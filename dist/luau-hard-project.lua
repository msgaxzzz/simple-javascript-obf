local function shallowClone(input)
  local out = {}
  for key, value in pairs(input) do
    out[key] = value
  end
  return out
end

local function stableHash(text, salt)
  local acc = salt or 17
  for i = 1, #text do
    local byte = string.byte(text, i)
    acc = (acc * 131 + byte + i * 7) % 2147483647
  end
  return acc
end

local function joinParts(parts, sep)
  local buffer = {}
  for i = 1, #parts do
    buffer[i] = tostring(parts[i])
  end
  return table.concat(buffer, sep or ",")
end

local function makeWindow(size)
  local values = {}
  local cursor = 1
  local length = 0

  local window = {}

  function window:push(value)
    values[cursor] = value
    cursor += 1
    if cursor > size then
      cursor = 1
    end
    if length < size then
      length += 1
    end
  end

  function window:snapshot()
    local out = {}
    for i = 1, length do
      out[i] = values[i]
    end
    table.sort(out, function(a, b)
      return a.name < b.name
    end)
    return out
  end

  return window
end

local function withRetry(label, limit, thunk, metrics)
  local lastError = "unknown"
  for attempt = 1, limit do
    metrics.attempts += 1
    local ok, result = pcall(thunk, attempt)
    if ok then
      return result
    end
    lastError = result
  end
  error(`step {label} failed after {limit} attempts: {lastError}`)
end

local Engine = {}
Engine.__index = Engine

function Engine.new(seed)
  local self = {
    seed = seed,
    nodes = {},
    order = {},
    cache = {},
    trace = {},
    metrics = {
      attempts = 0,
      retries = 0,
      checksum = 0,
    },
    window = makeWindow(6),
  }

  return setmetatable(self, Engine)
end

function Engine:register(name, deps, handler)
  self.nodes[name] = {
    name = name,
    deps = shallowClone(deps),
    handler = handler,
  }
  table.insert(self.order, name)
end

function Engine:_ready(node, state)
  for _, dep in ipairs(node.deps) do
    if state[dep] == nil then
      return false
    end
  end
  return true
end

function Engine:_resolve(node, state)
  local resolved = {}
  for _, dep in ipairs(node.deps) do
    resolved[dep] = state[dep]
  end
  return resolved
end

function Engine:_record(name, value)
  local digest = stableHash(name .. ":" .. tostring(value.score or value.value or value.digest), self.seed)
  self.metrics.checksum = (self.metrics.checksum + digest) % 2147483647
  table.insert(self.trace, {
    name = name,
    digest = digest,
    tag = value.tag or value.mode or "plain",
  })
  self.window:push({
    name = name,
    digest = digest,
  })
end

function Engine:run(payload)
  local state = {
    input = shallowClone(payload),
  }

  local pending = shallowClone(self.order)
  local progress = true

  repeat
    progress = false
    local nextPending = {}

    for _, name in ipairs(pending) do
      if state[name] ~= nil then
        continue
      end

      local node = self.nodes[name]
      if not self:_ready(node, state) then
        table.insert(nextPending, name)
        continue
      end

      local deps = self:_resolve(node, state)
      local value = withRetry(name, 3, function(attempt)
        if attempt > 1 then
          self.metrics.retries += 1
        end
        return node.handler(deps, payload, attempt, self)
      end, self.metrics)

      state[name] = value
      self:_record(name, value)
      progress = true
    end

    pending = nextPending
  until not progress

  if #pending > 0 then
    error("unresolved nodes: " .. joinParts(pending, ","))
  end

  local top = self.window:snapshot()
  local summary = {
    checksum = self.metrics.checksum,
    attempts = self.metrics.attempts,
    retries = self.metrics.retries,
    traceCount = #self.trace,
    hottest = top[1] and top[1].name or "none",
  }

  return state, summary
end

local engine = Engine.new(91357)

engine:register("normalize", { "input" }, function(deps, payload, attempt, runtime)
  if attempt == 1 and not runtime.cache.normalizeRetried then
    runtime.cache.normalizeRetried = true
    error("synthetic warmup fault")
  end

  local base = {}
  for _, item in ipairs(deps.input.items) do
    local weight = item.weight
    if payload.mode == "amplify" then
      weight *= 2
    elseif payload.mode == "trim" then
      weight = math.max(1, weight - 1)
    end

    table.insert(base, {
      id = item.id,
      label = string.upper(item.id),
      weight = weight,
      flags = {
        hot = weight >= 8,
        cold = weight <= 3,
      },
    })
  end

  return {
    value = #base,
    rows = base,
    mode = payload.mode,
  }
end)

engine:register("expand", { "normalize" }, function(deps, payload)
  local rows = {}
  for _, row in ipairs(deps.normalize.rows) do
    local samples = {}
    for i = 1, math.min(4, row.weight) do
      samples[i] = stableHash(row.id .. ":" .. tostring(i), payload.seed) % 97
    end
    table.insert(rows, {
      id = row.id,
      label = row.label,
      weight = row.weight,
      samples = samples,
      tag = row.flags.hot and "hot" or (row.flags.cold and "cold" or "warm"),
    })
  end

  return {
    rows = rows,
    digest = stableHash("expand:" .. tostring(#rows), payload.seed),
  }
end)

engine:register("rank", { "expand" }, function(deps, payload)
  local ranked = {}
  for _, row in ipairs(deps.expand.rows) do
    local score = row.weight * 10
    for _, sample in ipairs(row.samples) do
      score += sample
    end
    score += stableHash(row.id, payload.seed) % 23

    table.insert(ranked, {
      id = row.id,
      score = score,
      tag = row.tag,
    })
  end

  table.sort(ranked, function(a, b)
    if a.score == b.score then
      return a.id < b.id
    end
    return a.score > b.score
  end)

  return {
    ranked = ranked,
    top = ranked[1],
    digest = stableHash("rank:" .. tostring(ranked[1].score), payload.seed),
  }
end)

engine:register("report", { "rank", "expand" }, function(deps, payload)
  local lines = {}
  for index, row in ipairs(deps.rank.ranked) do
    local prefix = index <= 2 and "TOP" or "REST"
    local mood = row.tag == "hot" and "burst" or (row.tag == "cold" and "steady" or "mixed")
    lines[index] = `[${prefix}] {row.id} => {row.score} ({mood})`
  end

  local report = {
    lines = lines,
    digest = stableHash(table.concat(lines, "|"), payload.seed),
    value = #lines,
  }

  return report
end)

local payload = {
  seed = 77,
  mode = "amplify",
  items = {
    { id = "alpha", weight = 3 },
    { id = "beta", weight = 6 },
    { id = "gamma", weight = 4 },
    { id = "delta", weight = 8 },
  },
}

local state, summary = engine:run(payload)

print("== hard-project summary ==")
print(`checksum={summary.checksum} attempts={summary.attempts} retries={summary.retries}`)
print(`trace={summary.traceCount} hottest={summary.hottest}`)
for _, line in ipairs(state.report.lines) do
  print(line)
end
