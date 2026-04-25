import type { Chunk } from "./custom/nodes";

export interface MaskGlobalsScopeReference {
  name?: string;
}

export interface MaskGlobalsScope {
  bindings: Map<string, unknown> | Set<string>;
  typeBindings: Map<string, unknown> | Set<string>;
  references: MaskGlobalsScopeReference[];
  typeReferences: MaskGlobalsScopeReference[];
  children: MaskGlobalsScope[];
}

export interface MaskGlobalsFactory {
  makeStringLiteral(raw: string, value: string): unknown;
}

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
  factory?: MaskGlobalsFactory;
  buildScope?: (ast: Chunk, options?: Record<string, unknown>) => MaskGlobalsScope;
  getScope?: () => MaskGlobalsScope;
  getSSA?: () => unknown;
  debugTrace?: (event: unknown) => void;
}

const maskGlobalsImpl = require("./maskGlobals-impl") as {
  maskGlobalsLuau: (ast: Chunk, ctx: MaskGlobalsContext) => void;
};

export function maskGlobalsLuau(ast: Chunk, ctx: MaskGlobalsContext): void {
  maskGlobalsImpl.maskGlobalsLuau(ast, ctx);
}
