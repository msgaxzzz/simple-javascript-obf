const parserModule = require("./parser");
const tokenizerModule = require("./tokenizer");
const printerModule = require("./printer");
const walkModule = require("./walk");
const traverseModule = require("./traverse");
const validateModule = require("./validate");
const { parse } = parserModule;
const { printChunk } = printerModule;
const { walk } = walkModule;
const { traverse } = traverseModule;
const { buildScope } = require("./scope");
const factory = require("./factory");
const { validate } = validateModule;
const { buildCFG } = require("./cfg");
const { buildSSA } = require("./ssa");
const { buildIR, buildIRSSA } = require("./ir");
const { printIR } = require("./ir-printer");
const diagnostics = require("./diagnostics");
const { Tokenizer } = tokenizerModule;

const nodes = {
  rootType: "Chunk",
  nodeTypes: [
    "Chunk",
    "StatBlock",
    "StatAssign",
    "StatCompoundAssign",
    "StatExpr",
    "StatFunction",
    "StatLocalFunction",
    "StatLocal",
    "StatIf",
    "StatWhile",
    "StatRepeat",
    "StatFor",
    "StatForIn",
    "StatReturn",
    "StatBreak",
    "StatContinue",
    "StatTypeAlias",
    "StatTypeFunction",
    "StatDeclareFunction",
    "StatDeclareGlobal",
    "StatDeclareExternType",
    "StatError",
    "ExprLocal",
    "ExprGlobal",
    "ExprConstantNil",
    "ExprConstantBool",
    "ExprConstantNumber",
    "ExprConstantInteger",
    "ExprConstantString",
    "ExprInterpString",
    "ExprFunction",
    "ExprTable",
    "ExprUnary",
    "ExprBinary",
    "ExprTypeAssertion",
    "ExprGroup",
    "ExprIndexName",
    "ExprIndexExpr",
    "ExprCall",
    "ExprIfElse",
    "ExprVarargs",
    "ExprInstantiate",
    "ExprError",
    "TypeReference",
    "TypeTable",
    "TypeFunction",
    "TypeTypeof",
    "TypeOptional",
    "TypeUnion",
    "TypeIntersection",
    "TypePack",
    "TypePackExplicit",
    "TypePackVariadic",
    "TypePackGeneric",
    "TypeGroup",
    "TypeSingletonBool",
    "TypeSingletonString",
    "TypeError",
    "GenericType",
    "GenericTypePack",
    "Attr",
    "Identifier",
  ],
  sharedNodeFields: ["type", "range", "loc"],
};

const locations = {
  positionFields: ["line", "column"],
  locationFields: ["begin", "end"],
  sourceLocationFields: ["begin", "end"],
  baseNodeFields: ["type", "range", "loc"],
};

const diagnosticTypes = {
  diagnosticFields: ["message", "expected", "token", "location", "range"],
  diagnosticTokenFields: ["type", "value", "location"],
  fields: ["message", "expected", "token", "location", "range"],
  tokenFields: ["type", "value", "location"],
};

const types = {
  contractKeys: ["nodes", "locations", "diagnosticTypes"],
  nodes,
  locations,
  diagnosticTypes,
};

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
  Parser: parserModule.Parser,
  Tokenizer,
  types,
  nodes,
  locations,
  diagnosticTypes,
};
