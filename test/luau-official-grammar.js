const assert = require("assert");
const cp = require("child_process");
const custom = require("../src/luau/custom");
const { Tokenizer } = require("../src/luau/custom/tokenizer");

function tokenValues(source) {
  const tokenizer = new Tokenizer(source);
  const values = [];
  for (;;) {
    const token = tokenizer.next();
    if (token.type === "eof") {
      return values;
    }
    values.push([token.type, token.value]);
  }
}

assert.deepStrictEqual(
  tokenValues("type Pack = (...number) -> number"),
  [
    ["keyword", "type"],
    ["identifier", "Pack"],
    ["symbol", "="],
    ["symbol", "("],
    ["symbol", "..."],
    ["identifier", "number"],
    ["symbol", ")"],
    ["symbol", "->"],
    ["identifier", "number"],
  ],
);

assert.deepStrictEqual(
  tokenValues("local x = if ok then 1 else 2"),
  [
    ["keyword", "local"],
    ["identifier", "x"],
    ["symbol", "="],
    ["keyword", "if"],
    ["identifier", "ok"],
    ["keyword", "then"],
    ["number", "1"],
    ["keyword", "else"],
    ["number", "2"],
  ],
);

const sourceLoad = cp.spawnSync(
  process.execPath,
  ["--no-experimental-strip-types", "-e", "require('./src/luau/custom/tokenizer.js')"],
  {
    cwd: require("path").join(__dirname, ".."),
    encoding: "utf8",
  },
);

assert.strictEqual(
  sourceLoad.status,
  0,
  `tokenizer.js should load without Node strip-types support: ${sourceLoad.stderr || sourceLoad.stdout}`,
);

const accepted = [
  "type Result<T, E> = T | E",
  "declare function id<T>(x: T): T",
  "local x = if ok then 1 else 2",
  "continue",
  "x += 1",
  "@native function f() end",
  "local s = `hello {name}`",
];

for (const source of accepted) {
  assert.doesNotThrow(() => custom.parseLuau(source), source);
}

{
  const ast = custom.parseLuau("local x = if ok then 1 else 2");
  assert.strictEqual(ast.body[0].init[0].type, "ExprIfElse");
  assert.strictEqual(ast.body[0].init[0].condition.name, "ok");
}

{
  const ast = custom.parseLuau("x += 1");
  assert.strictEqual(ast.body[0].type, "CompoundAssignmentStatement");
  assert.strictEqual(ast.body[0].operator, "+=");
}

{
  const ast = custom.parseLuau("local s = `hello {name}`");
  assert.strictEqual(ast.body[0].init[0].type, "ExprInterpString");
  assert.strictEqual(ast.body[0].init[0].parts[0].raw, "hello ");
}
