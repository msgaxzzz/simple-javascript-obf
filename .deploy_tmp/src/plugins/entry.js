function rewriteGlobalEntry(ast, ctx) {
  const { traverse, t, nameGen } = ctx;
  let replacement = null;

  traverse(ast, {
    Program(path) {
      path.traverse({
        MemberExpression(memberPath) {
          const { node } = memberPath;
          if (!t.isIdentifier(node.object, { name: "globalThis" })) {
            return;
          }
          const isDirect =
            !node.computed && t.isIdentifier(node.property, { name: "__r" });
          const isComputed =
            node.computed && t.isStringLiteral(node.property, { value: "__r" });
          if (!isDirect && !isComputed) {
            return;
          }
          if (!replacement) {
            replacement = nameGen.next();
          }
          node.property = t.stringLiteral(replacement);
          node.computed = true;
        },
      });
    },
  });
}

module.exports = rewriteGlobalEntry;
