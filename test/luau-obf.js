const fs = require("fs");
const path = require("path");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { parseLuau: parseLuaparse } = require("../src/luau/ast");

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

async function run(parser) {
  const useCustom = parser === "custom";
  const out = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: parser,
    vm: { enabled: true, layers: 2 },
    cff: true,
    dead: true,
    strings: true,
    stringsOptions: { split: true },
    rename: true,
    renameOptions: { renameGlobals: true, renameMembers: true, homoglyphs: true },
    antiHook: { enabled: true, lock: false },
    seed: `luau-test-${parser}`,
  });

  if (useCustom) {
    parseCustom(out.code);
  } else {
    parseLuaparse(out.code, { luaVersion: "5.3" });
  }

  const outDir = path.join(__dirname, "dist");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `luau-${parser}.obf.lua`);
  fs.writeFileSync(outFile, out.code, "utf8");
  console.log(`luau obf (${parser}) -> ${outFile}`);
}

(async () => {
  await run("custom");
  await run("luaparse");
  console.log("luau-obf: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
