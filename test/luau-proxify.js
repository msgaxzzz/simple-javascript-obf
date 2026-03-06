const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { walk } = require("../src/luau/ast");

const source = [
  "local ToggleUI",
  "function ToggleUI(flag)",
  "  return flag and 1 or 0",
  "end",
  "return ToggleUI(true)",
].join("\n");

function hasFunctionExpressionProxyAssignment(ast) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node || node.type !== "AssignmentStatement") {
      return;
    }
    if (!Array.isArray(node.variables) || !Array.isArray(node.init)) {
      return;
    }
    if (node.variables.length !== 1 || node.init.length !== 1) {
      return;
    }
    const target = node.variables[0];
    const value = node.init[0];
    if (target && target.type === "IndexExpression" && value && value.type === "FunctionExpression") {
      found = true;
    }
  });
  return found;
}

function hasIdentifierToggleUICall(ast) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node || node.type !== "CallExpression") {
      return;
    }
    if (node.base && node.base.type === "Identifier" && node.base.name === "ToggleUI") {
      found = true;
    }
  });
  return found;
}

async function run() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    proxifyLocals: true,
    rename: false,
    strings: false,
    cff: false,
    dead: false,
    numbers: false,
    constArray: false,
    wrap: false,
    vm: { enabled: false },
    renameOptions: { maskGlobals: false },
    seed: "proxify-local-function-binding",
  });

  const ast = parseCustom(code);
  assert.ok(
    hasFunctionExpressionProxyAssignment(ast),
    "proxify: expected local function declaration to become proxy slot assignment"
  );
  assert.ok(
    !hasIdentifierToggleUICall(ast),
    "proxify: expected function call site to read through proxy slot instead of raw identifier"
  );
  console.log("luau-proxify: ok");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
