const { parse } = require("./parser");
const { printChunk } = require("./printer");
const { walk } = require("./walk");

function parseLuau(source) {
  return parse(source);
}

function generateLuau(ast) {
  return printChunk(ast);
}

module.exports = {
  parseLuau,
  generateLuau,
  walk,
};
