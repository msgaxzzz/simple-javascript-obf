const assert = require("assert");
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
