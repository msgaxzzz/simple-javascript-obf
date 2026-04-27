const assert = require("assert");

const {
  getCachedSSAReadNamesFromRoot,
  getCachedSSAUsedNamesFromRoot,
} = require("../src/luau/ssa-utils");

const ssaRoot = {
  functions: [
    {
      ssa: {
        variables: ["alpha", "beta"],
        uses: new Map([[1, "gamma$1"]]),
        defs: new Map([[1, "delta$2"]]),
        blocks: {
          0: {
            phi: [
              {
                variable: "phiLocal",
                result: "phiResult$3",
                args: { left: "argOne$4", right: "argTwo$5" },
              },
            ],
          },
        },
      },
    },
  ],
};

const readA = getCachedSSAReadNamesFromRoot(ssaRoot);
const readB = getCachedSSAReadNamesFromRoot(ssaRoot);
assert.strictEqual(readA, readB, "read-name cache should reuse the same Set");
assert(readA.has("gamma"), "read-name cache should include SSA uses");
assert(readA.has("argOne"), "read-name cache should include phi args");

const usedA = getCachedSSAUsedNamesFromRoot(ssaRoot);
const usedB = getCachedSSAUsedNamesFromRoot(ssaRoot);
assert.strictEqual(usedA, usedB, "used-name cache should reuse the same Set");
assert(usedA.has("alpha"), "used-name cache should include variables");
assert(usedA.has("delta"), "used-name cache should include defs");
assert(usedA.has("phiLocal"), "used-name cache should include phi variables");

console.log("luau-ssa-cache: ok");
