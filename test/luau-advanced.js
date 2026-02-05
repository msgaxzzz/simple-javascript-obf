const assert = require("assert");
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
  assert.ok(code.includes("while pc ~= 0 do"), "block dispatch should emit pc loop");
  assert.ok(!code.includes("inst = bc[pc]"), "block dispatch should omit bc table loop");
}

(async () => {
  await runNumbersExpressions();
  await runConstArrayBase64();
  await runBlockDispatchCustom();
  console.log("luau-advanced: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
