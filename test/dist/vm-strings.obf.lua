local AMh4iO = {{255, 238, 253, 130}, {2, 251, 10, 115, 131, 6, 166, 121}, {16, 231, 254, 124, 116}, {255, 245, 10, 115, 112, 17}, {2, 242, 11, 127, 129}, {254, 254, 11, 130}, {254, 231, 10, 116}, {254, 245, 14}, {254, 244, 11, 132}, {8, 249, 4, 121, 117, 17}, {14, 249, 4, 121, 117, 17}, {94, 17, 201, 211, 187}, {94, 13, 187, 211, 190}, {94, 27, 187, 211, 181, 196, 249, 161}, {}, {242, 73, 74}, {254, 255, 16, 117}, {12, 231, 255, 123}, {191}, {10}, {17, 244, 12, 113, 114, 8}}
local RSsE9hdD = {156, 134, 156, 16, 15, 157, 55, 11, 146, 140, 164, 171, 3, 104, 49, 189}
local p4pDpNFs = {}
local function Xzv3FhAt(i)
  local cached = p4pDpNFs[i]
  if cached ~= nil then
      return cached
    end
  local data = AMh4iO[i]
  local out = {}
  local keyLen = #RSsE9hdD
  for j = 1, #data do
      local idx = j - 1
      idx = idx % keyLen
      idx = idx + 1
      local v = data[j] - RSsE9hdD[idx]
      if v < 0 then
          v = v + 256
        end
      out[j] = string.char(v)
    end
  local s = table.concat(out)
  p4pDpNFs[i] = s
  return s
end
local function demo(a, b)
  do
      local CsBCjIR = 4294967296
      local MOHe
      do
          local k = 109
          local d = {245, 252, 7, 198, 197}
          local out = {}
          for i = 1, #d do
              out[i] = string[Xzv3FhAt(1)]((d[i] + k) % 256)
            end
          local env
          local getf = getfenv
          if type(getf) == Xzv3FhAt(2) then
              env = getf(1)
            end
          if type(env) ~= Xzv3FhAt(3) then
              env = _G
            end
          MOHe = env[table[Xzv3FhAt(4)](out)]
        end
      if MOHe == nil then
          local function IHm6(x)
              x = x % CsBCjIR
              if x < 0 then
                  x = x + CsBCjIR
                end
              return x
            end
          MOHe = {}
          function MOHe.band(a, b)
              a = IHm6(a)
              b = IHm6(b)
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
          function MOHe.bor(a, b)
              a = IHm6(a)
              b = IHm6(b)
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
          function MOHe.bxor(a, b)
              a = IHm6(a)
              b = IHm6(b)
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
          function MOHe.bnot(a)
              return CsBCjIR - 1 - IHm6(a)
            end
          function MOHe.lshift(a, b)
              b = b % 32
              return (IHm6(a) * (2 ^ b)) % CsBCjIR
            end
          function MOHe.rshift(a, b)
              b = b % 32
              return math[Xzv3FhAt(5)](IHm6(a) / (2 ^ b))
            end
        end
      local function x2FoJO(hi, lo)
          return {hi, lo}
        end
      local function dy99NUw4(v)
          return {0, v % CsBCjIR}
        end
      local function F3PS0ZIi(v)
          return v[2]
        end
      local function Cvc53PS(a, b)
          local lo = a[2] + b[2]
          local carry = 0
          if lo >= CsBCjIR then
              lo = lo - CsBCjIR
              carry = 1
            end
          local hi = (a[1] + b[1] + carry) % CsBCjIR
          return {hi, lo}
        end
      local function VzO2Yk(a, m)
          return ((a[1] % m) * (CsBCjIR % m) + (a[2] % m)) % m
        end
      local function Y4TZF(a)
          return ((a[1] % 255) * 1 + (a[2] % 255)) % 255
        end
      local function jaTM8(a, b)
          return {MOHe[Xzv3FhAt(6)](a[1], b[1]), MOHe[Xzv3FhAt(6)](a[2], b[2])}
        end
      local function wsIBM(a, b)
          return {MOHe[Xzv3FhAt(7)](a[1], b[1]), MOHe[Xzv3FhAt(7)](a[2], b[2])}
        end
      local function k7Nt(a, b)
          return {MOHe[Xzv3FhAt(8)](a[1], b[1]), MOHe[Xzv3FhAt(8)](a[2], b[2])}
        end
      local function edN7sZEw(a)
          return {MOHe[Xzv3FhAt(9)](a[1]), MOHe[Xzv3FhAt(9)](a[2])}
        end
      local function YnUIm4B(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local hi = MOHe[Xzv3FhAt(10)](a[2], b - 32)
              return {hi, 0}
            end
          local hi = MOHe[Xzv3FhAt(8)](MOHe[Xzv3FhAt(10)](a[1], b), MOHe[Xzv3FhAt(11)](a[2], 32 - b))
          local lo = MOHe[Xzv3FhAt(10)](a[2], b)
          return {hi, lo}
        end
      local function rAQtJul(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local lo = MOHe[Xzv3FhAt(11)](a[1], b - 32)
              return {0, lo}
            end
          local hi = MOHe[Xzv3FhAt(11)](a[1], b)
          local lo = MOHe[Xzv3FhAt(8)](MOHe[Xzv3FhAt(11)](a[2], b), MOHe[Xzv3FhAt(10)](a[1], 32 - b))
          return {hi, lo}
        end
      local function YJl0R6(a, b)
          return MOHe[Xzv3FhAt(6)](a, b)
        end
      local function lwV6Z(a, b)
          return MOHe[Xzv3FhAt(7)](a, b)
        end
      local function ov0t(a, b)
          return MOHe[Xzv3FhAt(8)](a, b)
        end
      local function msWwZDbU(a)
          return MOHe[Xzv3FhAt(9)](a)
        end
      local function qfQ2KZOB(a, b)
          return MOHe[Xzv3FhAt(10)](a, b)
        end
      local function SRd5lyo(a, b)
          return MOHe[Xzv3FhAt(11)](a, b)
        end
      local seed_pieces = {77, 34}
      local seed = dy99NUw4(0)
      for i = 1, #seed_pieces do
          local v = seed_pieces[i]
          local v64 = dy99NUw4(v)
          seed = jaTM8(Cvc53PS(seed, v64), wsIBM(YnUIm4B(v64, (i - 1) % 3), dy99NUw4(0xff)))
          seed = wsIBM(seed, dy99NUw4(0xff))
        end
      seed = Y4TZF(Cvc53PS(seed, dy99NUw4(55 + 5)))
      local op_data = {118, 119, 115, 132, 142, 156, 131, 139, 173, 176, 168, 163, 170, 201, 192, 247, 255, 192, 226, 209, 235, 214, 0, 28, 28, 11, 35, 15, 21, 48, 50, 70, 83, 75, 73, 127, 72, 123, 81, 127}
      local op_key = ((156 + 43 + seed) % 255) + 1
      local op_map = {}
      for i = 1, #op_data do
          local mix = (op_key + (i - 1) * 7) % 255
          op_map[i] = YJl0R6(op_data[i], mix)
        end
      local OP_NOP = op_map[(7 - 6)]
      local OP_PUSH_CONST = op_map[(4 - 2)]
      local OP_PUSH_LOCAL = op_map[(12 - 9)]
      local OP_SET_LOCAL = op_map[(12 - 8)]
      local OP_PUSH_GLOBAL = op_map[(8 - 3)]
      local OP_SET_GLOBAL = op_map[(7 - 1)]
      local OP_NEW_TABLE = op_map[(14 - 7)]
      local OP_DUP = op_map[(15 - 7)]
      local OP_SWAP = op_map[(14 - 5)]
      local OP_POP = op_map[(15 - 5)]
      local OP_GET_TABLE = op_map[(14 - 3)]
      local OP_SET_TABLE = op_map[(14 - 2)]
      local OP_CALL = op_map[(17 - 4)]
      local OP_RETURN = op_map[(18 - 4)]
      local OP_JMP = op_map[(16 - 1)]
      local OP_JMP_IF_FALSE = op_map[(23 - 7)]
      local OP_JMP_IF_TRUE = op_map[(21 - 4)]
      local OP_ADD = op_map[(26 - 8)]
      local OP_SUB = op_map[(27 - 8)]
      local OP_MUL = op_map[(27 - 7)]
      local OP_DIV = op_map[(25 - 4)]
      local OP_IDIV = op_map[(30 - 8)]
      local OP_MOD = op_map[(30 - 7)]
      local OP_POW = op_map[(31 - 7)]
      local OP_CONCAT = op_map[(27 - 2)]
      local OP_EQ = op_map[(29 - 3)]
      local OP_NE = op_map[(34 - 7)]
      local OP_LT = op_map[(35 - 7)]
      local OP_LE = op_map[(33 - 4)]
      local OP_GT = op_map[(36 - 6)]
      local OP_GE = op_map[(32 - 1)]
      local OP_BAND = op_map[(36 - 4)]
      local OP_BOR = op_map[(42 - 9)]
      local OP_BXOR = op_map[(42 - 8)]
      local OP_SHL = op_map[(38 - 3)]
      local OP_SHR = op_map[(38 - 2)]
      local OP_UNM = op_map[(45 - 8)]
      local OP_NOT = op_map[(41 - 3)]
      local OP_LEN = op_map[(40 - 1)]
      local OP_BNOT = op_map[(43 - 3)]
      local bc_key_data = {162, 190, 158}
      local bc_key_mask = ((YJl0R6(172, 80) + seed) % 255) + 1
      local bc_keys = {}
      for i = 1, #bc_key_data do
          local mix = (bc_key_mask + (i - 1) * 13) % 255
          bc_keys[i] = YJl0R6(bc_key_data[i], mix)
        end
      local bc_key_count = #bc_keys
      local consts_data = {{4, Xzv3FhAt(12)}, {4, Xzv3FhAt(13)}, {4, Xzv3FhAt(14)}, {0, Xzv3FhAt(15)}, {3, Xzv3FhAt(16)}}
      local consts_key_enc = {140, 10, 194, 127, 246, 153, 208, 41, 25}
      local consts_key = {}
      local consts_cache = {}
      local consts_ready = {}
      local const_key_mask = ((YJl0R6(119, 113) + seed) % 255) + 1
      for i = 1, #consts_key_enc do
          local mix = (const_key_mask + (i - 1) * 11) % 255
          consts_key[i] = YJl0R6(consts_key_enc[i], mix)
        end
      local keyLen = #consts_key
      local const_byte = string[Xzv3FhAt(17)]
      local function v00t(i)
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
              out[j] = string[Xzv3FhAt(1)](v)
            end
          local s = table[Xzv3FhAt(4)](out)
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
      if type(getf) == Xzv3FhAt(2) then
          env = getf(1)
        end
      if type(env) ~= Xzv3FhAt(3) then
          env = _G
        end
      local pack = table[Xzv3FhAt(18)]
      if pack == nil then
          pack = function(...)
  return {[Xzv3FhAt(20)] = select(Xzv3FhAt(19), ...), ...}
end
        end
      local unpack = table[Xzv3FhAt(21)]
      if unpack == nil then
          local function unpack_fn(t, i, j)
              i = i or 1
              j = j or (t[Xzv3FhAt(20)] or #t)
              if i > j then
                  return
                end
              return t[i], unpack_fn(t, i + 1, j)
            end
          unpack = unpack_fn
        end
      local bc_parts = {string[Xzv3FhAt(1)](189, 198, 215, 232, 250, 10, 27, 44, 63, 78, 95, 112, 152, 146, 163, 180, 212, 214, 231, 248, 26, 26, 43, 60, 75, 94, 111, 128, 181, 162, 179, 196, 241, 230, 247, 8, 31, 42, 59, 76, 92, 110, 127, 144, 163, 178, 195, 212, 224, 246, 7, 24, 58, 58, 75, 92, 126, 126, 143, 160) .. string[Xzv3FhAt(1)](130, 194, 211, 228, 209, 6, 23, 40, 29, 74, 91, 108), string[Xzv3FhAt(1)](122, 142, 159, 176, 194, 210, 227, 244, 7, 22, 39, 56, 80, 90, 107, 124, 157, 158, 175, 192, 194, 226, 243, 4, 42, 38, 55, 72, 125, 106, 123, 140, 185, 174, 191, 208, 244, 242, 3, 20, 39, 54, 71, 88, 107, 122, 139, 156, 187, 190, 207, 224, 224, 2, 19, 36, 38, 70, 87, 104) .. string[Xzv3FhAt(1)](87, 138, 155, 172, 152, 206, 223, 240, 37, 18, 35, 52, 77, 86, 103, 120, 137, 154, 171, 188, 207, 222, 239, 0, 35, 34, 51, 68, 70, 102, 119, 136, 138, 170, 187, 204, 226, 238, 255, 16, 5, 50, 67, 84, 65, 118, 135, 152, 175, 186, 203, 220, 235, 254, 15, 32, 51, 66, 83, 100) .. string[Xzv3FhAt(1)](111, 134, 151, 168, 169, 202, 219, 236, 238, 14, 31, 48, 111, 82, 99, 116, 165, 150, 167, 184, 237, 218, 235, 252, 26, 30, 47, 64, 82, 98, 115, 132, 148, 166, 183, 200, 206, 234, 251, 12, 9, 46, 63, 80, 114, 114, 131, 148, 133, 182, 199, 216, 203, 250, 11, 28, 9, 62, 79, 96) .. string[Xzv3FhAt(1)](119, 130, 147, 164, 178, 198, 215, 232, 251, 10, 27, 44, 36, 78, 95, 112, 151, 146, 163, 180, 214, 214, 231, 248, 39, 26, 43, 60, 111, 94, 111, 128, 181, 162, 179, 196, 221, 230, 247, 8, 28, 42, 59, 76, 95, 110, 127, 144, 167, 178, 195, 212, 244, 246, 7, 24, 56, 58, 75, 92) .. string[Xzv3FhAt(1)](77, 126, 143, 160, 156, 194, 211, 228, 209, 6, 23, 40, 63, 74, 91, 108, 119, 142, 159, 176, 195, 210, 227, 244, 28, 22, 39, 56, 82, 90, 107, 124, 158, 158, 175, 192, 240, 226, 243, 4, 53, 38, 55, 72, 125, 106, 123, 140, 143, 174, 191, 208, 227, 242, 3, 20, 39, 54, 71, 88) .. string[Xzv3FhAt(1)](94, 122, 139, 156, 151, 190, 207, 224, 226, 2, 19, 36, 11, 70, 87, 104, 93, 138, 155, 172, 153, 206, 223, 240, 9, 18, 35, 52, 79, 86, 103, 120, 139, 154, 171, 188, 218, 222, 239, 0, 5, 34, 51, 68, 70, 102, 119, 136, 183, 170, 187, 204, 250, 238, 255, 16, 5, 50, 67, 84) .. string[Xzv3FhAt(1)](109, 118, 135, 152, 162, 186, 203, 220, 239, 254, 15, 32, 0, 66, 83, 100, 102, 134, 151, 168, 170, 202, 219, 236, 221, 14, 31, 48, 102, 82, 99, 116, 161, 150, 167, 184, 198, 218, 235, 252, 24, 30, 47, 64, 83, 98, 115, 132, 156, 166, 183, 200, 202, 234, 251, 12, 14, 46, 63, 80) .. string[Xzv3FhAt(1)](79, 114, 131, 148, 130, 182, 199, 216, 205, 250, 11, 28, 42, 62, 79, 96, 118, 130, 147, 164, 183, 198, 215, 232, 237, 10, 27, 44, 46, 78, 95, 112, 146, 146, 163, 180, 194, 214, 231, 248, 25, 26, 43, 60, 105, 94, 111, 128, 137, 162, 179, 196, 215, 230, 247, 8, 27, 42, 59, 76) .. string[Xzv3FhAt(1)](68, 110, 127, 144, 182, 178, 195, 212, 246, 246, 7, 24, 8, 58, 75, 92, 75, 126, 143, 160, 149, 194, 211, 228, 238, 6, 23, 40, 59, 74, 91, 108, 127, 142, 159, 176, 221, 210, 227, 244, 23, 22, 39, 56, 90, 90, 107, 124, 164, 158, 175, 192, 192, 226, 243, 4, 49, 38, 55, 72) .. string[Xzv3FhAt(1)](65, 106, 123, 140, 159, 174, 191, 208, 227, 242, 3, 20, 60, 54, 71, 88, 121, 122, 139, 156, 190, 190, 207, 224, 218, 2, 19, 36, 16, 70, 87, 104, 93, 138, 155, 172, 176, 206, 223, 240, 3, 18, 35, 52, 71, 86, 103, 120)}
      local bc_order = {1, 2}
      local bc_build = {}
      for i = 1, #bc_order do
          bc_build[i] = bc_parts[bc_order[i]]
        end
      local bc_str = table[Xzv3FhAt(4)](bc_build)
      local bc_key = ((108 + 165 + seed) % 255) + 1
      local bc_byte = string[Xzv3FhAt(17)]
      local function UKvguR(i)
          local b = bc_byte(bc_str, i)
          local mix = (bc_key + (i - 1) * 17) % 256
          return YJl0R6(b, mix)
        end
      local function QHaiwl(pos)
          local b1 = UKvguR(pos)
          local b2 = UKvguR(pos + 1)
          local b3 = UKvguR(pos + 2)
          local b4 = UKvguR(pos + 3)
          return b1 + b2 * 256 + b3 * 65536 + b4 * 16777216
        end
      local function ZWZi2om(pc)
          local base = (pc - 1) * 12 + 1
          local op = QHaiwl(base)
          local a = QHaiwl(base + 4)
          local b = QHaiwl(base + 8)
          return op, a, b
        end
      local pc = 1
      while true do
          local op, a, b = ZWZi2om(pc)
          local key = 0
          if bc_key_count > 0 then
              local idx = ((pc + seed - 1) % bc_key_count) + 1
              key = bc_keys[idx]
              op = YJl0R6(op, key)
              a = YJl0R6(a, key)
              b = YJl0R6(b, key)
            end
          if op == OP_NOP then
              pc = pc + 1
      elseif op == OP_PUSH_CONST then
              top = top + 1
              stack[top] = v00t(a)
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
              stack[top] = env[v00t(a)]
              pc = pc + 1
      elseif op == OP_SET_GLOBAL then
              env[v00t(a)] = stack[top]
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
              stack[top - 1] = math[Xzv3FhAt(5)](stack[top - 1] / stack[top])
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
              stack[top - 1] = lwV6Z(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BOR then
              stack[top - 1] = ov0t(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BXOR then
              stack[top - 1] = YJl0R6(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHL then
              stack[top - 1] = qfQ2KZOB(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHR then
              stack[top - 1] = SRd5lyo(stack[top - 1], stack[top])
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
              stack[top] = msWwZDbU(stack[top])
              pc = pc + 1
            else
              return
            end
        end
    end
end
print(demo(2, 6))