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

async function runEnhancedShapeRegression() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    cff: true,
    cffOptions: { mode: "classic" },
    strings: false,
    rename: false,
    dead: false,
    numbers: false,
    seed: "cff-enhanced-shape",
  });
  const ast = parseCustom(code);
  const fn = ast.body.find((node) => node.type === "FunctionDeclaration");
  assert.ok(fn, "expected flattened local function in output");
  const body = fn.body && Array.isArray(fn.body.body) ? fn.body.body : [];
  const tableLocals = body.filter((stmt) =>
    stmt.type === "LocalStatement" &&
    Array.isArray(stmt.init) &&
    stmt.init[0] &&
    stmt.init[0].type === "TableConstructorExpression"
  );
  assert.ok(tableLocals.length >= 4, "enhanced CFF should emit values, next, dispatch, and handler tables");
  const handlerTable = tableLocals.find((stmt) => {
    const init = stmt.init[0];
    return Array.isArray(init.fields) && init.fields.some((field) => field && field.value && field.value.type === "FunctionExpression");
  });
  assert.ok(handlerTable, "enhanced CFF should indirect through a handler table");
  const loop = body.find((stmt) => stmt.type === "WhileStatement");
  assert.ok(loop, "enhanced CFF should still lower to a looped dispatcher");
  const loopBody = loop.body && Array.isArray(loop.body.body) ? loop.body.body : [];
  const handlerLocal = loopBody.find((stmt) =>
    stmt.type === "LocalStatement" &&
    Array.isArray(stmt.init) &&
    stmt.init[0] &&
    (stmt.init[0].type === "IndexExpression" ||
      ((stmt.init[0].type === "LogicalExpression" || stmt.init[0].type === "BinaryExpression") &&
        stmt.init[0].operator === "or"))
  );
  assert.ok(handlerLocal, "enhanced CFF should load an indirect handler each iteration");
  const dispatcher = loopBody.find((stmt) => stmt.type === "IfStatement");
  assert.ok(dispatcher, "enhanced CFF should emit a dispatcher if-chain");
  const clauses = Array.isArray(dispatcher.clauses) ? dispatcher.clauses : [];
  assert.ok(clauses.length >= 1, "enhanced CFF should keep a guarded dispatcher fallback");
}

(async () => {
  await runCustom();
  await runLocalReturnScopeRegression();
  await runEnhancedShapeRegression();
  console.log("luau-cff: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
