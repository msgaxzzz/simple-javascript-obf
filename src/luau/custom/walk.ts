import type { BaseNode } from "./nodes";

export type WalkVisitor = (
  node: BaseNode,
  parent: BaseNode | null,
  key: string | null,
  index: number | null,
) => void;

const walkImpl = require("./walk-impl") as {
  walk: (node: BaseNode, visitor: WalkVisitor) => void;
};

export const walk = walkImpl.walk;
