const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { obfuscateLuau } = require("../src/luau");
const { parse: parseCustom } = require("../src/luau/custom/parser");
const { walk } = require("../src/luau/ast");
const { renameLuau } = require("../src/luau/rename");
const { RNG } = require("../src/utils/rng");

const source = [
  "local function demo()",
  "  local a = 1",
  "  local b = a + 1",
  "  local t = { a = a, [b] = a }",
  "  print(b)",
  "  return b",
  "end",
].join("\n");

function collectLocalNames(ast) {
  const names = new Set();
  walk(ast, (node) => {
    if (!node || node.type !== "LocalStatement") {
      return;
    }
    if (Array.isArray(node.variables)) {
      node.variables.forEach((variable) => {
        if (variable && variable.type === "Identifier") {
          names.add(variable.name);
        }
      });
    }
  });
  return names;
}

function hasTableKeyA(ast) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node) {
      return;
    }
    if (node.type === "TableConstructorExpression") {
      const fields = node.fields || [];
      for (const field of fields) {
        if (field.kind === "name" && field.name && field.name.name === "a") {
          found = true;
          return;
        }
        if (field.type === "TableKeyString" && field.key && field.key.name === "a") {
          found = true;
          return;
        }
      }
    }
  });
  return found;
}

function hasPrintCall(ast) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node) {
      return;
    }
    if (node.type === "CallExpression" && node.base && node.base.type === "Identifier" && node.base.name === "print") {
      found = true;
    }
  });
  return found;
}

function hasMemberName(ast, name) {
  let found = false;
  walk(ast, (node) => {
    if (found || !node || node.type !== "MemberExpression") {
      return;
    }
    if (node.identifier && node.identifier.type === "Identifier" && node.identifier.name === name) {
      found = true;
    }
  });
  return found;
}

function countMemberName(ast, name) {
  let count = 0;
  walk(ast, (node) => {
    if (!node || node.type !== "MemberExpression") {
      return;
    }
    if (node.identifier && node.identifier.type === "Identifier" && node.identifier.name === name) {
      count += 1;
    }
  });
  return count;
}

function runLuau(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-rename-"));
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

function runEnvAliasMemberGuard() {
  const ast = parseCustom(
    [
      "local e = _G",
      "local i = 1",
      "local x = e[i].byte",
      "return x",
    ].join("\n")
  );
  ast.__obf_env_alias_name = "e";
  renameLuau(ast, {
    options: {
      renameOptions: {
        renameMembers: true,
        renameGlobals: false,
        reserved: [],
      },
    },
    rng: new RNG("rename-env-alias-member"),
  });
  assert.ok(hasMemberName(ast, "byte"), "custom: env alias lookup member should preserve 'byte'");
}

function runExternalServiceMemberGuard() {
  const ast = parseCustom(
    [
      "local Players = game:GetService(\"Players\")",
      "local lp = Players.LocalPlayer",
      "return lp",
    ].join("\n")
  );
  renameLuau(ast, {
    options: {
      renameOptions: {
        renameMembers: true,
        renameGlobals: false,
        reserved: [],
      },
    },
    rng: new RNG("rename-external-service-guard"),
  });
  assert.ok(hasMemberName(ast, "LocalPlayer"), "custom: external service member should be preserved");
}

function runLocalTableMemberRename() {
  const ast = parseCustom(
    [
      "local t = { foo = { bar = 1 } }",
      "return t.foo.bar",
    ].join("\n")
  );
  renameLuau(ast, {
    options: {
      renameOptions: {
        renameMembers: true,
        renameGlobals: false,
        reserved: [],
      },
    },
    rng: new RNG("rename-local-table-members"),
  });
  assert.strictEqual(countMemberName(ast, "foo"), 0, "custom: local table member 'foo' should be renamed");
  assert.strictEqual(countMemberName(ast, "bar"), 0, "custom: nested local table member 'bar' should be renamed");
}

async function runCustom() {
  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: false,
    cff: false,
    renameOptions: { maskGlobals: false },
    seed: "rename-custom",
  });
  const ast = parseCustom(code);
  const locals = collectLocalNames(ast);
  assert.ok(!locals.has("a"), "custom: local a should be renamed");
  assert.ok(!locals.has("b"), "custom: local b should be renamed");
  assert.ok(hasTableKeyA(ast), "custom: table key 'a' should remain");
  assert.ok(hasPrintCall(ast), "custom: print call should remain global");
}

async function runRenameMembersWithStrings() {
  const sourceWithMemberCalls = [
    "local t = {}",
    "function t.foo()",
    "  return 42",
    "end",
    "print(t.foo())",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithMemberCalls, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: {
      renameMembers: true,
      maskGlobals: false,
    },
    seed: "rename-members-with-strings",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "42", "member renaming should stay aligned with encoded member calls");
}

async function runExternalPayloadKeyGuard() {
  const sourceWithPayload = [
    "local RemoteEvent = {}",
    "function RemoteEvent:FireServer(payload)",
    "  return payload.keep and 'ok' or 'bad'",
    "end",
    "print(RemoteEvent:FireServer({ keep = true }))",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithPayload, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: {
      renameMembers: true,
      maskGlobals: false,
    },
    seed: "rename-external-payload",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "ok", "table literal payload keys should stay stable for external-style APIs");
}

async function runMetatableMethodRenameRoundtrip() {
  const sourceWithMetatableMethods = [
    "local Engine = {}",
    "Engine.__index = Engine",
    "function Engine.new()",
    "  local self = { nodes = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "function Engine:register(name)",
    "  self.nodes[name] = true",
    "end",
    "local engine = Engine.new()",
    "engine:register(\"ok\")",
    "print(engine.nodes[\"ok\"] and \"ok\" or \"bad\")",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithMetatableMethods, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: {
      renameMembers: true,
      maskGlobals: false,
    },
    seed: "rename-metatable-methods",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "ok", "metatable-backed method calls should stay aligned with renamed methods");
}

async function runAliasedContainerRecordGuard() {
  const sourceWithAliasedRecord = [
    "local Engine = {}",
    "Engine.__index = Engine",
    "function Engine.new()",
    "  local self = { nodes = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "function Engine:register(name, deps)",
    "  self.nodes[name] = { deps = deps }",
    "end",
    "function Engine:ready(node, state)",
    "  for _, dep in ipairs(node.deps) do",
    "    if state[dep] == nil then",
    "      return false",
    "    end",
    "  end",
    "  return true",
    "end",
    "local engine = Engine.new()",
    "engine:register(\"task\", { \"ok\" })",
    "local node = engine.nodes[\"task\"]",
    "print(engine:ready(node, { ok = true }) and \"ok\" or \"bad\")",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithAliasedRecord, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    renameOptions: {
      renameMembers: true,
      maskGlobals: false,
    },
    seed: "rename-aliased-container-record",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "ok", "record fields stored in local containers should remain readable through aliases");
}

async function runDynamicMapMemberAccessGuard() {
  const sourceWithDynamicMapMemberAccess = [
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
    "engine:register(\"a\", { \"x\" })",
    "print(engine:run())",
  ].join("\n");

  const { code } = await obfuscateLuau(sourceWithDynamicMapMemberAccess, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    wrap: true,
    renameOptions: {
      renameMembers: true,
      maskGlobals: true,
      renameGlobals: false,
    },
    seed: "rename-dynamic-map-member-access",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "1|a", "member reads through dynamic-key maps should preserve runtime keys");
}

async function runHardProjectLikeRoundtrip() {
  const source = [
    "local function shallowClone(input)",
    "  local out = {}",
    "  for key, value in pairs(input) do",
    "    out[key] = value",
    "  end",
    "  return out",
    "end",
    "",
    "local Engine = {}",
    "Engine.__index = Engine",
    "",
    "function Engine.new(seed)",
    "  local self = {",
    "    seed = seed,",
    "    nodes = {},",
    "    order = {},",
    "    cache = {},",
    "    trace = {},",
    "    metrics = { attempts = 0, retries = 0, checksum = 0 },",
    "  }",
    "  return setmetatable(self, Engine)",
    "end",
    "",
    "function Engine:register(name, deps, handler)",
    "  self.nodes[name] = {",
    "    name = name,",
    "    deps = shallowClone(deps),",
    "    handler = handler,",
    "  }",
    "  table.insert(self.order, name)",
    "end",
    "",
    "function Engine:_ready(node, state)",
    "  for _, dep in ipairs(node.deps) do",
    "    if state[dep] == nil then",
    "      return false",
    "    end",
    "  end",
    "  return true",
    "end",
    "",
    "function Engine:_resolve(node, state)",
    "  local resolved = {}",
    "  for _, dep in ipairs(node.deps) do",
    "    resolved[dep] = state[dep]",
    "  end",
    "  return resolved",
    "end",
    "",
    "function Engine:run(payload)",
    "  local state = { input = shallowClone(payload) }",
    "  for _, name in ipairs(self.order) do",
    "    local node = self.nodes[name]",
    "    if self:_ready(node, state) then",
    "      local deps = self:_resolve(node, state)",
    "      state[name] = node.handler(deps, payload, 1, self)",
    "    end",
    "  end",
    "  return state",
    "end",
    "",
    "local engine = Engine.new(13)",
    "engine:register(\"normalize\", { \"input\" }, function(deps)",
    "  return { rows = deps.input.items }",
    "end)",
    "engine:register(\"expand\", { \"normalize\" }, function(deps)",
    "  return { total = #deps.normalize.rows }",
    "end)",
    "local result = engine:run({ items = { 1, 2, 3 } })",
    "print(result.expand.total)",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    filename: "hard-project-like.lua",
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
      include: [],
    },
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "hard-project-like-roundtrip",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "3", "hard-project-like member graphs should survive full luau pipeline");
}

async function runClonedPayloadSchemaGuard() {
  const source = [
    "local function shallowClone(input)",
    "  local out = {}",
    "  for key, value in pairs(input) do",
    "    out[key] = value",
    "  end",
    "  return out",
    "end",
    "",
    "local Engine = {}",
    "Engine.__index = Engine",
    "",
    "function Engine.new()",
    "  local self = { nodes = {}, order = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "",
    "function Engine:register(name, deps, handler)",
    "  self.nodes[name] = { deps = shallowClone(deps), handler = handler }",
    "  table.insert(self.order, name)",
    "end",
    "",
    "function Engine:_ready(node, state)",
    "  for _, dep in ipairs(node.deps) do",
    "    if state[dep] == nil then",
    "      return false",
    "    end",
    "  end",
    "  return true",
    "end",
    "",
    "function Engine:_resolve(node, state)",
    "  local resolved = {}",
    "  for _, dep in ipairs(node.deps) do",
    "    resolved[dep] = state[dep]",
    "  end",
    "  return resolved",
    "end",
    "",
    "function Engine:run(payload)",
    "  local state = { input = shallowClone(payload) }",
    "  for _, name in ipairs(self.order) do",
    "    local node = self.nodes[name]",
    "    if self:_ready(node, state) then",
    "      local deps = self:_resolve(node, state)",
    "      state[name] = node.handler(deps, payload)",
    "    end",
    "  end",
    "  local summary = {",
    "    checksum = 11,",
    "    attempts = 2,",
    "  }",
    "  return state, summary",
    "end",
    "",
    "local engine = Engine.new()",
    "engine:register(\"normalize\", { \"input\" }, function(deps, payload)",
    "  local total = #deps.input.items",
    "  if payload.mode == \"trim\" then",
    "    total -= 1",
    "  end",
    "  return { lines = { tostring(total) }, total = total, mode = payload.mode }",
    "end)",
    "",
    "local payload = {",
    "  mode = \"amplify\",",
    "  items = { 1, 2, 3 },",
    "}",
    "local result, summary = engine:run(payload)",
    "print(result.normalize.total .. \":\" .. result.normalize.mode .. \":\" .. summary.checksum .. \":\" .. result.normalize.lines[1])",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    filename: "cloned-payload-schema-guard.lua",
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
      include: [],
    },
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "cloned-payload-schema-guard",
  });

  parseCustom(code);
  assert.strictEqual(
    runLuau(code),
    "3:amplify:11:3",
    "payload schemas cloned into deps.input should keep member access aligned"
  );
}

async function runDynamicMapRecordAliasGuard() {
  const source = [
    "local function shallowClone(input)",
    "  local out = {}",
    "  for key, value in pairs(input) do",
    "    out[key] = value",
    "  end",
    "  return out",
    "end",
    "",
    "local Engine = {}",
    "Engine.__index = Engine",
    "",
    "function Engine.new()",
    "  local self = { nodes = {}, order = {}, cache = {} }",
    "  return setmetatable(self, Engine)",
    "end",
    "",
    "function Engine:register(name, deps, handler)",
    "  self.nodes[name] = { deps = shallowClone(deps), handler = handler }",
    "  table.insert(self.order, name)",
    "end",
    "",
    "function Engine:run()",
    "  local node = self.nodes.normalize",
    "  return type(node.handler) .. ':' .. tostring(node.deps[1])",
    "end",
    "",
    "local engine = Engine.new()",
    "engine:register(\"normalize\", { \"input\" }, function() return 1 end)",
    "print(engine:run())",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    cff: false,
    dead: false,
    vm: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    wrap: false,
    renameOptions: {
      renameGlobals: false,
      renameMembers: true,
      maskGlobals: true,
      homoglyphs: false,
    },
    seed: "rename-dynamic-map-record-alias",
  });

  parseCustom(code);
  assert.strictEqual(
    runLuau(code),
    "function:input",
    "records stored inside dynamic-key maps should keep aliased field reads aligned"
  );
}

(async () => {
  runEnvAliasMemberGuard();
  runExternalServiceMemberGuard();
  runLocalTableMemberRename();
  await runCustom();
  await runRenameMembersWithStrings();
  await runExternalPayloadKeyGuard();
  await runMetatableMethodRenameRoundtrip();
  await runAliasedContainerRecordGuard();
  await runDynamicMapMemberAccessGuard();
  await runDynamicMapRecordAliasGuard();
  await runHardProjectLikeRoundtrip();
  await runClonedPayloadSchemaGuard();
  console.log("luau-rename: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
