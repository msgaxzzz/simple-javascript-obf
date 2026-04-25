import type { BaseNode } from "./nodes";

export interface TraverseContext {
  skip(): void;
  remove(): void;
  replace(next: BaseNode): void;
}

export interface TraverseLeaveContext {
  remove(): void;
  replace(next: BaseNode): void;
}

export type TraverseVisitor = unknown;

const traverseImpl = require("./traverse-impl") as {
  traverse: (root: BaseNode, visitor: TraverseVisitor) => BaseNode | null;
};

export const traverse = traverseImpl.traverse;
