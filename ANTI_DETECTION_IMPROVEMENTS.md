# Luau Obfuscator - Anti-Detection Improvements

## 🎭 防识别改进建议

### 当前可识别特征分析

1. **固定的代码模式** - 混淆输出有明显特征
2. **可预测的命名规则** - 变量名模式固定
3. **运行时特征明显** - 解码器函数易识别
4. **元数据泄露** - 调试信息和源映射

---

## 1. 消除代码指纹特征

### 1.1 当前问题：固定模板易识别

**位置**: `src/luau/cff.js:165-250`

当前控制流展平使用固定结构：
```lua
-- 易识别模式
local cff_state = values[1]
local cff_exit = values[2]
while cff_state ~= cff_exit do
  local cff_slot = dispatch[cff_state]
  -- ...
end
```

**改进方案：模板多态化**

```javascript
// 生成多种等价但结构不同的模板
const cffTemplates = [
  // 模板 1: While 循环
  {
    loop: 'while',
    condition: 'state ~= exit',
    update: 'end'
  },
  
  // 模板 2: Repeat-until 循环
  {
    loop: 'repeat',
    condition: 'until state == exit',
    update: 'state = nextState'
  },
  
  // 模板 3: 数值 for 循环 (固定上限)
  {
    loop: 'for _ = 1, 99999 do',
    condition: 'if state == exit then break end',
    update: 'end'
  },
  
  // 模板 4: 递归模拟
  {
    loop: 'local function loop(s)',
    condition: 'if s == exit then return end',
    update: 'loop(nextState) end; loop(initial)'
  }
];

function selectTemplate(rng, complexity) {
  // 根据代码复杂度选择不同模板
  const template = rng.pick(cffTemplates);
  return buildWithTemplate(template);
}
```

### 1.2 打乱代码布局

```javascript
// 随机化局部变量声明顺序
function randomizeDeclarations(declarations, rng) {
  // 分析依赖关系
  const deps = analyzeDependencies(declarations);
  
  // 在保持依赖的前提下随机排序
  const independent = declarations.filter(d => !deps.has(d));
  rng.shuffle(independent);
  
  // 交错插入依赖声明
  return interleave(independent, deps);
}

// 插入无害的空操作
function insertNops(statements, rng) {
  const nops = [
    'local _ = 0',
    'local _ = _ or 0',
    'do end',
    'if true then end',
    'while false do end'
  ];
  
  const result = [];
  for (const stmt of statements) {
    result.push(stmt);
    if (rng.bool(0.15)) {
      result.push(rng.pick(nops));
    }
  }
  
  return result;
}
```

### 1.3 变异运算符表达式

```javascript
// 将简单运算变换为复杂等价形式
function mutateExpression(expr, rng) {
  const mutations = {
    // a + b => (a - (-b))
    '+': (a, b) => `(${a} - (-${b}))`,
    
    // a - b => (a + (-b))
    '-': (a, b) => `(${a} + (-${b}))`,
    
    // a * 2 => (a + a)
    '*2': (a) => `(${a} + ${a})`,
    
    // a / 2 => (a * 0.5)
    '/2': (a) => `(${a} * 0.5)`,
    
    // a == b => not (a ~= b)
    '==': (a, b) => `not (${a} ~= ${b})`,
    
    // a and b => (not (not a or not b))
    'and': (a, b) => `(not (not ${a} or not ${b}))`,
    
    // a or b => (not (not a and not b))
    'or': (a, b) => `(not (not ${a} and not ${b}))`
  };
  
  if (rng.bool(0.3)) {
    return applyMutation(expr, mutations, rng);
  }
  
  return expr;
}
```

---

## 2. 变量命名多样化

### 2.1 当前问题：命名模式固定

**位置**: `src/luau/names.js`

当前命名规则：
- 单字母或短字母组合
- 容易识别为混淆变量

**改进方案：多种命名风格**

```javascript
const namingStrategies = {
  // 策略 1: 仿真真实变量名
  realistic: {
    generate(rng) {
      const prefixes = ['get', 'set', 'is', 'has', 'check', 'handle', 'process'];
      const nouns = ['Data', 'Value', 'Item', 'Result', 'Info', 'State', 'Config'];
      const prefix = rng.pick(prefixes);
      const noun = rng.pick(nouns);
      return prefix + noun + rng.int(1, 99);
    }
  },
  
  // 策略 2: Unicode 同形字符
  homoglyph: {
    chars: {
      'a': ['а', 'ɑ', 'α'], // Latin a, Cyrillic a, Greek alpha
      'e': ['е', 'е', 'ℯ'],
      'o': ['о', 'ο', 'ο'],
      'c': ['с', 'ϲ'],
      'p': ['р', 'ρ']
    },
    generate(rng) {
      const base = 'local' + rng.int(1, 999);
      return base.split('').map(ch => {
        const variants = this.chars[ch];
        return variants ? rng.pick(variants) : ch;
      }).join('');
    }
  },
  
  // 策略 3: 零宽字符混入
  zeroWidth: {
    zwChars: ['​', '‌', '‍', '﻿'],
    generate(rng) {
      let name = 'v' + rng.int(1, 9999);
      // 在字符间随机插入零宽字符
      const chars = name.split('');
      const zw = rng.pick(this.zwChars);
      const pos = rng.int(1, chars.length - 1);
      chars.splice(pos, 0, zw);
      return chars.join('');
    }
  },
  
  // 策略 4: 上下文相关命名
  contextual: {
    generate(rng, context) {
      // 根据上下文生成合理名称
      if (context.isLoop) {
        return rng.pick(['i', 'j', 'k', 'idx', 'iter', 'counter']);
      }
      if (context.isTemp) {
        return rng.pick(['tmp', 'temp', 'buffer', 'cache']);
      }
      if (context.isCallback) {
        return rng.pick(['callback', 'handler', 'listener', 'fn']);
      }
      return 'var' + rng.int(1, 999);
    }
  }
};

// 混合使用多种策略
function generateName(rng, context) {
  const strategies = ['realistic', 'homoglyph', 'contextual'];
  const strategy = rng.pick(strategies);
  
  return namingStrategies[strategy].generate(rng, context);
}
```

### 2.2 避免模式聚集

```javascript
// 确保生成的名称不会出现明显模式
function diversifyNames(names, rng) {
  const patterns = detectPatterns(names);
  
  // 检测到模式时重新生成
  if (patterns.score > 0.7) {
    return names.map(() => generateName(rng));
  }
  
  return names;
}

function detectPatterns(names) {
  const prefixes = {};
  const lengths = {};
  
  for (const name of names) {
    const prefix = name.slice(0, 2);
    prefixes[prefix] = (prefixes[prefix] || 0) + 1;
    
    const len = name.length;
    lengths[len] = (lengths[len] || 0) + 1;
  }
  
  // 计算模式得分（0-1，越高越有规律）
  const maxPrefixCount = Math.max(...Object.values(prefixes));
  const maxLengthCount = Math.max(...Object.values(lengths));
  
  const prefixScore = maxPrefixCount / names.length;
  const lengthScore = maxLengthCount / names.length;
  
  return {
    score: (prefixScore + lengthScore) / 2,
    prefixes,
    lengths
  };
}
```

---

## 3. 运行时特征混淆

### 3.1 解码器多态

**位置**: `src/luau/strings-impl.js:250-270`

当前解码器函数特征明显。

**改进方案：每次生成不同解码器**

```lua
-- 模板 A: 标准循环
local function decode_A(i)
  local cached = cache[i]
  if cached then return cached end
  
  local data = pool[i]
  local out = {}
  local keyLen = #key
  
  for j = 1, #data do
    local offset = (j - 1) % keyLen + 1
    local value = data[j] - key[offset]
    if value < 0 then value = value + 256 end
    out[j] = string.char(value)
  end
  
  local str = table.concat(out)
  cache[i] = str
  return str
end

-- 模板 B: 状态机
local function decode_B(i)
  local state = 0
  local cached, data, out, j, keyLen, offset, value, str
  
  while true do
    if state == 0 then
      cached = cache[i]
      state = cached and 5 or 1
    elseif state == 1 then
      data = pool[i]
      out = {}
      keyLen = #key
      j = 1
      state = 2
    elseif state == 2 then
      if j > #data then
        state = 4
      else
        offset = (j - 1) % keyLen + 1
        value = data[j] - key[offset]
        state = 3
      end
    elseif state == 3 then
      if value < 0 then value = value + 256 end
      out[j] = string.char(value)
      j = j + 1
      state = 2
    elseif state == 4 then
      str = table.concat(out)
      cache[i] = str
      state = 5
    else
      return cached or str
    end
  end
end

-- 模板 C: 递归
local function decode_C(i, j, out)
  if j == nil then
    local cached = cache[i]
    if cached then return cached end
    return decode_C(i, 1, {})
  end
  
  local data = pool[i]
  if j > #data then
    local str = table.concat(out)
    cache[i] = str
    return str
  end
  
  local offset = (j - 1) % #key + 1
  local value = data[j] - key[offset]
  if value < 0 then value = value + 256 end
  out[j] = string.char(value)
  
  return decode_C(i, j + 1, out)
end

-- 模板 D: goto 跳转（Lua 5.2+）
local function decode_D(i)
  local cached = cache[i]
  if cached then goto done end
  
  ::start::
  local data = pool[i]
  local out = {}
  local keyLen = #key
  local j = 1
  
  ::loop::
  if j > #data then goto finish end
  
  local offset = (j - 1) % keyLen + 1
  local value = data[j] - key[offset]
  if value < 0 then value = value + 256 end
  out[j] = string.char(value)
  
  j = j + 1
  goto loop
  
  ::finish::
  cached = table.concat(out)
  cache[i] = cached
  
  ::done::
  return cached
end
```

**生成器代码：**

```javascript
function generatePolymorphicDecoder(segment, rng) {
  const templates = ['A', 'B', 'C', 'D'];
  const chosen = rng.pick(templates);
  
  return decoderTemplates[chosen]
    .replace(/POOL_NAME/g, segment.poolName)
    .replace(/KEY_NAME/g, segment.keyName)
    .replace(/CACHE_NAME/g, segment.cacheName)
    .replace(/DECODE_NAME/g, segment.decodeName);
}
```

### 3.2 隐藏常量特征

```lua
-- 不要直接写 256，使用计算表达式
local MOD = 0x100              -- 明显
local MOD = 2^8                -- 稍好
local MOD = (0xFF + 0x01)      -- 更好
local MOD = (16 * 16)          -- 最好

-- 不要直接写 0，使用表达式
local ZERO = 0                 -- 明显
local ZERO = (1 - 1)           -- 好
local ZERO = (#"" * 999)       -- 更好

-- 混淆魔数
local function obfuscateConstant(value, rng) {
  const ops = [
    v => `(${v + 1} - 1)`,
    v => `(${v * 2} / 2)`,
    v => `(${v} + 0)`,
    v => `((${v} * 3) / 3)`,
    v => `(${v} ~ 0)`,  -- Luau 位运算
    v => `(${v} | 0)`
  ];
  
  return rng.pick(ops)(value);
}
```

### 3.3 消除字符串字面量特征

```javascript
// 将明显的字符串转换为字符码
function hideString(str) {
  return `string.char(${Array.from(str).map(c => c.charCodeAt(0)).join(', ')})`;
}

// 示例
// "concat" => string.char(99, 111, 110, 99, 97, 116)
// "pack" => string.char(112, 97, 99, 107)
```

---

## 4. 消除元数据和调试信息

### 4.1 移除源位置信息

```javascript
// 清除 AST 节点中的位置信息
function stripLocationData(ast) {
  walk(ast, (node) => {
    delete node.loc;
    delete node.start;
    delete node.end;
    delete node.range;
    delete node.leadingComments;
    delete node.trailingComments;
  });
}
```

### 4.2 禁用 Source Map

```javascript
// 在生产环境中完全禁用
const options = {
  sourceMap: false,
  // 即使用户请求也不生成
};

// 移除源映射注释
function stripSourceMapComments(code) {
  return code.replace(/\/\/[@#]\s*sourceMappingURL=.*/g, '');
}
```

### 4.3 清除函数名称

```lua
-- 匿名化所有函数
local function_1 = function()  -- 不好，仍有模式
  -- ...
end

local _ = function()  -- 好
  -- ...
end

(function()  -- 最好
  -- ...
end)()
```

---

## 5. 防止静态分析

### 5.1 打破数据流分析

```lua
-- 引入不透明谓词打破控制流
local function opaquePredicate(x)
  -- 总是返回 true，但静态分析难以确定
  return (x * x) % 2 == (x % 2)
end

if opaquePredicate(state) and condition then
  -- 实际代码
end
```

### 5.2 使用动态代码构造

```lua
-- 通过字符串拼接构造函数名
local funcName = string.char(100, 101, 99, 111, 100, 101)  -- "decode"
local func = _ENV[funcName]

-- 动态表访问
local key1 = string.char(112, 111, 111, 108)  -- "pool"
local data = _ENV[key1]
```

### 5.3 混淆常量传播

```javascript
function breakConstantPropagation(value, rng) {
  // 将常量拆分为运行时计算
  const a = rng.int(1, 100);
  const b = value - a;
  
  return `(${a} + ${b})`;  // 静态分析难以追踪
}

// 示例：256 => (173 + 83)
```

---

## 6. 防止模式匹配攻击

### 6.1 熵池注入

```javascript
// 在关键位置注入随机数据
function injectEntropyPool(code, rng) {
  const entropy = Array.from(
    { length: rng.int(50, 200) },
    () => rng.int(0, 255)
  );
  
  return `
    local _entropy = { ${entropy.join(', ')} }
    ${code}
  `;
}
```

### 6.2 代码块随机化

```javascript
// 打乱独立代码块顺序
function shuffleIndependentBlocks(blocks, rng) {
  const deps = buildDependencyGraph(blocks);
  const independent = blocks.filter(b => deps.get(b).size === 0);
  
  rng.shuffle(independent);
  
  return topologicalSort([...independent, ...dependent]);
}
```

### 6.3 避免重复模式

```javascript
// 检测并消除重复代码模式
function detectAndBreakPatterns(code) {
  const patterns = findRepeatingPatterns(code, minLength=20);
  
  for (const pattern of patterns) {
    if (pattern.occurrences > 3) {
      // 变异每个出现位置
      code = mutatePattern(code, pattern);
    }
  }
  
  return code;
}
```

---

## 7. 特定工具对抗

### 7.1 对抗 Luau 反混淆工具

```lua
-- 检测常见反混淆工具特征
local function detectDeobfuscator()
  local suspicious = false
  
  -- 检测 debug 库
  if debug and debug.getinfo then
    local info = debug.getinfo(1, "S")
    if info.what ~= "Lua" then
      suspicious = true
    end
  end
  
  -- 检测异常高的递归深度
  local depth = 0
  local function check()
    depth = depth + 1
    if depth > 1000 then
      suspicious = true
      return
    end
    if depth < 100 then
      check()
    end
  end
  pcall(check)
  
  -- 检测运行时长异常
  local start = os.clock and os.clock() or 0
  for i = 1, 10000 do end
  local elapsed = (os.clock and os.clock() or 0) - start
  
  if elapsed > 0.1 then  -- 太慢，可能在调试
    suspicious = true
  end
  
  if suspicious then
    error("Runtime anomaly detected")
  end
end
```

### 7.2 对抗字符串提取器

```lua
-- 不将所有字符串集中存储
-- 分散到多个小池中
local pool1 = { ... }  -- 10 个字符串
local pool2 = { ... }  -- 12 个字符串
local pool3 = { ... }  -- 8 个字符串

-- 动态选择池
local function getPool(index)
  if index < 10 then return pool1
  elseif index < 22 then return pool2
  else return pool3 end
end
```

### 7.3 对抗控制流还原

```lua
-- 添加不可达但看似可达的代码
if opaquePredicate(x) then
  realCode()
else
  -- 这个分支永远不执行，但包含迷惑性代码
  fakeCode()
  -- 包含假的状态转换
  state = fakeState
end

-- 使用异常控制流
local function executeWithJumps()
  local success, result = pcall(function()
    -- 正常代码路径
    if someCondition then
      error("JUMP_TO_HANDLER_1")
    end
    -- ...
  end)
  
  if not success then
    if result == "JUMP_TO_HANDLER_1" then
      handler1()
    end
  end
end
```

---

## 8. 综合防检测策略

### 实施优先级

| 优先级 | 改进项 | 实施难度 | 效果 |
|--------|--------|----------|------|
| 🔴 高 | 变量命名多样化 | 中 | 高 |
| 🔴 高 | 解码器多态 | 中 | 高 |
| 🔴 高 | 消除固定模式 | 高 | 高 |
| 🟡 中 | 运算符变异 | 低 | 中 |
| 🟡 中 | 常量混淆 | 低 | 中 |
| 🟡 中 | 代码块随机化 | 中 | 中 |
| 🟢 低 | 零宽字符 | 低 | 低 |
| 🟢 低 | 熵池注入 | 低 | 低 |

### 推荐配置

```javascript
const antiDetectionOptions = {
  // 高优先级
  diverseNaming: true,
  polymorphicDecoders: true,
  templateRandomization: true,
  
  // 中优先级
  operatorMutation: true,
  constantObfuscation: true,
  blockShuffling: true,
  
  // 根据需求启用
  zeroWidthChars: false,  // 可能影响兼容性
  entropyInjection: false, // 增加代码体积
  
  // 检测对抗
  antiDeobfuscation: true,
  runtimeChecks: true
};
```
