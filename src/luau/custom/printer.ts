import type { Chunk } from "./nodes";

export interface SourceMapEntry {
  generatedLine: number;
  generatedColumn: number;
  sourceLine: number;
  sourceColumn: number;
}

export interface PrintOptions {
  sourceMap?: boolean;
  compact?: boolean;
}

export interface PrintedSourceMap {
  code: string;
  mappings: SourceMapEntry[];
}

export type PrintResult = string | PrintedSourceMap;

const printerImpl = require("./printer-impl") as {
  printChunk: (ast: Chunk, options?: PrintOptions) => PrintResult;
};

export const printChunk = printerImpl.printChunk;
