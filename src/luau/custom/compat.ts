import type { Chunk } from "./nodes";

const compatImpl = require("./compat-impl") as {
  normalizeLegacyNodeShape: <T>(node: T, options?: ParseCompatibilityOptions) => T;
  isOfficialStyleChunk: (node: unknown) => boolean;
};

export interface ParseCompatibilityOptions {
  locations?: boolean;
  ranges?: boolean;
}

export function normalizeLegacyNodeShape<T>(node: T, options?: ParseCompatibilityOptions): T {
  return compatImpl.normalizeLegacyNodeShape(node, options);
}

export function isOfficialStyleChunk(node: unknown): node is Chunk {
  return compatImpl.isOfficialStyleChunk(node);
}
