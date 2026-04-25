export interface LuauObfuscateResult {
  code: string;
  map: unknown;
  cfg?: unknown;
  ssa?: unknown;
  ir?: unknown;
  irSSA?: unknown;
}

const luauIndex = require("./index.js") as {
  obfuscateLuau: (source: string, options?: Record<string, unknown>) => Promise<LuauObfuscateResult>;
  MAX_LUAU_OUTPUT_BYTES: number;
};

export const obfuscateLuau = luauIndex.obfuscateLuau;
export const MAX_LUAU_OUTPUT_BYTES = luauIndex.MAX_LUAU_OUTPUT_BYTES;
