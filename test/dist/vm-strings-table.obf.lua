local jNBS = {{117, 214, 178, 140}, {120, 227, 191, 125, 219, 220, 72, 11}, {134, 207, 179, 134, 204}, {117, 221, 191, 125, 200, 231}, {120, 218, 192, 137, 217}, {116, 230, 192, 140}, {116, 207, 191, 126}, {116, 221, 195}, {116, 220, 192, 142}, {126, 225, 185, 131, 205, 231}, {132, 225, 185, 131, 205, 231}, {130, 207, 180, 133}, {53}, {128}, {135, 220, 193, 123, 202, 222}, {116, 231, 197, 127}}
local cWmAu = {18, 110, 81, 26, 103, 115, 217, 157, 69, 99, 36}
local vaucifm = {}
local function peww_c6K(i)
  local cached = vaucifm[i]
  if cached ~= nil then
      return cached
    end
  local data = jNBS[i]
  local out = {}
  local keyLen = #cWmAu
  for j = 1, #data do
      local idx = j - 1
      idx = idx % keyLen
      idx = idx + 1
      local v = data[j] - cWmAu[idx]
      if v < 0 then
          v = v + 256
        end
      out[j] = string.char(v)
    end
  local s = table.concat(out)
  vaucifm[i] = s
  return s
end
local function demo(a, b)
  do
      local HNfIQ = 4294967296
      local xr4c
      do
          local k = 89
          local d = {9, 16, 27, 218, 217}
          local out = {}
          for i = 1, #d do
              out[i] = string[peww_c6K(1)]((d[i] + k) % 256)
            end
          local env
          local getf = getfenv
          if type(getf) == peww_c6K(2) then
              env = getf(1)
            end
          if type(env) ~= peww_c6K(3) then
              env = _G
            end
          xr4c = env[table[peww_c6K(4)](out)]
        end
      if xr4c == nil then
          local function DOQVIv(x)
              x = x % HNfIQ
              if x < 0 then
                  x = x + HNfIQ
                end
              return x
            end
          xr4c = {}
          function xr4c.band(a, b)
              a = DOQVIv(a)
              b = DOQVIv(b)
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
          function xr4c.bor(a, b)
              a = DOQVIv(a)
              b = DOQVIv(b)
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
          function xr4c.bxor(a, b)
              a = DOQVIv(a)
              b = DOQVIv(b)
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
          function xr4c.bnot(a)
              return HNfIQ - 1 - DOQVIv(a)
            end
          function xr4c.lshift(a, b)
              b = b % 32
              return (DOQVIv(a) * (2 ^ b)) % HNfIQ
            end
          function xr4c.rshift(a, b)
              b = b % 32
              return math[peww_c6K(5)](DOQVIv(a) / (2 ^ b))
            end
        end
      local function xalaX(hi, lo)
          return {hi, lo}
        end
      local function UCqbuPk(v)
          return {0, v % HNfIQ}
        end
      local function Y0Cy(v)
          return v[2]
        end
      local function mQBJ(a, b)
          local lo = a[2] + b[2]
          local carry = 0
          if lo >= HNfIQ then
              lo = lo - HNfIQ
              carry = 1
            end
          local hi = (a[1] + b[1] + carry) % HNfIQ
          return {hi, lo}
        end
      local function NkBkYqFf(a, m)
          return ((a[1] % m) * (HNfIQ % m) + (a[2] % m)) % m
        end
      local function gOMy0c(a)
          return ((a[1] % 255) * 1 + (a[2] % 255)) % 255
        end
      local function haEkD(a, b)
          return {xr4c[peww_c6K(6)](a[1], b[1]), xr4c[peww_c6K(6)](a[2], b[2])}
        end
      local function kPAf2(a, b)
          return {xr4c[peww_c6K(7)](a[1], b[1]), xr4c[peww_c6K(7)](a[2], b[2])}
        end
      local function MLp2Vfvq(a, b)
          return {xr4c[peww_c6K(8)](a[1], b[1]), xr4c[peww_c6K(8)](a[2], b[2])}
        end
      local function y6duW(a)
          return {xr4c[peww_c6K(9)](a[1]), xr4c[peww_c6K(9)](a[2])}
        end
      local function Z5mzq(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local hi = xr4c[peww_c6K(10)](a[2], b - 32)
              return {hi, 0}
            end
          local hi = xr4c[peww_c6K(8)](xr4c[peww_c6K(10)](a[1], b), xr4c[peww_c6K(11)](a[2], 32 - b))
          local lo = xr4c[peww_c6K(10)](a[2], b)
          return {hi, lo}
        end
      local function caP9D7(a, b)
          b = b % 64
          if b == 0 then
              return {a[1], a[2]}
            end
          if b >= 32 then
              local lo = xr4c[peww_c6K(11)](a[1], b - 32)
              return {0, lo}
            end
          local hi = xr4c[peww_c6K(11)](a[1], b)
          local lo = xr4c[peww_c6K(8)](xr4c[peww_c6K(11)](a[2], b), xr4c[peww_c6K(10)](a[1], 32 - b))
          return {hi, lo}
        end
      local function ADat3(a, b)
          return xr4c[peww_c6K(6)](a, b)
        end
      local function NNJ6NN(a, b)
          return xr4c[peww_c6K(7)](a, b)
        end
      local function Z2xMK(a, b)
          return xr4c[peww_c6K(8)](a, b)
        end
      local function KXHsrN(a)
          return xr4c[peww_c6K(9)](a)
        end
      local function kgdf(a, b)
          return xr4c[peww_c6K(10)](a, b)
        end
      local function SJT7(a, b)
          return xr4c[peww_c6K(11)](a, b)
        end
      local seed_pieces = {118, 160}
      local seed = UCqbuPk(0)
      for i = 1, #seed_pieces do
          local v = seed_pieces[i]
          local v64 = UCqbuPk(v)
          seed = haEkD(mQBJ(seed, v64), kPAf2(Z5mzq(v64, (i - 1) % 3), UCqbuPk(0xff)))
          seed = kPAf2(seed, UCqbuPk(0xff))
        end
      seed = gOMy0c(mQBJ(seed, UCqbuPk(55 + 5)))
      local op_data = {227, 219, 36, 11, 20, 2, 61, 32, 44, 47, 42, 87, 93, 64, 87, 67, 68, 78, 124, 125, 97, 135, 165, 156, 184, 131, 176, 160, 184, 166, 204, 192, 198, 220, 243, 254, 243, 252, 219, 14}
      local op_key = ((58 + 154 + seed) % 255) + 1
      local op_map = {}
      for i = 1, #op_data do
          local mix = (op_key + (i - 1) * 7) % 255
          op_map[i] = ADat3(op_data[i], mix)
        end
      local OP_NOP = op_map[(2 - 1)]
      local OP_PUSH_CONST = op_map[(10 - 8)]
      local OP_PUSH_LOCAL = op_map[(6 - 3)]
      local OP_SET_LOCAL = op_map[(7 - 3)]
      local OP_PUSH_GLOBAL = op_map[(7 - 2)]
      local OP_SET_GLOBAL = op_map[(13 - 7)]
      local OP_NEW_TABLE = op_map[(14 - 7)]
      local OP_DUP = op_map[(9 - 1)]
      local OP_SWAP = op_map[(13 - 4)]
      local OP_POP = op_map[(14 - 4)]
      local OP_GET_TABLE = op_map[(13 - 2)]
      local OP_SET_TABLE = op_map[(17 - 5)]
      local OP_CALL = op_map[(21 - 8)]
      local OP_RETURN = op_map[(19 - 5)]
      local OP_JMP = op_map[(16 - 1)]
      local OP_JMP_IF_FALSE = op_map[(20 - 4)]
      local OP_JMP_IF_TRUE = op_map[(21 - 4)]
      local OP_ADD = op_map[(23 - 5)]
      local OP_SUB = op_map[(27 - 8)]
      local OP_MUL = op_map[(28 - 8)]
      local OP_DIV = op_map[(28 - 7)]
      local OP_IDIV = op_map[(29 - 7)]
      local OP_MOD = op_map[(32 - 9)]
      local OP_POW = op_map[(30 - 6)]
      local OP_CONCAT = op_map[(29 - 4)]
      local OP_EQ = op_map[(35 - 9)]
      local OP_NE = op_map[(31 - 4)]
      local OP_LT = op_map[(31 - 3)]
      local OP_LE = op_map[(30 - 1)]
      local OP_GT = op_map[(33 - 3)]
      local OP_GE = op_map[(33 - 2)]
      local OP_BAND = op_map[(37 - 5)]
      local OP_BOR = op_map[(40 - 7)]
      local OP_BXOR = op_map[(37 - 3)]
      local OP_SHL = op_map[(39 - 4)]
      local OP_SHR = op_map[(38 - 2)]
      local OP_UNM = op_map[(44 - 7)]
      local OP_NOT = op_map[(43 - 5)]
      local OP_LEN = op_map[(40 - 1)]
      local OP_BNOT = op_map[(42 - 2)]
      local bc_key_data = {25, 127, 17, 59}
      local bc_key_mask = ((ADat3(90, 196) + seed) % 255) + 1
      local bc_keys = {}
      for i = 1, #bc_key_data do
          local mix = (bc_key_mask + (i - 1) * 13) % 255
          bc_keys[i] = ADat3(bc_key_data[i], mix)
        end
      local bc_key_count = #bc_keys
      local consts_data = {{4, {122, 208, 209}}, {4, {118, 194, 212}}, {4, {132, 194, 203, 199, 204}}, {0, {}}, {3, {69, 145}}}
      local consts_key_enc = {68, 58, 4, 36, 37, 63, 189, 217, 155, 144, 4, 236, 55}
      local consts_key = {}
      local consts_cache = {}
      local consts_ready = {}
      local const_key_mask = ((ADat3(20, 38) + seed) % 255) + 1
      for i = 1, #consts_key_enc do
          local mix = (const_key_mask + (i - 1) * 11) % 255
          consts_key[i] = ADat3(consts_key_enc[i], mix)
        end
      local keyLen = #consts_key
      local function gsfVN(i)
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
              local v = data[j] - consts_key[idx]
              if v < 0 then
                  v = v + 256
                end
              out[j] = string[peww_c6K(1)](v)
            end
          local s = table[peww_c6K(4)](out)
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
      if type(getf) == peww_c6K(2) then
          env = getf(1)
        end
      if type(env) ~= peww_c6K(3) then
          env = _G
        end
      local pack = table[peww_c6K(12)]
      if pack == nil then
          pack = function(...)
  return {[peww_c6K(14)] = select(peww_c6K(13), ...), ...}
end
        end
      local unpack = table[peww_c6K(15)]
      if unpack == nil then
          local function unpack_fn(t, i, j)
              i = i or 1
              j = j or (t[peww_c6K(14)] or #t)
              if i > j then
                  return
                end
              return t[i], unpack_fn(t, i + 1, j)
            end
          unpack = unpack_fn
        end
      local bc_parts = {string[peww_c6K(1)](25, 155, 172, 189, 121, 223, 240, 1, 164, 35, 52, 69, 180, 103, 120, 137, 95, 171, 188, 205, 25, 239, 0, 17, 222, 51, 68, 85, 190, 119, 136, 153, 114, 187, 204, 221, 72, 255, 16, 33, 148, 67, 84, 101, 211, 135, 152, 169, 44, 203, 220, 237, 72, 15, 32, 49, 244, 83, 100, 117) .. string[peww_c6K(1)](69, 151, 168, 185, 13, 219, 236, 253, 201, 31, 48, 65, 168, 99, 116, 133, 79, 167, 184, 201, 2, 235, 252, 13, 158, 47, 64, 81, 196, 115, 132, 149, 3, 183, 200, 217, 75, 251, 12, 29, 152, 63, 80, 97, 196, 131, 148, 165, 117, 199, 216, 233, 61, 11, 28, 45, 249, 79, 96, 113) .. string[peww_c6K(1)](120, 147, 164, 181, 28, 215, 232, 249, 210, 27, 44, 61, 206, 95, 112, 129, 54, 163, 180, 197, 115, 231, 248, 9, 137, 43, 60, 77, 234, 111, 128, 145, 20, 179, 196, 213, 36, 247, 8, 25, 237, 59, 76, 93, 169, 127, 144, 161, 125, 195, 212, 229, 46, 7, 24, 41, 226, 75, 92, 109) .. string[peww_c6K(1)](216, 143, 160, 177, 99, 211, 228, 245, 163, 23, 40, 57, 231, 91, 108, 125, 59, 159, 176, 193, 100, 227, 244, 5, 244, 39, 56, 73, 153, 107, 124, 141, 89, 175, 192, 209, 32, 243, 4, 21, 255, 55, 72, 89, 177, 123, 140, 157, 8, 191, 208, 225, 80, 3, 20, 37, 147, 71, 88, 105) .. string[peww_c6K(1)](207, 139, 156, 173, 14, 207, 224, 241, 180, 19, 36, 53, 130, 87, 104, 121, 72, 155, 172, 189, 9, 223, 240, 1, 239, 35, 52, 69, 139, 103, 120, 137, 66, 171, 188, 205, 94, 239, 0, 17, 129, 51, 68, 85, 195, 119, 136, 153, 57, 187, 204, 221, 95, 255, 16, 33, 132, 67, 84, 101) .. string[peww_c6K(1)](171, 135, 152, 169, 127, 203, 220, 237, 59, 15, 32, 49, 153, 83, 100, 117, 87, 151, 168, 185, 18, 219, 236, 253, 168, 31, 48, 65, 255, 99, 116, 133, 51, 167, 184, 201, 73, 235, 252, 13, 160, 47, 64, 81, 212, 115, 132, 149, 67, 183, 200, 217, 41, 251, 12, 29, 233, 63, 80, 97) .. string[peww_c6K(1)](139, 131, 148, 165, 110, 199, 216, 233, 34, 11, 28, 45, 188, 79, 96, 113, 14, 147, 164, 181, 99, 215, 232, 249, 161, 27, 44, 61, 248, 95, 112, 129, 36, 163, 180, 197, 52, 231, 248, 9, 213, 43, 60, 77, 153, 111, 128, 145, 121, 179, 196, 213, 57, 247, 8, 25, 242, 59, 76, 93) .. string[peww_c6K(1)](238, 127, 144, 161, 20, 195, 212, 229, 83, 7, 24, 41, 169, 75, 92, 109, 193, 143, 160, 177, 116, 211, 228, 245, 229, 23, 40, 57, 141, 91, 108, 125, 73, 159, 176, 193, 9, 227, 244, 5, 205, 39, 56, 73, 130, 107, 124, 141, 57, 175, 192, 209, 80, 243, 4, 21, 131, 55, 72, 89) .. string[peww_c6K(1)](193, 123, 140, 157, 24, 191, 208, 225, 68, 3, 20, 37), string[peww_c6K(1)](212, 71, 88, 105, 190, 139, 156, 173, 121, 207, 224, 241, 248, 19, 36, 53, 155, 87, 104, 121, 82, 155, 172, 189, 115, 223, 240, 1, 183, 35, 52, 69, 243, 103, 120, 137, 51, 171, 188, 205, 92, 239, 0, 17, 148, 51, 68, 85, 188, 119, 136, 153, 109, 187, 204, 221, 41, 255, 16, 33) .. string[peww_c6K(1)](207, 67, 84, 101, 170, 135, 152, 169, 98, 203, 220, 237, 121, 15, 32, 49, 229, 83, 100, 117, 35, 151, 168, 185, 111, 219, 236, 253, 184, 31, 48, 65, 228, 99, 116, 133, 95, 167, 184, 201, 28, 235, 252, 13, 217, 47, 64, 81, 184, 115, 132, 149, 75, 183, 200, 217, 50, 251, 12, 29) .. string[peww_c6K(1)](150, 63, 80, 97, 215, 131, 148, 165, 19, 199, 216, 233, 105, 11, 28, 45, 139, 79, 96, 113, 52, 147, 164, 181, 15, 215, 232, 249, 204, 27, 44, 61, 137, 95, 112, 129, 68, 163, 180, 197, 14, 231, 248, 9, 194, 43, 60, 77)}
      local bc_order = {1, 2}
      local bc_build = {}
      for i = 1, #bc_order do
          bc_build[i] = bc_parts[bc_order[i]]
        end
      local bc_str = table[peww_c6K(4)](bc_build)
      local bc_key = ((105 + 3 + seed) % 255) + 1
      local bc_byte = string[peww_c6K(16)]
      local function IwmPFExQ(i)
          local b = bc_byte(bc_str, i)
          local mix = (bc_key + (i - 1) * 17) % 256
          return ADat3(b, mix)
        end
      local function T6SpT(pos)
          local b1 = IwmPFExQ(pos)
          local b2 = IwmPFExQ(pos + 1)
          local b3 = IwmPFExQ(pos + 2)
          local b4 = IwmPFExQ(pos + 3)
          return b1 + b2 * 256 + b3 * 65536 + b4 * 16777216
        end
      local function MDR7yt(pc)
          local base = (pc - 1) * 12 + 1
          local op = T6SpT(base)
          local a = T6SpT(base + 4)
          local b = T6SpT(base + 8)
          return op, a, b
        end
      local pc = 1
      while true do
          local op, a, b = MDR7yt(pc)
          local key = 0
          if bc_key_count > 0 then
              local idx = ((pc + seed - 1) % bc_key_count) + 1
              key = bc_keys[idx]
              op = ADat3(op, key)
              a = ADat3(a, key)
              b = ADat3(b, key)
            end
          if op == OP_NOP then
              pc = pc + 1
      elseif op == OP_PUSH_CONST then
              top = top + 1
              stack[top] = gsfVN(a)
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
              stack[top] = env[gsfVN(a)]
              pc = pc + 1
      elseif op == OP_SET_GLOBAL then
              env[gsfVN(a)] = stack[top]
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
              stack[top - 1] = math[peww_c6K(5)](stack[top - 1] / stack[top])
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
              stack[top - 1] = NNJ6NN(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BOR then
              stack[top - 1] = Z2xMK(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_BXOR then
              stack[top - 1] = ADat3(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHL then
              stack[top - 1] = kgdf(stack[top - 1], stack[top])
              stack[top] = nil
              top = top - 1
              pc = pc + 1
      elseif op == OP_SHR then
              stack[top - 1] = SJT7(stack[top - 1], stack[top])
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
              stack[top] = KXHsrN(stack[top])
              pc = pc + 1
            else
              return
            end
        end
    end
end
print(demo(2, 6))