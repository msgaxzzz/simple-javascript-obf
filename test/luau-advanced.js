const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

const numbersSource = [
  "local function demo(x)",
  "  local value = 9876543",
  "  local other = 13579",
  "  return value + other + x",
  "end",
].join("\n");

const constArraySource = [
  "local function greet(name)",
  "  local msg = \"hello constant\"",
  "  return msg .. name",
  "end",
].join("\n");

const vmSource = [
  "local function demo(a, b)",
  "  local c = a + b",
  "  if c > 3 then",
  "    return c",
  "  end",
  "  return a - b",
  "end",
].join("\n");

function runLuau(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-advanced-"));
  const file = path.join(dir, "case.luau");
  try {
    fs.writeFileSync(file, code, "utf8");
    const result = spawnSync("luau", [file], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `luau exited with code ${result.status}`);
    }
    return result.stdout.trim();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function luauLongStringLiteral(value) {
  const text = String(value);
  let equals = "";
  while (text.includes(`]${equals}]`)) {
    equals += "=";
  }
  return `[${equals}[${text}]${equals}]`;
}

function runLuauWithRobloxLikeGlobals(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-advanced-"));
  const runner = path.join(dir, "runner.luau");
  try {
    fs.writeFileSync(runner, [
      `local source = ${luauLongStringLiteral(code)}`,
      "local fn, err = loadstring(source)",
      "assert(fn, err)",
      "local env = {",
      "  _G = {},",
      "  string = string,",
      "  table = table,",
      "  math = math,",
      "  os = os,",
      "  debug = debug,",
      "  type = type,",
      "  getfenv = getfenv,",
      "  getmetatable = getmetatable,",
      "  setmetatable = setmetatable,",
      "  pcall = pcall,",
      "  error = error,",
      "  print = print,",
      "  tonumber = tonumber,",
      "  tostring = tostring,",
      "  select = select,",
      "}",
      "setfenv(fn, env)",
      "local result = fn()",
      "if result ~= nil then print(result) end",
    ].join("\n"), "utf8");
    const result = spawnSync("luau", [runner], { cwd: dir, encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || `luau exited with code ${result.status}`);
    }
    return result.stdout.trim();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function runNumbersExpressions() {
  const baseOptions = {
    lang: "luau",
    luauParser: "custom",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    seed: "numbers-test",
  };

  const { code: plain } = await obfuscateLuau(numbersSource, baseOptions);
  const { code: transformed } = await obfuscateLuau(numbersSource, {
    ...baseOptions,
    numbers: true,
    numbersOptions: {
      probability: 1,
      innerProbability: 1,
      maxDepth: 4,
    },
  });

  parseCustom(transformed);
  assert.notStrictEqual(plain, transformed, "numbers pass should change output");
  assert.ok(!transformed.includes("9876543"), "numbers pass should hide sentinel literal");
  assert.ok(!/\bbit32\b/.test(transformed), "numbers pass should not expose bit32 helper names");
}

async function runConstArrayBase64() {
  const { code } = await obfuscateLuau(constArraySource, {
    lang: "luau",
    luauParser: "custom",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    vm: false,
    constArray: true,
    constArrayOptions: {
      encoding: "base64",
      wrapper: true,
      probability: 1,
    },
    seed: "const-array-test",
  });

  parseCustom(code);
  assert.ok(
    code.includes("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"),
    "const array base64 runtime should exist"
  );
}

async function runBlockDispatchCustom() {
  const { code } = await obfuscateLuau(vmSource, {
    lang: "luau",
    luauParser: "custom",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    vm: { enabled: true, blockDispatch: true },
    seed: "vm-block-custom",
  });
  parseCustom(code);
  assert.ok(
    /while\s+[A-Za-z_][A-Za-z0-9_]*\s*~=\s*0\s*do/.test(code),
    "block dispatch should emit pc loop"
  );
  assert.ok(!code.includes("inst = bc[pc]"), "block dispatch should omit bc table loop");
}

async function runSignatureHiding() {
  const { code } = await obfuscateLuau(vmSource, {
    lang: "luau",
    luauParser: "custom",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    antiHook: { enabled: true, lock: true },
    vm: { enabled: true },
    seed: "vm-signature-hiding",
  });

  parseCustom(code);
  assert.ok(!code.includes("Integrity check failed"), "anti-hook output should not expose integrity failure text");
  assert.ok(!code.includes("Runtime integrity violation"), "anti-hook output should not expose runtime failure text");
  assert.ok(!/\bbxor\b/.test(code), "vm runtime should not expose bxor helper names");
  assert.ok(!code.includes("local dbg = debug"), "anti-hook runtime should not expose fixed debug local names");
  assert.ok(!code.includes("local lockEnv ="), "anti-hook runtime should not expose fixed lockEnv local names");
}

async function runAntiHookLockReadonlyEnvCompatibility() {
  const source = [
    "local Engine = {}",
    "Engine.__index = Engine",
    "function Engine.new()",
    "  local self = {}",
    "  return setmetatable(self, Engine)",
    "end",
    "print(Engine.new() ~= nil)",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    antiHook: { enabled: true, lock: true },
    vm: { enabled: false },
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "anti-hook-readonly-env",
  });

  parseCustom(code);
  assert.strictEqual(
    runLuau(code),
    "true",
    "anti-hook lock should not fail on readonly luau environments"
  );
}

async function runAntiHookRobloxLikeGlobalsCompatibility() {
  const { code } = await obfuscateLuau("return string.char(111, 107)", {
    lang: "luau",
    luauParser: "custom",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    antiHook: { enabled: true, lock: false },
    vm: { enabled: false },
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: { maskGlobals: false },
    seed: "anti-hook-roblox-like-globals",
  });

  parseCustom(code);
  assert.strictEqual(
    runLuauWithRobloxLikeGlobals(code),
    "ok",
    "anti-hook should not assume Roblox standard libraries live on _G"
  );
}

(async () => {
  await runNumbersExpressions();
  await runConstArrayBase64();
  await runBlockDispatchCustom();
  await runSignatureHiding();
  await runAntiHookLockReadonlyEnvCompatibility();
  await runAntiHookRobloxLikeGlobalsCompatibility();
  console.log("luau-advanced: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
