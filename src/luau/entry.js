const { walk } = require("./ast");

function buildName(rng) {
  const suffix = rng.int(0, 0x7fffffff).toString(36);
  return `__obf_${suffix}`;
}

function stringLiteral(value) {
  return { type: "StringLiteral", value, raw: JSON.stringify(value) };
}

function isGlobalEnv(node) {
  return node && node.type === "Identifier" && (node.name === "_G" || node.name === "_ENV");
}

function entryLuau(ast, ctx) {
  let replacement = null;
  walk(ast, (node, parent, key, index) => {
    if (!node || !parent || key === null || key === undefined) {
      return;
    }
    if (node.type === "MemberExpression") {
      if (!isGlobalEnv(node.base)) {
        return;
      }
      if (node.indexer === ":") {
        return;
      }
      const name = node.identifier && node.identifier.name;
      if (name !== "__r") {
        return;
      }
      if (!replacement) {
        replacement = buildName(ctx.rng);
      }
      node.identifier.name = replacement;
      return;
    }
    if (node.type === "IndexExpression") {
      if (!isGlobalEnv(node.base)) {
        return;
      }
      if (!node.index || node.index.type !== "StringLiteral") {
        return;
      }
      const value = node.index.value ?? node.index.raw?.slice(1, -1);
      if (value !== "__r") {
        return;
      }
      if (!replacement) {
        replacement = buildName(ctx.rng);
      }
      node.index = stringLiteral(replacement);
      if (index === null || index === undefined) {
        parent[key] = node;
      } else {
        parent[key][index] = node;
      }
    }
  });
}

module.exports = {
  entryLuau,
};
