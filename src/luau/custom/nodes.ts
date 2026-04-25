import type { SourceLocation } from "./locations";

export type NodeType = (typeof nodeTypes)[number];

export interface BaseNode {
  type: NodeType | string;
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

export type TypeName = Identifier | string;
export type GenericTypeList = TypeAnnotation[];
export type TypeAnnotation = BaseNode;

export interface StatTypeAlias extends BaseNode {
  type: "StatTypeAlias";
  name: TypeName;
  nameLocation?: SourceLocation;
  generics: GenericTypeList | null;
  genericPacks?: GenericTypeList | null;
  annotation: TypeAnnotation;
  exported?: boolean;
}

export interface ExprIfElse extends BaseNode {
  type: "ExprIfElse";
  condition: Expression;
  trueExpression: Expression;
  falseExpression: Expression;
  hasThen?: boolean;
  hasElse?: boolean;
}

export interface TypeReference extends BaseNode {
  type: "TypeReference";
  prefix?: TypeName | null;
  name: TypeName;
  hasParameterList?: boolean;
  parameters?: TypeAnnotation[];
}

export type Statement = BaseNode;
export type Expression = BaseNode;

export const rootType = "Chunk";
export const nodeTypes = [
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
] as const;
export const sharedNodeFields = ["type", "range", "loc"] as const;
