import type { PrintOptions, PrintResult } from "./printer";
import type { CustomAstTypeMetadata } from "./types";
import type { Chunk } from "./nodes";

export interface ParserConstructor {
  new (source: string): {
    parse(): Chunk;
  };
}

export interface TokenizerConstructor {
  new (source: string): {
    next(): unknown;
    peek(): unknown;
  };
}

const customIndex = require("./index.js") as {
  parseLuau: (source: string) => Chunk;
  generateLuau: (ast: Chunk, options?: PrintOptions) => PrintResult;
  Parser: ParserConstructor;
  Tokenizer: TokenizerConstructor;
  types: CustomAstTypeMetadata;
};

export const parseLuau = customIndex.parseLuau;
export const generateLuau = customIndex.generateLuau;
export const Parser = customIndex.Parser;
export const Tokenizer = customIndex.Tokenizer;
export const types = customIndex.types;
