const assert = require("assert");
const { parseLuau, buildScope } = require("../src/luau/custom");

function collectTypeReferences(scope, out = []) {
  out.push(...scope.typeReferences);
  scope.children.forEach((child) => collectTypeReferences(child, out));
  return out;
}

const ast = parseLuau("local function f<T>(x: T): T return x end");
const scope = buildScope(ast, { includeTypes: true });
const refs = collectTypeReferences(scope).filter((ref) => ref.name === "T");

assert.strictEqual(refs.length, 2, "expected both generic type references to be recorded");
assert.ok(refs.every((ref) => ref.binding), "generic type references should resolve to the function type parameter");

console.log("luau-custom-scope: ok");
