function isSimpleLiteral(node) {
  return (
    node.type === "NumericLiteral" ||
    node.type === "StringLiteral" ||
    node.type === "BooleanLiteral" ||
    node.type === "NullLiteral"
  );
}

function literalValue(node) {
  if (node.type === "NullLiteral") return null;
  return node.value;
}

function makeLiteral(t, value) {
  if (value === undefined) return t.identifier("undefined");
  if (value === null) return t.nullLiteral();
  if (typeof value === "string") return t.stringLiteral(value);
  if (typeof value === "number") return t.numericLiteral(value);
  if (typeof value === "boolean") return t.booleanLiteral(value);
  return t.nullLiteral();
}

function containsSuper(node) {
  if (!node) {
    return false;
  }
  const stack = [node];
  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (current.type === "Super") {
      return true;
    }
    for (const key of Object.keys(current)) {
      const value = current[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === "string") {
            stack.push(child);
          }
        }
      } else if (value && typeof value.type === "string") {
        stack.push(value);
      }
    }
  }
  return false;
}

module.exports = {
  containsSuper,
  isSimpleLiteral,
  literalValue,
  makeLiteral,
};
