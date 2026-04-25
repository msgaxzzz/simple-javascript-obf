import type { Chunk } from "./custom/nodes";

export interface StringEncodeOptions {
  stringsOptions: {
    minLength: number;
    maxCount: number;
    segmentSize?: number;
    sampleRate?: number;
    split?: boolean;
    splitMin?: number;
    splitMaxParts?: number;
  };
}

export interface StringEncodeContext {
  options: StringEncodeOptions;
  rng: {
    int(min: number, max: number): number;
    shuffle<T>(items: T[]): T[];
    bool(probability: number): boolean;
  };
  debugTrace?: (event: unknown) => void;
}

const stringsImpl = require("./strings-impl") as {
  decodeRawString: (raw: string | null | undefined) => string | null;
  stringEncode: (ast: Chunk, ctx: StringEncodeContext) => void;
};

export const decodeRawString = stringsImpl.decodeRawString;

export function stringEncode(ast: Chunk, ctx: StringEncodeContext): void {
  stringsImpl.stringEncode(ast, ctx);
}
