function walk(node, visitor) {
  const stack = [{ node, parent: null, key: null, index: null }];
  while (stack.length) {
    const current = stack.pop();
    const value = current.node;
    if (!value || typeof value !== "object") {
      continue;
    }
    if (value.type && typeof value.type === "string") {
      visitor(value, current.parent, current.key, current.index);
    }
    for (const key of Object.keys(value)) {
      const child = value[key];
      if (Array.isArray(child)) {
        for (let i = child.length - 1; i >= 0; i -= 1) {
          const item = child[i];
          if (item && typeof item === "object") {
            stack.push({ node: item, parent: value, key, index: i });
          }
        }
      } else if (child && typeof child === "object") {
        stack.push({ node: child, parent: value, key, index: null });
      }
    }
  }
}

module.exports = {
  walk,
};
