"use strict";

const assert = require("assert");
const { spawnSync } = require("child_process");
const { obfuscateLuau } = require("../src/luau");
const { parseLuau, buildSSA } = require("../src/luau/ast");

const fs = require("fs");
const os = require("os");
const path = require("path");

function runLuau(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-anti-ssa-"));
  const file = path.join(dir, "case.luau");
  try {
    fs.writeFileSync(file, code, "utf8");
    const result = spawnSync("D:\\servers\\luau.exe", [file], { encoding: "utf8" });
    if (result.status !== 0) {
      const errorMsg = result.stderr || result.stdout;
      throw new Error(`Luau execution failed with exit code ${result.status}: ${errorMsg}`);
    }
    return (result.stdout || "").trim();
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {}
  }
}

async function runBasicAntiSSASemantics() {
  const source = [
    "local function calculate(base, factor)",
    "  local x = base * 2",
    "  local y = factor + 10",
    "  local total = x + y",
    "  if total > 50 then",
    "    total = total - 5",
    "  else",
    "    total = total + 5",
    "  end",
    "  return total",
    "end",
    "print(calculate(15, 20))",
  ].join("\n");

  const expected = runLuau(source);
  assert.strictEqual(expected, "55", "Baseline execution check");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    antiSSA: true,
    antiSSAOptions: {
      probability: 1.0,
      phiConfusion: true,
      mba: true,
    },
    rename: false,
    strings: false,
    numbers: false,
    dead: false,
    cff: false,
    wrap: false,
    seed: "anti-ssa-basic-test",
  });

  const actual = runLuau(code);
  assert.strictEqual(actual, expected, "Anti-SSA code must produce identical output to original");
}

async function runPhiConfusionVerification() {
  const source = [
    "local function compute()",
    "  local alpha = 10",
    "  local beta = 20",
    "  local gamma = alpha + beta",
    "  return gamma",
    "end",
    "print(compute())",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    antiSSA: true,
    antiSSAOptions: {
      probability: 1.0,
      phiConfusion: true,
      mba: false,
    },
    rename: false,
    strings: false,
    numbers: false,
    dead: false,
    cff: false,
    wrap: false,
    seed: "anti-ssa-phi-test",
  });

  const actual = runLuau(code);
  assert.strictEqual(actual, "30", "Execution must be correct");

  const ast = parseLuau(code);
  const ssaRoot = buildSSA(ast);
  const targetFn = ssaRoot.functions.find((f) => {
    if (!f.node || !f.node.name) return false;
    const name = f.node.name.base ? f.node.name.base.name : f.node.name.name;
    return name === "compute";
  });
  assert.ok(targetFn, "Should locate compute function in SSA root");

  let totalPhis = 0;
  for (const block of Object.values(targetFn.ssa.blocks)) {
    if (block.phi && block.phi.length) {
      totalPhis += block.phi.length;
    }
  }

  assert.ok(totalPhis >= 2, `Anti-SSA must generate multiple PHI nodes in SSA blocks (found ${totalPhis})`);
}

async function runMbaExpansionVerification() {
  const source = [
    "local function mathOps(a, b, c)",
    "  local r1 = a + b",
    "  local r2 = b - c",
    "  local r3 = r1 + r2",
    "  return r3",
    "end",
    "print(mathOps(100, 50, 20))",
  ].join("\n");

  const expected = runLuau(source);
  assert.strictEqual(expected, "180");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    antiSSA: true,
    antiSSAOptions: {
      probability: 1.0,
      phiConfusion: false,
      mba: true,
    },
    rename: false,
    strings: false,
    numbers: false,
    cff: false,
    dead: false,
    wrap: false,
    seed: "anti-ssa-mba-test",
  });

  const actual = runLuau(code);
  assert.strictEqual(actual, expected, "MBA arithmetic must match original values");
}

async function runCombinedPayloadVmAndAntiSSA() {
  const source = [
    "local function fib(n)",
    "  if n <= 1 then return n end",
    "  local a, b = 0, 1",
    "  for i = 2, n do",
    "    local c = a + b",
    "    a = b",
    "    b = c",
    "  end",
    "  return b",
    "end",
    "print(fib(8))",
  ].join("\n");

  const expected = runLuau(source);
  assert.strictEqual(expected, "21");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    antiSSA: true,
    antiSSAOptions: {
      probability: 0.8,
      phiConfusion: true,
      mba: true,
    },
    vm: {
      enabled: true,
      shellStyle: "payload",
      instructionFusion: true,
      registerRandomization: true,
    },
    rename: true,
    strings: true,
    numbers: true,
    seed: "anti-ssa-vm-combined-test",
  });

  assert.ok(!code.includes("loadstring"), "Must contain zero loadstring");
  assert.ok(!code.includes("load("), "Must contain zero load");

  const actual = runLuau(code);
  assert.strictEqual(actual, expected, "Combined Anti-SSA + Payload VM must execute accurately");
}

(async () => {
  console.log("Running Anti-SSA test suite...");
  await runBasicAntiSSASemantics();
  console.log("  [+] Basic Anti-SSA Semantics: OK");
  await runPhiConfusionVerification();
  console.log("  [+] Phi Confusion Verification: OK");
  await runMbaExpansionVerification();
  console.log("  [+] MBA Expansion Verification: OK");
  await runCombinedPayloadVmAndAntiSSA();
  console.log("  [+] Combined Anti-SSA + Payload VM: OK");
  console.log("luau-anti-ssa: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
