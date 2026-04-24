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

const nodes = {
  rootType: "Chunk",
  nodeTypes: [
    "Chunk",
    "Block",
    "LocalStatement",
    "AssignmentStatement",
    "CompoundAssignmentStatement",
    "CallStatement",
    "FunctionDeclaration",
    "FunctionExpression",
    "IfStatement",
    "IfExpression",
    "WhileStatement",
    "RepeatStatement",
    "ForNumericStatement",
    "ForGenericStatement",
    "DoStatement",
    "ReturnStatement",
    "BreakStatement",
    "ContinueStatement",
    "LabelStatement",
    "GotoStatement",
    "TypeAliasStatement",
    "ExportTypeStatement",
    "TypeFunctionStatement",
    "ExportTypeFunctionStatement",
    "DeclareFunctionStatement",
    "DeclareVariableStatement",
    "FunctionName",
    "Attribute",
    "Identifier",
    "NumericLiteral",
    "StringLiteral",
    "InterpolatedString",
    "InterpolatedStringText",
    "BooleanLiteral",
    "NilLiteral",
    "VarargLiteral",
    "UnaryExpression",
    "BinaryExpression",
    "TypeAssertion",
    "GroupExpression",
    "MemberExpression",
    "IndexExpression",
    "CallExpression",
    "MethodCallExpression",
    "TableConstructorExpression",
    "TableField",
    "UnionType",
    "IntersectionType",
    "OptionalType",
    "TypePack",
    "VariadicType",
    "TypeLiteral",
    "TypeofType",
    "TypeReference",
    "TableType",
    "TableTypeField",
    "FunctionType",
    "ParenthesizedType",
    "TupleType",
    "TypeParameter",
  ],
  sharedNodeFields: ["type", "range", "loc"],
};

const locations = {
  positionFields: ["line", "column"],
  sourceLocationFields: ["start", "end"],
  baseNodeFields: ["type", "range", "loc"],
};

const diagnosticTypes = {
  fields: ["message", "expected", "token", "loc", "range"],
  tokenFields: ["type", "value"],
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
  types,
  nodes,
  locations,
  diagnosticTypes,
};
