const { walk } = require("./ast");

function stringLiteral(value, ctx) {
  const raw = JSON.stringify(value);
  if (ctx && ctx.factory && typeof ctx.factory.makeStringLiteral === "function") {
    return ctx.factory.makeStringLiteral(raw, value);
  }
  return { type: "StringLiteral", value, raw };
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
    return {
      type: "TableField",
      kind: "index",
      key: stringLiteral(field.name.name, ctx),
      value: field.value,
    };
  }
  return field;
}

function encodeMembers(ast, ctx) {
  if (!shouldEncodeMembers(ctx.options)) {
    return;
  }

  walk(ast, (node, parent, key, index) => {
    if (!node || !parent || key === null || key === undefined) {
      return;
    }
    if (node.type === "MemberExpression") {
      if (parent.type === "FunctionDeclaration" && key === "identifier") {
        return;
      }
      const replacement = encodeMemberExpression(node, ctx);
      if (replacement !== node) {
        if (index === null || index === undefined) {
          parent[key] = replacement;
        } else {
          parent[key][index] = replacement;
        }
      }
      return;
    }
    if (node.type === "TableKeyString" || node.kind === "name") {
      const replacement = encodeTableField(node, ctx);
      if (replacement !== node) {
        if (index === null || index === undefined) {
          parent[key] = replacement;
        } else {
          parent[key][index] = replacement;
        }
      }
    }
  });
}

module.exports = {
  encodeMembers,
};
