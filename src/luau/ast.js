const luaparse = require("luaparse");
const luacodegen = require("luacodegen");

function extractDirectives(source) {
  const lines = source.split(/\r?\n/);
  const directives = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line && line.trimStart().startsWith("--!")) {
      directives.push(line);
      index += 1;
      continue;
    }
    break;
  }
  return directives.join("\n");
}

function parseLuau(source, options = {}) {
  try {
    return luaparse.parse(source, {
      luaVersion: options.luaVersion || "5.1",
      locations: false,
      ranges: false,
      scope: false,
      comments: false,
    });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    const wrapped = new Error(`[js-obf] luau parse failed: ${message}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

function generateLuau(ast) {
  return luacodegen(ast);
}

function insertAtTop(ast, nodes) {
  if (!nodes || !nodes.length) {
    return;
  }
  ast.body.unshift(...nodes);
}

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
  extractDirectives,
  generateLuau,
  insertAtTop,
  parseLuau,
  walk,
};
