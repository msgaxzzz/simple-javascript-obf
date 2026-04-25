import type { Chunk } from "./nodes";

const compatImpl = require("./compat-impl") as {
  normalizeLegacyNodeShape: <T>(node: T) => T;
  isOfficialStyleChunk: (node: unknown) => boolean;
};

export function normalizeLegacyNodeShape<T>(node: T): T {
  return compatImpl.normalizeLegacyNodeShape(node);
}

export function isOfficialStyleChunk(node: unknown): node is Chunk {
  return compatImpl.isOfficialStyleChunk(node);
}
