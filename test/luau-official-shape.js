const assert = require("assert");
const custom = require("../src/luau/custom");

assert.ok(custom.types.nodes.nodeTypes.includes("StatTypeAlias"));
assert.ok(custom.types.nodes.nodeTypes.includes("ExprIfElse"));
assert.ok(custom.types.nodes.nodeTypes.includes("TypeReference"));

const ast = custom.parseLuau([
  "export type Pair<T> = { value: T }",
  "local function f<T>(x: T): T",
  "  return x",
  "end",
].join("\n"));

assert.strictEqual(ast.type, "Chunk");
assert.ok(Array.isArray(ast.body), "Chunk body should be an array");
assert.strictEqual(ast.body[0].type, "StatTypeAlias", "type alias should use official-style statement naming");
assert.strictEqual(ast.body[1].type, "StatLocalFunction", "local function should use official-style local function naming");
