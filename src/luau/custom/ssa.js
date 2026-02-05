const { buildCFG } = require("./cfg");

function isNode(value) {
  return value && typeof value === "object" && typeof value.type === "string";
}

function buildSSA(input) {
  const cfgRoot = normalizeCFG(input);
  cfgRoot.functions.forEach((cfg) => {
    cfg.ssa = buildSSAForFunction(cfg);
  });
  return cfgRoot;
}

function normalizeCFG(input) {
  if (!input) {
    return buildCFG(null);
  }
  if (input.functions && Array.isArray(input.functions)) {
    return input;
  }
  if (input.blocks && Array.isArray(input.blocks)) {
    return { functions: [input] };
  }
  return buildCFG(input);
}

function buildSSAForFunction(cfg) {
  const blocks = cfg.blocks;
  const defsByBlock = new Map();
  const defBlocks = new Map();
  const variables = new Set();

  const noteDef = (blockId, name) => {
    if (!name) {
      return;
    }
    variables.add(name);
    if (!defsByBlock.has(blockId)) {
      defsByBlock.set(blockId, new Set());
    }
    defsByBlock.get(blockId).add(name);
    if (!defBlocks.has(name)) {
      defBlocks.set(name, new Set());
    }
    defBlocks.get(name).add(blockId);
  };

  blocks.forEach((block) => {
    const defs = new Set();
    defsByBlock.set(block.id, defs);
    block.statements.forEach((stmt) => collectDefs(stmt, defs));
    defs.forEach((name) => noteDef(block.id, name));
  });

  const params = getFunctionParams(cfg.node);
  params.forEach((name) => variables.add(name));

  const phiByBlock = new Map();
  variables.forEach((name) => {
    const work = Array.from(defBlocks.get(name) || []);
    const hasPhi = new Set();
    while (work.length) {
      const blockId = work.pop();
      const frontier = cfg.dominanceFrontier && cfg.dominanceFrontier[blockId]
        ? cfg.dominanceFrontier[blockId]
        : [];
      for (const frontierId of frontier) {
        const key = `${frontierId}:${name}`;
        if (hasPhi.has(key)) {
          continue;
        }
        hasPhi.add(key);
        const map = phiByBlock.get(frontierId) || new Map();
        if (!phiByBlock.has(frontierId)) {
          phiByBlock.set(frontierId, map);
        }
        if (!map.has(name)) {
          map.set(name, { variable: name, result: null, args: {} });
        }
        const defsAtFrontier = defsByBlock.get(frontierId);
        if (!defsAtFrontier || !defsAtFrontier.has(name)) {
          work.push(frontierId);
        }
      }
    }
  });

  const ssa = {
    variables: Array.from(variables),
    versions: {},
    defs: new Map(),
    uses: new Map(),
    blocks: {},
  };

  const stacks = new Map();
  const counters = new Map();
  variables.forEach((name) => {
    stacks.set(name, [`${name}$0`]);
    counters.set(name, 0);
    ssa.versions[name] = 0;
  });

  const newVersion = (name) => {
    const next = (counters.get(name) || 0) + 1;
    counters.set(name, next);
    ssa.versions[name] = next;
    return `${name}$${next}`;
  };

  const pushVersion = (name, version) => {
    stacks.get(name).push(version);
  };

  const popVersion = (name) => {
    const stack = stacks.get(name);
    if (stack && stack.length) {
      stack.pop();
    }
  };

  const currentVersion = (name) => {
    const stack = stacks.get(name);
    if (!stack || !stack.length) {
      const base = `${name}$0`;
      stacks.set(name, [base]);
      return base;
    }
    return stack[stack.length - 1];
  };

  const blockInfo = (blockId) => {
    if (!ssa.blocks[blockId]) {
      const phiMap = phiByBlock.get(blockId);
      ssa.blocks[blockId] = {
        phi: phiMap ? Array.from(phiMap.values()) : [],
      };
    }
    return ssa.blocks[blockId];
  };

  const recordUse = (node, name) => {
    if (isNode(node)) {
      ssa.uses.set(node, name);
    }
  };

  const recordDef = (node, name) => {
    if (isNode(node)) {
      ssa.defs.set(node, name);
    }
  };

  const renameExpression = (expr) => {
    if (!isNode(expr)) {
      return;
    }
    switch (expr.type) {
      case "Identifier": {
        const name = currentVersion(expr.name);
        recordUse(expr, name);
        return;
      }
      case "BinaryExpression":
        renameExpression(expr.left);
        renameExpression(expr.right);
        return;
      case "UnaryExpression":
        renameExpression(expr.argument);
        return;
      case "TypeAssertion":
        renameExpression(expr.expression);
        return;
      case "IfExpression":
        expr.clauses.forEach((clause) => {
          renameExpression(clause.condition);
          renameExpression(clause.value);
        });
        renameExpression(expr.elseValue);
        return;
      case "GroupExpression":
        renameExpression(expr.expression);
        return;
      case "MemberExpression":
        renameExpression(expr.base);
        return;
      case "IndexExpression":
        renameExpression(expr.base);
        renameExpression(expr.index);
        return;
      case "CallExpression":
      case "MethodCallExpression":
        renameExpression(expr.base);
        expr.arguments.forEach((arg) => renameExpression(arg));
        return;
      case "FunctionExpression":
        return;
      case "TableConstructorExpression":
        expr.fields.forEach((field) => {
          if (field.kind === "index") {
            renameExpression(field.key);
            renameExpression(field.value);
            return;
          }
          if (field.kind === "name") {
            renameExpression(field.value);
            return;
          }
          renameExpression(field.value);
        });
        return;
      case "InterpolatedString":
        if (expr.parts) {
          expr.parts.forEach((part) => renameExpression(part));
        }
        return;
      default:
        return;
    }
  };

  const renameAssignmentTarget = (target) => {
    if (!isNode(target)) {
      return;
    }
    if (target.type === "Identifier") {
      const version = newVersion(target.name);
      pushVersion(target.name, version);
      recordDef(target, version);
      return;
    }
    if (target.type === "MemberExpression") {
      renameExpression(target.base);
      return;
    }
    if (target.type === "IndexExpression") {
      renameExpression(target.base);
      renameExpression(target.index);
      return;
    }
    renameExpression(target);
  };

  const renameStatement = (stmt) => {
    if (!isNode(stmt)) {
      return;
    }
    switch (stmt.type) {
      case "LocalStatement":
        stmt.init.forEach(renameExpression);
        stmt.variables.forEach((id) => {
          if (!id || id.type !== "Identifier") {
            return;
          }
          const version = newVersion(id.name);
          pushVersion(id.name, version);
          recordDef(id, version);
        });
        return;
      case "AssignmentStatement":
        stmt.init.forEach(renameExpression);
        stmt.variables.forEach(renameAssignmentTarget);
        return;
      case "CompoundAssignmentStatement":
        renameExpression(stmt.value);
        if (stmt.variable && stmt.variable.type === "Identifier") {
          renameExpression(stmt.variable);
          const version = newVersion(stmt.variable.name);
          pushVersion(stmt.variable.name, version);
          recordDef(stmt.variable, version);
          return;
        }
        renameAssignmentTarget(stmt.variable);
        return;
      case "CallStatement":
        renameExpression(stmt.expression);
        return;
      case "ReturnStatement":
        stmt.arguments.forEach(renameExpression);
        return;
      case "IfStatement":
        stmt.clauses.forEach((clause) => renameExpression(clause.condition));
        return;
      case "WhileStatement":
        renameExpression(stmt.condition);
        return;
      case "RepeatStatement":
        renameExpression(stmt.condition);
        return;
      case "ForNumericStatement":
        renameExpression(stmt.start);
        renameExpression(stmt.end);
        if (stmt.step) {
          renameExpression(stmt.step);
        }
        if (stmt.variable && stmt.variable.type === "Identifier") {
          const version = newVersion(stmt.variable.name);
          pushVersion(stmt.variable.name, version);
          recordDef(stmt.variable, version);
        }
        return;
      case "ForGenericStatement":
        stmt.iterators.forEach(renameExpression);
        stmt.variables.forEach((id) => {
          if (!id || id.type !== "Identifier") {
            return;
          }
          const version = newVersion(id.name);
          pushVersion(id.name, version);
          recordDef(id, version);
        });
        return;
      case "FunctionDeclaration": {
        const name = stmt.name && stmt.name.base ? stmt.name.base : null;
        if (name && name.type === "Identifier") {
          const version = newVersion(name.name);
          pushVersion(name.name, version);
          recordDef(name, version);
        }
        return;
      }
      default:
        return;
    }
  };

  const pushParams = () => {
    params.forEach((name) => {
      const version = newVersion(name);
      pushVersion(name, version);
      const paramNode = findParamNode(cfg.node, name);
      if (paramNode) {
        recordDef(paramNode, version);
      }
    });
  };

  const renameBlock = (blockId) => {
    const block = blocks[blockId];
    const info = blockInfo(blockId);
    const pushed = [];

    info.phi.forEach((phi) => {
      const version = newVersion(phi.variable);
      phi.result = version;
      pushVersion(phi.variable, version);
      pushed.push(phi.variable);
    });

    block.statements.forEach((stmt) => {
      const before = new Map();
      varsForStatement(stmt).forEach((name) => {
        before.set(name, currentVersion(name));
      });
      renameStatement(stmt);
      varsForStatement(stmt).forEach((name) => {
        if (before.get(name) !== currentVersion(name)) {
          pushed.push(name);
        }
      });
    });

    block.successors.forEach((succId) => {
      const succInfo = blockInfo(succId);
      succInfo.phi.forEach((phi) => {
        phi.args[blockId] = currentVersion(phi.variable);
      });
    });

    const treeChildren = cfg.dominatorTree ? cfg.dominatorTree[blockId] || [] : [];
    treeChildren.forEach((childId) => renameBlock(childId));

    pushed.reverse().forEach((name) => popVersion(name));
  };

  pushParams();
  renameBlock(cfg.entry.id);

  return ssa;
}

function getFunctionParams(node) {
  if (!node || !node.parameters) {
    return [];
  }
  return node.parameters
    .filter((param) => param && param.type === "Identifier")
    .map((param) => param.name);
}

function findParamNode(node, name) {
  if (!node || !Array.isArray(node.parameters)) {
    return null;
  }
  for (const param of node.parameters) {
    if (param && param.type === "Identifier" && param.name === name) {
      return param;
    }
  }
  return null;
}

function collectDefs(stmt, defs) {
  if (!isNode(stmt)) {
    return;
  }
  switch (stmt.type) {
    case "LocalStatement":
      stmt.variables.forEach((id) => {
        if (id && id.type === "Identifier") {
          defs.add(id.name);
        }
      });
      return;
    case "AssignmentStatement":
      stmt.variables.forEach((target) => {
        if (target && target.type === "Identifier") {
          defs.add(target.name);
        }
      });
      return;
    case "CompoundAssignmentStatement":
      if (stmt.variable && stmt.variable.type === "Identifier") {
        defs.add(stmt.variable.name);
      }
      return;
    case "ForNumericStatement":
      if (stmt.variable && stmt.variable.type === "Identifier") {
        defs.add(stmt.variable.name);
      }
      return;
    case "ForGenericStatement":
      stmt.variables.forEach((id) => {
        if (id && id.type === "Identifier") {
          defs.add(id.name);
        }
      });
      return;
    case "FunctionDeclaration":
      if (stmt.name && stmt.name.base && stmt.name.base.type === "Identifier") {
        defs.add(stmt.name.base.name);
      }
      return;
    default:
      return;
  }
}

function varsForStatement(stmt) {
  const vars = new Set();
  collectDefs(stmt, vars);
  return vars;
}

module.exports = {
  buildSSA,
};
