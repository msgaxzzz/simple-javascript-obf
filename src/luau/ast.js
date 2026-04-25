const { parseLuau: parseCustomLuau, generateLuau: generateCustomLuau } = require("./custom");
const { normalizeLegacyNodeShape } = require("./custom/compat");
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
  if (
    options.luaVersion !== undefined &&
    options.luaVersion !== null &&
    options.luaVersion !== "5.1" &&
    options.luaVersion !== "Luau" &&
    options.luaVersion !== "luau"
  ) {
    throw new Error(`[js-obf] luau parse failed: unsupported luaVersion ${options.luaVersion}`);
  }
  try {
    return normalizeLegacyNodeShape(parseCustomLuau(source, options), options);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    const wrapped = new Error(`[js-obf] luau parse failed: ${message}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

function generateLuau(ast, options) {
  return generateCustomLuau(normalizeLegacyNodeShape(ast), options);
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
