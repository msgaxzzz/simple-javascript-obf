const parserModule = require("./parser.js");
const compatModule = require("./compat.js");
const tokenizerModule = require("./tokenizer.js");
const printerModule = require("./printer.js");
const walkModule = require("./walk.js");
const traverseModule = require("./traverse.js");
const validateModule = require("./validate.js");
const { parse } = parserModule;
const { printChunk } = printerModule;
const { walk } = walkModule;
const { traverse } = traverseModule;
const { buildScope } = require("./scope.js");
const factory = require("./factory.js");
const { validate } = validateModule;
const { buildCFG } = require("./cfg.js");
const { buildSSA } = require("./ssa.js");
const { buildIR, buildIRSSA } = require("./ir.js");
const { printIR } = require("./ir-printer.js");
const diagnostics = require("./diagnostics.js");
const { Tokenizer } = tokenizerModule;
const { normalizeOfficialNodeShape } = compatModule;

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
  return normalizeOfficialNodeShape(parse(source));
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
