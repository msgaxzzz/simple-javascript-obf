const assert = require("assert");
const custom = require("../src/luau/custom");

const accepted = [
  "type Result<T, E> = T | E",
  "declare function id<T>(x: T): T",
  "local x = if ok then 1 else 2",
  "x += 1",
  "@native function f() end",
  "local s = `hello {name}`",
];

for (const source of accepted) {
  assert.doesNotThrow(() => custom.parseLuau(source), source);
}
