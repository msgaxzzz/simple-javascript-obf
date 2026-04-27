const { walk } = require("./ast");
const { collectIdentifierNames, makeNameFactory } = require("./names");

const SUPPORTED_STATEMENTS = new Set([
  "LocalStatement",
  "AssignmentStatement",
  "CompoundAssignmentStatement",
  "CallStatement",
  "ReturnStatement",
]);

function buildStateValues(count, rng) {
  const poolSize = Math.max(count * 3, count + 5);
  const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
  rng.shuffle(pool);
  const isLinearStep = (values) => {
    if (values.length < 3) {
      return true;
    }
    const step = values[1] - values[0];
    for (let i = 2; i < values.length; i += 1) {
      if (values[i] - values[i - 1] !== step) {
        return false;
      }
    }
    return true;
  };
  let values = pool.slice(0, count);
  for (let attempt = 0; attempt < 5 && isLinearStep(values); attempt += 1) {
    rng.shuffle(pool);
    values = pool.slice(0, count);
  }
  return values;
}

function getFunctionStatements(node) {
  if (!node || !node.body) {
    return null;
  }
  if (Array.isArray(node.body)) {
    return { statements: node.body, style: "luaparse" };
  }
  if (node.body && Array.isArray(node.body.body)) {
    return { statements: node.body.body, style: "custom" };
  }
  return null;
}

function getFunctionName(fnNode) {
  if (!fnNode) {
    return null;
  }
  if (fnNode.name && fnNode.name.type === "FunctionName") {
    const parts = [fnNode.name.base.name, ...(fnNode.name.members || []).map((m) => m.name)];
    if (fnNode.name.method) {
      parts.push(fnNode.name.method.name);
    }
    return parts.join(".");
  }
  if (fnNode.identifier && fnNode.identifier.type === "Identifier") {
    return fnNode.identifier.name;
  }
  return null;
}

function shouldSkipForVm(node, options) {
  if (!options || !options.vm || options.vm.enabled === false || !node) {
    return false;
  }
  const include = Array.isArray(options.vm.include) ? options.vm.include : [];
  if (options.vm.all || include.length === 0) {
    return true;
  }
  const name = getFunctionName(node);
  return Boolean(name && include.includes(name));
}

function setFunctionStatements(node, statements, style) {
  if (style === "luaparse") {
    node.body = statements;
  } else if (node.body && node.body.type === "Block") {
    node.body.body = statements;
  }
}

function hasUnsupportedStatements(statements) {
  for (const stmt of statements) {
    if (!stmt || !stmt.type || !SUPPORTED_STATEMENTS.has(stmt.type)) {
      return true;
    }
  }
  return false;
}

function numericLiteral(value) {
  return { type: "NumericLiteral", value, raw: String(value) };
}

function identifier(name) {
  return { type: "Identifier", name };
}

function binaryExpression(operator, left, right) {
  return { type: "BinaryExpression", operator, left, right };
}

function logicalAnd(left, right, style) {
  if (style === "luaparse") {
    return { type: "LogicalExpression", operator: "and", left, right };
  }
  return { type: "BinaryExpression", operator: "and", left, right };
}

function indexExpression(base, index) {
  return { type: "IndexExpression", base, index };
}

function assignmentStatement(variable, value) {
  return { type: "AssignmentStatement", variables: [variable], init: [value] };
}

function localStatement(variable, value) {
  return { type: "LocalStatement", variables: [variable], init: [value] };
}

function cloneNode(node) {
  if (!node || typeof node !== "object") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((item) => cloneNode(item));
  }
  const out = {};
  Object.keys(node).forEach((key) => {
    out[key] = cloneNode(node[key]);
  });
  return out;
}

function buildTableList(values, style) {
  const fields = values.map((value) => {
    if (style === "luaparse") {
      return { type: "TableValue", value };
    }
    return { type: "TableField", kind: "list", value };
  });
  return { type: "TableConstructorExpression", fields };
}

function buildTableIndex(pairs, style) {
  const fields = pairs.map(({ key, value }) => {
    if (style === "luaparse") {
      return { type: "TableKey", key, value };
    }
    return { type: "TableField", kind: "index", key, value };
  });
  return { type: "TableConstructorExpression", fields };
}

function buildBlock(body, style) {
  if (style === "luaparse") {
    return body;
  }
  return { type: "Block", body };
}

function buildIfStatement(cases, elseBody, style) {
  if (style === "luaparse") {
    const clauses = cases.map((entry, idx) => ({
      type: idx === 0 ? "IfClause" : "ElseifClause",
      condition: entry.condition,
      body: entry.body,
    }));
    clauses.push({ type: "ElseClause", body: elseBody });
    return { type: "IfStatement", clauses };
  }
  const clauses = cases.map((entry) => ({
    condition: entry.condition,
    body: buildBlock(entry.body, style),
  }));
  return { type: "IfStatement", clauses, elseBody: buildBlock(elseBody, style) };
}

function buildWhileStatement(condition, body, style) {
  return { type: "WhileStatement", condition, body: buildBlock(body, style) };
}

function buildOpaquePredicate(stateName, rng) {
  const seed = rng.int(2, 13);
  const left = binaryExpression(
    "%",
    binaryExpression("*", identifier(stateName), numericLiteral(seed)),
    numericLiteral(seed)
  );
  return binaryExpression("==", left, numericLiteral(0));
}

function addNamesFromSSA(ssa, used) {
  if (!ssa || !used) {
    return;
  }
  if (Array.isArray(ssa.variables)) {
    ssa.variables.forEach((name) => {
      if (name) {
        used.add(name);
      }
    });
  }
  const addVersioned = (value) => {
    if (!value || typeof value !== "string") {
      return;
    }
    const base = value.split("$", 1)[0];
    if (base) {
      used.add(base);
    }
  };
  if (ssa.uses && typeof ssa.uses.forEach === "function") {
    ssa.uses.forEach((value) => addVersioned(value));
  }
  if (ssa.defs && typeof ssa.defs.forEach === "function") {
    ssa.defs.forEach((value) => addVersioned(value));
  }
  if (ssa.blocks) {
    Object.values(ssa.blocks).forEach((block) => {
      if (block && Array.isArray(block.phi)) {
        block.phi.forEach((phi) => {
          if (phi && phi.variable) {
            used.add(phi.variable);
          }
        });
      }
    });
  }
}

function findSSAForNode(ssaRoot, node) {
  if (!ssaRoot || !Array.isArray(ssaRoot.functions)) {
    return null;
  }
  for (const cfg of ssaRoot.functions) {
    if (cfg && cfg.node === node) {
      return cfg.ssa || null;
    }
  }
  return null;
}

function extractLocalName(variable) {
  if (!variable || variable.type !== "Identifier" || typeof variable.name !== "string") {
    return null;
  }
  return variable.name;
}

function prepareFlattenStatements(statements) {
  const hoisted = [];
  const seen = new Set();
  const rewritten = [];
  for (const stmt of statements) {
    if (!stmt || stmt.type !== "LocalStatement") {
      rewritten.push(stmt);
      continue;
    }
    const variables = Array.isArray(stmt.variables) ? stmt.variables : [];
    for (const variable of variables) {
      const name = extractLocalName(variable);
      if (!name || seen.has(name)) {
        return null;
      }
      seen.add(name);
      hoisted.push(cloneNode(variable));
    }
    const init = Array.isArray(stmt.init) && stmt.init.length
      ? cloneNode(stmt.init)
      : variables.map(() => ({ type: "NilLiteral", value: null }));
    rewritten.push({
      type: "AssignmentStatement",
      variables: cloneNode(variables),
      init,
    });
  }
  return { hoisted, rewritten };
}

function buildFlattenedStatements(statements, ctx, style, usedNames = null) {
  const { rng } = ctx;
  const used = usedNames || collectIdentifierNames({ type: "Chunk", body: statements });
  const nameFor = makeNameFactory(rng, used);
  const stateName = nameFor("cff_state");
  const nextName = nameFor("cff_next");
  const valuesName = nameFor("cff_vals");

  const count = statements.length;
  const stateValues = buildStateValues(count, rng);
  const order = Array.from({ length: count }, (_, i) => i);
  rng.shuffle(order);
  const opaque = ctx.options.cffOptions?.opaque !== false
    ? buildOpaquePredicate(stateName, rng)
    : null;

  const nextPairs = stateValues.map((value, idx) => ({
    key: numericLiteral(value),
    value: numericLiteral(idx < count - 1 ? stateValues[idx + 1] : -1),
  }));

  const cases = order.map((index) => {
    const stmt = statements[index];
    const stateValue = stateValues[index];
    const body = [stmt];
    if (stmt.type !== "ReturnStatement") {
      body.push(
        assignmentStatement(
          identifier(stateName),
          indexExpression(identifier(nextName), identifier(stateName))
        )
      );
    }
    const condition = binaryExpression("==", identifier(stateName), numericLiteral(stateValue));
    return {
      condition: opaque ? logicalAnd(condition, opaque, style) : condition,
      body,
    };
  });

  const elseBody = [
    assignmentStatement(identifier(stateName), numericLiteral(-1)),
  ];

  const whileBody = [
    buildIfStatement(cases, elseBody, style),
  ];

  return [
    localStatement(
      identifier(valuesName),
      buildTableList(stateValues.map((value) => numericLiteral(value)), style)
    ),
    localStatement(
      identifier(nextName),
      buildTableIndex(nextPairs, style)
    ),
    localStatement(
      identifier(stateName),
      indexExpression(identifier(valuesName), numericLiteral(1))
    ),
    buildWhileStatement(
      opaque
        ? logicalAnd(
          binaryExpression("~=", identifier(stateName), numericLiteral(-1)),
          opaque,
          style
        )
        : binaryExpression("~=", identifier(stateName), numericLiteral(-1)),
      whileBody,
      style
    ),
  ];
}

function flattenFunction(node, ctx) {
  if (shouldSkipForVm(node, ctx && ctx.options)) {
    return;
  }
  const info = getFunctionStatements(node);
  if (!info) {
    return;
  }
  const { statements, style } = info;
  const minStatements = ctx.options.cffOptions?.minStatements ?? 3;
  if (!statements || statements.length < minStatements) {
    return;
  }
  if (hasUnsupportedStatements(statements)) {
    return;
  }

  const usedNames = collectIdentifierNames({ type: "Chunk", body: statements });
  if (ctx && typeof ctx.getSSA === "function") {
    const ssaRoot = ctx.getSSA();
    const ssa = findSSAForNode(ssaRoot, node);
    if (ssa) {
      addNamesFromSSA(ssa, usedNames);
    }
  }
  const prepared = prepareFlattenStatements(statements);
  if (!prepared) {
    return;
  }
  const flattened = buildFlattenedStatements(prepared.rewritten, ctx, style, usedNames);
  if (prepared.hoisted.length) {
    flattened.unshift({
      type: "LocalStatement",
      variables: prepared.hoisted,
      init: [],
    });
  }
  setFunctionStatements(node, flattened, style);
}

function controlFlowFlatten(ast, ctx) {
  if (ctx && typeof ctx.getCFG === "function") {
    ctx.cfg = ctx.getCFG();
  }
  walk(ast, (node) => {
    if (!node || !node.type) {
      return;
    }
    if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
      flattenFunction(node, ctx);
    }
  });
}

module.exports = {
  controlFlowFlatten,
};
