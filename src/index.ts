import type { ParserOptions } from "@babel/parser";
import type { File } from "@babel/types";

export interface ObfuscateResult {
  code: string;
  map: unknown;
}

const indexImpl = require("./index-impl") as {
  obfuscate: (source: string, userOptions?: Record<string, unknown>) => Promise<ObfuscateResult>;
  parseSource: (code: string, filename?: string) => File;
};

export const obfuscate = indexImpl.obfuscate;
export const parseSource = indexImpl.parseSource;
