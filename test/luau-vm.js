const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { parseLuau: parseLuaparse } = require("../src/luau/ast");

const source = [
  "local function demo(a, b)",
  "  local c = a + b",
  "  if c > 3 then",
  "    return c",
  "  end",
  "  return a - b",
  "end",
].join("\n");

async function runCustom() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    vm: true,
    cff: false,
    strings: false,
    rename: false,
    seed: "vm-custom",
  });
  parseCustom(code);
  assert.ok(code.includes("while true do"), "custom parser should emit VM loop");
}

async function runLuaparse() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "luaparse",
    vm: true,
    cff: false,
    strings: false,
    rename: false,
    seed: "vm-luaparse",
  });
  parseLuaparse(code, { luaVersion: "5.3" });
  assert.ok(code.includes("while true do"), "luaparse should emit VM loop");
}

async function runCustomLayered() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, layers: 2 },
    cff: false,
    strings: false,
    rename: false,
    seed: "vm-custom-layered",
  });
  parseCustom(code);
}

async function runLuaparseLayered() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "luaparse",
    vm: { enabled: true, layers: 2 },
    cff: false,
    strings: false,
    rename: false,
    seed: "vm-luaparse-layered",
  });
  parseLuaparse(code, { luaVersion: "5.3" });
}

(async () => {
  await runCustom();
  await runLuaparse();
  await runCustomLayered();
  await runLuaparseLayered();
  console.log("luau-vm: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
