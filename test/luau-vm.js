const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { obfuscateLuau, MAX_LUAU_OUTPUT_BYTES } = require("../src/luau");
const { normalizeOptions } = require("../src/options");
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

function hasRuntimeToolkitBundle(code) {
  return /local\s+\w+\s*=\s*\{\s*[^}]*char[^}]*byte[^}]*concat[^}]*pack[^}]*unpack[^}]*select[^}]*type[^}]*floor[^}]*getfenv[^}]*\}/.test(code);
}

function hasPackedShellShape(code) {
  return /return\s*\(function\(\.\.\.\)/.test(code)
    && /local\s+\w+\s*=\s*\{\[[=]*\[/.test(code)
    && /return\s+\w+\(\w+,\w+,\.\.\.\);end\)\(\.\.\.\)\s*$/.test(code);
}

function hasPackedShellObfPrefix(code) {
  return code.includes("__obf_");
}

function hasEscapedNewlineLiteral(code) {
  return code.includes("\\n");
}

function hasPackedLookupTableShape(code) {
  return /local\s+\w+\s*=\s*\{\d+(?:,\d+){8,}\};local\s+\w+\s*=\s*\{\};for\s+\w+\s*=\s*1,\s*#\w+\s*do\s+\w+\[string\.byte\(/.test(code);
}

function hasPackedDecodeTailShape(code) {
  return /for\s+\w+\s*=\s*1,\s*#\w+\s*,\s*5\s*do[\s\S]*table\.concat\(\w+\):sub\(1,\w+\)[\s\S]*loadstring\s+or\s+load/.test(code);
}

function getPackedShellHeadBeforePayload(code) {
  const payloadMarker = code.indexOf("=[");
  if (payloadMarker === -1) {
    return code;
  }
  return code.slice(0, payloadMarker);
}

function hasPackedFrontLoadedDecodeShape(code) {
  const head = getPackedShellHeadBeforePayload(code);
  return /string\.byte\(\w+,1\)[\s\S]*math\.floor\(/.test(head);
}

function hasPackedFrontLoadedLoaderShape(code) {
  const head = getPackedShellHeadBeforePayload(code);
  return /"loa"|dstr|"ad"|getfenv|_ENV|_G/.test(head);
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
  assert.ok(hasRuntimeToolkitBundle(code), "custom parser should emit runtime toolkit bundle");
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
  assert.ok(hasRuntimeToolkitBundle(code), "top-level chunk should emit runtime toolkit bundle");
}

function runPackedShellNormalizationDefaults() {
  const options = normalizeOptions({
    lang: "luau",
    luauParser: "custom",
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
  });

  assert.strictEqual(options.vm.shellStyle, "packed", "packed shell style should be normalized");
}

function runPackedShellNormalizationOverride() {
  const options = normalizeOptions({
    lang: "luau",
    luauParser: "custom",
    vm: {
      enabled: true,
      shellStyle: "packed",
      include: ["beta"],
      topLevel: false,
    },
  });

  assert.strictEqual(options.vm.shellStyle, "packed", "packed shell style should remain enabled");
  assert.deepStrictEqual(options.vm.include, ["beta"], "packed shell should respect explicit include overrides");
}

function runLuauOutputSizeLimit() {
  assert.strictEqual(
    MAX_LUAU_OUTPUT_BYTES,
    5 * 1024 * 1024,
    "Luau output size limit should allow up to 5 MB before fallback or failure"
  );
}

async function runPackedShellWholeProgramDefault() {
  const packedSource = [
    "local function demo(a, b)",
    "  local sum = a + b",
    "  return sum * 2",
    "end",
    "print(demo(2, 5))",
  ].join("\n");

  const { code } = await obfuscateLuau(packedSource, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    dead: false,
    cff: false,
    wrap: true,
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
    },
    seed: "vm-packed-whole-program",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "14", "packed shell whole-program output should still execute");
  assert.ok(hasPackedShellShape(code), "packed shell mode should emit a packed loader shape");
}

async function runPackedShellPayloadConcealment() {
  const packedSource = [
    "local function demo()",
    "  local lines = {",
    "    'alpha',",
    "    'beta',",
    "  }",
    "  return table.concat(lines, '|')",
    "end",
    "print(demo())",
  ].join("\n");

  const { code } = await obfuscateLuau(packedSource, {
    lang: "luau",
    luauParser: "custom",
    strings: false,
    rename: false,
    dead: false,
    cff: false,
    wrap: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
    seed: "vm-packed-loader-surface",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "alpha|beta", "packed payload shell should still execute");
  assert.ok(hasPackedShellShape(code), "packed payload shell should keep a loader shape");
  assert.ok(!hasPackedShellObfPrefix(code), "packed payload shell should not expose __obf_* loader locals");
  assert.ok(!hasEscapedNewlineLiteral(code), "packed shell should not materialize source chunks through \\n escape literals");
  assert.ok(!code.includes("loadstring"), "packed payload shell should not expose a visible loadstring name");
  assert.ok(!code.includes("local function demo"), "packed payload shell should not expose plaintext function bodies");
  assert.ok(!hasPackedFrontLoadedDecodeShape(code), "packed payload shell should not front-load the decode helper before payload data");
  assert.ok(!hasPackedFrontLoadedLoaderShape(code), "packed payload shell should not front-load loader selection hints before payload data");
  assert.ok(!hasPackedLookupTableShape(code), "packed payload shell should not expose explicit numeric key tables and reverse lookup maps");
  assert.ok(!hasPackedDecodeTailShape(code), "packed payload shell should not expose a straight-line decode tail at the end");
}

async function runPackedShellExplicitIncludeOverride() {
  const packedOverrideSource = [
    "local function alpha()",
    "  return 4",
    "end",
    "local function beta()",
    "  return alpha() + 3",
    "end",
    "print(beta())",
  ].join("\n");

  const { code } = await obfuscateLuau(packedOverrideSource, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    dead: false,
    cff: false,
    wrap: true,
    vm: {
      enabled: true,
      shellStyle: "packed",
      include: ["beta"],
      topLevel: false,
    },
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
    },
    seed: "vm-packed-explicit-include",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "7", "packed shell explicit include output should still execute");
  assert.ok(hasPackedShellShape(code), "packed shell mode should keep its packed loader shape with explicit include overrides");
}

async function runPackedShellHardProjectRegression() {
  const hardProjectSource = fs.readFileSync(
    path.join(__dirname, "luau-hard-project.lua"),
    "utf8"
  );
  const expectedLines = [
    "trace=4 hottest=expand",
    "[$TOP] delta => 480 (burst)",
    "[$TOP] beta => 421 (burst)",
    "[$REST] alpha => 240 (mixed)",
    "[$REST] gamma => 158 (burst)",
  ];
  const sharedOptions = {
    lang: "luau",
    luauParser: "custom",
    filename: "luau-hard-project.lua",
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
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "hard-project-sourcemap",
  };

  const { code: nonPackedCode } = await obfuscateLuau(hardProjectSource, {
    ...sharedOptions,
    vm: {
      enabled: true,
      all: true,
      topLevel: true,
    },
  });
  parseCustom(nonPackedCode);
  const nonPackedOutput = runLuau(nonPackedCode);
  expectedLines.forEach((line) => {
    assert.ok(
      nonPackedOutput.includes(line),
      `non-packed hard project output should include ${line}`
    );
  });

  const { code: packedCode } = await obfuscateLuau(hardProjectSource, {
    ...sharedOptions,
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
  });
  parseCustom(packedCode);
  const packedOutput = runLuau(packedCode);
  expectedLines.forEach((line) => {
    assert.ok(
      packedOutput.includes(line),
      `packed hard project output should include ${line}`
    );
  });
  assert.ok(hasPackedShellShape(packedCode), "hard project regression should stay on the packed loader path");
  assert.ok(
    !packedCode.includes("authorize_purchase_flow") &&
      !packedCode.includes("refresh_payment_session"),
    "packed hard project output should not expose fixed VM helper aliases"
  );
}

async function runWrappedVm() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    wrap: true,
    vm: true,
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-wrap",
  });
  parseCustom(code);
  assert.ok(hasVmLoop(code), "wrap should not prevent VM virtualization");
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

async function runNestedCallbackInnerLocalGuard() {
  const sourceWithNestedLocal = [
    "ghost = 77",
    "local function host()",
    "  local function inner()",
    "    local ghost = 123",
    "    return ghost",
    "  end",
    "  task.spawn(function()",
    "    print(ghost)",
    "  end)",
    "  return inner()",
    "end",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithNestedLocal, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["host"] },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-nested-local-guard",
  });

  const ast = parseCustom(code);
  let helperParamCount = null;
  walkAst(ast, (node) => {
    if (helperParamCount !== null || node.type !== "FunctionDeclaration") {
      return;
    }
    const fnName = node.name && node.name.base && node.name.base.name;
    if (typeof fnName === "string" && fnName.startsWith("__vm_lift_")) {
      const params = Array.isArray(node.parameters) ? node.parameters : [];
      helperParamCount = params.length;
    }
  });
  assert.strictEqual(helperParamCount, 0, "lifted callback should not capture names declared only in nested functions");
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

async function runRenamedMemberCompoundAssignment() {
  const sourceWithRenamedMetrics = [
    "local function withRetry(metrics)",
    "  metrics.attempts += 1",
    "  metrics.retries += 2",
    "  return metrics.attempts + metrics.retries",
    "end",
    "local metrics = { attempts = 0, retries = 0 }",
    "print(withRetry(metrics))",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithRenamedMetrics, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["withRetry"] },
    cff: false,
    strings: false,
    rename: true,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: {
      renameMembers: true,
      maskGlobals: false,
    },
    seed: "vm-renamed-member-compound",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "3", "virtualized functions should preserve renamed member compound assignments");
}

async function runMetatableConstructorGuard() {
  const sourceWithMetatableConstructor = [
    "local Engine = {}",
    "Engine.__index = Engine",
    "function Engine.new()",
    "  local self = { nodes = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "function Engine:register(name)",
    "  self.nodes[name] = true",
    "end",
    "function Engine:has(name)",
    "  return self.nodes[name] == true",
    "end",
    "local engine = Engine.new()",
    "engine:register(\"ok\")",
    "print(engine:has(\"ok\") and \"ok\" or \"bad\")",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithMetatableConstructor, {
    lang: "luau",
    luauParser: "custom",
    vm: { enabled: true, include: ["Engine.new", "register", "has"] },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-metatable-constructor-guard",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "ok", "metatable constructors should preserve instance method dispatch");
}

async function runWrappedVmMethodRoundtrip() {
  const wrappedMethodSource = [
    "local function shallowClone(input)",
    "  local out = {}",
    "  for key, value in pairs(input) do",
    "    out[key] = value",
    "  end",
    "  return out",
    "end",
    "local Engine = {}",
    "Engine.__index = Engine",
    "function Engine.new()",
    "  local self = { nodes = {}, order = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "function Engine:register(name, deps)",
    "  self.nodes[name] = { deps = shallowClone(deps) }",
    "  table.insert(self.order, name)",
    "end",
    "function Engine:run()",
    "  return #self.nodes.a.deps .. '|' .. self.order[1]",
    "end",
    "local engine = Engine.new()",
    "engine:register('a', { 'x' })",
    "print(engine:run())",
  ].join("\n");

  const { code } = await obfuscateLuau(wrappedMethodSource, {
    lang: "luau",
    luauParser: "custom",
    wrap: true,
    vm: { enabled: true, include: [] },
    cff: false,
    strings: true,
    rename: true,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "vm-wrap-method-roundtrip",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "1|a", "synthetic wrap helpers should not break VM method virtualization");
}

async function runWholeProgramNormalizeGraph() {
  const wholeProgramSource = [
    "local function shallowClone(input)",
    "  local out = {}",
    "  for key, value in pairs(input) do",
    "    out[key] = value",
    "  end",
    "  return out",
    "end",
    "local function withRetry(label, limit, thunk)",
    "  local lastError = 'unknown'",
    "  for attempt = 1, limit do",
    "    local ok, result = pcall(thunk, attempt)",
    "    if ok then",
    "      return result",
    "    end",
    "    lastError = result",
    "  end",
    "  error(`step {label} failed after {limit} attempts: {lastError}`)",
    "end",
    "local Engine = {}",
    "Engine.__index = Engine",
    "function Engine.new()",
    "  local self = { nodes = {}, order = {}, cache = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "function Engine:register(name, deps, handler)",
    "  self.nodes[name] = { deps = shallowClone(deps), handler = handler }",
    "  table.insert(self.order, name)",
    "end",
    "function Engine:_ready(node, state)",
    "  for _, dep in ipairs(node.deps) do",
    "    if state[dep] == nil then",
    "      return false",
    "    end",
    "  end",
    "  return true",
    "end",
    "function Engine:_resolve(node, state)",
    "  local resolved = {}",
    "  for _, dep in ipairs(node.deps) do",
    "    resolved[dep] = state[dep]",
    "  end",
    "  return resolved",
    "end",
    "function Engine:run(payload)",
    "  local state = { input = shallowClone(payload) }",
    "  local pending = shallowClone(self.order)",
    "  repeat",
    "    local progress = false",
    "    local nextPending = {}",
    "    for _, name in ipairs(pending) do",
    "      local node = self.nodes[name]",
    "      if not self:_ready(node, state) then",
    "        table.insert(nextPending, name)",
    "      else",
    "        local deps = self:_resolve(node, state)",
    "        state[name] = withRetry(name, 3, function(attempt)",
    "          return node.handler(deps, payload, attempt, self)",
    "        end)",
    "        progress = true",
    "      end",
    "    end",
    "    pending = nextPending",
    "    if not progress then",
    "      break",
    "    end",
    "  until #pending == 0",
    "  return state",
    "end",
    "local engine = Engine.new()",
    "engine:register('normalize', { 'input' }, function(deps, payload, attempt, runtime)",
    "  if attempt == 1 and not runtime.cache.normalizeRetried then",
    "    runtime.cache.normalizeRetried = true",
    "    error('synthetic warmup fault')",
    "  end",
    "  local rows = {}",
    "  for _, item in ipairs(deps.input.items) do",
    "    local weight = item.weight",
    "    if payload.mode == 'amplify' then",
    "      weight *= 2",
    "    end",
    "    table.insert(rows, { id = item.id, weight = weight })",
    "  end",
    "  return { rows = rows, mode = payload.mode }",
    "end)",
    "local payload = {",
    "  mode = 'amplify',",
    "  items = {",
    "    { id = 'alpha', weight = 3 },",
    "    { id = 'beta', weight = 6 },",
    "  },",
    "}",
    "local state = engine:run(payload)",
    "print(#state.normalize.rows .. ':' .. state.normalize.mode .. ':' .. state.normalize.rows[1].id)",
  ].join("\n");

  const { code } = await obfuscateLuau(wholeProgramSource, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    dead: true,
    cff: true,
    wrap: true,
    numbers: true,
    constArray: true,
    proxifyLocals: false,
    padFooter: true,
    vm: {
      enabled: true,
      all: true,
      topLevel: true,
    },
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "vm-whole-program-normalize-graph",
  });

  parseCustom(code);
  assert.strictEqual(
    runLuau(code),
    "2:amplify:alpha",
    "whole-program VM should preserve normalize graph payload and deps field access"
  );
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

async function runNestedTableTailCallExpansion() {
  const nestedTableTailSource = [
    "local function test()",
    "  local total = 3",
    "  local result = { lines = { tostring(total) } }",
    "  return result.lines[1]",
    "end",
    "print(test())",
  ].join("\n");

  const code = await obfuscateSemanticVm(nestedTableTailSource, "test", "vm-nested-table-tail");
  assert.strictEqual(
    runLuau(code),
    "3",
    "nested table constructors should preserve tail-call list entries without corrupting outer field assignment"
  );
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

async function runCapturedAnonymousClosureRead() {
  const capturedClosureSource = [
    "local function outer()",
    "  local x = { value = 'ok' }",
    "  local fn = function()",
    "    return x.value",
    "  end",
    "  return fn()",
    "end",
    "print(outer())",
  ].join("\n");

  const { code } = await obfuscateLuau(capturedClosureSource, {
    lang: "luau",
    luauParser: "custom",
    vm: {
      enabled: true,
      include: [],
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
    },
    cff: false,
    strings: false,
    rename: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    seed: "vm-captured-anon-read",
  });

  assert.strictEqual(
    runLuau(code),
    "ok",
    "virtualized anonymous closures should preserve captured outer locals"
  );
}

(async () => {
  await runCustom();
  await runCustomLayered();
  await runCustomPolymorph();
  await runCustomTopLevel();
  runPackedShellNormalizationDefaults();
  runPackedShellNormalizationOverride();
  runLuauOutputSizeLimit();
  await runPackedShellWholeProgramDefault();
  await runPackedShellPayloadConcealment();
  await runPackedShellExplicitIncludeOverride();
  await runPackedShellHardProjectRegression();
  await runWrappedVm();
  await runNestedCallbackLift();
  await runNestedCallbackLiftWithParams();
  await runNestedCallbackInnerLocalGuard();
  await runCompoundAssignmentTargets();
  await runRenamedMemberCompoundAssignment();
  await runMetatableConstructorGuard();
  await runWrappedVmMethodRoundtrip();
  await runWholeProgramNormalizeGraph();
  await runGotoLabelSupport();
  await runRecursiveLocalFunction();
  await runMultiReturnAssignment();
  await runTailReturnExpansion();
  await runTableTailCallExpansion();
  await runNestedTableTailCallExpansion();
  await runAssignmentTargetOrdering();
  await runElseScopeIsolation();
  await runRepeatConditionScope();
  await runCallArgumentExpansion();
  await runSingleAssignmentOrdering();
  await runCapturedLocalWriteback();
  await runCapturedAnonymousClosureRead();
  console.log("luau-vm: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
