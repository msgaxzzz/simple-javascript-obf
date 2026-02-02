const { insertAtTop } = require("./ast");

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

function buildRuntime({ lock }) {
  const errIntegrity = luaString("Integrity check failed");
  const errRuntime = luaString("Runtime integrity violation");
  return [
    "do",
    "  local function __obf_fail(msg)",
    "    error(msg, 0)",
    "  end",
    "  local function __obf_check()",
    "    local env = _ENV",
    "    local rawgetFn = rawget",
    "    local typeFn = nil",
    "    if rawgetFn then",
    "      typeFn = rawgetFn(env, \"type\")",
    "    end",
    "    if not typeFn then",
    `      __obf_fail(${errIntegrity})`,
    "    end",
    "    if typeFn(env) ~= \"table\" then",
    `      __obf_fail(${errIntegrity})`,
    "    end",
    "    if typeFn(rawgetFn) == \"function\" then",
    "      local dbg = rawgetFn(env, \"debug\")",
    "      if dbg and typeFn(dbg) == \"table\" then",
    "        local gethook = dbg.gethook",
    "        if typeFn(gethook) == \"function\" then",
    "          local ok, hook = pcall(gethook)",
    "          if ok and hook ~= nil then",
    `            __obf_fail(${errIntegrity})`,
    "          end",
    "        end",
    "      end",
    "    end",
    "    local getmt = getmetatable",
    "    if typeFn(getmt) == \"function\" then",
    "      local mt = getmt(env)",
    "      if mt ~= nil then",
    `        __obf_fail(${errIntegrity})`,
    "      end",
    "    end",
    "  end",
    "  __obf_check()",
    lock ? "  local lockEnv = true" : "  local lockEnv = false",
    "  if lockEnv then",
    "    local setmt = setmetatable",
    "    if typeFn(setmt) == \"function\" then",
    "      local env = _ENV",
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
  const runtime = buildRuntime({ lock: ctx.options.antiHook.lock });
  const runtimeAst = ctx.options.luauParser === "custom"
    ? ctx.parseCustom(runtime)
    : ctx.parseLuaparse(runtime);
  insertAtTop(ast, runtimeAst.body);
}

module.exports = {
  antiHookLuau,
};
