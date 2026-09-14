const optionsImpl = require("./options-impl") as {
  normalizeOptions: (userOptions?: Record<string, unknown>) => NormalizedOptions;
  PRESETS: Record<string, Record<string, unknown>>;
};

export interface IdentifierProfile {
  style?: "random" | "legacy";
  alphabet?: string;
  firstAlphabet?: string;
  prefix?: string;
  minLength?: number;
  maxLength?: number;
  homoglyphs?: boolean;
}

export interface NormalizedVmOptions {
  enabled: boolean;
  kind?: "rc" | "stack";
  packed?: boolean;
  bytecodeEncoding?: "base85" | "reference16" | "escape";
  base85Alphabet?: string;
  referenceAlphabet?: string;
  runtimeRename?: boolean;
  runtimeObfuscation?: boolean;
  runtimeNames?: IdentifierProfile;
  compatibilityFallback?: "stack";
  [key: string]: unknown;
}

export interface NormalizedOptions {
  preset: string;
  lang: "js" | "luau" | "java";
  javaOptions: {
    classpath?: string;
    release?: string | number;
    timeoutMs?: number;
  };
  luauParser: string;
  filename: string;
  sourceMap: boolean;
  compact: boolean;
  minify: boolean;
  beautify: boolean;
  timing: boolean;
  ecma: number;
  rename: boolean;
  strings: boolean;
  cff: boolean;
  dead: boolean;
  vm: NormalizedVmOptions;
  renameOptions: IdentifierProfile & {
    reserved: string[];
    [key: string]: unknown;
  };
  stringsOptions: Record<string, unknown>;
  cffOptions: Record<string, unknown>;
  deadCodeOptions: Record<string, unknown>;
  wrapOptions: Record<string, unknown>;
  numbersOptions: Record<string, unknown>;
  constArrayOptions: Record<string, unknown>;
  padFooterOptions: Record<string, unknown>;
  antiHook?: Record<string, unknown>;
  [key: string]: unknown;
}

export const normalizeOptions = optionsImpl.normalizeOptions;
export const PRESETS = optionsImpl.PRESETS;
