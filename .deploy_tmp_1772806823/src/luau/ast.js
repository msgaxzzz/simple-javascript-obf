const luaparse = require("luaparse");
const luacodegen = require("luacodegen");
const { traverse } = require("./custom/traverse");
const { buildScope } = require("./custom/scope");
const factory = require("./custom/factory");
const { validate } = require("./custom/validate");
const { buildCFG } = require("./custom/cfg");
const { buildSSA } = require("./custom/ssa");
const { buildIR, buildIRSSA } = require("./custom/ir");
const { printIR } = require("./custom/ir-printer");
const diagnostics = require("./custom/diagnostics");

function extractDirectives(source) {
  const lines = source.split(/\r?\n/);
  const directives = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trimStart();
    if (!trimmed) {
      index += 1;
      continue;
    }
    if (trimmed.startsWith("--")) {
      if (trimmed.startsWith("--!")) {
        directives.push(line);
      }
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
      locations: options.locations !== undefined ? options.locations : true,
      ranges: options.ranges !== undefined ? options.ranges : true,
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
  traverse(node, (value, parent, key, index) => {
    visitor(value, parent, key, index);
  });
}

module.exports = {
  extractDirectives,
  generateLuau,
  insertAtTop,
  parseLuau,
  traverse,
  buildScope,
  validate,
  factory,
  buildCFG,
  buildSSA,
  buildIR,
  buildIRSSA,
  printIR,
  diagnostics,
  walk,
};
