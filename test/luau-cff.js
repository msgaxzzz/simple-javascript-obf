const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

const source = [
  "local function demo()",
  "  local a = 1",
  "  local b = 2",
  "  a = a + b",
  "  print(a)",
  "end",
].join("\n");

async function runCustom() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    cff: true,
    cffOptions: { mode: "classic" },
    strings: false,
    seed: "cff-custom",
  });
  parseCustom(code);
  assert.ok(code.includes("while"), "custom parser should emit while loop");
}

(async () => {
  await runCustom();
  console.log("luau-cff: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
