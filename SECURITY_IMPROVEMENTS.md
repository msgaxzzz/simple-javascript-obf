# Luau Obfuscator - Security Improvements

## 1. 加密密钥管理

### 当前问题
- 字符串加密密钥在编译时固定（`src/luau/strings-impl.js:322`）
- VM 运行时密钥可预测（`src/plugins/stringEncode/runtime.js:58`）
- 所有字符串共享同一密钥组

### 改进方案

#### 1.1 动态密钥派生
```javascript
// 为每个字符串段使用唯一派生密钥
function deriveSegmentKey(masterKey, segmentIndex, contextHash) {
  const material = Buffer.concat([
    Buffer.from(masterKey),
    Buffer.from([segmentIndex & 0xff, (segmentIndex >> 8) & 0xff]),
    Buffer.from(contextHash)
  ]);
  
  // 使用 HKDF 或 PBKDF2 派生
  return crypto.pbkdf2Sync(material, 'obf-salt', 10000, 32, 'sha256');
}
```

#### 1.2 混合密钥调度
```lua
-- 在运行时使用密钥调度算法
local function expandKey(baseKey, round)
  local expanded = {}
  for i = 1, #baseKey do
    local value = baseKey[i]
    value = (value ~ round) % 256
    value = ((value * 0x9e3779b9) ~ 0xdeadbeef) % 256
    expanded[i] = value
  end
  return expanded
end
```

## 2. Anti-Hook 运行时增强

### 当前问题
- 简单的 native code 检测容易绕过（`src/plugins/antiHook/runtime.js:27`）
- 计时检测阈值固定（50ms）容易适应
- 缺少运行时完整性校验

### 改进方案

#### 2.1 多层检测机制
```javascript
// 添加到 antiHook runtime
const checkStack = () => {
  try {
    const err = new Error();
    const stack = err.stack || "";
    // 检测调试器特征
    if (stack.includes("eval") || 
        stack.includes("debugger") ||
        stack.split("\n").length > 100) {
      return false;
    }
  } catch { return false; }
  return true;
};

// 内存占用异常检测
const checkMemory = () => {
  if (typeof performance === "undefined") return true;
  try {
    const mem = performance.memory;
    if (mem && mem.usedJSHeapSize > mem.jsHeapSizeLimit * 0.9) {
      return false; // 可能的内存注入
    }
  } catch {}
  return true;
};
```

#### 2.2 函数指纹验证
```javascript
// 在关键函数中嵌入校验和
const fnChecksum = (fn) => {
  const src = fnToString.call(fn);
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
};

// 存储原始校验和并定期验证
const originalChecksums = new Map();
originalChecksums.set(Function.prototype.toString, fnChecksum(Function.prototype.toString));

const verifyIntegrity = () => {
  for (const [fn, expected] of originalChecksums) {
    if (fnChecksum(fn) !== expected) {
      throw new Error(errIntegrity);
    }
  }
};
```

## 3. VM 字节码保护

### 当前问题
- 字节码数组直接暴露（`src/plugins/vm/index.js:405`）
- 常量池可被轻易提取
- 缺少运行时混淆

### 改进方案

#### 3.1 字节码分段加密
```javascript
// 将字节码分成多个加密段
function segmentBytecode(code, rng) {
  const segments = [];
  const segmentSize = rng.int(32, 64);
  
  for (let i = 0; i < code.length; i += segmentSize) {
    const chunk = code.slice(i, i + segmentSize);
    const key = rng.bytes(16);
    const encrypted = chunk.map((byte, idx) => 
      byte ^ key[idx % key.length] ^ (i + idx)
    );
    segments.push({ data: encrypted, key, offset: i });
  }
  
  return segments;
}
```

#### 3.2 运行时解密器
```javascript
// VM 运行时动态解密
const bytecodeCache = new Map();
const decryptSegment = (segment, pc) => {
  if (bytecodeCache.has(pc)) {
    return bytecodeCache.get(pc);
  }
  
  const { data, key, offset } = segment;
  const decrypted = data.map((byte, idx) => 
    byte ^ key[idx % key.length] ^ (offset + idx)
  );
  
  bytecodeCache.set(pc, decrypted);
  return decrypted;
};
```

#### 3.3 假指令注入增强
```javascript
// 当前假指令概率太低（15%）且容易识别
// 改进：动态调整假指令比例和复杂度
function injectDeceptiveOpcodes(code, rng) {
  const enhanced = [];
  const fakeRatio = rng.int(25, 40) / 100; // 25-40%
  
  for (let i = 0; i < code.length; i++) {
    enhanced.push(code[i]);
    
    if (rng.bool(fakeRatio)) {
      // 注入看起来合法的假指令序列
      const fakeSeq = generatePlausibleSequence(rng);
      enhanced.push(...fakeSeq);
    }
  }
  
  return enhanced;
}

function generatePlausibleSequence(rng) {
  // 创建看起来合理的指令序列（如 PUSH + POP）
  const patterns = [
    [OPCODES.PUSH_CONST, rng.int(0, 255), OPCODES.POP],
    [OPCODES.PUSH_LOCAL, rng.int(0, 10), OPCODES.POP],
    [OPCODES.DUP, OPCODES.POP]
  ];
  return rng.pick(patterns);
}
```

## 4. 字符串池隐藏

### 当前问题
- Base64 编码容易识别（`src/plugins/stringEncode/runtime.js:122`）
- 字符串池结构明显
- 解码函数特征固定

### 改进方案

#### 4.1 自定义编码表
```javascript
// 随机化 Base64 字母表
function shuffleAlphabet(rng) {
  const standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const shuffled = standard.split('');
  rng.shuffle(shuffled);
  return shuffled.join('');
}

// 在编码时使用
const customAlphabet = shuffleAlphabet(rng);
const customEncode = (data) => {
  // 使用 customAlphabet 而非标准 Base64
};
```

#### 4.2 多态解码器
```javascript
// 为每个字符串段生成不同的解码函数
function generatePolymorphicDecoder(segment, rng) {
  const templates = [
    // 模板 1: 循环解码
    `function(i) {
      local d = cache[i]
      if d then return d end
      local s = ""
      for j = 1, #pool[i] do
        s = s .. char((pool[i][j] - key[j % #key]) % 256)
      end
      cache[i] = s
      return s
    end`,
    
    // 模板 2: 递归解码
    `function(i, j)
      j = j or 1
      if j > #pool[i] then return "" end
      return char((pool[i][j] - key[j % #key]) % 256) .. decode(i, j + 1)
    end`,
    
    // 模板 3: 状态机解码
    `function(i)
      local state = 0
      local s = ""
      local j = 1
      while state ~= 2 do
        if state == 0 then
          if cache[i] then state = 2; s = cache[i]
          else state = 1 end
        elseif state == 1 then
          if j <= #pool[i] then
            s = s .. char((pool[i][j] - key[j % #key]) % 256)
            j = j + 1
          else
            cache[i] = s
            state = 2
          end
        end
      end
      return s
    end`
  ];
  
  return rng.pick(templates);
}
```

## 5. 控制流混淆增强

### 当前问题
- 状态值分布可预测（`src/luau/cff.js:14-34`）
- 跳转表结构固定
- 假状态转换太少（最多3个）

### 改进方案

#### 5.1 动态状态编码
```javascript
// 使用非线性编码函数
function createNonlinearCodec(rng) {
  const prime1 = [2, 3, 5, 7, 11, 13][rng.int(0, 5)];
  const prime2 = [17, 19, 23, 29, 31][rng.int(0, 4)];
  const offset = rng.int(100, 500);
  
  return {
    encode(value) {
      return (value * prime1 * prime2 + offset) % 65521;
    }
  };
}
```

#### 5.2 多层跳转混淆
```lua
-- 添加间接跳转层
local function resolveState(encoded)
  local decoded = (encoded - offset) / (prime1 * prime2)
  local indirect = indirectionTable[decoded]
  return actualStateTable[indirect]
end
```

#### 5.3 增加假状态密度
```javascript
// 当前最多 3 个假转换，改为动态比例
const fakeRatio = Math.min(0.6, count >= 10 ? rng.int(20, 60) / 100 : 0.15);
const fakeTransitionCount = Math.floor(nonTerminalIndices.length * fakeRatio);
```

## 6. Luau 特有保护

### 6.1 防止 `debug.getinfo` 检查
```lua
-- 在函数入口添加检查
local function protectFunction(fn)
  return function(...)
    local info = debug and debug.getinfo
    if info then
      local data = info(1, "S")
      if data and data.what == "Lua" then
        -- 正常执行
        return fn(...)
      end
    end
    error("invalid context")
  end
end
```

### 6.2 环境隔离
```lua
-- 创建受限环境
local function createSandbox()
  local env = {}
  local allowed = {
    "string", "table", "math", "next", "pairs", 
    "ipairs", "tonumber", "tostring", "type"
  }
  
  for _, name in ipairs(allowed) do
    env[name] = _G[name]
  end
  
  -- 禁止访问 debug/loadstring
  env.debug = nil
  env.loadstring = nil
  env.load = nil
  
  return env
end
```

### 6.3 防止字节码反编译
```lua
-- 检测 Luau 编译器痕迹
local function checkRuntime()
  local fn = function() end
  local info = debug.getinfo(fn, "S")
  
  -- 检测是否为预编译字节码
  if info.what ~= "Lua" then
    error("invalid runtime")
  end
end
```
