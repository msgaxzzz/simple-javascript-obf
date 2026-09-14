"use strict";

const { RC_OPCODES, CONST_BIAS } = require("./rcOpcodes");

/**
 * Packs 3-address instructions [op, a, b, c] into a compact 6-byte sequence
 */
function packInstructions(insts, opToCode) {
  const bytes = [];
  for (const [op, a, b, c] of insts) {
    const code = opToCode.get(op) || op;
    const aVal = Math.max(0, Math.min(255, a || 0));
    const bVal = Math.max(0, Math.min(65535, b || 0));
    const cVal = Math.max(0, Math.min(65535, c || 0));
    bytes.push(code & 0xff);
    bytes.push(aVal);
    bytes.push((bVal >> 8) & 0xff);
    bytes.push(bVal & 0xff);
    bytes.push((cVal >> 8) & 0xff);
    bytes.push(cVal & 0xff);
  }
  return bytes;
}

/**
 * Formats byte array into Lua decimal escape string ("\\001\\002...")
 */
function bytesToLuaEscapedString(bytes) {
  if (!bytes || !bytes.length) return '""';
  return '"' + bytes.map((b) => "\\" + String(b).padStart(3, "0")).join("") + '"';
}

/**
 * Recursively builds a balanced binary decision tree for opcode dispatching.
 * Time complexity: O(log N) branch depth instead of O(N) linear comparisons.
 */
function buildBinaryTreeDispatch(sortedCodes, handlers, low, high, indent = "      ") {
  if (low === high) {
    const code = sortedCodes[low];
    return `${indent}${handlers.get(code)}`;
  }
  if (high === low + 1) {
    const codeLow = sortedCodes[low];
    const codeHigh = sortedCodes[high];
    return `${indent}if s == ${codeLow} then\n${indent}  ${handlers.get(codeLow)}\n${indent}else\n${indent}  ${handlers.get(codeHigh)}\n${indent}end`;
  }
  const mid = Math.floor((low + high) / 2);
  const midCode = sortedCodes[mid];
  const left = buildBinaryTreeDispatch(sortedCodes, handlers, low, mid, indent + "  ");
  const right = buildBinaryTreeDispatch(sortedCodes, handlers, mid + 1, high, indent + "  ");
  return `${indent}if s <= ${midCode} then\n${left}\n${indent}else\n${right}\n${indent}end`;
}

/**
 * Builds the RC VM runtime execution shell for Luau
 */
function buildRcRuntime(program, rng, options = {}) {
  // 1. Opcode Mapping Randomization
  const opcodeNames = Object.keys(RC_OPCODES);
  const shuffledOps = [...opcodeNames];
  if (options.shuffle !== false) {
    for (let i = shuffledOps.length - 1; i > 0; i--) {
      const j = rng ? rng.int(0, i) : Math.floor(Math.random() * (i + 1));
      [shuffledOps[i], shuffledOps[j]] = [shuffledOps[j], shuffledOps[i]];
    }
  }

  const opToCode = new Map();
  shuffledOps.forEach((name, idx) => {
    opToCode.set(RC_OPCODES[name], idx + 1);
  });

  // 2. Format Constants
  function formatConstant(val) {
    if (val === null || val === undefined) return "nil";
    if (typeof val === "number") return String(val);
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "string") {
      const escaped = val
        .replace(/\\/g, "\\\\")
        .replace(/"/g, "\\\"")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return `"${escaped}"`;
    }
    return "nil";
  }

  const isPacked = options.packed !== false;

  // 3. Serialize Instructions
  function serializeInstructions(insts) {
    if (isPacked) {
      const packedBytes = packInstructions(insts, opToCode);
      return `d(${bytesToLuaEscapedString(packedBytes)})`;
    }
    const rawTuples = insts.map(([op, a, b, c]) => {
      const code = opToCode.get(op) || op;
      return `{ ${code}, ${a}, ${b}, ${c} }`;
    });
    return `{ ${rawTuples.join(", ")} }`;
  }

  // 4. Generate Sub-prototypes with minimal indices { consts, insts, upvals }
  const protoSources = (program.protos || []).map((p) => {
    const pConsts = p.constants.map(formatConstant).join(", ");
    const pInsts = serializeInstructions(p.instructions);
    const pUpvals = (p.upvalues || []).map((u) => `{ ${u.instack}, ${u.index} }`).join(", ");
    return `{ { ${pConsts} }, ${pInsts}, { ${pUpvals} } }`;
  });

  const rootConsts = program.constants.map(formatConstant).join(", ");
  const rootInsts = serializeInstructions(program.instructions);

  // 5. Build Opcode Handlers using ultra-compact 1-character identifiers
  const handlers = new Map();

  // MOVE: r[a] = r[b]
  handlers.set(opToCode.get(RC_OPCODES.MOVE), `r[t[2]] = r[t[3]]`);

  // LOADK: r[a] = k[b]
  handlers.set(opToCode.get(RC_OPCODES.LOADK), `r[t[2]] = k[t[3] + 1]`);

  // LOADBOOL: r[a] = (b ~= 0); if c ~= 0 then p = p + 1 end
  handlers.set(opToCode.get(RC_OPCODES.LOADBOOL), `r[t[2]] = (t[3] ~= 0); if t[4] ~= 0 then p = p + 1 end`);

  // LOADNIL: for j = a, b do r[j] = nil end
  handlers.set(opToCode.get(RC_OPCODES.LOADNIL), `for j = t[2], t[3] do r[j] = nil end`);

  // GETGLOBAL: r[a] = e[k[b]]
  handlers.set(opToCode.get(RC_OPCODES.GETGLOBAL), `r[t[2]] = e[k[t[3] + 1]]`);

  // SETGLOBAL: e[k[b]] = r[a]
  handlers.set(opToCode.get(RC_OPCODES.SETGLOBAL), `e[k[t[3] + 1]] = r[t[2]]`);

  // GETTABLE: r[a] = r[b][rk(c)]
  handlers.set(
    opToCode.get(RC_OPCODES.GETTABLE),
    `local x = t[3]; local y = t[4]; r[t[2]] = r[x][y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]]`
  );

  // SETTABLE: r[a][rk(b)] = rk(c)
  handlers.set(
    opToCode.get(RC_OPCODES.SETTABLE),
    `local a = t[2]; local x = t[3]; local y = t[4]; r[a][x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]] = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );

  // NEWTABLE: r[a] = {}
  handlers.set(opToCode.get(RC_OPCODES.NEWTABLE), `r[t[2]] = {}`);

  // SELF: r[a+1] = r[b]; r[a] = r[b][rk(c)]
  handlers.set(
    opToCode.get(RC_OPCODES.SELF),
    `local a = t[2]; local x = t[3]; local y = t[4]; r[a + 1] = r[x]; r[a] = r[x][y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]]`
  );

  // Arithmetic
  handlers.set(
    opToCode.get(RC_OPCODES.ADD),
    `local x = t[3]; local y = t[4]; r[t[2]] = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) + (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.SUB),
    `local x = t[3]; local y = t[4]; r[t[2]] = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) - (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.MUL),
    `local x = t[3]; local y = t[4]; r[t[2]] = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) * (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.DIV),
    `local x = t[3]; local y = t[4]; r[t[2]] = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) / (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.IDIV),
    `local x = t[3]; local y = t[4]; local xv = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]); local yv = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]); r[t[2]] = math.floor(xv / yv)`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.MOD),
    `local x = t[3]; local y = t[4]; r[t[2]] = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) % (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.POW),
    `local x = t[3]; local y = t[4]; r[t[2]] = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) ^ (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.CONCAT),
    `local x = t[3]; local y = t[4]; r[t[2]] = tostring(x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) .. tostring(y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])`
  );

  // Unary
  handlers.set(opToCode.get(RC_OPCODES.UNM), `r[t[2]] = -r[t[3]]`);
  handlers.set(opToCode.get(RC_OPCODES.NOT), `r[t[2]] = not r[t[3]]`);
  handlers.set(opToCode.get(RC_OPCODES.LEN), `r[t[2]] = #r[t[3]]`);

  // Jumps & Branches
  handlers.set(opToCode.get(RC_OPCODES.JMP), `p = t[2] + 1`);
  handlers.set(
    opToCode.get(RC_OPCODES.EQ),
    `local x = t[3]; local y = t[4]; local c = ((x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) == (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])); if (c and 1 or 0) == t[2] then p = p + 1 end`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.LT),
    `local x = t[3]; local y = t[4]; local c = ((x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) < (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])); if (c and 1 or 0) == t[2] then p = p + 1 end`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.LE),
    `local x = t[3]; local y = t[4]; local c = ((x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]) <= (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y])); if (c and 1 or 0) == t[2] then p = p + 1 end`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.TEST),
    `local c = not not r[t[2]]; if (c and 1 or 0) == t[4] then p = t[3] + 1 end`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.TESTSET),
    `local x = t[3]; local c = not not r[x]; if (c and 1 or 0) == t[4] then r[t[2]] = r[x]; p = p + 1 end`
  );

  // CALL
  handlers.set(
    opToCode.get(RC_OPCODES.CALL),
    `local a = t[2]; local x = t[3]; local y = t[4]; local g = r[a]; local z = {}
      for j = 1, x - 1 do z[j] = r[a + j] end
      if y == 1 then
        g(u(z))
      elseif y > 1 then
        local h = { g(u(z)) }
        for j = 1, y - 1 do r[a + j - 1] = h[j] end
      else
        local h = { g(u(z)) }
        for j = 1, #h do r[a + j - 1] = h[j] end
      end`
  );

  // RETURN
  handlers.set(
    opToCode.get(RC_OPCODES.RETURN),
    `local a = t[2]; local x = t[3]
      if x == 1 then
        return
      elseif x > 1 then
        local z = {}
        for j = 1, x - 1 do z[j] = r[a + j - 1] end
        return u(z)
      else
        local z = {}
        for j = a, #r do z[#z + 1] = r[j] end
        return u(z)
      end`
  );

  // Loops
  handlers.set(
    opToCode.get(RC_OPCODES.FORPREP),
    `local a = t[2]; r[a] = r[a] - r[a + 2]; p = t[3] + 1`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.FORLOOP),
    `local a = t[2]; local st = r[a + 2]; r[a] = r[a] + st; local lim = r[a + 1]
      if (st > 0 and r[a] <= lim) or (st <= 0 and r[a] >= lim) then
        p = t[3] + 1; r[a + 3] = r[a]
      end`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.TFORLOOP),
    `local a = t[2]; local gn = r[a]; local re = { gn(r[a + 1], r[a + 2]) }
      if re[1] ~= nil then
        r[a + 2] = re[1]
        for j = 1, t[4] do r[a + 2 + j] = re[j] end
        p = t[3] + 1
      end`
  );

  // SETLIST
  handlers.set(
    opToCode.get(RC_OPCODES.SETLIST),
    `local a = t[2]; local n = t[3]; local c = t[4]; local of = (c - 1) * 50; for j = 1, n do r[a][of + j] = r[a + j] end`
  );

  // CLOSURE
  handlers.set(
    opToCode.get(RC_OPCODES.CLOSURE),
    `local id = t[3] + 1; local cp = m[id]; local cw = {}; local g
      g = function(...) return f(cp, cw, ...) end
      r[t[2]] = g
      if cp[3] then
        for j = 1, #cp[3] do
          local dsc = cp[3][j]
          if dsc[1] == 1 then
            local ri = dsc[2]
            local c = o[ri]
            if not c then
              c = { [1] = r[ri] }
              o[ri] = c
            else
              c[1] = r[ri]
            end
            cw[j] = c
          else
            cw[j] = w[dsc[2] + 1]
          end
        end
      end`
  );

  // VARARG
  handlers.set(
    opToCode.get(RC_OPCODES.VARARG),
    `local a = t[2]; local b = t[3]; for j = 1, b - 1 do r[a + j - 1] = v[j] end`
  );

  // Upvalues
  handlers.set(opToCode.get(RC_OPCODES.GETUPVAL), `r[t[2]] = w[t[3] + 1][1]`);
  handlers.set(
    opToCode.get(RC_OPCODES.SETUPVAL),
    `local c = w[t[3] + 1]; if c then c[1] = r[t[2]] end`
  );

  // Bitwise
  handlers.set(
    opToCode.get(RC_OPCODES.BAND),
    `local x = t[3]; local y = t[4]; local xv = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]); local yv = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]); r[t[2]] = b.band(xv, yv)`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.BOR),
    `local x = t[3]; local y = t[4]; local xv = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]); local yv = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]); r[t[2]] = b.bor(xv, yv)`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.BXOR),
    `local x = t[3]; local y = t[4]; local xv = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]); local yv = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]); r[t[2]] = b.bxor(xv, yv)`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.SHL),
    `local x = t[3]; local y = t[4]; local xv = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]); local yv = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]); r[t[2]] = b.lshift(xv, yv)`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.SHR),
    `local x = t[3]; local y = t[4]; local xv = (x >= ${CONST_BIAS} and k[x - ${CONST_BIAS} + 1] or r[x]); local yv = (y >= ${CONST_BIAS} and k[y - ${CONST_BIAS} + 1] or r[y]); r[t[2]] = b.rshift(xv, yv)`
  );
  handlers.set(
    opToCode.get(RC_OPCODES.BNOT),
    `local x = t[3]; r[t[2]] = b.bnot(r[x])`
  );

  // 6. Build Balanced Binary Decision Tree Dispatcher
  const sortedCodes = Array.from(handlers.keys()).sort((a, b) => a - b);
  const dispatchTree = buildBinaryTreeDispatch(sortedCodes, handlers, 0, sortedCodes.length - 1);

  // 7. Optional Stream Deserializer Definition
  const deserializerDef = isPacked
    ? `  local function d(s)
    local l = {}
    local j = 1
    for i = 1, #s, 6 do
      local o, a, b1, b2, c1, c2 = string.byte(s, i, i + 5)
      l[j] = { o, a, b1 * 256 + b2, c1 * 256 + c2 }
      j = j + 1
    end
    return l
  end`
    : "";

  // 8. Construct Minimal Luau Runtime Code
  const luaSource = `
--!nocheck
return (function(...)
  local u = table.unpack or unpack
  local b = bit32 or (getfenv and getfenv().bit32) or {}
  local e = getfenv and getfenv() or _G
${deserializerDef}
  local m = { ${protoSources.join(", ")} }

  local function f(q, w, ...)
    local k = q[1]
    local l = q[2]
    local r = {}
    local o = {}
    local p = 1
    w = w or {}

    local v = { ... }
    for j = 1, #v do
      r[j - 1] = v[j]
    end

    while p <= #l do
      local t = l[p]
      local s = t[1]
      p = p + 1

${dispatchTree}
    end
  end

  return f({ { ${rootConsts} }, ${rootInsts}, {} }, {}, ...)
end)(...)
`;

  return luaSource.trim();
}

module.exports = {
  buildRcRuntime,
};
