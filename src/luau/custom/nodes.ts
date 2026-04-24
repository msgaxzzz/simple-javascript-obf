export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface BaseNode {
  type: string;
  range?: [number, number];
  loc?: SourceLocation;
}

export interface Chunk extends BaseNode {
  type: "Chunk";
  body: Statement[];
}

export interface Identifier extends BaseNode {
  type: "Identifier";
  name: string;
}

export type Statement = BaseNode;
export type Expression = BaseNode;

export const rootType = "Chunk";
export const nodeTypes = [
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
] as const;
export const sharedNodeFields = ["type", "range", "loc"] as const;
