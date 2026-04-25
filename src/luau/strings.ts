import type { Chunk, BaseNode } from "./custom/nodes";

export interface StringEncodeContext {
  options: {
    stringsOptions?: Record<string, unknown>;
  };
  rng: {
    int(min: number, max: number): number;
    shuffle<T>(items: T[]): T[];
    chance?(probability: number): boolean;
  };
  debugTrace?: (event: unknown) => void;
}

const stringsImpl = require("./strings-impl") as {
  decodeRawString: (raw: string | null | undefined) => string | null;
  stringEncode: (ast: Chunk, ctx: StringEncodeContext) => void;
};

export const decodeRawString = stringsImpl.decodeRawString;

export function stringEncode(ast: Chunk, ctx: StringEncodeContext): Chunk {
  stringsImpl.stringEncode(ast, ctx);
  return ast;
}
