function serializeAst(ast) {
  return JSON.parse(JSON.stringify(ast));
}

function countAstNodes(ast) {
  let count = 0;

  (function visit(value) {
    if (!value || typeof value !== "object") {
      return;
    }

    count += 1;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    Object.keys(value).forEach((key) => visit(value[key]));
  })(ast);

  return count;
}

module.exports = {
  serializeAst,
  countAstNodes,
};
