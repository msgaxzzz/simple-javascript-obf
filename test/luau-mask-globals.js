const assert = require("assert");
const rename = require("../src/luau/rename");
const maskGlobals = require("../src/luau/maskGlobals");
const strings = require("../src/luau/strings");
const { obfuscateLuau } = require("../src/luau");
const { parseLuau: parseFromAst } = require("../src/luau/ast");
const { parseLuau: parseCanonical } = require("../src/luau/custom");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { walk } = require("../src/luau/ast");
const { RNG } = require("../src/utils/rng");

assert.ok(rename, "rename transform should still load");
assert.ok(maskGlobals, "maskGlobals transform should still load");
assert.ok(strings, "strings transform should still load");

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

function hasPlainMemberName(ast, name) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node) {
      return;
    }
    if (node.type === "MemberExpression" && node.identifier && node.identifier.name === name) {
      found = true;
      return;
    }
    if (node.type === "MethodCallExpression" && node.method && node.method.name === name) {
      found = true;
    }
  });
  return found;
}

function countText(code, text) {
  return String(code).split(text).length - 1;
}

function runAstCompatContract() {
  const ast = parseFromAst([
    "type Pair<T> = { value: T }",
    "local x: Pair<number> = { value = 1 }",
    "return x.value",
  ].join("\n"));

  assert.ok(ast && ast.type === "Chunk", "ast.parseLuau should return a custom-style chunk");
  assert.strictEqual(ast.body[0].type, "TypeAliasStatement", "ast.parseLuau should translate official type aliases back to legacy shape");
  assert.strictEqual(ast.body[0].typeParameters[0].name, "T", "legacy compat should preserve generic parameters");
  assert.strictEqual(ast.body[1].type, "LocalStatement", "ast.parseLuau should keep transform-facing statement shapes consumable");
}

function runAstCompatOptions() {
  const ast = parseFromAst("local x = 1", { locations: false, ranges: false });
  let sawLocationData = false;

  walk(ast, (node) => {
    if (sawLocationData || !node) {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(node, "loc") || Object.prototype.hasOwnProperty.call(node, "range")) {
      sawLocationData = true;
    }
  });

  assert.ok(!sawLocationData, "ast.parseLuau should honor locations/ranges compatibility flags");

  assert.throws(
    () => parseFromAst("local x = 1", { luaVersion: "5.4" }),
    /unsupported luaVersion 5\.4/,
    "ast.parseLuau should reject unsupported legacy luaVersion values explicitly"
  );
}

function runCanonicalMaskGlobalsContract() {
  const ast = parseCanonical("print(foo)");
  maskGlobals.maskGlobalsLuau(ast, {
    options: { renameOptions: { maskGlobals: true } },
    rng: new RNG("mask-globals-canonical"),
  });
  assert.ok(ast && ast.type === "Chunk", "maskGlobals should accept canonical official-shape AST");
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

async function runGlobalApiChainMasking() {
  const apiSource = [
    "local mockGame = { PlaceVersion = 42 }",
    "function mockGame:GetService(name)",
    "  return { Name = name }",
    "end",
    "game = mockGame",
    "local service = game:GetService(\"Workspace\")",
    "local version = game.PlaceVersion",
    "local function getLocal()",
    "  return { VisibleMember = 7 }",
    "end",
    "local visible = getLocal().VisibleMember",
    "print(service.Name, version, visible)",
  ].join("\n");

  const { code } = await obfuscateLuau(apiSource, {
    lang: "luau",
    luauParser: "custom",
    rename: false,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    numbers: false,
    constArray: false,
    renameOptions: { maskGlobals: true },
    seed: "mask-globals-api-chain",
  });

  const ast = parseCustom(code);
  assert.ok(hasEnvIndex(ast, "GetService"), "global API method names should use escaped index access");
  assert.ok(hasEnvIndex(ast, "PlaceVersion"), "global API property names should use escaped index access");
  assert.ok(!hasPlainMemberName(ast, "GetService"), "global API method names should not remain plaintext members");
  assert.ok(!hasPlainMemberName(ast, "PlaceVersion"), "global API property names should not remain plaintext members");
  assert.ok(hasPlainMemberName(ast, "VisibleMember"), "members rooted at call results must preserve single-evaluation semantics");
  assert.strictEqual(countText(code, "GetService"), 1, "only the API declaration may retain GetService plaintext");
  assert.strictEqual(countText(code, "PlaceVersion"), 1, "only the table declaration may retain PlaceVersion plaintext");
}

async function runShadowedApiRootRegression() {
  const shadowSource = [
    "local game = { Value = 9 }",
    "local function read()",
    "  return game.Value",
    "end",
    "print(read())",
  ].join("\n");

  const { code } = await obfuscateLuau(shadowSource, {
    lang: "luau",
    luauParser: "custom",
    rename: false,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    numbers: false,
    constArray: false,
    renameOptions: { maskGlobals: true },
    seed: "mask-globals-shadowed-root",
  });

  const ast = parseCustom(code);
  assert.ok(hasPlainMemberName(ast, "Value"), "a locally shadowed API root should keep ordinary member syntax");
}

async function runGlobalApiAssignmentMasking() {
  const assignmentSource = [
    "local mockGame = { PlaceVersion = 1 }",
    "function mockGame:GetService(name) return mockGame end",
    "game = mockGame",
    "game.PlaceVersion = game.PlaceVersion + 1",
    "game:GetService(\"Workspace\").PlaceVersion = game.PlaceVersion",
    "print(game.PlaceVersion)",
  ].join("\n");

  const { code } = await obfuscateLuau(assignmentSource, {
    lang: "luau",
    luauParser: "custom",
    rename: false,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    numbers: false,
    constArray: false,
    renameOptions: { maskGlobals: true },
    seed: "mask-globals-api-assignment",
  });

  const ast = parseCustom(code);
  assert.ok(!hasPlainMemberName(ast, "PlaceVersion"), "API assignment targets should use escaped index access");
}

(async () => {
  runAstCompatContract();
  runAstCompatOptions();
  runCanonicalMaskGlobalsContract();
  await run();
  await runRepeatUntilScopeRegression();
  await runGlobalApiChainMasking();
  await runShadowedApiRootRegression();
  await runGlobalApiAssignmentMasking();
  console.log("luau-mask-globals: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
