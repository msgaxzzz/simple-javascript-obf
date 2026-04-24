import type { SourceLocation } from "./locations";

export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
  range: [number, number];
  loc: SourceLocation;
}

export interface TokenizerInstance {
  source: string;
  length: number;
  index: number;
  line: number;
  column: number;
  peeked: Token | null;
  next(): Token;
  peek(): Token;
}

export interface TokenizerConstructor {
  new (source: string): TokenizerInstance;
}

const tokenizerImpl = require("./tokenizer-impl") as {
  Tokenizer: TokenizerConstructor;
};

export const Tokenizer: TokenizerConstructor = tokenizerImpl.Tokenizer;
