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

export type TraverseEnterHandler = (
  node: BaseNode,
  parent: BaseNode | null,
  key: string | null,
  index: number | null,
  context: TraverseContext,
) => void;

export type TraverseLeaveHandler = (
  node: BaseNode,
  parent: BaseNode | null,
  key: string | null,
  index: number | null,
  context: TraverseLeaveContext,
) => void;

export interface TraverseNodeVisitor {
  enter?: TraverseEnterHandler;
  leave?: TraverseLeaveHandler;
}

export interface TraverseVisitorMap {
  enter?: TraverseEnterHandler;
  leave?: TraverseLeaveHandler;
  [nodeType: string]: TraverseEnterHandler | TraverseLeaveHandler | TraverseNodeVisitor | undefined;
}

export type TraverseVisitor = TraverseEnterHandler | TraverseVisitorMap;

const traverseImpl = require("./traverse-impl") as {
  traverse: (root: BaseNode, visitor: TraverseVisitor) => BaseNode | null;
};

export const traverse = traverseImpl.traverse;
