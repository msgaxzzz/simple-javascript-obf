const { walk } = require("./ast");
const { decodeRawString } = require("./strings-impl");

function stringLiteral(value, ctx) {
  const raw = JSON.stringify(value);
  if (ctx && ctx.factory && typeof ctx.factory.makeStringLiteral === "function") {
    return ctx.factory.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
}

function escapedByteStringLiteral(value, ctx) {
  const bytes = Array.from(Buffer.from(String(value), "utf8"));
  const raw = `"${bytes.map((byte) => `\\${String(byte).padStart(3, "0")}`).join("")}"`;
  if (ctx && ctx.factory && typeof ctx.factory.makeStringLiteral === "function") {
    return ctx.factory.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
}

function identifier(name) {
  return { type: "Identifier", name };
}

function numericLiteral(value) {
  return { type: "NumericLiteral", value, raw: String(value) };
}

function charCallExpression(text) {
  const bytes = Array.from(Buffer.from(String(text), "utf8"));
  return {
    type: "CallExpression",
    base: {
      type: "MemberExpression",
      base: identifier("string"),
      identifier: identifier("char"),
      indexer: ".",
    },
    arguments: bytes.map((b) => numericLiteral(b)),
  };
}

function buildConcat(parts) {
  if (!parts.length) {
    return { type: "StringLiteral", value: "", raw: '""' };
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

function buildTableConcat(parts, isCustom, rng) {
  const fields = parts.map((part, index) => {
    if (isCustom) {
      return {
        type: "TableField",
        kind: "index",
        key: numericLiteral(index + 1),
        value: part,
      };
    }
    return {
      type: "TableKey",
      key: numericLiteral(index + 1),
      value: part,
    };
  });
  if (rng) {
    rng.shuffle(fields);
  }
  return {
    type: "CallExpression",
    base: {
      type: "MemberExpression",
      base: identifier("table"),
      identifier: identifier("concat"),
      indexer: ".",
    },
    arguments: [
      {
        type: "TableConstructorExpression",
        fields,
      },
    ],
  };
}

function buildStringFormat(parts, ctx) {
  const formatStr = parts.map(() => "%s").join("");
  return {
    type: "CallExpression",
    base: {
      type: "MemberExpression",
      base: identifier("string"),
      identifier: identifier("format"),
      indexer: ".",
    },
    arguments: [escapedByteStringLiteral(formatStr, ctx), ...parts],
  };
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

function buildChunkNode(part, ctx, rng) {
  const choice = rng.int(0, 3);
  if (choice === 0 && part.length <= 4) {
    return charCallExpression(part);
  }
  if (choice === 1 || choice === 0) {
    return escapedByteStringLiteral(part, ctx);
  }
  return stringLiteral(part, ctx);
}

function assembleChunks(chunkNodes, ctx, rng, isCustom) {
  const strategy = rng.int(0, 2);
  if (strategy === 0) {
    return buildConcat(chunkNodes);
  }
  if (strategy === 1) {
    return buildTableConcat(chunkNodes, isCustom, rng);
  }
  return buildStringFormat(chunkNodes, ctx);
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
  const splitMaxParts = ctx.options.stringsOptions.splitMaxParts ?? 4;
  const isCustom = !ctx.options || ctx.options.luauParser !== "luaparse";

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
    const rawParts = splitString(value, ctx.rng, splitMaxParts);
    const chunkNodes = rawParts.map((part) => buildChunkNode(part, ctx, ctx.rng));
    const expr = assembleChunks(chunkNodes, ctx, ctx.rng, isCustom);
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

