const { parse } = require("./parser");
const { printChunk } = require("./printer");
const { walk } = require("./walk");
const { traverse } = require("./traverse");
const { buildScope } = require("./scope");
const factory = require("./factory");
const { validate } = require("./validate");
const { buildCFG } = require("./cfg");
const { buildSSA } = require("./ssa");
const { buildIR, buildIRSSA } = require("./ir");
const { printIR } = require("./ir-printer");
const diagnostics = require("./diagnostics");

function parseLuau(source) {
  return parse(source);
}

function generateLuau(ast, options) {
  return printChunk(ast, options);
}

module.exports = {
  parseLuau,
  generateLuau,
  walk,
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
};
