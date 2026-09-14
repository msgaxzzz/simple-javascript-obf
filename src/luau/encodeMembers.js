function stringLiteral(value, ctx) {
  const bytes = Array.from(Buffer.from(String(value), "utf8"));
  const raw = bytes.length
    ? `"${bytes.map((num) => `\\${String(num).padStart(3, "0")}`).join("")}"`
    : "\"\"";
  if (ctx && ctx.factory && typeof ctx.factory.makeStringLiteral === "function") {
    return ctx.factory.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
}

function escapeInterpolatedRaw(value) {
  const bytes = Array.from(Buffer.from(String(value), "utf8"));
  return bytes.map((num) => `\\${String(num).padStart(3, "0")}`).join("");
}

function shouldEncodeMembers(options) {
  if (!options || !options.stringsOptions) {
    return false;
  }
  return options.stringsOptions.encodeObjectKeys !== false;
}

function encodeMemberExpression(node, ctx) {
  if (!node || node.type !== "MemberExpression") {
    return node;
  }
  if (node.indexer === ":") {
    return node;
  }
  const name = node.identifier && node.identifier.name;
  if (typeof name !== "string") {
    return node;
  }
  return {
    type: "IndexExpression",
    base: node.base,
    index: stringLiteral(name, ctx),
  };
}

function cloneNode(value) {
  if (Array.isArray(value)) {
    return value.map(cloneNode);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = cloneNode(value[key]);
    }
    return out;
  }
  return value;
}

function isStableMethodBase(expr) {
  if (!expr || typeof expr !== "object") {
    return false;
  }
  switch (expr.type) {
    case "Identifier":
      return true;
    case "GroupExpression":
      return isStableMethodBase(expr.expression);
    case "MemberExpression":
      return isStableMethodBase(expr.base);
    case "IndexExpression":
      return isStableMethodBase(expr.base) && Boolean(
        expr.index &&
          (
            expr.index.type === "Identifier" ||
            expr.index.type === "StringLiteral" ||
            expr.index.type === "NumericLiteral" ||
            expr.index.type === "BooleanLiteral"
          )
      );
    default:
      return false;
  }
}

function encodeMethodCallExpression(node, ctx) {
  if (!node || node.type !== "MethodCallExpression") {
    return node;
  }
  const name = node.method && node.method.name;
  if (typeof name !== "string" || !isStableMethodBase(node.base)) {
    return node;
  }
  return {
    type: "CallExpression",
    base: {
      type: "IndexExpression",
      base: node.base,
      index: stringLiteral(name, ctx),
    },
    arguments: [
      cloneNode(node.base),
      ...(Array.isArray(node.arguments) ? node.arguments : []),
    ],
  };
}

function encodeTableField(field, ctx) {
  if (!field || typeof field !== "object") {
    return field;
  }
  if (field.type === "TableKeyString") {
    return {
      type: "TableKey",
      key: stringLiteral(field.key.name, ctx),
      value: field.value,
    };
  }
  if (field.kind === "name") {
    const rawName = field.name?.name || field.key?.name || (typeof field.name === "string" ? field.name : (typeof field.key === "string" ? field.key : null));
    if (rawName) {
      return {
        type: "TableField",
        kind: "index",
        key: stringLiteral(rawName, ctx),
        value: field.value,
      };
    }
  }
  return field;
}

function encodeMembers(ast, ctx) {
  if (!shouldEncodeMembers(ctx.options)) {
    return;
  }

  function encodeAny(value, parent = null, key = null) {
    if (!value || typeof value !== "object") {
      return value;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        value[i] = encodeAny(value[i], value, i);
      }
      return value;
    }

    let node = value;
    if (node.type === "MemberExpression") {
      if (!(parent && parent.type === "FunctionDeclaration" && key === "identifier")) {
        node = encodeMemberExpression(node, ctx);
      }
    } else if (node.type === "MethodCallExpression") {
      node = encodeMethodCallExpression(node, ctx);
    } else if (node.type === "TableKeyString" || node.kind === "name") {
      node = encodeTableField(node, ctx);
    } else if (node.type === "InterpolatedString" && Array.isArray(node.parts)) {
      node.parts.forEach((part) => {
        if (part && part.type === "InterpolatedStringText" && typeof part.raw === "string" && part.raw.length) {
          part.raw = escapeInterpolatedRaw(part.raw);
        }
      });
    }

    for (const childKey of Object.keys(node)) {
      if (childKey === "loc" || childKey === "range") {
        continue;
      }
      node[childKey] = encodeAny(node[childKey], node, childKey);
    }

    if (parent && key !== null && key !== undefined && !Array.isArray(parent)) {
      parent[key] = node;
    }
    return node;
  }

  encodeAny(ast);
}

module.exports = {
  encodeMembers,
};
