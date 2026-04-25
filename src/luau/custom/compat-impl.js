function normalizeLegacyNodeShape(node) {
  return node;
}

function isOfficialStyleChunk(node) {
  return Boolean(node && typeof node === "object" && node.type === "Chunk");
}

module.exports = {
  normalizeLegacyNodeShape,
  isOfficialStyleChunk,
};
