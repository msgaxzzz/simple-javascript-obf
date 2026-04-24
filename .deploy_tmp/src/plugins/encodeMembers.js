function makeGlobalAccess(t, name) {
  return t.memberExpression(t.identifier("globalThis"), t.stringLiteral(name), true);
}

function isGlobalIdentifier(path, name) {
  return path.isIdentifier({ name }) && !path.scope.getBinding(name);
}

function encodeMembers(ast, ctx) {
  const { traverse, t, options } = ctx;
  const enabled = options.stringsOptions.encodeConsole !== false;
  if (!enabled) {
    return;
  }

  traverse(ast, {
    MemberExpression(path) {
      const { node } = path;
      const objectPath = path.get("object");
      if (!isGlobalIdentifier(objectPath, "console")) {
        return;
      }
      node.object = makeGlobalAccess(t, "console");
      if (!node.computed && t.isIdentifier(node.property)) {
        node.property = t.stringLiteral(node.property.name);
        node.computed = true;
      }
    },
    OptionalMemberExpression(path) {
      const { node } = path;
      const objectPath = path.get("object");
      if (!isGlobalIdentifier(objectPath, "console")) {
        return;
      }
      node.object = makeGlobalAccess(t, "console");
      if (!node.computed && t.isIdentifier(node.property)) {
        node.property = t.stringLiteral(node.property.name);
        node.computed = true;
      }
    },
  });
}

module.exports = encodeMembers;
