const { walk } = require("./ast");
const { decodeRawString } = require("./strings");

function stringLiteral(value, ctx) {
  const raw = JSON.stringify(value);
  if (ctx && ctx.factory && typeof ctx.factory.makeStringLiteral === "function") {
    return ctx.factory.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
}

function buildConcat(parts, ctx) {
  if (!parts.length) {
    return stringLiteral("", ctx);
  }
  let expr = parts[0];
  for (let i = 1; i < parts.length; i += 1) {
    expr = {
      type: "BinaryExpression",
      operator: "..",
      left: expr,
      right: parts[i],
    };
  }
  return expr;
}

function splitString(value, rng, maxParts) {
  const length = value.length;
  const maxCount = Math.max(2, Math.min(maxParts, length));
  const count = rng.int(2, maxCount);
  const parts = [];
  let offset = 0;
  let remaining = length;
  for (let i = 0; i < count - 1; i += 1) {
    const maxSize = remaining - (count - 1 - i);
    const size = rng.int(1, Math.max(1, maxSize));
    parts.push(value.slice(offset, offset + size));
    offset += size;
    remaining -= size;
  }
  parts.push(value.slice(offset));
  return parts;
}

function getStringValue(node) {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (typeof node.raw === "string") {
    return decodeRawString(node.raw);
  }
  return null;
}

function splitStringsLuau(ast, ctx) {
  if (!ctx.options.stringsOptions || !ctx.options.stringsOptions.split) {
    return;
  }
  if (ctx.options.strings) {
    return;
  }
  const splitMin = ctx.options.stringsOptions.splitMin ?? 12;
  const splitMaxParts = ctx.options.stringsOptions.splitMaxParts ?? 3;

  walk(ast, (node, parent, key, index) => {
    if (!node || node.type !== "StringLiteral") {
      return;
    }
    if (node.__obf_skip_split) {
      return;
    }
    const value = getStringValue(node);
    if (typeof value !== "string") {
      return;
    }
    if (value.length < splitMin) {
      return;
    }
    const parts = splitString(value, ctx.rng, splitMaxParts);
    const expr = buildConcat(parts.map((part) => stringLiteral(part, ctx)), ctx);
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
  splitStringsLuau,
};
