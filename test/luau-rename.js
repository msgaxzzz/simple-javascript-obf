const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { walk } = require("../src/luau/ast");

const source = [
  "local function demo()",
  "  local a = 1",
  "  local b = a + 1",
  "  local t = { a = a, [b] = a }",
  "  print(b)",
  "  return b",
  "end",
].join("\n");

function collectLocalNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "LocalStatement") {
      return;
    }
    if (Array.isArray(node.variables)) {
      node.variables.forEach((variable) => {
        if (variable && variable.type === "Identifier") {
          names.add(variable.name);
        }
      });
    }
  });
  return names;
}

function hasTableKeyA(ast) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node) {
      return;
    }
    if (node.type === "TableConstructorExpression") {
      const fields = node.fields || [];
      for (const field of fields) {
        if (field.kind === "name" && field.name && field.name.name === "a") {
          found = true;
          return;
        }
        if (field.type === "TableKeyString" && field.key && field.key.name === "a") {
          found = true;
          return;
        }
      }
    }
  });
  return found;
}

function hasPrintCall(ast) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node) {
      return;
    }
    if (node.type === "CallExpression" && node.base && node.base.type === "Identifier" && node.base.name === "print") {
      found = true;
    }
  });
  return found;
}

async function runCustom() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: false,
    cff: false,
    renameOptions: { maskGlobals: false },
    seed: "rename-custom",
  });
  const ast = parseCustom(code);
  const locals = collectLocalNames(ast);
  assert.ok(!locals.has("a"), "custom: local a should be renamed");
  assert.ok(!locals.has("b"), "custom: local b should be renamed");
  assert.ok(hasTableKeyA(ast), "custom: table key 'a' should remain");
  assert.ok(hasPrintCall(ast), "custom: print call should remain global");
}

(async () => {
  await runCustom();
  console.log("luau-rename: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
