const { describe, test, expect } = require("bun:test");
const { obfuscate, parseSource } = require("../src");
const { obfuscateLuau } = require("../src/luau");

describe("Bun runtime support", () => {
  test("obfuscates JavaScript code via CJS require", async () => {
    const source = "function add(a, b) { return a + b; } console.log(add(2, 3));";
    const result = await obfuscate(source, { preset: "high" });
    expect(result).toBeDefined();
    expect(typeof result.code).toBe("string");
    expect(result.code.length).toBeGreaterThan(0);
  });

  test("obfuscates JavaScript code with VM virtualization", async () => {
    const source = "function calc(x) { return x * 2 + 1; }";
    const result = await obfuscate(source, { preset: "high", vm: true });
    expect(result).toBeDefined();
    expect(typeof result.code).toBe("string");
  });

  test("parses JavaScript source using parseSource", () => {
    const ast = parseSource("const answer = 42;");
    expect(ast).toBeDefined();
    expect(ast.type).toBe("File");
  });

  test("obfuscates Luau source code", async () => {
    const source = "local function greet(name: string): string return 'hello ' .. name end";
    const result = await obfuscateLuau(source, { preset: "high" });
    expect(result).toBeDefined();
    expect(typeof result.code).toBe("string");
    expect(result.code.length).toBeGreaterThan(0);
  });

  test("supports ESM default import", async () => {
    const mod = await import("../src");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default.obfuscate).toBe("function");
    expect(typeof mod.obfuscate).toBe("function");
  });

  test("runs Luau WebAssembly VM and engine checks", async () => {
    const { isWasmEngineAvailable, executeLuauWasm, checkLuauWasm } = await import("../src/luau/wasm");
    const available = await isWasmEngineAvailable();
    expect(available).toBe(true);

    const execResult = await executeLuauWasm("return 100 + 200");
    expect(execResult.ok).toBe(true);
    expect(execResult.output).toContain("300");

    const checkResult = await checkLuauWasm("local x: number = 42");
    expect(checkResult.ok).toBe(true);
  });

  test("obfuscates Luau with 3-address RC VM and executes in Official WASM VM", async () => {
    const { checkLuauWasm, executeLuauWasm } = await import("../src/luau/wasm");
    const source = `
      local function testFn(x, y)
        local z = x * y
        return z + 5
      end
      print("RC_VAL:", testFn(10, 4))
    `;
    const res = await obfuscateLuau(source, {
      vm: {
        enabled: true,
        kind: "rc",
        packed: true,
      },
    });
    expect(res).toBeDefined();
    expect(typeof res.code).toBe("string");

    const check = await checkLuauWasm(res.code);
    expect(check.ok).toBe(true);

    const exec = await executeLuauWasm(res.code);
    expect(exec.ok).toBe(true);
    expect(exec.output).toContain("RC_VAL:\t45");
  });
});

