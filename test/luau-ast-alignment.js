const assert = require("assert");
const luau = require("../src/luau/custom");

console.log("Running Luau AST Alignment Test Suite...");

const cases = [
  {
    name: "Class statement with properties and methods",
    code: `class Point
  x: number
  y: number
  function distance(other: Point): number
    return 0
  end
end`,
  },
  {
    name: "Class statement with extends and public members",
    code: `export class Dog extends Animal
  public name: string
  public function bark(): ()
    print("woof")
  end
end`,
  },
  {
    name: "Const local declarations and functions",
    code: `const x = 10
local const y: number = 20
export const z = 30
const function compute(val: number): number
  return val * 2
end`,
  },
  {
    name: "Integer literals with 'i' suffix (64-bit int)",
    code: `local a = 123i
local b = 0x10i
local c = 0b101i`,
  },
  {
    name: "Generic specialization on call and method call (<<T>>)",
    code: `local res = compute<<number, string>>(10, "hello")
local item = service:get<<User>>(userId)`,
  },
  {
    name: "Attribute list (@[...])",
    code: `@[native, checked]
function fastLoop(n: number)
  for i = 1, n do
  end
end`,
  },
  {
    name: "Function type with parenthesized multi-return",
    code: `type Handler = (req: Request) -> (Response, number)
type VoidFunc = () -> ()
type SingleFunc = (x: number) -> boolean`,
  },
  {
    name: "Table type with read/write indexers",
    code: `type Map = {
  read [string]: number,
  write [number]: string,
  read id: string
}`,
  },
  {
    name: "Table constructor with non-identifier/keyword keys",
    code: `local t = {
  ["end"] = 1,
  ["for"] = 2,
  ["123bad"] = 3,
  validKey = 4
}`,
  },
  {
    name: "Special floats (Infinity, -Infinity, NaN)",
    code: `local inf = 1e500
local ninf = -1e500
local nan = 0/0`,
  },
  {
    name: "Statement ASI semicolon prefix",
    code: `print("test")
;(function()
end)()`,
  },
];

let passed = 0;

for (const testCase of cases) {
  try {
    const ast = luau.parse(testCase.code);
    const validationErrors = luau.validate(ast);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed for ${testCase.name}: ${validationErrors.join(", ")}`);
    }

    const printed = luau.print(ast);
    const reparsedAst = luau.parse(printed);
    const reValidationErrors = luau.validate(reparsedAst);
    if (reValidationErrors.length > 0) {
      throw new Error(`Re-validation failed for ${testCase.name}: ${reValidationErrors.join(", ")}`);
    }

    console.log(`  ✓ ${testCase.name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${testCase.name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log(`\nAll ${passed} Luau AST alignment tests passed successfully!`);
