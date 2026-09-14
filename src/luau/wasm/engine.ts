import path from "path";
import fs from "fs";

export interface LuauWasmModule {
  checkScript(source: string): string | null;
  executeScript(source: string): string | null;
  compileScript?(source: string): string | null;
  astScript?(source: string): string | null;
}

export interface WasmParseResult {
  ok: boolean;
  ast?: any;
  errors?: string[];
  error?: string;
}

export interface WasmCompileResult {
  ok: boolean;
  bytecodeHex?: string;
  size?: number;
  error?: string;
}

let cachedEmscriptenModule: LuauWasmModule | null = null;
let cachedLuauRs: any = null;

/**
 * Attempt to load the Emscripten-compiled Luau WebAssembly module (from third_party/luau).
 */
export async function loadEmscriptenLuau(): Promise<LuauWasmModule | null> {
  if (cachedEmscriptenModule) {
    return cachedEmscriptenModule;
  }

  const distPath = path.resolve(__dirname, "dist", "luau.web.js");
  if (!fs.existsSync(distPath)) {
    return null;
  }

  try {
    let outputBuffer: string[] = [];
    const createModule = require(distPath);
    const mod = typeof createModule === "function" ? await createModule({
      print: (text: string) => {
        outputBuffer.push(String(text));
      },
      printErr: (text: string) => {
        outputBuffer.push(String(text));
      },
    }) : createModule;

    const checkScript = mod.cwrap ? mod.cwrap("checkScript", "string", ["string"]) : mod._checkScript;
    const executeScript = mod.cwrap ? mod.cwrap("executeScript", "string", ["string"]) : mod._executeScript;
    const compileScript = mod.cwrap ? mod.cwrap("compileScript", "string", ["string"]) : mod._compileScript;
    const astScript = mod.cwrap ? mod.cwrap("astScript", "string", ["string"]) : mod._astScript;

    cachedEmscriptenModule = {
      checkScript(source: string) {
        return checkScript(source);
      },
      executeScript(source: string) {
        outputBuffer.length = 0;
        const err = executeScript(source);
        if (err) {
          const out = outputBuffer.length > 0 ? outputBuffer.join("\n") + "\n" : "";
          return out + err;
        }
        return outputBuffer.length > 0 ? outputBuffer.join("\n") : "";
      },
      compileScript(source: string) {
        return compileScript ? compileScript(source) : null;
      },
      astScript(source: string) {
        return astScript ? astScript(source) : null;
      },
    };

    return cachedEmscriptenModule;
  } catch (err) {
    return null;
  }
}

/**
 * Load @luau-rs/luau WASM fallback if available.
 */
export async function loadLuauRsFallback(): Promise<any | null> {
  if (cachedLuauRs) {
    return cachedLuauRs;
  }

  try {
    const pkg = await import("@luau-rs/luau");
    cachedLuauRs = pkg;
    return pkg;
  } catch {
    return null;
  }
}

/**
 * Check if WebAssembly Luau engine is available in the current environment.
 */
export async function isWasmEngineAvailable(): Promise<boolean> {
  const em = await loadEmscriptenLuau();
  if (em) return true;
  const rs = await loadLuauRsFallback();
  return rs !== null;
}

/**
 * Parse Luau AST using the WebAssembly engine.
 */
export async function parseLuauAstWasm(source: string): Promise<WasmParseResult> {
  const em = await loadEmscriptenLuau();
  if (em && em.astScript) {
    const raw = em.astScript(source);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    }
  }

  const rs = await loadLuauRsFallback();
  if (rs && rs.Lua) {
    try {
      const lua = await rs.Lua.create({ sandbox: true });
      const dump = lua.dump(source);
      return { ok: true, ast: { dump } };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  return { ok: false, error: "No WASM Luau engine loaded. Run scripts/wasm/build-luau-wasm.bat to build it." };
}

/**
 * Validate syntax and types using official Luau WebAssembly.
 */
export async function checkLuauWasm(source: string): Promise<{ ok: boolean; error?: string }> {
  const em = await loadEmscriptenLuau();
  if (em) {
    const err = em.checkScript(source);
    return { ok: !err, error: err || undefined };
  }

  const rs = await loadLuauRsFallback();
  if (rs && rs.Lua) {
    try {
      const lua = await rs.Lua.create({ sandbox: true });
      lua.compile(source);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  return { ok: false, error: "WASM engine unavailable" };
}

/**
 * Execute Luau script inside official Luau WebAssembly VM.
 */
export async function executeLuauWasm(source: string): Promise<{ ok: boolean; output?: string; error?: string }> {
  const em = await loadEmscriptenLuau();
  if (em) {
    const outputOrError = em.executeScript(source);
    if (outputOrError && (outputOrError.includes("error") || outputOrError.startsWith("stdin:"))) {
      return { ok: false, error: outputOrError };
    }
    return { ok: true, output: outputOrError || "Execution completed successfully" };
  }

  const rs = await loadLuauRsFallback();
  if (rs && rs.Lua) {
    try {
      const lua = await rs.Lua.create({ sandbox: true });
      const res = lua.execute(source);
      return { ok: true, output: JSON.stringify(res) };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  return { ok: false, error: "WASM engine unavailable" };
}
