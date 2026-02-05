local function demo(a, b)
  do
      local TrcrYKa = 4294967296
      local x2j7MC
      do
          local k = 182
          local d = {172, 179, 190, 125, 124}
          local out = {}
          for i = 1, #d do
              out[i] = string.char((d[i] + k) % 256)
            end
          local env
          local getf = getfenv
          if type(getf) == "function" then
              env = getf(1)
            end
          if type(env) ~= "table" then
              env = _G
            end
          x2j7MC = env[table.concat(out)]
        end
      if x2j7MC == nil then
          local function Ekuzv(x)
              x = x % TrcrYKa
              if x < 0 then
                  x = x + TrcrYKa
                end
              return x
            end
          x2j7MC = {}
          function x2j7MC.band(a, b)
              a = Ekuzv(a)
              b = Ekuzv(b)
              local res = 0
              local bit = 1
              for i = 0, 31 do
                  local abit = a % 2
                  local bbit = b % 2
                  if abit == 1 and bbit == 1 then
                      res = res + bit
                    end
                  a = (a - abit) / 2
                  b = (b - bbit) / 2
                  bit = bit * 2
                end
              return res
            end
          function x2j7MC.bor(a, b)
              a = Ekuzv(a)
              b = Ekuzv(b)
              local res = 0
              local bit = 1
              for i = 0, 31 do
                  local abit = a % 2
                  local bbit = b % 2
                  if abit == 1 or bbit == 1 then
                      res = res + bit
                    end
                  a = (a - abit) / 2
                  b = (b - bbit) / 2
                  bit = bit * 2
                end
              return res
            end
          function x2j7MC.bxor(a, b)
              a = Ekuzv(a)
              b = Ekuzv(b)
              local res = 0
              local bit = 1
              for i = 0, 31 do
                  local abit = a % 2
                  local bbit = b % 2
                  if abit + bbit == 1 then
                      res = res + bit
                    end
                  a = (a - abit) / 2
                  b = (b - bbit) / 2
                  bit = bit * 2
                end
              return res
            end
          function x2j7MC.bnot(a)
              return TrcrYKa - 1 - Ekuzv(a)
            end
          function x2j7MC.lshift(a, b)
              b = b % 32
              return (Ekuzv(a) * (2 ^ b)) % TrcrYKa
            end
          function x2j7MC.rshift(a, b)
              b = b % 32
              return math.floor(Ekuzv(a) / (2 ^ b))
            end
        end
      local function cigJAjj(hi, lo)
          return {hi, lo}
        end
      local function mVGsL5(v)
          return {0, v % TrcrYKa}
        end
      local function KXh1Jb(v)
          return v[2]
        end
      local function G3Ba(a, b)
          local lo = a[2] + b[2]
          local carry = 0
          if lo >= TrcrYKa then
              lo = lo - TrcrYKa
              carry = 1
            end
          local hi = (a[1] + b[1] + carry) % TrcrYKa
          return {hi, lo}
        end
      local function LpQ4(a, m)
          return ((a[1] % m) * (TrcrYKa % m) + (a[2] % m)) % m
        end
      local function NuY1q5(a)
          return ((a[1] % 255) * 1 + (a[2] % 255)) % 255
        end
      local function lKQ8z8(a, b)
          return {x2j7MC.bxor(a[1], b[1]), x2j7MC.bxor(a[2], b[2])}
        end
      local function sMLmlD7T(a, b)
          return {x2j7MC.band(a[1], b[1]), x2j7MC.band(a[2], b[2])}
        end
      local function dG5ZU(a, b)
          return {x2j7MC.bor(a[1], b[1]), x2j7MC.bor(a[2], b[2])}
        end
      local function o2EXp(a)
          return {x2j7MC.bnot(a[1]), x2j7MC.bnot(a[2])}
        end
      local function MYTef(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local hi = x2j7MC.lshift(a[2], b - 32)
              return {hi, 0}
            end
          local hi = x2j7MC.bor(x2j7MC.lshift(a[1], b), x2j7MC.rshift(a[2], 32 - b))
          local lo = x2j7MC.lshift(a[2], b)
          return {hi, lo}
        end
      local function FwvtTIhd(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local lo = x2j7MC.rshift(a[1], b - 32)
              return {0, lo}
            end
          local hi = x2j7MC.rshift(a[1], b)
          local lo = x2j7MC.bor(x2j7MC.rshift(a[2], b), x2j7MC.lshift(a[1], 32 - b))
          return {hi, lo}
        end
      local function MUOpK7(a, b)
          return x2j7MC.bxor(a, b)
        end
      local function K7tD5j(a, b)
          return x2j7MC.band(a, b)
        end
      local function Ul4ZnSlq(a, b)
          return x2j7MC.bor(a, b)
        end
      local function kul7(a)
          return x2j7MC.bnot(a)
        end
      local function Q3xC8R(a, b)
          return x2j7MC.lshift(a, b)
        end
      local function Zarv8yS(a, b)
          return x2j7MC.rshift(a, b)
        end
      local seed_pieces = {68, 194, 77, 179}
      local seed = mVGsL5(0)
      for i = 1, #seed_pieces do
          local v = seed_pieces[i]
          local v64 = mVGsL5(v)
          seed = lKQ8z8(G3Ba(seed, v64), sMLmlD7T(MYTef(v64, (i - 1) % 3), mVGsL5(0xff)))
          seed = sMLmlD7T(seed, mVGsL5(0xff))
        end
      seed = NuY1q5(G3Ba(seed, mVGsL5(7 + 0)))
      local op_data = {2, 9, 48, 58, 63, 12, 9, 55, 52, 84, 79, 72, 126, 72, 69, 119, 118, 105, 149, 155, 155, 189, 140, 190, 166, 163, 181, 205, 203, 214, 203, 255, 247, 225, 251, 225, 31, 5, 4, 8}
      local op_key = ((125 + 149 + seed) % 255) + 1
      local op_map = {}
      for i = 1, #op_data do
          local mix = (op_key + (i - 1) * 7) % 255
          op_map[i] = MUOpK7(op_data[i], mix)
        end
      local OP_NOP = op_map[(5 - 4)]
      local OP_PUSH_CONST = op_map[(7 - 5)]
      local OP_PUSH_LOCAL = op_map[(6 - 3)]
      local OP_SET_LOCAL = op_map[(13 - 9)]
      local OP_PUSH_GLOBAL = op_map[(14 - 9)]
      local OP_SET_GLOBAL = op_map[(13 - 7)]
      local OP_NEW_TABLE = op_map[(10 - 3)]
      local OP_DUP = op_map[(14 - 6)]
      local OP_SWAP = op_map[(11 - 2)]
      local OP_POP = op_map[(19 - 9)]
      local OP_GET_TABLE = op_map[(19 - 8)]
      local OP_SET_TABLE = op_map[(19 - 7)]
      local OP_CALL = op_map[(18 - 5)]
      local OP_RETURN = op_map[(17 - 3)]
      local OP_JMP = op_map[(17 - 2)]
      local OP_JMP_IF_FALSE = op_map[(18 - 2)]
      local OP_JMP_IF_TRUE = op_map[(20 - 3)]
      local OP_ADD = op_map[(27 - 9)]
      local OP_SUB = op_map[(27 - 8)]
      local OP_MUL = op_map[(22 - 2)]
      local OP_DIV = op_map[(24 - 3)]
      local OP_IDIV = op_map[(27 - 5)]
      local OP_MOD = op_map[(32 - 9)]
      local OP_POW = op_map[(26 - 2)]
      local OP_CONCAT = op_map[(32 - 7)]
      local OP_EQ = op_map[(29 - 3)]
      local OP_NE = op_map[(31 - 4)]
      local OP_LT = op_map[(34 - 6)]
      local OP_LE = op_map[(36 - 7)]
      local OP_GT = op_map[(35 - 5)]
      local OP_GE = op_map[(33 - 2)]
      local OP_BAND = op_map[(37 - 5)]
      local OP_BOR = op_map[(41 - 8)]
      local OP_BXOR = op_map[(37 - 3)]
      local OP_SHL = op_map[(37 - 2)]
      local OP_SHR = op_map[(44 - 8)]
      local OP_UNM = op_map[(44 - 7)]
      local OP_NOT = op_map[(45 - 7)]
      local OP_LEN = op_map[(41 - 2)]
      local OP_BNOT = op_map[(45 - 5)]
      local bc_key_data = {190, 95, 125, 91}
      local bc_key_mask = ((MUOpK7(57, 49) + seed) % 255) + 1
      local bc_keys = {}
      for i = 1, #bc_key_data do
          local mix = (bc_key_mask + (i - 1) * 13) % 255
          bc_keys[i] = MUOpK7(bc_key_data[i], mix)
        end
      local bc_key_count = #bc_keys
      local consts_data = {}
      local consts_key_enc = {187, 187, 139, 181, 45, 122, 131, 45, 90}
      local consts_key = {}
      local consts_cache = {}
      local consts_ready = {}
      local const_key_mask = ((MUOpK7(168, 73) + seed) % 255) + 1
      for i = 1, #consts_key_enc do
          local mix = (const_key_mask + (i - 1) * 11) % 255
          consts_key[i] = MUOpK7(consts_key_enc[i], mix)
        end
      local keyLen = #consts_key
      local const_byte = string.byte
      local function l10TOWi(i)
          if consts_ready[i] then
              return consts_cache[i]
            end
          consts_ready[i] = true
          local entry = consts_data[i]
          if not entry then
              return nil
            end
          local tag = entry[1]
          local data = entry[2]
          local out = {}
          for j = 1, #data do
              local idx = (j - 1) % keyLen + 1
              local v = const_byte(data, j) - consts_key[idx]
              if v < 0 then
                  v = v + 256
                end
              out[j] = string.char(v)
            end
          local s = table.concat(out)
          local value
          if tag == 0 then
              value = nil
      elseif tag == 1 then
              value = false
      elseif tag == 2 then
              value = true
      elseif tag == 3 then
              value = tonumber(s)
            else
              value = s
            end
          consts_cache[i] = value
          return value
        end
      local locals = {a, b}
      local stack = {}
      local top = 0
      local env
      local getf = getfenv
      if type(getf) == "function" then
          env = getf(1)
        end
      if type(env) ~= "table" then
          env = _G
        end
      local pack = table.pack
      if pack == nil then
          pack = function(...)
  return {n = select("#", ...), ...}
end
        end
      local unpack = table.unpack
      if unpack == nil then
          local function unpack_fn(t, i, j)
              i = i or 1
              j = j or (t.n or #t)
              if i > j then
                  return
                end
              return t[i], unpack_fn(t, i + 1, j)
            end
          unpack = unpack_fn
        end
      local bc_parts = {string.char(106, 31, 48, 65, 20, 99, 116, 133, 209, 167, 184, 201, 161, 235, 252, 13, 68, 47, 64, 81, 58, 115, 132, 149, 218, 183, 200, 217, 131, 251, 12, 29, 71, 63, 80, 97), string.char(151, 231, 248, 9, 115, 43, 60, 77, 55, 111, 128, 145), string.char(40, 131, 148, 165, 207, 199, 216, 233, 128, 11, 28, 45, 90, 79, 96, 113, 198, 147, 164, 181, 129, 215, 232, 249), string.char(122, 27, 44, 61, 23, 95, 112, 129, 202, 163, 180, 197)}
      local bc_order = {1, 3, 4, 2}
      local bc_build = {}
      for i = 1, #bc_order do
          bc_build[i] = bc_parts[bc_order[i]]
        end
      local bc_str = table.concat(bc_build)
      local bc_key = ((111 + 172 + seed) % 255) + 1
      local bc_byte = string.byte
      local function V4wh(i)
          local b = bc_byte(bc_str, i)
          local mix = (bc_key + (i - 1) * 17) % 256
          return MUOpK7(b, mix)
        end
      local function vRNx(pos)
          local b1 = V4wh(pos)
          local b2 = V4wh(pos + 1)
          local b3 = V4wh(pos + 2)
          local b4 = V4wh(pos + 3)
          return b1 + b2 * 256 + b3 * 65536 + b4 * 16777216
        end
      local function nMcB(pc)
          local base = (pc - 1) * 12 + 1
          local op = vRNx(base)
          local a = vRNx(base + 4)
          local b = vRNx(base + 8)
          return op, a, b
        end
      local pc = 1
      while true do
          local op, a, b = nMcB(pc)
          local key = 0
          if bc_key_count > 0 then
              local idx = ((pc + seed - 1) % bc_key_count) + 1
              key = bc_keys[idx]
              op = MUOpK7(op, key)
              a = MUOpK7(a, key)
              b = MUOpK7(b, key)
            end
          if op == OP_NOP then
              pc = pc + 1
      elseif op == OP_PUSH_CONST then
              top = top + 1
              stack[top] = l10TOWi(a)
              pc = pc + 1
      elseif op == OP_PUSH_LOCAL then
              top = top + 1
              stack[top] = locals[a]
              pc = pc + 1
      elseif op == OP_SET_LOCAL then
              locals[a] = stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_PUSH_GLOBAL then
              top = top + 1
              stack[top] = env[l10TOWi(a)]
              pc = pc + 1
      elseif op == OP_SET_GLOBAL then
              env[l10TOWi(a)] = stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_NEW_TABLE then
              top = top + 1
              stack[top] = {}
              pc = pc + 1
      elseif op == OP_DUP then
              top = top + 1
              stack[top] = stack[top - 1]
              pc = pc + 1
      elseif op == OP_SWAP then
              stack[top], stack[top - 1] = stack[top - 1], stack[top]
              pc = pc + 1
      elseif op == OP_POP then
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_GET_TABLE then
              local idx = stack[top]
              stack[top] = nil
              local base = stack[top - 1]
              stack[top - 1] = base[idx]
              top = top - 1
              pc = pc + 1
      elseif op == OP_SET_TABLE then
              local val = stack[top]
              stack[top] = nil
              local key = stack[top - 1]
              stack[top - 1] = nil
              local base = stack[top - 2]
              base[key] = val
              stack[top - 2] = nil
              top = top - 3
              pc = pc + 1
      elseif op == OP_CALL then
              local argc = a
              local retc = b
              local base = top - argc
              local fn = stack[base]
              if retc == 0 then
                  fn(unpack(stack, base + 1, top))
                  for i = top, base, -1 do
                      stack[i] = nil
                    end
                  top = base - 1
                else
                  local res = pack(fn(unpack(stack, base + 1, top)))
                  for i = top, base, -1 do
                      stack[i] = nil
                    end
                  top = base - 1
                  if retc == 1 then
                      top = top + 1
                      stack[top] = res[1]
                    else
                      for i = 1, retc do
                          top = top + 1
                          stack[top] = res[i]
                        end
                    end
                end
              pc = pc + 1
      elseif op == OP_RETURN then
              local count = a
              if count == 0 then
                  return
        elseif count == 1 then
                  return stack[top]
                else
                  local base = top - count + 1
                  return unpack(stack, base, top)
                end
      elseif op == OP_JMP then
              pc = a
      elseif op == OP_JMP_IF_FALSE then
              if not stack[top] then
                  pc = a
                else
                  pc = pc + 1
                end
      elseif op == OP_JMP_IF_TRUE then
              if stack[top] then
                  pc = a
                else
                  pc = pc + 1
                end
      elseif op == OP_ADD then
              stack[top - 1] = stack[top - 1] + stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SUB then
              stack[top - 1] = stack[top - 1] - stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_MUL then
              stack[top - 1] = stack[top - 1] * stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_DIV then
              stack[top - 1] = stack[top - 1] / stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_IDIV then
              stack[top - 1] = math.floor(stack[top - 1] / stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_MOD then
              stack[top - 1] = stack[top - 1] % stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_POW then
              stack[top - 1] = stack[top - 1] ^ stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_CONCAT then
              stack[top - 1] = stack[top - 1] .. stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_EQ then
              stack[top - 1] = stack[top - 1] == stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_NE then
              stack[top - 1] = stack[top - 1] ~= stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_LT then
              stack[top - 1] = stack[top - 1] < stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_LE then
              stack[top - 1] = stack[top - 1] <= stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_GT then
              stack[top - 1] = stack[top - 1] > stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_GE then
              stack[top - 1] = stack[top - 1] >= stack[top]
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BAND then
              stack[top - 1] = K7tD5j(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BOR then
              stack[top - 1] = Ul4ZnSlq(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BXOR then
              stack[top - 1] = MUOpK7(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHL then
              stack[top - 1] = Q3xC8R(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHR then
              stack[top - 1] = Zarv8yS(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_UNM then
              stack[top] = -stack[top]
              pc = pc + 1
      elseif op == OP_NOT then
              stack[top] = not stack[top]
              pc = pc + 1
      elseif op == OP_LEN then
              stack[top] = #stack[top]
              pc = pc + 1
      elseif op == OP_BNOT then
              stack[top] = kul7(stack[top])
              pc = pc + 1
            else
              return
            end
        end
    end
end
print(demo(2, 6))