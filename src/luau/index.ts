export interface LuauObfuscateResult {
  code: string;
  map: unknown;
  cfg?: unknown;
  ssa?: unknown;
  ir?: unknown;
  irSSA?: unknown;
}

const fs = require("fs");
const path = require("path");

const sourceLuauIndex = path.join(__dirname, "..", "..", "..", "src", "luau", "index.js");
const isCompiledInBuild =
  fs.existsSync(sourceLuauIndex) &&
  path.resolve(sourceLuauIndex) !== path.resolve(path.join(__dirname, "index.js"));

const luauIndex = (isCompiledInBuild ? require(sourceLuauIndex) : require("./index.js")) as {
  obfuscateLuau: (source: string, options?: Record<string, unknown>) => Promise<LuauObfuscateResult>;
  MAX_LUAU_OUTPUT_BYTES: number;
};

export const obfuscateLuau = luauIndex.obfuscateLuau;
export const MAX_LUAU_OUTPUT_BYTES = luauIndex.MAX_LUAU_OUTPUT_BYTES;

export default {
  obfuscateLuau,
  MAX_LUAU_OUTPUT_BYTES,
};

