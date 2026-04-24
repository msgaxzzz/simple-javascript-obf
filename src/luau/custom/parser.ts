import type { Chunk } from "./nodes";
import type { Position, SourceLocation } from "./locations";
import type { Token, TokenizerInstance } from "./tokenizer";

export interface ParserNode {
  type: string;
  range?: [number, number];
  loc?: SourceLocation;
  body?: ParserNode[];
}

export interface ParserInstance {
  tokenizer: TokenizerInstance;
  current: Token;
  last: Token | null;
  parse(): Chunk;
  advance(): Token;
  is(type: string, value?: string): boolean;
  eat(type: string, value?: string): Token | null;
  expect(type: string, value?: string): Token;
  raise(message: string, token?: Token, expected?: string | null): never;
  peek(): Token;
  clonePosition(pos: Position | null | undefined): Position | null;
  nodeStart(node: ParserNode | null | undefined): { range: [number, number]; loc: SourceLocation } | null;
  finishNode<T extends ParserNode>(node: T, startToken: Token, endToken?: Token | null): T;
}

export interface ParserConstructor {
  new (source: string): ParserInstance;
}

const parserImpl = require("./parser-impl") as {
  Parser: ParserConstructor;
  parse: (source: string) => Chunk;
};

export const Parser: ParserConstructor = parserImpl.Parser;
export const parse: (source: string) => Chunk = parserImpl.parse;
