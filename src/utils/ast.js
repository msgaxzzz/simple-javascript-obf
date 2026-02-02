function insertAtTop(programPath, nodes) {
  const body = programPath.node.body;
  let index = 0;
  while (index < body.length) {
    const stmt = body[index];
    if (stmt.type === "ExpressionStatement" && stmt.directive) {
      index += 1;
      continue;
    }
    break;
  }
  body.splice(index, 0, ...nodes);
}

module.exports = {
  insertAtTop,
};
