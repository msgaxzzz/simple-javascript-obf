const { walk } = require("./ast");
const { collectSSAReadNamesFromRoot } = require("./ssa-utils");

function numericLiteral(value) {
  return {
    type: "NumericLiteral",
    value,
    raw: Number.isFinite(value) ? String(value) : "0",
    __obf_skip_numbers: true,
  };
}

function buildLiteral(value) {
  if (!Number.isFinite(value)) {
    return numericLiteral(0);
  }
  if (value < 0) {
    return {
      type: "UnaryExpression",
      operator: "-",
      argument: numericLiteral(Math.abs(value)),
    };
  }
  return numericLiteral(value);
}

function randomOffset(rng, range) {
  const span = Math.max(1, range);
  let value = rng.int(-span, span);
  if (value === 0) {
    value = rng.int(1, span);
    if (rng.bool(0.5)) {
      value = -value;
    }
  }
  return value;
}

function isInt32Like(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 0x3fffffff;
}

function buildBinary(operator, left, right) {
  return {
    type: "BinaryExpression",
    operator,
    left,
    right,
  };
}

function identifier(name) {
  return {
    type: "Identifier",
    name,
  };
}

function bit32Call(name, args) {
  return {
    type: "CallExpression",
    base: {
      type: "MemberExpression",
      base: identifier("bit32"),
      identifier: identifier(name),
      indexer: ".",
    },
    arguments: args,
  };
}

function tryBuildBitwiseMba(value, ctx, depth, options) {
  if (!isInt32Like(value)) {
    return null;
  }
  const leftValue = ctx.rng.int(0, value);
  const rightValue = value - leftValue;
  if (!Number.isSafeInteger(leftValue) || !Number.isSafeInteger(rightValue)) {
    return null;
  }
  const leftExpr = buildExpression(leftValue, ctx, depth + 1, options);
  const rightExpr = buildExpression(rightValue, ctx, depth + 1, options);
  const xorExpr = bit32Call("bxor", [leftExpr, rightExpr]);
  const andExpr = bit32Call("band", [leftExpr, rightExpr]);
  const carryExpr = bit32Call("lshift", [andExpr, numericLiteral(1)]);
  return buildBinary("+", xorExpr, carryExpr);
}

function tryBuildMulDivMba(value, ctx, depth, options) {
  if (!Number.isSafeInteger(value)) {
    return null;
  }
  const mul = ctx.rng.int(3, 11);
  const shift = randomOffset(ctx.rng, Math.min(options.range, 1 << 15));
  const shifted = value + shift;
  const encoded = shifted * mul;
  const bias = shift * mul;
  if (!Number.isSafeInteger(shifted) || !Number.isSafeInteger(encoded) || !Number.isSafeInteger(bias)) {
    return null;
  }
  const numerator = buildBinary(
    "-",
    buildBinary(
      "*",
      buildExpression(shifted, ctx, depth + 1, options),
      numericLiteral(mul)
    ),
    buildExpression(bias, ctx, depth + 1, options)
  );
  return buildBinary("//", numerator, numericLiteral(mul));
}

function buildNonLinearExpression(value, ctx, depth, options) {
  if (depth + 1 >= options.maxDepth) {
    return null;
  }
  const candidates = [];
  if (isInt32Like(value)) {
    candidates.push(() => tryBuildBitwiseMba(value, ctx, depth, options));
  }
  if (Number.isSafeInteger(value)) {
    candidates.push(() => tryBuildMulDivMba(value, ctx, depth, options));
  }
  if (!candidates.length) {
    return null;
  }
  ctx.rng.shuffle(candidates);
  for (const build of candidates) {
    const expr = build();
    if (expr) {
      return expr;
    }
  }
  return null;
}

function buildExpression(value, ctx, depth, options) {
  if (!Number.isFinite(value)) {
    return buildLiteral(0);
  }
  if (depth >= options.maxDepth || !ctx.rng.bool(options.innerProbability)) {
    return buildLiteral(value);
  }
  if (ctx.rng.bool(0.45)) {
    const nonlinear = buildNonLinearExpression(value, ctx, depth, options);
    if (nonlinear) {
      return nonlinear;
    }
  }
  const offset = randomOffset(ctx.rng, options.range);
  if (ctx.rng.bool(0.5)) {
    const leftValue = offset;
    const rightValue = value - offset;
    if (!Number.isFinite(rightValue)) {
      return buildLiteral(value);
    }
    return {
      type: "BinaryExpression",
      operator: "+",
      left: buildExpression(leftValue, ctx, depth + 1, options),
      right: buildExpression(rightValue, ctx, depth + 1, options),
    };
  }
  const leftValue = value + offset;
  if (!Number.isFinite(leftValue)) {
    return buildLiteral(value);
  }
  return {
    type: "BinaryExpression",
    operator: "-",
    left: buildExpression(leftValue, ctx, depth + 1, options),
    right: buildExpression(offset, ctx, depth + 1, options),
  };
}

function numbersToExpressions(ast, ctx) {
  if (!ctx.options.numbers) {
    return;
  }
  const probability = ctx.options.numbersOptions?.probability ?? 1;
  const innerProbability = ctx.options.numbersOptions?.innerProbability ?? 0.2;
  const maxDepth = ctx.options.numbersOptions?.maxDepth ?? 6;
  const range = ctx.options.numbersOptions?.range ?? 2 ** 20;
  const readNames =
    ctx && typeof ctx.getSSA === "function"
      ? collectSSAReadNamesFromRoot(ctx.getSSA())
      : null;

  const settings = {
    innerProbability,
    maxDepth,
    range,
  };

  walk(ast, (node, parent, key, index) => {
    if (!node || node.type !== "NumericLiteral") {
      return;
    }
    if (node.__obf_skip_numbers) {
      return;
    }
    if (readNames && parent && key === "init" && typeof index === "number") {
      if (parent.type === "LocalStatement") {
        const variable = parent.variables && parent.variables[index];
        if (variable && variable.type === "Identifier" && !readNames.has(variable.name)) {
          return;
        }
      } else if (parent.type === "AssignmentStatement") {
        const variable = parent.variables && parent.variables[index];
        if (variable && variable.type === "Identifier" && !readNames.has(variable.name)) {
          return;
        }
      }
    }
    if (!ctx.rng.bool(probability)) {
      return;
    }
    const value = typeof node.value === "number" ? node.value : Number(node.raw);
    if (!Number.isFinite(value)) {
      return;
    }
    const expr = buildExpression(value, ctx, 0, settings);
    if (!parent || key === null || key === undefined) {
      return;
    }
    const target = index === null || index === undefined
      ? parent[key]
      : parent[key][index];
    if (!target || typeof target !== "object") {
      return;
    }
    Object.keys(target).forEach((prop) => {
      delete target[prop];
    });
    Object.assign(target, expr);
  });
}

module.exports = {
  numbersToExpressions,
};
