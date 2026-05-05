const assert = require("assert");
const { obfuscate } = require("../src");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { walk } = require("../src/luau/ast");

function hasStringLiteralValue(ast, expected) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node || node.type !== "StringLiteral") {
      return;
    }
    if (node.value === expected) {
      found = true;
    }
  });
  return found;
}

async function runShortStringEncoding() {
  const source = 'print("ji")';
  const { code } = await obfuscate(source, {
    lang: "luau",
    strings: true,
    rename: false,
    cff: false,
    dead: false,
    numbers: false,
    constArray: false,
    proxifyLocals: false,
    padFooter: false,
    vm: { enabled: false },
    seed: "luau-short-string-default",
  });

  const ast = parseCustom(code);
  assert.ok(!hasStringLiteralValue(ast, "ji"), 'short Luau strings should be encoded by default');
  assert.ok(!code.includes('"ji"') && !code.includes("'ji'"), 'output should not expose the raw short string');
}

async function runStringRuntimeLocalNameHiding() {
  const source = [
    'local function demo()',
    '  return "hello world", "hello world"',
    'end',
    'print(demo())',
  ].join("\n");
  const { code } = await obfuscate(source, {
    lang: "luau",
    strings: true,
    rename: false,
    cff: false,
    dead: false,
    numbers: false,
    constArray: false,
    proxifyLocals: false,
    padFooter: false,
    vm: { enabled: false },
    seed: "luau-string-runtime-local-hiding",
  });

  parseCustom(code);
  assert.ok(!code.includes("local cached ="), "string runtime should not expose cached local name");
  assert.ok(!code.includes("local data ="), "string runtime should not expose data local name");
  assert.ok(!code.includes("local out ="), "string runtime should not expose out local name");
}

(async () => {
  await runShortStringEncoding();
  await runStringRuntimeLocalNameHiding();
  console.log("luau-strings: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
