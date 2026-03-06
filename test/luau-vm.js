const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
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

function createSemanticVmOptions(functionName) {
  return {
    enabled: true,
    include: [functionName],
    opcodeShuffle: false,
    fakeOpcodes: 0,
    bytecodeEncrypt: false,
    constsEncrypt: false,
    constsSplit: false,
    runtimeKey: false,
    runtimeSplit: false,
    decoyRuntime: false,
    symbolNoise: false,
    instructionFusion: false,
    semanticMisdirection: false,
    dynamicCoupling: false,
    isaPolymorph: false,
    fakeEdges: false,
  };
}

async function obfuscateSemanticVm(sourceText, functionName, seed) {
  const { code } = await obfuscateLuau(sourceText, {
    lang: "luau",
    luauParser: "custom",
    vm: createSemanticVmOptions(functionName),
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed,
  });
  parseCustom(code);
  return code;
}

function runLuau(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-vm-"));
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
    /string\.char,\s*string\.byte,\s*table\.concat,\s*table\.pack,\s*table\.unpack,\s*select,\s*type,\s*math\.floor,\s*getfenv/.test(code),
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
    /string\.char,\s*string\.byte,\s*table\.concat,\s*table\.pack,\s*table\.unpack,\s*select,\s*type,\s*math\.floor,\s*getfenv/.test(code),
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

async function runRecursiveLocalFunction() {
  const recursiveSource = [
    "local function fact(n)",
    "  if n == 0 then",
    "    return 1",
    "  end",
    "  return fact(n - 1) * n",
    "end",
    "print(fact(5))",
  ].join("\n");

  const code = await obfuscateSemanticVm(recursiveSource, "fact", "vm-recursive-local");
  assert.strictEqual(runLuau(code), "120", "local recursive functions should keep self-binding inside the VM");
}

async function runMultiReturnAssignment() {
  const multiAssignSource = [
    "local function pair()",
    "  return 4, 9",
    "end",
    "local function test()",
    "  local a, b = pair()",
    "  return a, b",
    "end",
    "local x, y = test()",
    "print(tostring(x) .. '|' .. tostring(y))",
  ].join("\n");

  const code = await obfuscateSemanticVm(multiAssignSource, "test", "vm-multi-assign");
  assert.strictEqual(runLuau(code), "4|9", "last-call multi assignment should preserve multiple return values");
}

async function runTailReturnExpansion() {
  const tailReturnSource = [
    "local function pair()",
    "  return 'b', 'c', 'd'",
    "end",
    "local function test()",
    "  return 'a', pair()",
    "end",
    "local w, x, y, z = test()",
    "print(table.concat({w, x, y, z}, '|'))",
  ].join("\n");

  const code = await obfuscateSemanticVm(tailReturnSource, "test", "vm-tail-return");
  assert.strictEqual(runLuau(code), "a|b|c|d", "tail-call returns should preserve all results");
}

async function runTableTailCallExpansion() {
  const tableTailSource = [
    "local function pair()",
    "  return 'x', 'y', 'z'",
    "end",
    "local function test()",
    "  local values = { pair() }",
    "  return table.concat(values, '|')",
    "end",
    "print(test())",
  ].join("\n");

  const code = await obfuscateSemanticVm(tableTailSource, "test", "vm-table-tail");
  assert.strictEqual(runLuau(code), "x|y|z", "table constructors should expand tail call results");
}

async function runAssignmentTargetOrdering() {
  const assignmentSource = [
    "local function test()",
    "  local t = { [1] = 'one', value = 'v' }",
    "  local i = 1",
    "  t.value = 'x'",
    "  t[i] = 'y'",
    "  i, t[i] = 2, 'z'",
    "  return t.value .. '|' .. t[1] .. '|' .. (t[2] or 'nil') .. '|' .. i",
    "end",
    "print(test())",
  ].join("\n");

  const code = await obfuscateSemanticVm(assignmentSource, "test", "vm-assign-targets");
  assert.strictEqual(runLuau(code), "x|z|nil|2", "assignment targets should keep Luau evaluation order");
}

async function runElseScopeIsolation() {
  const sourceWithElseLocal = [
    "x = 99",
    "local function test(flag)",
    "  if flag then",
    "  else",
    "    local x = 1",
    "  end",
    "  return x",
    "end",
    "print(test(true), test(false))",
  ].join("\n");

  const code = await obfuscateSemanticVm(sourceWithElseLocal, "test", "vm-else-scope");
  assert.strictEqual(runLuau(code), "99\t99", "else branch locals should not leak into the outer scope");
}

async function runRepeatConditionScope() {
  const repeatScopeSource = [
    "local function test()",
    "  local n = 0",
    "  local first = true",
    "  repeat",
    "    local x = first",
    "    first = false",
    "    n += 1",
    "  until not x",
    "  return n",
    "end",
    "print(test())",
  ].join("\n");

  const code = await obfuscateSemanticVm(repeatScopeSource, "test", "vm-repeat-scope");
  assert.strictEqual(runLuau(code), "2", "repeat-until conditions should see locals declared in the loop body");
}

async function runCallArgumentExpansion() {
  const callArgSource = [
    "local function pair()",
    "  return 1, 2",
    "end",
    "local function f(...)",
    "  local n = select('#', ...)",
    "  local a, b = ...",
    "  return n, a, b",
    "end",
    "local function test()",
    "  return f(pair())",
    "end",
    "local n, a, b = test()",
    "print(n, a, b)",
  ].join("\n");

  const code = await obfuscateSemanticVm(callArgSource, "test", "vm-call-arg-expand");
  assert.strictEqual(runLuau(code), "2\t1\t2", "last call arguments should expand all return values");
}

async function runSingleAssignmentOrdering() {
  const singleAssignSource = [
    "local function test()",
    "  local out = {}",
    "  local function idx()",
    "    out[#out + 1] = 'idx'",
    "    return 'k'",
    "  end",
    "  local function rhs()",
    "    out[#out + 1] = 'rhs'",
    "    return 'v'",
    "  end",
    "  local t = {}",
    "  t[idx()] = rhs()",
    "  return table.concat(out, ',')",
    "end",
    "print(test())",
  ].join("\n");

  const code = await obfuscateSemanticVm(singleAssignSource, "test", "vm-single-assign-order");
  assert.strictEqual(runLuau(code), "idx,rhs", "single table assignments should evaluate index expressions before the RHS");
}

async function runCapturedLocalWriteback() {
  const upvalueWriteSource = [
    "local x = 0",
    "local function inc()",
    "  x = x + 1",
    "  return x",
    "end",
    "print(inc(), x)",
  ].join("\n");

  const code = await obfuscateSemanticVm(upvalueWriteSource, "inc", "vm-upvalue-writeback");
  assert.strictEqual(runLuau(code), "1\t1", "writes to captured outer locals should be reflected outside the VM");
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
  await runRecursiveLocalFunction();
  await runMultiReturnAssignment();
  await runTailReturnExpansion();
  await runTableTailCallExpansion();
  await runAssignmentTargetOrdering();
  await runElseScopeIsolation();
  await runRepeatConditionScope();
  await runCallArgumentExpansion();
  await runSingleAssignmentOrdering();
  await runCapturedLocalWriteback();
  console.log("luau-vm: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
