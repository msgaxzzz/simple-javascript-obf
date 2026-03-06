const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

const source = [
  "local function demo()",
  "  local a = 1",
  "  local b = 2",
  "  a = a + b",
  "  print(a)",
  "end",
].join("\n");

function runLuau(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-cff-"));
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

async function runCustom() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    cff: true,
    cffOptions: { mode: "classic" },
    strings: false,
    seed: "cff-custom",
  });
  parseCustom(code);
  assert.ok(code.includes("while"), "custom parser should emit while loop");
}

async function runLocalReturnScopeRegression() {
  const scopeSource = [
    "local function pair()",
    "  return 1, 2",
    "end",
    "local function f(...)",
    "  local n = select('#', ...)",
    "  local a, b = ...",
    "  return n, a, b",
    "end",
    "local n, a, b = f(pair())",
    "print(n, a, b)",
  ].join("\n");

  const { code } = await obfuscateLuau(scopeSource, {
    lang: "luau",
    luauParser: "custom",
    cff: true,
    cffOptions: { mode: "classic" },
    strings: false,
    rename: false,
    dead: false,
    numbers: false,
    seed: "cff-local-scope",
  });
  parseCustom(code);
  assert.strictEqual(runLuau(code), "2\t1\t2", "classic CFF should keep flattened locals visible to later returns");
}

(async () => {
  await runCustom();
  await runLocalReturnScopeRegression();
  console.log("luau-cff: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
