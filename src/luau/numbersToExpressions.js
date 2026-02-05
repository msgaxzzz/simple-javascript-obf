const { walk } = require("./ast");
const { collectSSAReadNamesFromRoot } = require("./ssa-utils");

function numericLiteral(value) {
  return {
    type: "NumericLiteral",
    value,
    raw: Number.isFinite(value) ? String(value) : "0",
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

function buildExpression(value, ctx, depth, options) {
  if (!Number.isFinite(value)) {
    return buildLiteral(0);
  }
  if (depth >= options.maxDepth || !ctx.rng.bool(options.innerProbability)) {
    return buildLiteral(value);
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
    if (index === null || index === undefined) {
      parent[key] = expr;
    } else {
      parent[key][index] = expr;
    }
  });
}

module.exports = {
  numbersToExpressions,
};
