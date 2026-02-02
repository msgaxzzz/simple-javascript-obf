const { walk } = require("./ast");

const SUPPORTED_STATEMENTS = new Set([
  "LocalStatement",
  "AssignmentStatement",
  "CompoundAssignmentStatement",
  "CallStatement",
  "ReturnStatement",
]);

function buildNameFactory(rng, used) {
  return (prefix) => {
    let name = "";
    do {
      const suffix = rng.int(0, 0x7fffffff).toString(36);
      name = `__obf_${prefix}_${suffix}`;
    } while (used.has(name));
    used.add(name);
    return name;
  };
}

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

function collectIdentifierNames(node) {
  const used = new Set();
  walk(node, (child) => {
    if (child && child.type === "Identifier" && typeof child.name === "string") {
      used.add(child.name);
    }
  });
  return used;
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

function buildFlattenedStatements(statements, ctx, style) {
  const { rng } = ctx;
  const usedNames = collectIdentifierNames({ type: "Chunk", body: statements });
  const nameFor = buildNameFactory(rng, usedNames);
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

  const flattened = buildFlattenedStatements(statements, ctx, style);
  setFunctionStatements(node, flattened, style);
}

function controlFlowFlatten(ast, ctx) {
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
