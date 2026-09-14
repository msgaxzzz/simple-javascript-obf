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

export interface PrintOptions {
  sourceMap?: boolean;
  compact?: boolean;
}

export interface SourceMapEntry {
  generatedLine: number;
  generatedColumn: number;
  sourceLine: number;
  sourceColumn: number;
}

export interface PrintedSourceMap {
  code: string;
  mappings: SourceMapEntry[];
}

export type PrintResult = string | PrintedSourceMap;

import * as parserModule from "./parser";
import * as tokenizerModule from "./tokenizer";
import * as printerModule from "./printer";
import * as compatModule from "./compat";
import * as typesModule from "./types";
import * as nodesModule from "./nodes";
import * as locationsModule from "./locations";
import * as diagnosticsModule from "./diagnostics";
import * as walkModule from "./walk";
import * as traverseModule from "./traverse";
import * as validateModule from "./validate";

const { buildScope } = require("./scope");
const factory = require("./factory");
const { buildCFG } = require("./cfg");
const { buildSSA } = require("./ssa");
const { buildIR, buildIRSSA } = require("./ir");
const { printIR } = require("./ir-printer");

export function parseLuau(source: string): any {
  return compatModule.normalizeOfficialNodeShape(parserModule.parse(source));
}

export function generateLuau(ast: any, options?: PrintOptions): PrintResult {
  return printerModule.printChunk(ast, options);
}

export const Parser = parserModule.Parser;
export const Tokenizer = tokenizerModule.Tokenizer;
export const types = typesModule;
export const nodes = nodesModule;
export const locations = locationsModule;
export const diagnosticTypes = diagnosticsModule.diagnosticTypes;
export const walk = walkModule.walk;
export const traverse = traverseModule.traverse;
export const validate = validateModule.validate;
export { buildScope, factory, buildCFG, buildSSA, buildIR, buildIRSSA, printIR };
export const diagnostics = diagnosticsModule;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseLuau,
    generateLuau,
    Parser,
    Tokenizer,
    types,
    nodes,
    locations,
    diagnosticTypes,
    walk,
    traverse,
    validate,
    buildScope,
    factory,
    buildCFG,
    buildSSA,
    buildIR,
    buildIRSSA,
    printIR,
    diagnostics,
  };
}
