import type { SourceLocation, BaseNode } from "./locations";
export type { BaseNode };

// ---------------------------------------------------------------------------
// Identifiers & Literals
// ---------------------------------------------------------------------------

export interface Identifier extends BaseNode {
  type: "Identifier";
  name: string;
  annotation?: TypeAnnotation | null;
}

export interface NumericLiteral extends BaseNode {
  type: "NumericLiteral";
  value: number;
  raw?: string;
  suffix?: "i" | null;
}

export interface StringLiteral extends BaseNode {
  type: "StringLiteral";
  value?: string;
  raw: string;
}

export interface BooleanLiteral extends BaseNode {
  type: "BooleanLiteral";
  value: boolean;
  raw?: string;
}

export interface NilLiteral extends BaseNode {
  type: "NilLiteral";
  value?: null;
  raw?: string;
}

export interface VarargLiteral extends BaseNode {
  type: "VarargLiteral";
  value?: string;
  raw?: string;
}

export interface InterpolatedStringText extends BaseNode {
  type: "InterpolatedStringText";
  raw: string;
}

export type InterpolatedStringPart = InterpolatedStringText | Expression;

export interface InterpolatedString extends BaseNode {
  type: "InterpolatedString";
  raw?: string;
  parts?: InterpolatedStringPart[];
}

// ---------------------------------------------------------------------------
// Attributes & Helper Sub-nodes
// ---------------------------------------------------------------------------

export interface Attribute extends BaseNode {
  type: "Attribute";
  name: Identifier | string;
  arguments: (Expression | StringLiteral | NumericLiteral | BooleanLiteral | NilLiteral)[];
  argumentStyle?: "call" | "bare";
}

export interface AttributeList extends BaseNode {
  type: "AttributeList";
  attributes: Attribute[];
}

export interface FunctionName extends BaseNode {
  type: "FunctionName";
  base: Identifier;
  members: Identifier[];
  method?: Identifier | null;
}

export interface TableField extends BaseNode {
  type: "TableField";
  kind: "list" | "name" | "index";
  key?: Expression | null;
  name?: Identifier | null;
  value: Expression;
  separator?: "," | ";";
}

export interface TableTypeField extends BaseNode {
  type: "TableTypeField";
  kind: "list" | "name" | "index";
  key?: TypeAnnotation | null;
  name?: Identifier | null;
  value: TypeAnnotation;
  access?: "read" | "write" | null;
}

export interface IfClause {
  condition: Expression;
  body?: Block | null;
  value?: Expression | null;
}

// ---------------------------------------------------------------------------
// Type Annotations
// ---------------------------------------------------------------------------

export type TypeName = Identifier | string | (Identifier | string)[];

export interface TypeParameter extends BaseNode {
  type: "TypeParameter";
  name: Identifier | string | null;
  value?: TypeAnnotation | null;
  isPack?: boolean;
  packStyle?: "prefix" | "postfix" | null;
  default?: TypeAnnotation | null;
}

export interface TypeReference extends BaseNode {
  type: "TypeReference";
  name: TypeName;
  typeArguments?: TypeAnnotation[];
  typeArgumentsExplicit?: boolean;
  prefix?: TypeName | null;
}

export interface UnionType extends BaseNode {
  type: "UnionType";
  types: TypeAnnotation[];
}

export interface IntersectionType extends BaseNode {
  type: "IntersectionType";
  types: TypeAnnotation[];
}

export interface OptionalType extends BaseNode {
  type: "OptionalType";
  base: TypeAnnotation;
}

export interface VariadicType extends BaseNode {
  type: "VariadicType";
  value: TypeAnnotation;
}

export interface TypeLiteral extends BaseNode {
  type: "TypeLiteral";
  raw: string;
  value?: string | boolean | number;
}

export interface TypeofType extends BaseNode {
  type: "TypeofType";
  expression: Expression;
}

export interface FunctionTypeParameter {
  name?: Identifier | string | null;
  type?: TypeAnnotation;
  value?: TypeAnnotation;
  isPack?: boolean;
}

export interface FunctionType extends BaseNode {
  type: "FunctionType";
  parameters: (FunctionTypeParameter | TypeParameter | TypeAnnotation)[];
  returnTypes: TypeAnnotation[];
  typeParameters?: TypeParameter[];
}

export interface TableType extends BaseNode {
  type: "TableType";
  fields: TableTypeField[];
}

export interface ParenthesizedType extends BaseNode {
  type: "ParenthesizedType";
  value: TypeAnnotation;
}

export interface TupleType extends BaseNode {
  type: "TupleType";
  items: TypeAnnotation[];
}

export interface TypePack extends BaseNode {
  type: "TypePack";
  value: TypeAnnotation;
  postfix?: boolean;
}

export type TypeAnnotation =
  | TypeReference
  | UnionType
  | IntersectionType
  | OptionalType
  | VariadicType
  | TypeLiteral
  | TypeofType
  | FunctionType
  | TableType
  | ParenthesizedType
  | TupleType
  | TypePack
  | TypeParameter
  | BaseNode;

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export interface BinaryExpression extends BaseNode {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: "UnaryExpression";
  operator: string;
  argument: Expression;
}

export interface TypeAssertion extends BaseNode {
  type: "TypeAssertion";
  expression: Expression;
  annotation: TypeAnnotation;
}

export interface MemberExpression extends BaseNode {
  type: "MemberExpression";
  base: Expression;
  indexer: "." | ":";
  identifier: Identifier;
}

export interface IndexExpression extends BaseNode {
  type: "IndexExpression";
  base: Expression;
  index: Expression;
}

export interface CallExpression extends BaseNode {
  type: "CallExpression";
  base: Expression;
  arguments: Expression[];
  typeArguments?: TypeAnnotation[];
}

export interface MethodCallExpression extends BaseNode {
  type: "MethodCallExpression";
  base: Expression;
  method: Identifier;
  arguments: Expression[];
  typeArguments?: TypeAnnotation[];
}

export interface TypeInstantiation extends BaseNode {
  type: "TypeInstantiation";
  expression: Expression;
  typeArguments: TypeAnnotation[];
}

export interface IfExpression extends BaseNode {
  type: "IfExpression";
  clauses: IfClause[];
  elseValue: Expression;
}

export interface GroupExpression extends BaseNode {
  type: "GroupExpression";
  expression: Expression;
}

export interface TableConstructorExpression extends BaseNode {
  type: "TableConstructorExpression";
  fields: TableField[];
}

export interface FunctionExpression extends BaseNode {
  type: "FunctionExpression";
  parameters: Identifier[];
  hasVararg?: boolean;
  varargAnnotation?: TypeAnnotation | null;
  returnType?: TypeAnnotation | null;
  typeParameters?: TypeParameter[];
  body: Block | Statement[];
  attributes?: (Attribute | AttributeList)[];
}

export type Expression =
  | Identifier
  | NumericLiteral
  | StringLiteral
  | BooleanLiteral
  | NilLiteral
  | VarargLiteral
  | InterpolatedString
  | BinaryExpression
  | UnaryExpression
  | TypeAssertion
  | MemberExpression
  | IndexExpression
  | CallExpression
  | MethodCallExpression
  | TypeInstantiation
  | IfExpression
  | GroupExpression
  | FunctionExpression
  | TableConstructorExpression
  | BaseNode;

// ---------------------------------------------------------------------------
// Statements & Program Structure
// ---------------------------------------------------------------------------

export interface Chunk extends BaseNode {
  type: "Chunk";
  body: Statement[];
}

export interface Block extends BaseNode {
  type: "Block";
  body: Statement[];
}

export interface LocalStatement extends BaseNode {
  type: "LocalStatement";
  variables: Identifier[];
  init: Expression[];
  attributes?: (Attribute | AttributeList)[];
  isConst?: boolean;
  exported?: boolean;
}

export interface AssignmentStatement extends BaseNode {
  type: "AssignmentStatement";
  variables: Expression[];
  init: Expression[];
  attributes?: (Attribute | AttributeList)[];
}

export interface CompoundAssignmentStatement extends BaseNode {
  type: "CompoundAssignmentStatement";
  operator: string;
  variable: Expression;
  value: Expression;
  attributes?: (Attribute | AttributeList)[];
}

export interface CallStatement extends BaseNode {
  type: "CallStatement";
  expression: CallExpression | MethodCallExpression;
  attributes?: (Attribute | AttributeList)[];
}

export interface FunctionDeclaration extends BaseNode {
  type: "FunctionDeclaration";
  name: Identifier | FunctionName;
  parameters: Identifier[];
  hasVararg?: boolean;
  varargAnnotation?: TypeAnnotation | null;
  returnType?: TypeAnnotation | null;
  typeParameters?: TypeParameter[];
  isLocal: boolean;
  isConst?: boolean;
  exported?: boolean;
  body: Block | Statement[];
  attributes?: (Attribute | AttributeList)[];
}

export interface IfStatement extends BaseNode {
  type: "IfStatement";
  clauses: IfClause[];
  elseBody?: Block | Statement[] | null;
  attributes?: Attribute[];
}

export interface WhileStatement extends BaseNode {
  type: "WhileStatement";
  condition: Expression;
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface RepeatStatement extends BaseNode {
  type: "RepeatStatement";
  condition: Expression;
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface ForNumericStatement extends BaseNode {
  type: "ForNumericStatement";
  variable: Identifier;
  start: Expression;
  end: Expression;
  step?: Expression | null;
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface ForGenericStatement extends BaseNode {
  type: "ForGenericStatement";
  variables: Identifier[];
  iterators: Expression[];
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface DoStatement extends BaseNode {
  type: "DoStatement";
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface ReturnStatement extends BaseNode {
  type: "ReturnStatement";
  arguments: Expression[];
  attributes?: Attribute[];
}

export interface BreakStatement extends BaseNode {
  type: "BreakStatement";
  attributes?: Attribute[];
}

export interface ContinueStatement extends BaseNode {
  type: "ContinueStatement";
  attributes?: Attribute[];
}

export interface LabelStatement extends BaseNode {
  type: "LabelStatement";
  name: Identifier | string;
  attributes?: Attribute[];
}

export interface GotoStatement extends BaseNode {
  type: "GotoStatement";
  name: Identifier | string;
  attributes?: Attribute[];
}

export interface TypeAliasStatement extends BaseNode {
  type: "TypeAliasStatement";
  name: Identifier | string;
  typeParameters?: TypeParameter[];
  value: TypeAnnotation;
  exported?: boolean;
  attributes?: Attribute[];
}

export interface ExportTypeStatement extends BaseNode {
  type: "ExportTypeStatement";
  name: Identifier | string;
  typeParameters?: TypeParameter[];
  value: TypeAnnotation;
  attributes?: Attribute[];
}

export interface TypeFunctionStatement extends BaseNode {
  type: "TypeFunctionStatement";
  name: Identifier | string;
  typeParameters?: TypeParameter[];
  parameters?: Identifier[];
  hasVararg?: boolean;
  varargAnnotation?: TypeAnnotation | null;
  returnTypes?: TypeAnnotation[];
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface ExportTypeFunctionStatement extends BaseNode {
  type: "ExportTypeFunctionStatement";
  name: Identifier | string;
  typeParameters?: TypeParameter[];
  parameters?: Identifier[];
  hasVararg?: boolean;
  varargAnnotation?: TypeAnnotation | null;
  returnTypes?: TypeAnnotation[];
  body: Block | Statement[];
  attributes?: Attribute[];
}

export interface DeclareFunctionStatement extends BaseNode {
  type: "DeclareFunctionStatement";
  name: Identifier | FunctionName;
  typeParameters?: TypeParameter[];
  parameters?: Identifier[];
  hasVararg?: boolean;
  varargAnnotation?: TypeAnnotation | null;
  returnTypes?: TypeAnnotation[];
  returnType?: TypeAnnotation | null;
  attributes?: Attribute[];
}

export interface DeclareVariableStatement extends BaseNode {
  type: "DeclareVariableStatement";
  name: Identifier | string;
  annotation: TypeAnnotation;
  attributes?: Attribute[];
}

export interface DeclareGlobalStatement extends BaseNode {
  type: "DeclareGlobalStatement";
  name: Identifier | string;
  annotation?: TypeAnnotation;
  attributes?: Attribute[];
}

export interface DeclareClassProperty extends BaseNode {
  type: "DeclareClassProperty" | "DeclareFunctionStatement";
  name: Identifier | string;
  annotation?: TypeAnnotation;
}

export interface DeclareClassStatement extends BaseNode {
  type: "DeclareClassStatement";
  name: Identifier | string;
  superName?: Identifier | string | null;
  properties: (DeclareClassProperty | DeclareFunctionStatement)[];
  attributes?: Attribute[];
}

export interface ClassProperty extends BaseNode {
  type: "ClassProperty";
  name: Identifier;
  annotation?: TypeAnnotation | null;
  isPublic?: boolean;
}

export interface ClassMethod extends BaseNode {
  type: "ClassMethod";
  name: Identifier;
  func: FunctionExpression;
  isPublic?: boolean;
}

export interface ClassStatement extends BaseNode {
  type: "ClassStatement";
  name: Identifier;
  superName?: Identifier | null;
  members: (ClassProperty | ClassMethod)[];
  exported?: boolean;
  attributes?: (Attribute | AttributeList)[];
}

export type Statement =
  | LocalStatement
  | AssignmentStatement
  | CompoundAssignmentStatement
  | CallStatement
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | RepeatStatement
  | ForNumericStatement
  | ForGenericStatement
  | DoStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | LabelStatement
  | GotoStatement
  | TypeAliasStatement
  | ExportTypeStatement
  | TypeFunctionStatement
  | ExportTypeFunctionStatement
  | DeclareFunctionStatement
  | DeclareVariableStatement
  | DeclareGlobalStatement
  | DeclareClassStatement
  | ClassStatement
  | BaseNode;

export type Node =
  | Chunk
  | Block
  | Statement
  | Expression
  | TypeAnnotation
  | TableField
  | TableTypeField
  | Attribute
  | AttributeList
  | ClassProperty
  | ClassMethod;

// ---------------------------------------------------------------------------
// Constants & Metadata
// ---------------------------------------------------------------------------

export const rootType = "Chunk";

export const nodeTypes = [
  "Chunk",
  "Block",
  "LocalStatement",
  "AssignmentStatement",
  "CompoundAssignmentStatement",
  "CallStatement",
  "FunctionDeclaration",
  "IfStatement",
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
  "DeclareGlobalStatement",
  "DeclareClassStatement",
  "ClassStatement",
  "ClassProperty",
  "ClassMethod",
  "Identifier",
  "NumericLiteral",
  "StringLiteral",
  "BooleanLiteral",
  "NilLiteral",
  "VarargLiteral",
  "InterpolatedString",
  "InterpolatedStringText",
  "BinaryExpression",
  "UnaryExpression",
  "TypeAssertion",
  "MemberExpression",
  "IndexExpression",
  "CallExpression",
  "MethodCallExpression",
  "TypeInstantiation",
  "IfExpression",
  "GroupExpression",
  "FunctionExpression",
  "TableConstructorExpression",
  "TypeReference",
  "UnionType",
  "IntersectionType",
  "OptionalType",
  "VariadicType",
  "TypeLiteral",
  "TypeofType",
  "FunctionType",
  "TableType",
  "ParenthesizedType",
  "TupleType",
  "TypePack",
  "TypeParameter",
  "TableField",
  "TableTypeField",
  "Attribute",
  "AttributeList",
  "FunctionName",
  "StatTypeAlias",
  "ExprIfElse",
  "StatLocalFunction",
  "StatFunction",
  "StatDeclareFunction",
  "ExprInterpString",
  "StatClass",
  "ExprInstantiate",
] as const;

export type NodeType = (typeof nodeTypes)[number];

export const sharedNodeFields = ["type", "range", "loc"] as const;
