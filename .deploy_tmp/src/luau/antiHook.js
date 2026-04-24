const { insertAtTop, walk } = require("./ast");

const LUA_KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
]);

function makeName(rng, used) {
  const firstAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  const restAlphabet = `${firstAlphabet}0123456789`;
  let out = "";
  while (!out || LUA_KEYWORDS.has(out) || used.has(out) || out.toLowerCase().includes("obf")) {
    const length = rng.int(3, 8);
    let name = firstAlphabet[rng.int(0, firstAlphabet.length - 1)];
    for (let i = 1; i < length; i += 1) {
      name += restAlphabet[rng.int(0, restAlphabet.length - 1)];
    }
    out = name;
  }
  used.add(out);
  return out;
}

function luaString(value) {
  const text = String(value);
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/"/g, "\\\"");
  return `"${escaped}"`;
}

function buildRuntime({ lock, rng }) {
  const errIntegrity = luaString("Integrity check failed");
  const errRuntime = luaString("Runtime integrity violation");
  const used = new Set();
  const failName = makeName(rng, used);
  const envName = makeName(rng, used);
  const checkName = makeName(rng, used);
  return [
    "do",
    `  local function ${failName}(msg)`,
    "    error(msg, 0)",
    "  end",
    "  local typeFn = type",
    "  if typeFn == nil then",
    `    ${failName}(${errIntegrity})`,
    "  end",
    `  local function ${envName}()`,
    "    local env",
    "    local getf = getfenv",
    "    if typeFn(getf) == \"function\" then",
    "      env = getf(1)",
    "    end",
    "    if typeFn(env) ~= \"table\" then",
    "      env = _G",
    "    end",
    "    local getmt = getmetatable",
    "    if typeFn(getmt) == \"function\" then",
    "      local mt = getmt(env)",
    "      if mt ~= nil then",
    "        local g = _G",
    "        if typeFn(g) == \"table\" then",
    "          env = g",
    "        end",
    "      end",
    "    end",
    "    return env",
    "  end",
    `  local function ${checkName}()`,
    `    local env = ${envName}()`,
    "    if typeFn(env) ~= \"table\" then",
    `      ${failName}(${errIntegrity})`,
    "    end",
    "    local dbg = debug",
    "    if typeFn(dbg) == \"table\" then",
    "      local gethook = dbg.gethook",
    "      if typeFn(gethook) == \"function\" then",
    "        local ok, hook = pcall(gethook)",
    "        if ok and hook ~= nil then",
    `          ${failName}(${errIntegrity})`,
    "        end",
    "      end",
    "    end",
    "    local getmt = getmetatable",
    "    if typeFn(getmt) == \"function\" then",
    "      local mt = getmt(env)",
    "      if mt ~= nil then",
    `        ${failName}(${errIntegrity})`,
    "      end",
    "    end",
    "  end",
    `  ${checkName}()`,
    lock ? "  local lockEnv = true" : "  local lockEnv = false",
    "  if lockEnv then",
    "    local setmt = setmetatable",
    "    if typeFn(setmt) == \"function\" then",
    `      local env = ${envName}()`,
      "      local mt = getmetatable(env)",
      "      if mt == nil then",
      "        mt = {}",
      "        setmt(env, mt)",
      "      end",
      "      if mt.__metatable == nil then",
      "        mt.__metatable = \"locked\"",
      "      end",
      "      if mt.__newindex == nil then",
      `        mt.__newindex = function() error(${errRuntime}, 0) end`,
      "      end",
    "    end",
    "  end",
    "end",
  ].join("\n");
}

function antiHookLuau(ast, ctx) {
  if (!ctx.options.antiHook || !ctx.options.antiHook.enabled) {
    return;
  }
  const runtime = buildRuntime({ lock: ctx.options.antiHook.lock, rng: ctx.rng });
  const runtimeAst = ctx.options.luauParser === "custom"
    ? ctx.parseCustom(runtime)
    : ctx.parseLuaparse(runtime);
  if (runtimeAst && Array.isArray(runtimeAst.body)) {
    runtimeAst.body.forEach((stmt) => {
      stmt.__obf_skip_mask = true;
      walk(stmt, (node) => {
        node.__obf_skip_mask = true;
      });
    });
  }
  insertAtTop(ast, runtimeAst.body);
}

module.exports = {
  antiHookLuau,
};
