const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { obfuscate } = require("../src");

const rename = require("../src/luau/rename");
const maskGlobals = require("../src/luau/maskGlobals");
const strings = require("../src/luau/strings");
const { parseLuau } = require("../src/luau/custom");
const { RNG } = require("../src/utils/rng");

assert.ok(rename, "rename transform should still load");
assert.ok(maskGlobals, "maskGlobals transform should still load");
assert.ok(strings, "strings transform should still load");

function runCanonicalStringEncodeContract() {
  const ast = parseLuau('local s = "abc"');
  strings.stringEncode(ast, {
    options: {
      stringsOptions: {
        minLength: 1,
        maxCount: 10,
      },
    },
    rng: new RNG("strings-canonical"),
  });
  assert.ok(ast && ast.type === "Chunk", "string encoder should accept canonical official-shape AST");
}

function runLuau(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-long-strings-"));
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

async function runLongStringRegression() {
  const source = "local s = [[\nabc]]\nprint(#s, string.byte(s, 1, #s))";
  const originalOutput = runLuau(source);

  assert.strictEqual(originalOutput, "3\t97\t98\t99");

  const { code } = await obfuscate(source, {
    lang: "luau",
    strings: true,
    rename: false,
    cff: false,
    dead: false,
    numbers: false,
    constArray: false,
    proxifyLocals: false,
    padFooter: false,
    vm: { enabled: false },
    seed: "luau-long-string-initial-newline",
  });

  const obfuscatedOutput = runLuau(code);
  assert.strictEqual(obfuscatedOutput, originalOutput);
}

(async () => {
  runCanonicalStringEncodeContract();
  await runLongStringRegression();
  console.log("luau-long-strings: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
