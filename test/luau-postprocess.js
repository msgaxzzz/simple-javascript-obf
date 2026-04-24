const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

async function runBacktickPostprocessRegression() {
  const source = [
    "local value = 7",
    "local spaced = `a  b`",
    "local dashed = `a--b`",
    "local mixed = `left {value}  --  right`",
    "print(spaced, dashed, mixed)",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    preset: "low",
    strings: false,
    rename: false,
    cff: false,
    dead: false,
    numbers: false,
    constArray: false,
    proxifyLocals: false,
    padFooter: false,
    vm: false,
    seed: "luau-postprocess",
  });

  parseCustom(code);
  assert.ok(
    code.includes("`a  b`"),
    "whitespace compaction should preserve double spaces inside backtick strings"
  );
  assert.ok(
    code.includes("`a--b`"),
    "double-dash neutralization should preserve -- inside backtick strings"
  );
  assert.ok(
    code.includes("`left {value}  --  right`"),
    "postprocess should preserve text segments around interpolations inside backtick strings"
  );
}

(async () => {
  await runBacktickPostprocessRegression();
  console.log("luau-postprocess: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
