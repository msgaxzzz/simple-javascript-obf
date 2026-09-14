const { walk } = require("./ast");
const { addSSAUsedNames, findSSAForNode } = require("./ssa-utils").default;

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

function buildOpaqueFalseCondition(name, rng) {
  const subject = identifier(name);
  const template = rng.int(0, 5);
  if (template === 0) {
    // x^2 mod 4 == 2 is impossible
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        binaryExpression("*", subject, identifier(name)),
        numericLiteral(4)
      ),
      numericLiteral(2)
    );
  }
  if (template === 1) {
    // x^2 mod 4 == 3 is impossible
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        binaryExpression("*", subject, identifier(name)),
        numericLiteral(4)
      ),
      numericLiteral(3)
    );
  }
  if (template === 2) {
    // x*(x+1) mod 2 == 1 is impossible (product of consecutive ints is always even)
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        binaryExpression(
          "*",
          subject,
          binaryExpression("+", identifier(name), numericLiteral(1))
        ),
        numericLiteral(2)
      ),
      numericLiteral(1)
    );
  }
  if (template === 3) {
    // (x^2 + 1) mod 4 == 0 is impossible
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        binaryExpression(
          "+",
          binaryExpression("*", subject, identifier(name)),
          numericLiteral(1)
        ),
        numericLiteral(4)
      ),
      numericLiteral(0)
    );
  }
  if (template === 4) {
    // (x^3 - x) mod 6 == 5 is impossible (always divisible by 6)
    return binaryExpression(
      "==",
      binaryExpression(
        "%",
        binaryExpression(
          "-",
          binaryExpression(
            "*",
            binaryExpression("*", subject, identifier(name)),
            identifier(name)
          ),
          identifier(name)
        ),
        numericLiteral(6)
      ),
      numericLiteral(5)
    );
  }
  // (x^2 + k) < k is impossible (x^2 < 0)
  const seed = rng.int(10, 50);
  return binaryExpression(
    "<",
    binaryExpression(
      "+",
      binaryExpression("*", subject, identifier(name)),
      numericLiteral(seed)
    ),
    numericLiteral(seed)
  );
}

function buildDecoyBody(rng, used, style) {
  const d1 = makeNoiseName(rng, used);
  const d2 = makeNoiseName(rng, used);
  const template = rng.int(0, 2);
  if (template === 0) {
    return [
      buildLocalStatement(d1, numericLiteral(rng.int(100, 999)), style),
      buildAssignment(
        d1,
        binaryExpression(
          "+",
          binaryExpression("*", identifier(d1), numericLiteral(rng.int(2, 7))),
          numericLiteral(rng.int(1, 99))
        )
      ),
    ];
  }
  if (template === 1) {
    return [
      buildLocalStatement(d1, numericLiteral(rng.int(1, 50)), style),
      buildLocalStatement(
        d2,
        binaryExpression(
          "%",
          binaryExpression("*", identifier(d1), numericLiteral(13)),
          numericLiteral(256)
        ),
        style
      ),
    ];
  }
  return [
    buildLocalStatement(d1, numericLiteral(0), style),
    buildAssignment(
      d1,
      binaryExpression(
        "+",
        identifier(d1),
        numericLiteral(rng.int(17, 127))
      )
    ),
  ];
}

function buildNoiseStatements(rng, used, style, count) {
  const statements = [];
  for (let i = 0; i < count; i += 1) {
    const name = makeNoiseName(rng, used);
    const value = rng.int(1, 999);
    statements.push(buildLocalStatement(name, numericLiteral(value), style));
    statements.push(buildAssignment(name, numericLiteral(value)));
    const guard = buildOpaqueFalseCondition(name, rng);
    const decoy = buildDecoyBody(rng, used, style);
    statements.push(buildIfStatement(guard, decoy, style));
    statements.push(buildDoStatement([buildAssignment(name, identifier(name))], style));
  }
  return statements;
}

function interleaveStatements(original, noise, rng) {
  if (!noise.length) {
    return original;
  }
  if (!original.length) {
    return noise;
  }
  const result = [];
  let noiseIndex = 0;
  const chunkPerNoise = Math.max(1, Math.floor(original.length / (noise.length + 1)));

  for (let i = 0; i < original.length; i += 1) {
    const stmt = original[i];
    if (
      noiseIndex < noise.length &&
      i > 0 &&
      i % chunkPerNoise === 0 &&
      stmt.type !== "ReturnStatement"
    ) {
      result.push(noise[noiseIndex++]);
    }
    result.push(stmt);
  }
  while (noiseIndex < noise.length) {
    const last = result[result.length - 1];
    if (last && last.type === "ReturnStatement") {
      result.splice(result.length - 1, 0, noise[noiseIndex++]);
    } else {
      result.push(noise[noiseIndex++]);
    }
  }
  return result;
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
    const next = interleaveStatements(statements, noise, rng);
    setFunctionStatements(node, next, style);
  });
}

module.exports = {
  injectDeadCode,
};
