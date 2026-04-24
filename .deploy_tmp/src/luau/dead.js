const { walk } = require("./ast");
const { addSSAUsedNames, findSSAForNode } = require("./ssa-utils");

const CONFUSING_CHARS = ["l", "I", "1"];

function collectIdentifierNames(node) {
  const used = new Set();
  walk(node, (child) => {
    if (child && child.type === "Identifier" && typeof child.name === "string") {
      used.add(child.name);
    }
  });
  return used;
}

function makeNoiseName(rng, used) {
  let name = "";
  while (!name || used.has(name)) {
    const length = rng.int(3, 6);
    let out = "";
    for (let i = 0; i < length; i += 1) {
      out += CONFUSING_CHARS[rng.int(0, CONFUSING_CHARS.length - 1)];
    }
    if (/[0-9]/.test(out[0])) {
      out = `l${out}`;
    }
    name = out;
  }
  used.add(name);
  return name;
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

function buildIfStatement(condition, body, style) {
  if (style === "luaparse") {
    return {
      type: "IfStatement",
      clauses: [{ type: "IfClause", condition, body }],
    };
  }
  return {
    type: "IfStatement",
    clauses: [{ condition, body: { type: "Block", body } }],
    elseBody: null,
  };
}

function buildLocalStatement(name, value, style) {
  const init = value ? [value] : [];
  if (style === "luaparse") {
    return { type: "LocalStatement", variables: [identifier(name)], init };
  }
  return { type: "LocalStatement", variables: [identifier(name)], init };
}

function buildAssignment(name, value) {
  return {
    type: "AssignmentStatement",
    variables: [identifier(name)],
    init: [value],
  };
}

function buildDoStatement(body, style) {
  if (style === "luaparse") {
    return { type: "DoStatement", body };
  }
  return { type: "DoStatement", body: { type: "Block", body } };
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

function buildNoiseStatements(rng, used, style, count) {
  const statements = [];
  for (let i = 0; i < count; i += 1) {
    const name = makeNoiseName(rng, used);
    const value = rng.int(0, 999);
    statements.push(buildLocalStatement(name, numericLiteral(value), style));
    statements.push(buildAssignment(name, numericLiteral(value)));
    const guard = binaryExpression("==", numericLiteral(1), numericLiteral(0));
    statements.push(buildIfStatement(guard, [buildLocalStatement(makeNoiseName(rng, used), null, style)], style));
    statements.push(buildDoStatement([buildAssignment(name, identifier(name))], style));
  }
  return statements;
}

function injectDeadCode(ast, ctx) {
  const { rng, options } = ctx;
  if (!options.dead) {
    return;
  }
  const probability = options.deadCodeOptions?.probability ?? 0.15;
  const ssaRoot = ctx && typeof ctx.getSSA === "function" ? ctx.getSSA() : null;

  walk(ast, (node) => {
    if (!node || (node.type !== "FunctionDeclaration" && node.type !== "FunctionExpression")) {
      return;
    }
    if (!rng.bool(probability)) {
      return;
    }
    const info = getFunctionStatements(node);
    if (!info || !info.statements) {
      return;
    }
    const { statements, style } = info;
    const used = collectIdentifierNames(node);
    if (ssaRoot) {
      const ssa = findSSAForNode(ssaRoot, node);
      if (ssa) {
        addSSAUsedNames(ssa, used);
      }
    }
    const count = rng.int(1, 2);
    const noise = buildNoiseStatements(rng, used, style, count);
    const next = [...noise, ...statements];
    setFunctionStatements(node, next, style);
  });
}

module.exports = {
  injectDeadCode,
};
