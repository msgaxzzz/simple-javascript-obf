const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { walk } = require("../src/luau/ast");

const source = [
  "local function foo()",
  "  foo()",
  "  print(\"hi\")",
  "end",
  "",
  "foo()",
].join("\n");

function hasEnvIndex(ast, name) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node || node.type !== "IndexExpression") {
      return;
    }
    const index = node.index;
    if (!index || index.type !== "StringLiteral") {
      return;
    }
    let value = typeof index.value === "string" ? index.value : null;
    if (value === null && typeof index.raw === "string" && index.raw.length >= 2) {
      const quote = index.raw[0];
      if (quote === "\"" || quote === "'") {
        value = index.raw.slice(1, -1);
      }
    }
    if (value === name) {
      found = true;
    }
  });
  return found;
}

function hasCallBase(ast, name) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node || node.type !== "CallExpression") {
      return;
    }
    if (node.base && node.base.type === "Identifier" && node.base.name === name) {
      found = true;
    }
  });
  return found;
}

async function run() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    rename: false,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    renameOptions: { maskGlobals: true },
    seed: "mask-globals-custom",
  });

  const ast = parseCustom(code);

  assert.ok(hasEnvIndex(ast, "print"), "custom: print should be masked via env alias");
  assert.ok(!hasEnvIndex(ast, "foo"), "custom: local foo should not be masked");
  assert.ok(hasCallBase(ast, "foo"), "custom: local foo calls should remain identifiers");
  assert.ok(!hasCallBase(ast, "print"), "custom: print calls should not remain bare identifiers");
}

async function runRepeatUntilScopeRegression() {
  const repeatSource = [
    "local function test()",
    "  local n = 0",
    "  repeat",
    "    local x = n + 1",
    "    n = x",
    "  until x > 1",
    "  return n",
    "end",
    "print(test())",
  ].join("\n");

  const { code } = await obfuscateLuau(repeatSource, {
    lang: "luau",
    luauParser: "custom",
    rename: false,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    renameOptions: { maskGlobals: true },
    seed: "mask-globals-repeat-scope",
  });

  const ast = parseCustom(code);
  assert.ok(!hasEnvIndex(ast, "x"), "repeat-until locals should remain visible in the condition");
}

(async () => {
  await run();
  await runRepeatUntilScopeRegression();
  console.log("luau-mask-globals: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
