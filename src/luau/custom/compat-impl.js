function isNode(value) {
  return Boolean(value && typeof value === "object" && typeof value.type === "string");
}

function stripLocationFields(node, options) {
  if (!isNode(node)) {
    return node;
  }

  if (options.locations === false) {
    delete node.loc;
  }
  if (options.ranges === false) {
    delete node.range;
  }

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (isNode(item)) {
          stripLocationFields(item, options);
        }
      });
    } else if (isNode(value)) {
      stripLocationFields(value, options);
    }
  }

  return node;
}

function normalizeLegacyNodeShape(node, options = {}) {
  if (!isOfficialStyleChunk(node)) {
    throw new Error("Expected a custom Luau Chunk root");
  }
  return stripLocationFields(node, options);
}

function isOfficialStyleChunk(node) {
  return Boolean(
    node &&
    typeof node === "object" &&
    node.type === "Chunk" &&
    Array.isArray(node.body)
  );
}

module.exports = {
  normalizeLegacyNodeShape,
  isOfficialStyleChunk,
};
