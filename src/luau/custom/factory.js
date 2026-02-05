function attachLoc(node, loc, range) {
  if (loc) {
    node.loc = loc;
  }
  if (range) {
    node.range = range;
  }
  return node;
}

function makeChunk(body = []) {
  return { type: "Chunk", body };
}

function makeBlock(body = []) {
  return { type: "Block", body };
}

function makeLocalStatement(variables, init = []) {
  return { type: "LocalStatement", variables, init };
}

function makeAssignmentStatement(variables, init) {
  return { type: "AssignmentStatement", variables, init };
}

function makeCompoundAssignmentStatement(operator, variable, value) {
  return { type: "CompoundAssignmentStatement", operator, variable, value };
}

function makeCallStatement(expression) {
  return { type: "CallStatement", expression };
}

function makeFunctionDeclaration({
  name,
  parameters,
  hasVararg = false,
  varargAnnotation = null,
  returnType = null,
  typeParameters = [],
  isLocal = false,
  body,
}) {
  return {
    type: "FunctionDeclaration",
    name,
    parameters,
    hasVararg,
    varargAnnotation,
    returnType,
    typeParameters,
    isLocal,
    body,
  };
}

function makeFunctionExpression({
  parameters,
  hasVararg = false,
  varargAnnotation = null,
  returnType = null,
  typeParameters = [],
  body,
}) {
  return {
    type: "FunctionExpression",
    parameters,
    hasVararg,
    varargAnnotation,
    returnType,
    typeParameters,
    body,
  };
}

function makeIfStatement(clauses, elseBody = null) {
  return { type: "IfStatement", clauses, elseBody };
}

function makeIfExpression(clauses, elseValue) {
  return { type: "IfExpression", clauses, elseValue };
}

function makeWhileStatement(condition, body) {
  return { type: "WhileStatement", condition, body };
}

function makeRepeatStatement(condition, body) {
  return { type: "RepeatStatement", condition, body };
}

function makeForNumericStatement(variable, start, end, step, body) {
  return { type: "ForNumericStatement", variable, start, end, step, body };
}

function makeForGenericStatement(variables, iterators, body) {
  return { type: "ForGenericStatement", variables, iterators, body };
}

function makeDoStatement(body) {
  return { type: "DoStatement", body };
}

function makeReturnStatement(argumentsList = []) {
  return { type: "ReturnStatement", arguments: argumentsList };
}

function makeBreakStatement() {
  return { type: "BreakStatement" };
}

function makeContinueStatement() {
  return { type: "ContinueStatement" };
}

function makeLabelStatement(name) {
  return { type: "LabelStatement", name };
}

function makeGotoStatement(name) {
  return { type: "GotoStatement", name };
}

function makeTypeAliasStatement(name, typeParameters, value) {
  return { type: "TypeAliasStatement", name, typeParameters, value };
}

function makeExportTypeStatement(name, typeParameters, value) {
  return { type: "ExportTypeStatement", name, typeParameters, value };
}

function makeTypeFunctionStatement({
  name,
  typeParameters,
  parameters,
  hasVararg = false,
  varargAnnotation = null,
  returnTypes = [],
  body,
}) {
  return {
    type: "TypeFunctionStatement",
    name,
    typeParameters,
    parameters,
    hasVararg,
    varargAnnotation,
    returnTypes,
    body,
  };
}

function makeExportTypeFunctionStatement(options) {
  return { ...makeTypeFunctionStatement(options), type: "ExportTypeFunctionStatement" };
}

function makeDeclareFunctionStatement({
  name,
  typeParameters,
  parameters,
  hasVararg = false,
  varargAnnotation = null,
  returnType = null,
}) {
  return {
    type: "DeclareFunctionStatement",
    name,
    typeParameters,
    parameters,
    hasVararg,
    varargAnnotation,
    returnType,
  };
}

function makeDeclareVariableStatement(name, annotation) {
  return { type: "DeclareVariableStatement", name, annotation };
}

function makeFunctionName(base, members = [], method = null) {
  return { type: "FunctionName", base, members, method };
}

function makeAttribute(name, args = null, argumentStyle = null) {
  const attr = { type: "Attribute", name, arguments: args };
  if (argumentStyle) {
    attr.argumentStyle = argumentStyle;
  }
  return attr;
}

function makeIdentifier(name) {
  return { type: "Identifier", name };
}

function makeNumericLiteral(value, raw = null) {
  return { type: "NumericLiteral", value, raw: raw ?? String(value) };
}

function makeStringLiteral(raw, value = undefined) {
  const node = { type: "StringLiteral", raw };
  if (value !== undefined) {
    node.value = value;
  }
  return node;
}

function makeInterpolatedString(partsOrRaw) {
  if (typeof partsOrRaw === "string") {
    return { type: "InterpolatedString", raw: partsOrRaw };
  }
  return { type: "InterpolatedString", parts: partsOrRaw || [] };
}

function makeInterpolatedStringText(raw) {
  return { type: "InterpolatedStringText", raw };
}

function makeBooleanLiteral(value) {
  return { type: "BooleanLiteral", value };
}

function makeNilLiteral() {
  return { type: "NilLiteral" };
}

function makeVarargLiteral() {
  return { type: "VarargLiteral" };
}

function makeUnaryExpression(operator, argument) {
  return { type: "UnaryExpression", operator, argument };
}

function makeBinaryExpression(operator, left, right) {
  return { type: "BinaryExpression", operator, left, right };
}

function makeTypeAssertion(expression, annotation) {
  return { type: "TypeAssertion", expression, annotation };
}

function makeGroupExpression(expression) {
  return { type: "GroupExpression", expression };
}

function makeMemberExpression(base, identifier) {
  return { type: "MemberExpression", base, indexer: ".", identifier };
}

function makeIndexExpression(base, index) {
  return { type: "IndexExpression", base, index };
}

function makeCallExpression(base, args = []) {
  return { type: "CallExpression", base, arguments: args };
}

function makeMethodCallExpression(base, method, args = []) {
  return { type: "MethodCallExpression", base, method, arguments: args };
}

function makeTableConstructor(fields = []) {
  return { type: "TableConstructorExpression", fields };
}

function makeTableField(kind, data) {
  return { type: "TableField", kind, ...data };
}

function makeTableFieldIndex(key, value) {
  return { type: "TableField", kind: "index", key, value };
}

function makeTableFieldName(name, value) {
  return { type: "TableField", kind: "name", name, value };
}

function makeTableFieldList(value) {
  return { type: "TableField", kind: "list", value };
}

function makeUnionType(types) {
  return { type: "UnionType", types };
}

function makeIntersectionType(types) {
  return { type: "IntersectionType", types };
}

function makeOptionalType(base) {
  return { type: "OptionalType", base };
}

function makeTypePack(value, postfix = false) {
  return { type: "TypePack", value, postfix };
}

function makeVariadicType(value) {
  return { type: "VariadicType", value };
}

function makeTypeLiteral(raw) {
  return { type: "TypeLiteral", raw };
}

function makeTypeofType(expression) {
  return { type: "TypeofType", expression };
}

function makeTypeReference(name, typeArguments = []) {
  return { type: "TypeReference", name, typeArguments };
}

function makeTableType(fields = []) {
  return { type: "TableType", fields };
}

function makeTableTypeField(kind, data) {
  return { type: "TableTypeField", kind, ...data };
}

function makeTableTypeFieldIndex(key, value, access = null) {
  return { type: "TableTypeField", kind: "index", key, value, access };
}

function makeTableTypeFieldName(name, value, access = null) {
  return { type: "TableTypeField", kind: "name", name, value, access };
}

function makeTableTypeFieldList(value) {
  return { type: "TableTypeField", kind: "list", value };
}

function makeFunctionType(parameters, returnTypes, typeParameters = []) {
  return { type: "FunctionType", parameters, returnTypes, typeParameters };
}

function makeParenthesizedType(value) {
  return { type: "ParenthesizedType", value };
}

function makeTupleType(items) {
  return { type: "TupleType", items };
}

function makeTypeParameter(name, value) {
  return { type: "TypeParameter", name, value };
}

module.exports = {
  attachLoc,
  makeChunk,
  makeBlock,
  makeLocalStatement,
  makeAssignmentStatement,
  makeCompoundAssignmentStatement,
  makeCallStatement,
  makeFunctionDeclaration,
  makeFunctionExpression,
  makeIfStatement,
  makeIfExpression,
  makeWhileStatement,
  makeRepeatStatement,
  makeForNumericStatement,
  makeForGenericStatement,
  makeDoStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeContinueStatement,
  makeLabelStatement,
  makeGotoStatement,
  makeTypeAliasStatement,
  makeExportTypeStatement,
  makeTypeFunctionStatement,
  makeExportTypeFunctionStatement,
  makeDeclareFunctionStatement,
  makeDeclareVariableStatement,
  makeFunctionName,
  makeAttribute,
  makeIdentifier,
  makeNumericLiteral,
  makeStringLiteral,
  makeInterpolatedString,
  makeInterpolatedStringText,
  makeBooleanLiteral,
  makeNilLiteral,
  makeVarargLiteral,
  makeUnaryExpression,
  makeBinaryExpression,
  makeTypeAssertion,
  makeGroupExpression,
  makeMemberExpression,
  makeIndexExpression,
  makeCallExpression,
  makeMethodCallExpression,
  makeTableConstructor,
  makeTableField,
  makeTableFieldIndex,
  makeTableFieldName,
  makeTableFieldList,
  makeUnionType,
  makeIntersectionType,
  makeOptionalType,
  makeTypePack,
  makeVariadicType,
  makeTypeLiteral,
  makeTypeofType,
  makeTypeReference,
  makeTableType,
  makeTableTypeField,
  makeTableTypeFieldIndex,
  makeTableTypeFieldName,
  makeTableTypeFieldList,
  makeFunctionType,
  makeParenthesizedType,
  makeTupleType,
  makeTypeParameter,
};
