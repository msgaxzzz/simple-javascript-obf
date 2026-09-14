export * from "./engine";

export type LuauEngineType = "custom" | "wasm" | "auto";

export interface LuauEngineConfig {
  engine?: LuauEngineType;
}
