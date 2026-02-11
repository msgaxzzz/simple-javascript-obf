const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");

const source = [
  "local function demo(a, b)",
  "  local c = a + b",
  "  if c > 3 then",
  "    return c",
  "  end",
  "  return a - b",
  "end",
].join("\n");

function hasVmLoop(code) {
  return code.includes("while true do") || /while\s+[A-Za-z_][A-Za-z0-9_]*\s*~=\s*0\s*do/.test(code);
}

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
  assert.ok(hasVmLoop(code), "custom parser should emit VM loop");
  assert.ok(
    code.includes("string.char, string.byte, table.concat, table.pack, table.unpack, select, type, math.floor, getfenv"),
    "custom parser should emit runtime toolkit bundle",
  );
  assert.ok(/0[xX][0-9A-Fa-f_]+|0[bB][01_]+/.test(code), "custom parser should emit mixed numeric literal style");
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

async function runCustomPolymorph() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    vm: {
      enabled: true,
      layers: 1,
      blockDispatch: true,
      dispatchGraph: "sparse",
      stackProtocol: "api",
      isaPolymorph: true,
      fakeEdges: true,
    },
    cff: false,
    strings: false,
    rename: false,
    seed: "vm-custom-polymorph",
  });
  parseCustom(code);
  assert.ok(hasVmLoop(code), "custom parser should emit sparse block dispatch loop");
}

async function runCustomTopLevel() {
  const topLevelSource = [
    "local function helper(v)",
    "  return v + 1",
    "end",
    "local a = helper(1)",
    "if a > 0 then",
    "  print(\"ok\")",
    "end",
  ].join("\n");
  const { code } = await obfuscateLuau(topLevelSource, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, topLevel: true },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-custom-top-level",
  });
  parseCustom(code);
  assert.ok(hasVmLoop(code), "top-level chunk should emit VM loop");
  assert.ok(code.includes("local function helper"), "top-level local function prelude should be preserved");
  assert.ok(
    code.includes("string.char, string.byte, table.concat, table.pack, table.unpack, select, type, math.floor, getfenv"),
    "top-level chunk should emit runtime toolkit bundle",
  );
}

async function runNestedCallbackLift() {
  const sourceWithNestedCallback = [
    "local function setupLeaderstats(player)",
    "  local coins = Instance.new(\"IntValue\")",
    "  task.spawn(function()",
    "    while player.Parent do",
    "      task.wait(5)",
    "      coins.Value += 10",
    "    end",
    "  end)",
    "end",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithNestedCallback, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["setupLeaderstats"] },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-nested-callback-lift",
  });
  parseCustom(code);
  assert.ok(!code.includes("task.spawn(function()"), "nested callback should be lifted before VM");
  assert.ok(code.includes("local function __vm_lift_"), "lifted callback helper should be emitted");
  assert.ok(hasVmLoop(code), "host function should be virtualized after lifting");
}

function walkAst(node, visit) {
  if (!node || typeof node !== "object") {
    return;
  }
  visit(node);
  Object.keys(node).forEach((key) => {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((item) => walkAst(item, visit));
      return;
    }
    walkAst(value, visit);
  });
}

async function runNestedCallbackLiftWithParams() {
  const sourceWithParamCallback = [
    "local function scheduleTick(player)",
    "  local coins = player.leaderstats.Coins",
    "  task.spawn(function(dt)",
    "    if dt then",
    "      coins.Value += 1",
    "    end",
    "  end)",
    "end",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithParamCallback, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["scheduleTick"] },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-nested-callback-lift-param",
  });

  const ast = parseCustom(code);
  assert.ok(!code.includes("task.spawn(function("), "parameterized callback should also be lifted");
  let foundLift = false;
  walkAst(ast, (node) => {
    if (foundLift || node.type !== "FunctionDeclaration") {
      return;
    }
    const fnName = node.name && node.name.base && node.name.base.name;
    if (typeof fnName === "string" && fnName.startsWith("__vm_lift_")) {
      const params = Array.isArray(node.parameters) ? node.parameters : [];
      foundLift = params.length >= 2;
    }
  });
  assert.ok(foundLift, "lifted helper should keep callback params and append captures");
  assert.ok(hasVmLoop(code), "host function should remain virtualized");
}

async function runCompoundAssignmentTargets() {
  const sourceWithCompoundTargets = [
    "local function adjust(tbl, key, delta)",
    "  tbl.value += delta",
    "  tbl[key] += 1",
    "  return tbl.value + tbl[key]",
    "end",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithCompoundTargets, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["adjust"] },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-compound-targets",
  });

  parseCustom(code);
  assert.ok(hasVmLoop(code), "compound assignment member/index targets should not skip VM");
}

async function runGotoLabelSupport() {
  const sourceWithGoto = [
    "local function spin(limit)",
    "  ::start::",
    "  if limit > 0 then",
    "    goto done",
    "  end",
    "  goto start",
    "  ::done::",
    "  return limit",
    "end",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithGoto, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["spin"] },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-goto-label",
  });

  parseCustom(code);
  assert.ok(hasVmLoop(code), "goto/label should be virtualized");
}

(async () => {
  await runCustom();
  await runCustomLayered();
  await runCustomPolymorph();
  await runCustomTopLevel();
  await runNestedCallbackLift();
  await runNestedCallbackLiftWithParams();
  await runCompoundAssignmentTargets();
  await runGotoLabelSupport();
  console.log("luau-vm: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
