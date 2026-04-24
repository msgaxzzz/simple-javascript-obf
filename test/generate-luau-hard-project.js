const fs = require("fs");
const path = require("path");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

async function run() {
  const root = path.resolve(__dirname, "..");
  const sourcePath = path.join(__dirname, "luau-hard-project.lua");
  const distDir = path.join(root, "dist");
  const originalOut = path.join(distDir, "luau-hard-project.lua");
  const obfOut = path.join(distDir, "luau-hard-project.obf.lua");
  const mapOut = path.join(distDir, "luau-hard-project.obf.lua.map");

  const source = fs.readFileSync(sourcePath, "utf8");
  fs.mkdirSync(distDir, { recursive: true });

  const result = await obfuscateLuau(source, {
    lang: "luau",
    filename: "luau-hard-project.lua",
    sourceMap: true,
    preset: "high",
    strings: true,
    cff: true,
    dead: true,
    rename: true,
    wrap: true,
    numbers: true,
    constArray: true,
    padFooter: true,
    proxifyLocals: false,
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "hard-project-sourcemap",
  });

  parseCustom(result.code);

  fs.writeFileSync(originalOut, source, "utf8");
  fs.writeFileSync(
    obfOut,
    result.map ? `${result.code}\n--# sourceMappingURL=${path.basename(mapOut)}\n` : `${result.code}\n`,
    "utf8"
  );
  if (result.map) {
    fs.writeFileSync(mapOut, JSON.stringify(result.map, null, 2), "utf8");
  }

  console.log(`hard project source -> ${originalOut}`);
  console.log(`hard project obf -> ${obfOut}`);
  if (result.map) {
    console.log(`hard project map -> ${mapOut}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
