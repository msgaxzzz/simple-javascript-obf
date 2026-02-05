const assert = require("assert");
const { parse } = require("../src/luau/custom/parser");
const { printChunk } = require("../src/luau/custom/printer");

function roundTrip(name, source) {
  const ast = parse(source);
  const printed = printChunk(ast);
  const ast2 = parse(printed);
  assert.ok(ast2 && ast2.body, `${name}: round-trip failed`);
  return { ast, printed, ast2 };
}

function shouldThrow(name, fn) {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
  }
  assert.ok(threw, `${name}: expected error`);
}

roundTrip(
  "numeric-literals",
  [
    "local a = 0xff",
    "local b = 0x1.8p1",
    "local c = 0b1010_0011",
    "local d = 1_000_000",
    "local e = 1.2_3e+4",
  ].join("\n"),
);

roundTrip(
  "compound-continue",
  [
    "local continue = 1",
    "local x = 10",
    "x //= 3",
    "x ..= \"a\"",
    "continue",
  ].join("\n"),
);

roundTrip(
  "types-and-attrs",
  [
    "type Pair<T = number, U = string> = { read a: T, write b: U, [read number]: string }",
    "local f: <T>(T) -> T = nil",
    "local g: (...number) -> number = nil",
    "type function Foo<T>(self: T, x: number): number",
    "  return x",
    "end",
    "@[native, deprecated(\"x\"), info({ foo = \"bar\" })] function f2() end",
    "local f3 = @native function() return 1 end",
    "@native \"str\" function f4() end",
    "@native { foo = \"bar\" } function f5() end",
    "type Signal<T, U...> = { data: T, f: (T, U...) -> () }",
    "type EmptyArgs = Returns<>",
  ].join("\n"),
);

roundTrip(
  "interpolated-string",
  "local s = `hello {name}`",
);

roundTrip(
  "interpolated-escapes",
  [
    "local s = `hello \\{name\\}`",
    "local t = `a\\z",
    "  b`",
  ].join("\n"),
);

roundTrip(
  "semicolons",
  "local a = 1; local b = 2; return a + b;",
);

roundTrip(
  "string-escape-z",
  "local s = \"a\\\\z\\n  b\"",
);

roundTrip(
  "declare-statements",
  [
    "declare foo: number",
    "declare function bar(x: number, y: number): number",
    "declare function baz<T>(x: T): T",
  ].join("\n"),
);

shouldThrow("interp-double-open", () => parse("local s = `bad {{`"));
shouldThrow("interp-call-sugar", () => parse("f `hi`"));
shouldThrow("attr-nonliteral-arg", () => parse("@native(1 + 2) function f() end"));
shouldThrow("table-access-before-indexer", () => parse("type T = { read [number]: string }"));
shouldThrow("return-not-laststat", () => parse("do return 1; local x = 2 end"));
shouldThrow("break-not-laststat", () => parse("while true do break; local x = 1 end"));
shouldThrow("continue-not-laststat", () => parse("while true do continue; local x = 1 end"));
shouldThrow("function-default-type-params", () => parse("function id<T = number>(x: T): T return x end"));
shouldThrow("type-function-default-type-params", () => parse("type function Foo<T = number>() end"));

console.log("luau-custom-roundtrip: ok");
