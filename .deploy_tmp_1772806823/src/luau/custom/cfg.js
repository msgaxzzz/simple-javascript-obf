function isNode(value) {
  return value && typeof value === "object" && typeof value.type === "string";
}

function createBlock(cfg, kind) {
  const block = {
    id: cfg.blocks.length,
    kind,
    statements: [],
    successors: new Set(),
    predecessors: new Set(),
  };
  cfg.blocks.push(block);
  return block;
}

function connect(from, to) {
  if (!from || !to) {
    return;
  }
  from.successors.add(to.id);
  to.predecessors.add(from.id);
}

function finalizeBlocks(cfg) {
  cfg.blocks.forEach((block) => {
    block.successors = Array.from(block.successors);
    block.predecessors = Array.from(block.predecessors);
  });
}

function scanExpressionForFunctions(node, ctx) {
  if (!isNode(node)) {
    return;
  }
  if (node.type === "FunctionExpression") {
    buildFunctionCFG(node, ctx.root, "function");
    return;
  }
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((item) => scanExpressionForFunctions(item, ctx));
      continue;
    }
    if (isNode(value)) {
      scanExpressionForFunctions(value, ctx);
    }
  }
}

function processStatementExpressions(stmt, ctx) {
  switch (stmt.type) {
    case "LocalStatement":
      stmt.init.forEach((expr) => scanExpressionForFunctions(expr, ctx));
      return;
    case "AssignmentStatement":
      stmt.variables.forEach((expr) => scanExpressionForFunctions(expr, ctx));
      stmt.init.forEach((expr) => scanExpressionForFunctions(expr, ctx));
      return;
    case "CompoundAssignmentStatement":
      scanExpressionForFunctions(stmt.variable, ctx);
      scanExpressionForFunctions(stmt.value, ctx);
      return;
    case "CallStatement":
      scanExpressionForFunctions(stmt.expression, ctx);
      return;
    case "ReturnStatement":
      stmt.arguments.forEach((expr) => scanExpressionForFunctions(expr, ctx));
      return;
    case "IfStatement":
      stmt.clauses.forEach((clause) => scanExpressionForFunctions(clause.condition, ctx));
      return;
    case "WhileStatement":
      scanExpressionForFunctions(stmt.condition, ctx);
      return;
    case "RepeatStatement":
      scanExpressionForFunctions(stmt.condition, ctx);
      return;
    case "ForNumericStatement":
      scanExpressionForFunctions(stmt.start, ctx);
      scanExpressionForFunctions(stmt.end, ctx);
      if (stmt.step) {
        scanExpressionForFunctions(stmt.step, ctx);
      }
      return;
    case "ForGenericStatement":
      stmt.iterators.forEach((expr) => scanExpressionForFunctions(expr, ctx));
      return;
    case "TypeFunctionStatement":
    case "ExportTypeFunctionStatement":
      return;
    default:
      return;
  }
}

function buildSequence(statements, ctx, startBlock) {
  let current = startBlock || createBlock(ctx.cfg, "block");
  const entry = current;

  for (const stmt of statements) {
    if (!current) {
      current = createBlock(ctx.cfg, "block");
    }

    processStatementExpressions(stmt, ctx);

    if (stmt.type === "LabelStatement") {
      if (current.statements.length) {
        const labelBlock = createBlock(ctx.cfg, "label");
        connect(current, labelBlock);
        current = labelBlock;
      }
      current.statements.push(stmt);
      const labelName = stmt.name && stmt.name.name;
      if (labelName) {
        if (!ctx.labels.has(labelName)) {
          ctx.labels.set(labelName, current);
        }
        const pending = ctx.pendingGotos.get(labelName);
        if (pending) {
          pending.forEach((block) => connect(block, current));
          ctx.pendingGotos.delete(labelName);
        }
      }
      continue;
    }

    switch (stmt.type) {
      case "FunctionDeclaration":
        current.statements.push(stmt);
        buildFunctionCFG(stmt, ctx.root, "function");
        break;
      case "TypeFunctionStatement":
      case "ExportTypeFunctionStatement":
        current.statements.push(stmt);
        buildFunctionCFG(stmt, ctx.root, "type-function");
        break;
      case "IfStatement": {
        current.statements.push(stmt);
        const afterBlock = createBlock(ctx.cfg, "join");
        for (const clause of stmt.clauses) {
          const clauseEntry = createBlock(ctx.cfg, "if");
          connect(current, clauseEntry);
          const clauseResult = buildSequence(clause.body.body, ctx, clauseEntry);
          clauseResult.exits.forEach((exitBlock) => connect(exitBlock, afterBlock));
        }
        if (stmt.elseBody) {
          const elseEntry = createBlock(ctx.cfg, "else");
          connect(current, elseEntry);
          const elseResult = buildSequence(stmt.elseBody.body, ctx, elseEntry);
          elseResult.exits.forEach((exitBlock) => connect(exitBlock, afterBlock));
        } else {
          connect(current, afterBlock);
        }
        current = afterBlock;
        break;
      }
      case "WhileStatement": {
        current.statements.push(stmt);
        const loopHead = current;
        const bodyEntry = createBlock(ctx.cfg, "loop-body");
        const afterBlock = createBlock(ctx.cfg, "loop-exit");
        connect(loopHead, bodyEntry);
        connect(loopHead, afterBlock);
        ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
        const bodyResult = buildSequence(stmt.body.body, ctx, bodyEntry);
        bodyResult.exits.forEach((exitBlock) => connect(exitBlock, loopHead));
        ctx.loopStack.pop();
        current = afterBlock;
        break;
      }
      case "RepeatStatement": {
        const bodyEntry = createBlock(ctx.cfg, "repeat-body");
        const condBlock = createBlock(ctx.cfg, "repeat-cond");
        const afterBlock = createBlock(ctx.cfg, "loop-exit");
        connect(current, bodyEntry);
        ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: condBlock });
        const bodyResult = buildSequence(stmt.body.body, ctx, bodyEntry);
        bodyResult.exits.forEach((exitBlock) => connect(exitBlock, condBlock));
        ctx.loopStack.pop();
        condBlock.statements.push(stmt);
        connect(condBlock, bodyEntry);
        connect(condBlock, afterBlock);
        current = afterBlock;
        break;
      }
      case "ForNumericStatement":
      case "ForGenericStatement": {
        current.statements.push(stmt);
        const loopHead = current;
        const bodyEntry = createBlock(ctx.cfg, "loop-body");
        const afterBlock = createBlock(ctx.cfg, "loop-exit");
        connect(loopHead, bodyEntry);
        connect(loopHead, afterBlock);
        ctx.loopStack.push({ breakTarget: afterBlock, continueTarget: loopHead });
        const bodyResult = buildSequence(stmt.body.body, ctx, bodyEntry);
        bodyResult.exits.forEach((exitBlock) => connect(exitBlock, loopHead));
        ctx.loopStack.pop();
        current = afterBlock;
        break;
      }
      case "DoStatement": {
        const bodyEntry = createBlock(ctx.cfg, "do-body");
        const afterBlock = createBlock(ctx.cfg, "do-exit");
        current.statements.push(stmt);
        connect(current, bodyEntry);
        const bodyResult = buildSequence(stmt.body.body, ctx, bodyEntry);
        bodyResult.exits.forEach((exitBlock) => connect(exitBlock, afterBlock));
        current = afterBlock;
        break;
      }
      case "ReturnStatement":
        current.statements.push(stmt);
        connect(current, ctx.exitBlock);
        current = null;
        break;
      case "BreakStatement": {
        current.statements.push(stmt);
        const target = ctx.loopStack.length ? ctx.loopStack[ctx.loopStack.length - 1].breakTarget : ctx.exitBlock;
        connect(current, target);
        current = null;
        break;
      }
      case "ContinueStatement": {
        current.statements.push(stmt);
        const target = ctx.loopStack.length ? ctx.loopStack[ctx.loopStack.length - 1].continueTarget : ctx.exitBlock;
        connect(current, target);
        current = null;
        break;
      }
      case "GotoStatement": {
        current.statements.push(stmt);
        const labelName = stmt.name && stmt.name.name;
        if (labelName && ctx.labels.has(labelName)) {
          connect(current, ctx.labels.get(labelName));
        } else if (labelName) {
          const pending = ctx.pendingGotos.get(labelName);
          if (pending) {
            pending.push(current);
          } else {
            ctx.pendingGotos.set(labelName, [current]);
          }
        } else {
          connect(current, ctx.exitBlock);
        }
        current = null;
        break;
      }
      default:
        current.statements.push(stmt);
        break;
    }
  }

  const exits = [];
  if (current) {
    exits.push(current);
  }
  return { entry, exits };
}

function computeDominators(cfg) {
  const entryId = cfg.entry.id;
  const allIds = cfg.blocks.map((block) => block.id);
  const allSet = new Set(allIds);
  const dom = new Map();
  cfg.blocks.forEach((block) => {
    if (block.id === entryId) {
      dom.set(block.id, new Set([block.id]));
    } else {
      dom.set(block.id, new Set(allSet));
    }
  });

  let changed = true;
  while (changed) {
    changed = false;
    for (const block of cfg.blocks) {
      if (block.id === entryId) {
        continue;
      }
      const preds = block.predecessors;
      let next = null;
      if (!preds.length) {
        next = new Set([block.id]);
      } else {
        for (const pred of preds) {
          const predDom = dom.get(pred);
          if (!predDom) {
            continue;
          }
          if (!next) {
            next = new Set(predDom);
          } else {
            for (const value of Array.from(next)) {
              if (!predDom.has(value)) {
                next.delete(value);
              }
            }
          }
        }
        if (!next) {
          next = new Set();
        }
        next.add(block.id);
      }
      const current = dom.get(block.id);
      if (!setsEqual(current, next)) {
        dom.set(block.id, next);
        changed = true;
      }
    }
  }

  const idom = new Map();
  for (const block of cfg.blocks) {
    if (block.id === entryId) {
      idom.set(block.id, null);
      continue;
    }
    const domSet = new Set(dom.get(block.id));
    domSet.delete(block.id);
    let immediate = null;
    for (const candidate of domSet) {
      let dominatedByOther = false;
      for (const other of domSet) {
        if (other === candidate) {
          continue;
        }
        if (dom.get(candidate).has(other)) {
          dominatedByOther = true;
          break;
        }
      }
      if (!dominatedByOther) {
        immediate = candidate;
        break;
      }
    }
    idom.set(block.id, immediate);
  }

  const dominators = {};
  const immediateDominators = {};
  const dominatorTree = {};
  const dominanceFrontier = {};
  dom.forEach((set, id) => {
    dominators[id] = Array.from(set);
  });
  idom.forEach((value, id) => {
    immediateDominators[id] = value;
  });
  cfg.blocks.forEach((block) => {
    dominatorTree[block.id] = [];
    dominanceFrontier[block.id] = new Set();
  });
  idom.forEach((parent, id) => {
    if (parent !== null && dominatorTree[parent]) {
      dominatorTree[parent].push(id);
    }
  });
  for (const block of cfg.blocks) {
    if (block.predecessors.length < 2) {
      continue;
    }
    const idomOfBlock = immediateDominators[block.id];
    for (const pred of block.predecessors) {
      let runner = pred;
      while (runner !== null && runner !== idomOfBlock) {
        dominanceFrontier[runner].add(block.id);
        runner = immediateDominators[runner];
      }
    }
  }
  const dominanceFrontierOut = {};
  Object.keys(dominanceFrontier).forEach((id) => {
    dominanceFrontierOut[id] = Array.from(dominanceFrontier[id]);
  });
  cfg.dominators = dominators;
  cfg.immediateDominators = immediateDominators;
  cfg.dominatorTree = dominatorTree;
  cfg.dominanceFrontier = dominanceFrontierOut;
}

function setsEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function buildFunctionCFG(node, root, kind) {
  const cfg = {
    node,
    kind,
    blocks: [],
    entry: null,
    exit: null,
    dominators: null,
    immediateDominators: null,
  };
  cfg.entry = createBlock(cfg, "entry");
  cfg.exit = createBlock(cfg, "exit");

  const ctx = {
    cfg,
    exitBlock: cfg.exit,
    loopStack: [],
    root,
    labels: new Map(),
    pendingGotos: new Map(),
  };

  const bodyStatements = node.type === "Chunk" ? node.body : node.body.body;
  const result = buildSequence(bodyStatements, ctx, cfg.entry);
  result.exits.forEach((exitBlock) => connect(exitBlock, cfg.exit));
  for (const pending of ctx.pendingGotos.values()) {
    pending.forEach((block) => connect(block, cfg.exit));
  }

  finalizeBlocks(cfg);
  computeDominators(cfg);
  root.functions.push(cfg);
  return cfg;
}

function buildCFG(ast) {
  const root = { functions: [] };
  buildFunctionCFG(ast, root, "chunk");
  return root;
}

module.exports = {
  buildCFG,
};
