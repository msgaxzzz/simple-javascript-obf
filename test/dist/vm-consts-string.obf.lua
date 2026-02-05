local function demo(a, b)
  do
      local jQ2AM = 4294967296
      local LEOxD
      do
          local k = 93
          local d = {5, 12, 23, 214, 213}
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
          LEOxD = env[table.concat(out)]
        end
      if LEOxD == nil then
          local function hquzTR(x)
              x = x % jQ2AM
              if x < 0 then
                  x = x + jQ2AM
                end
              return x
            end
          LEOxD = {}
          function LEOxD.band(a, b)
              a = hquzTR(a)
              b = hquzTR(b)
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
          function LEOxD.bor(a, b)
              a = hquzTR(a)
              b = hquzTR(b)
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
          function LEOxD.bxor(a, b)
              a = hquzTR(a)
              b = hquzTR(b)
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
          function LEOxD.bnot(a)
              return jQ2AM - 1 - hquzTR(a)
            end
          function LEOxD.lshift(a, b)
              b = b % 32
              return (hquzTR(a) * (2 ^ b)) % jQ2AM
            end
          function LEOxD.rshift(a, b)
              b = b % 32
              return math.floor(hquzTR(a) / (2 ^ b))
            end
        end
      local function mp9Borw(hi, lo)
          return {hi, lo}
        end
      local function FaSP(v)
          return {0, v % jQ2AM}
        end
      local function RRgwTXFO(v)
          return v[2]
        end
      local function oQuYDj(a, b)
          local lo = a[2] + b[2]
          local carry = 0
          if lo >= jQ2AM then
              lo = lo - jQ2AM
              carry = 1
            end
          local hi = (a[1] + b[1] + carry) % jQ2AM
          return {hi, lo}
        end
      local function wlc4Cu(a, m)
          return ((a[1] % m) * (jQ2AM % m) + (a[2] % m)) % m
        end
      local function AK9vo(a)
          return ((a[1] % 255) * 1 + (a[2] % 255)) % 255
        end
      local function xM2w(a, b)
          return {LEOxD.bxor(a[1], b[1]), LEOxD.bxor(a[2], b[2])}
        end
      local function M96Zk(a, b)
          return {LEOxD.band(a[1], b[1]), LEOxD.band(a[2], b[2])}
        end
      local function BFnj(a, b)
          return {LEOxD.bor(a[1], b[1]), LEOxD.bor(a[2], b[2])}
        end
      local function EKBv(a)
          return {LEOxD.bnot(a[1]), LEOxD.bnot(a[2])}
        end
      local function Z9QKEA(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local hi = LEOxD.lshift(a[2], b - 32)
              return {hi, 0}
            end
          local hi = LEOxD.bor(LEOxD.lshift(a[1], b), LEOxD.rshift(a[2], 32 - b))
          local lo = LEOxD.lshift(a[2], b)
          return {hi, lo}
        end
      local function QjqU2h6(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local lo = LEOxD.rshift(a[1], b - 32)
              return {0, lo}
            end
          local hi = LEOxD.rshift(a[1], b)
          local lo = LEOxD.bor(LEOxD.rshift(a[2], b), LEOxD.lshift(a[1], 32 - b))
          return {hi, lo}
        end
      local function sJCSz(a, b)
          return LEOxD.bxor(a, b)
        end
      local function HfIZ(a, b)
          return LEOxD.band(a, b)
        end
      local function qZRn(a, b)
          return LEOxD.bor(a, b)
        end
      local function R3BD(a)
          return LEOxD.bnot(a)
        end
      local function ra4b(a, b)
          return LEOxD.lshift(a, b)
        end
      local function TQw4Cf3(a, b)
          return LEOxD.rshift(a, b)
        end
      local seed_pieces = {34, 240, 231, 150}
      local seed = FaSP(0)
      for i = 1, #seed_pieces do
          local v = seed_pieces[i]
          local v64 = FaSP(v)
          seed = xM2w(oQuYDj(seed, v64), M96Zk(Z9QKEA(v64, (i - 1) % 3), FaSP(0xff)))
          seed = M96Zk(seed, FaSP(0xff))
        end
      seed = AK9vo(oQuYDj(seed, FaSP(55 + 5)))
      local op_data = {80, 117, 121, 64, 114, 126, 111, 125, 143, 133, 135, 139, 149, 161, 140, 165, 189, 206, 193, 215, 215, 196, 198, 254, 212, 209, 9, 22, 13, 7, 0, 52, 8, 49, 43, 101, 77, 105, 91, 89}
      local op_key = ((76 + 41 + seed) % 255) + 1
      local op_map = {}
      for i = 1, #op_data do
          local mix = (op_key + (i - 1) * 7) % 255
          op_map[i] = sJCSz(op_data[i], mix)
        end
      local OP_NOP = op_map[(7 - 6)]
      local OP_PUSH_CONST = op_map[(8 - 6)]
      local OP_PUSH_LOCAL = op_map[(8 - 5)]
      local OP_SET_LOCAL = op_map[(10 - 6)]
      local OP_PUSH_GLOBAL = op_map[(6 - 1)]
      local OP_SET_GLOBAL = op_map[(11 - 5)]
      local OP_NEW_TABLE = op_map[(11 - 4)]
      local OP_DUP = op_map[(13 - 5)]
      local OP_SWAP = op_map[(16 - 7)]
      local OP_POP = op_map[(19 - 9)]
      local OP_GET_TABLE = op_map[(16 - 5)]
      local OP_SET_TABLE = op_map[(21 - 9)]
      local OP_CALL = op_map[(22 - 9)]
      local OP_RETURN = op_map[(18 - 4)]
      local OP_JMP = op_map[(16 - 1)]
      local OP_JMP_IF_FALSE = op_map[(18 - 2)]
      local OP_JMP_IF_TRUE = op_map[(25 - 8)]
      local OP_ADD = op_map[(26 - 8)]
      local OP_SUB = op_map[(21 - 2)]
      local OP_MUL = op_map[(22 - 2)]
      local OP_DIV = op_map[(27 - 6)]
      local OP_IDIV = op_map[(25 - 3)]
      local OP_MOD = op_map[(25 - 2)]
      local OP_POW = op_map[(27 - 3)]
      local OP_CONCAT = op_map[(31 - 6)]
      local OP_EQ = op_map[(29 - 3)]
      local OP_NE = op_map[(34 - 7)]
      local OP_LT = op_map[(37 - 9)]
      local OP_LE = op_map[(34 - 5)]
      local OP_GT = op_map[(37 - 7)]
      local OP_GE = op_map[(39 - 8)]
      local OP_BAND = op_map[(39 - 7)]
      local OP_BOR = op_map[(34 - 1)]
      local OP_BXOR = op_map[(38 - 4)]
      local OP_SHL = op_map[(36 - 1)]
      local OP_SHR = op_map[(38 - 2)]
      local OP_UNM = op_map[(38 - 1)]
      local OP_NOT = op_map[(46 - 8)]
      local OP_LEN = op_map[(40 - 1)]
      local OP_BNOT = op_map[(47 - 7)]
      local bc_key_data = {107, 105, 87, 177}
      local bc_key_mask = ((sJCSz(175, 33) + seed) % 255) + 1
      local bc_keys = {}
      for i = 1, #bc_key_data do
          local mix = (bc_key_mask + (i - 1) * 13) % 255
          bc_keys[i] = sJCSz(bc_key_data[i], mix)
        end
      local bc_key_count = #bc_keys
      local consts_data = {{4, "\053\137\092"}, {4, "\049\123\095"}, {4, "\063\123\086\126\066"}, {0, ""}, {3, "\000\074"}}
      local consts_key_enc = {36, 236, 239, 1, 215, 58, 153, 219, 56, 200, 163}
      local consts_key = {}
      local consts_cache = {}
      local consts_ready = {}
      local const_key_mask = ((sJCSz(118, 97) + seed) % 255) + 1
      for i = 1, #consts_key_enc do
          local mix = (const_key_mask + (i - 1) * 11) % 255
          consts_key[i] = sJCSz(consts_key_enc[i], mix)
        end
      local keyLen = #consts_key
      local const_byte = string.byte
      local function wXkn(i)
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
      local bc_parts = {string.char(174, 154, 171, 188, 246, 222, 239, 0, 42, 34, 51, 68, 91, 102, 119, 136, 145, 170, 187, 204, 213, 238, 255, 16, 28, 50, 67, 84, 126, 118, 135, 152, 176, 186, 203, 220, 230, 254, 15, 32, 26, 66, 83, 100, 95, 134, 151, 168, 163, 202, 219, 236, 196, 14, 31, 48, 122, 82, 99, 116) .. string.char(149, 150, 167, 184, 193, 218, 235, 252, 5, 30, 47, 64, 84, 98, 115, 132, 140, 166, 183, 200, 192, 234, 251, 12, 40, 46, 63, 80, 79, 114, 131, 148, 143, 182, 199, 216, 198, 250, 11, 28, 21, 62, 79, 96, 74, 130, 147, 164, 156, 198, 215, 232, 245, 10, 27, 44, 53, 78, 95, 112) .. string.char(147, 146, 163, 180, 221, 214, 231, 248, 19, 26, 43, 60, 120, 94, 111, 128, 188, 162, 179, 196, 255, 230, 247, 8, 61, 42, 59, 76, 96, 110, 127, 144, 154, 178, 195, 212, 242, 246, 7, 24, 36, 58, 75, 92, 101, 126, 143, 160, 137, 194, 211, 228, 233, 6, 23, 40, 32, 74, 91, 108) .. string.char(118, 142, 159, 176, 237, 210, 227, 244, 47, 22, 39, 56, 83, 90, 107, 124, 177, 158, 175, 192, 234, 226, 243, 4, 22, 38, 55, 72, 83, 106, 123, 140, 151, 174, 191, 208, 231, 242, 3, 20, 53, 54, 71, 88, 112, 122, 139, 156, 152, 190, 207, 224, 211, 2, 19, 36, 31, 70, 87, 104) .. string.char(99, 138, 155, 172, 142, 206, 223, 240, 58, 18, 35, 52, 105, 86, 103, 120, 133, 154, 171, 188, 197, 222, 239, 0, 32, 34, 51, 68, 76, 102, 119, 136, 128, 170, 187, 204, 240, 238, 255, 16, 34, 50, 67, 84, 79, 118, 135, 152, 158, 186, 203, 220, 214, 254, 15, 32, 10, 66, 83, 100) .. string.char(92, 134, 151, 168, 185, 202, 219, 236, 245, 14, 31, 48, 71, 82, 99, 116, 155, 150, 167, 184, 208, 218, 235, 252, 6, 30, 47, 64, 120, 98, 115, 132, 191, 166, 183, 200, 195, 234, 251, 12, 47, 46, 63, 80, 90, 114, 131, 148, 162, 182, 199, 216, 225, 250, 11, 28, 37, 62, 79, 96) .. string.char(119, 130, 147, 164, 175, 198, 215, 232, 224, 10, 27, 44, 55, 78, 95, 112, 188, 146, 163, 180, 239, 214, 231, 248, 62, 26, 43, 60, 118, 94, 111, 128, 170, 162, 179, 196, 252, 230, 247, 8, 18, 42, 59, 76, 85, 110, 127, 144, 156, 178, 195, 212, 249, 246, 7, 24, 48, 58, 75, 92) .. string.char(86, 126, 143, 160, 155, 194, 211, 228, 223, 6, 23, 40, 20, 74, 91, 108, 114, 142, 159, 176, 250, 210, 227, 244, 1, 22, 39, 56, 65, 90, 107, 124, 133, 158, 175, 192, 233, 226, 243, 4, 8, 38, 55, 72, 64, 106, 123, 140, 147, 174, 191, 208, 201, 242, 3, 20, 15, 54, 71, 88) .. string.char(69, 122, 139, 156, 150, 190, 207, 224, 202, 2, 19, 36, 57, 70, 87, 104, 112, 138, 155, 172, 181, 206, 223, 240, 56, 18, 35, 52, 105, 86, 103, 120, 144, 154, 171, 188, 235, 222, 239, 0, 59, 34, 51, 68, 127, 102, 119, 136, 131, 170, 187, 204, 229, 238, 255, 16, 26, 50, 67, 84) .. string.char(105, 118, 135, 152, 160, 186, 203, 220, 229, 254, 15, 32, 44, 66, 83, 100, 108, 134, 151, 168, 160, 202, 219, 236), string.char(51, 58, 75, 92, 87, 126, 143, 160, 138, 194, 211, 228, 220, 6, 23, 40, 51, 74, 91, 108, 117, 142, 159, 176, 215, 210, 227, 244, 28, 22, 39, 56, 80, 90, 107, 124, 184, 158, 175, 192, 248, 226, 243, 4, 63, 38, 55, 72, 121, 106, 123, 140, 166, 174, 191, 208, 218, 242, 3, 20) .. string.char(43, 54, 71, 88, 97, 122, 139, 156, 165, 190, 207, 224, 204, 2, 19, 36, 45, 70, 87, 104, 96, 138, 155, 172, 182, 206, 223, 240, 40, 18, 35, 52, 111, 86, 103, 120)}
      local bc_order = {2, 1}
      local bc_build = {}
      for i = 1, #bc_order do
          bc_build[i] = bc_parts[bc_order[i]]
        end
      local bc_str = table.concat(bc_build)
      local bc_key = ((3 + 81 + seed) % 255) + 1
      local bc_byte = string.byte
      local function CIibhhOd(i)
          local b = bc_byte(bc_str, i)
          local mix = (bc_key + (i - 1) * 17) % 256
          return sJCSz(b, mix)
        end
      local function LJUb7aO(pos)
          local b1 = CIibhhOd(pos)
          local b2 = CIibhhOd(pos + 1)
          local b3 = CIibhhOd(pos + 2)
          local b4 = CIibhhOd(pos + 3)
          return b1 + b2 * 256 + b3 * 65536 + b4 * 16777216
        end
      local function hoHJi1(pc)
          local base = (pc - 1) * 12 + 1
          local op = LJUb7aO(base)
          local a = LJUb7aO(base + 4)
          local b = LJUb7aO(base + 8)
          return op, a, b
        end
      local pc = 1
      while true do
          local op, a, b = hoHJi1(pc)
          local key = 0
          if bc_key_count > 0 then
              local idx = ((pc + seed - 1) % bc_key_count) + 1
              key = bc_keys[idx]
              op = sJCSz(op, key)
              a = sJCSz(a, key)
              b = sJCSz(b, key)
            end
          if op == OP_NOP then
              pc = pc + 1
      elseif op == OP_PUSH_CONST then
              top = top + 1
              stack[top] = wXkn(a)
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
              stack[top] = env[wXkn(a)]
              pc = pc + 1
      elseif op == OP_SET_GLOBAL then
              env[wXkn(a)] = stack[top]
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
              stack[top - 1] = HfIZ(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BOR then
              stack[top - 1] = qZRn(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BXOR then
              stack[top - 1] = sJCSz(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHL then
              stack[top - 1] = ra4b(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHR then
              stack[top - 1] = TQw4Cf3(stack[top - 1], stack[top])
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
              stack[top] = R3BD(stack[top])
              pc = pc + 1
            else
              return
            end
        end
    end
end
print(demo(2, 6))