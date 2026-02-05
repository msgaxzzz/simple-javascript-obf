const fs = require("fs");
const path = require("path");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

const source = [
  "local function demo(a, b)",
  "  local sum = a + b",
  "  local t = { foo = sum, bar = a * b }",
  "  for k, v in pairs(t) do",
  "    sum = sum + v",
  "  end",
  "  if sum > 10 then",
  "    return t.bar",
  "  end",
  "  return sum",
  "end",
  "",
  "print(demo(2, 6))",
].join("\n");

async function run() {
  const out = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, layers: 2 },
    cff: true,
    dead: true,
    strings: true,
    stringsOptions: { split: true },
    rename: true,
    renameOptions: { renameGlobals: true, renameMembers: true, homoglyphs: true },
    antiHook: { enabled: true, lock: false },
    seed: "luau-test-custom",
  });

  parseCustom(out.code);

  const outDir = path.join(__dirname, "dist");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "luau-custom.obf.lua");
  fs.writeFileSync(outFile, out.code, "utf8");
  console.log(`luau obf (custom) -> ${outFile}`);
}

(async () => {
  await run();
  console.log("luau-obf: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
