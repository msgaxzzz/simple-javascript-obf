local z1EC = {{43, 160, 126}, {39, 146, 129}}
local EYe = {197, 49, 15, 103, 218, 69, 215, 143}
local eXzs = {}
local function aA9I(i)
  local cached = eXzs[i]
  if cached ~= nil then
      return cached
    end
  local data = z1EC[i]
  local out = {}
  local keyLen = #EYe
  for j = 1, #data do
      local idx = j - 1
      idx = idx % keyLen
      idx = idx + 1
      local v = data[j] - EYe[idx]
      if v < 0 then
          v = v + 256
        end
      out[j] = string.char(v)
    end
  local s = table.concat(out)
  eXzs[i] = s
  return s
end
local function demo(a, b)
  local sum = a + b
  local t = {[aA9I(1)] = sum, [aA9I(2)] = a * b}
  for k, v in pairs(t) do
      sum = sum + v
    end
  if sum > 10 then
      return t[aA9I(2)]
    end
  return sum
end
print(demo(2, 6))