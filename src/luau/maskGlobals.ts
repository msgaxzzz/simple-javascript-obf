import type { Chunk } from "./custom/nodes";

export interface MaskGlobalsContext {
  options: {
    renameOptions?: {
      maskGlobals?: boolean;
    };
    luauParser?: string;
  };
  rng: {
    int(min: number, max: number): number;
  };
  factory?: Record<string, unknown>;
  buildScope?: (ast: Chunk, options?: Record<string, unknown>) => unknown;
  getScope?: () => unknown;
  getSSA?: () => unknown;
  debugTrace?: (event: unknown) => void;
}

const maskGlobalsImpl = require("./maskGlobals-impl") as {
  maskGlobalsLuau: (ast: Chunk, ctx: MaskGlobalsContext) => void;
};

export function maskGlobalsLuau(ast: Chunk, ctx: MaskGlobalsContext): Chunk {
  maskGlobalsImpl.maskGlobalsLuau(ast, ctx);
  return ast;
}
