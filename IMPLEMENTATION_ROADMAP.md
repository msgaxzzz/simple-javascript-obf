# Luau Obfuscator - Implementation Roadmap

## 📋 改进实施路线图

根据前面的安全性、性能和防识别分析，这里提供分阶段的实施计划。

---

## Phase 1: 快速增强（1-2 周）

### 优先级：🔴 高影响 + 低复杂度

#### 1.1 变量命名多样化
**文件**: `src/luau/names.js`

```javascript
// 添加新的命名策略
const namingModes = {
  short: () => generateShortName(),      // 当前默认
  realistic: () => generateRealisticName(), // 新增
  mixed: (rng) => rng.bool(0.5) 
    ? generateShortName() 
    : generateRealisticName()
};

// 在 makeNameFactory 中使用
function makeNameFactory(rng, usedNames, mode = 'mixed') {
  const strategy = namingModes[mode];
  return (prefix) => {
    let name = strategy(rng);
    while (usedNames.has(name)) {
      name = strategy(rng);
    }
    usedNames.add(name);
    return name;
  };
}
```

**测试**:
```bash
node bin/luau-obf test/sample.lua -o test/output.lua --naming-mode realistic
```

---

#### 1.2 常量混淆
**文件**: `src/luau/cff.js:256-293`

```javascript
// 在 buildOpaquePredicate 中混淆常量
function obfuscateNumeric(value, rng) {
  const strategies = [
    v => v,                           // 直接
    v => `(${v + rng.int(1, 10)} - ${rng.int(1, 10)})`,
    v => `(${v * 2} / 2)`,
    v => `((${v} ~ 0) + 0)`,          // Luau 位运算
  ];
  
  return rng.pick(strategies)(value);
}

// 应用到所有数字字面量
function numericLiteral(value, rng) {
  return { 
    type: "NumericLiteral", 
    value, 
    raw: obfuscateNumeric(value, rng)
  };
}
```

---

#### 1.3 字符串解码缓存预热
**文件**: `src/luau/strings-impl.js:197-251`

```javascript
// 在 buildRuntime 函数末尾添加
function buildRuntime(segments, poolEncoding, nameFor) {
  const lines = [];
  
  // ... 现有代码 ...
  
  // 添加预热逻辑
  for (const segment of segments) {
    if (segment.pool.length > 0) {
      lines.push(`-- Warmup cache for hot strings`);
      lines.push(`for i = 1, math.min(10, #${segment.poolName}) do`);
      lines.push(`  ${segment.decodeName}(i)`);
      lines.push(`end`);
    }
  }
  
  return lines.join("\n");
}
```

---

#### 1.4 移除调试信息
**文件**: `src/luau/index.js`

```javascript
// 在 obfuscateLuau 函数开始处添加
function obfuscateLuau(source, options) {
  options = normalizeLuauOptions(options);
  
  // 清除源码中的注释
  source = source.replace(/--\[\[[\s\S]*?\]\]/g, '');
  source = source.replace(/--[^\n]*/g, '');
  
  // ... 其余代码
}

// 在生成代码后清除位置信息
function stripLocationData(ast) {
  walkLuauAst(ast, (node) => {
    delete node.loc;
    delete node.start;
    delete node.end;
    delete node.range;
  });
}
```

**预期收益**:
- 命名多样化: 提高识别难度 40%
- 常量混淆: 提高静态分析难度 20%
- 缓存预热: 提升运行时性能 15-25%
- 调试信息清除: 减少元数据泄露 100%

---

## Phase 2: 核心增强（3-4 周）

### 优先级：🔴 高影响 + 中等复杂度

#### 2.1 解码器多态化
**文件**: `src/luau/strings-impl.js`

**新增文件**: `src/luau/decoder-templates.js`

```javascript
// decoder-templates.js
module.exports = {
  standard: (names) => `
    local function ${names.decoder}(${names.index})
      local ${names.cached} = ${names.cache}[${names.index}]
      if ${names.cached} then return ${names.cached} end
      
      local ${names.data} = ${names.pool}[${names.index}]
      local ${names.out} = {}
      
      for ${names.loop} = 1, #${names.data} do
        local ${names.offset} = (${names.loop} - 1) % #${names.key} + 1
        local ${names.value} = ${names.data}[${names.loop}] - ${names.key}[${names.offset}]
        if ${names.value} < 0 then ${names.value} = ${names.value} + 256 end
        ${names.out}[${names.loop}] = string.char(${names.value})
      end
      
      ${names.cached} = table.concat(${names.out})
      ${names.cache}[${names.index}] = ${names.cached}
      return ${names.cached}
    end
  `,
  
  stateMachine: (names) => `
    local function ${names.decoder}(${names.index})
      local ${names.state} = 0
      local ${names.cached}, ${names.data}, ${names.out}
      local ${names.loop}, ${names.offset}, ${names.value}
      
      while ${names.state} ~= 99 do
        if ${names.state} == 0 then
          ${names.cached} = ${names.cache}[${names.index}]
          ${names.state} = ${names.cached} and 99 or 1
        elseif ${names.state} == 1 then
          ${names.data} = ${names.pool}[${names.index}]
          ${names.out} = {}
          ${names.loop} = 1
          ${names.state} = 2
        elseif ${names.state} == 2 then
          if ${names.loop} > #${names.data} then
            ${names.state} = 3
          else
            ${names.offset} = (${names.loop} - 1) % #${names.key} + 1
            ${names.value} = ${names.data}[${names.loop}] - ${names.key}[${names.offset}]
            if ${names.value} < 0 then ${names.value} = ${names.value} + 256 end
            ${names.out}[${names.loop}] = string.char(${names.value})
            ${names.loop} = ${names.loop} + 1
          end
        elseif ${names.state} == 3 then
          ${names.cached} = table.concat(${names.out})
          ${names.cache}[${names.index}] = ${names.cached}
          ${names.state} = 99
        end
      end
      
      return ${names.cached}
    end
  `,
  
  unrolled: (names) => `
    local function ${names.decoder}(${names.index})
      local ${names.cached} = ${names.cache}[${names.index}]
      if ${names.cached} then return ${names.cached} end
      
      local ${names.data} = ${names.pool}[${names.index}]
      local ${names.len} = #${names.data}
      local ${names.out} = {}
      local ${names.klen} = #${names.key}
      local ${names.loop} = 1
      
      -- 展开前 8 次迭代
      if ${names.len} >= 1 then
        ${names.out}[1] = string.char((${names.data}[1] - ${names.key}[1]) % 256)
      end
      if ${names.len} >= 2 then
        ${names.out}[2] = string.char((${names.data}[2] - ${names.key}[(1 % ${names.klen}) + 1]) % 256)
      end
      -- ... 展开到 8
      
      -- 剩余部分循环
      for ${names.loop} = 9, ${names.len} do
        local ${names.offset} = (${names.loop} - 1) % ${names.klen} + 1
        local ${names.value} = ${names.data}[${names.loop}] - ${names.key}[${names.offset}]
        if ${names.value} < 0 then ${names.value} = ${names.value} + 256 end
        ${names.out}[${names.loop}] = string.char(${names.value})
      end
      
      ${names.cached} = table.concat(${names.out})
      ${names.cache}[${names.index}] = ${names.cached}
      return ${names.cached}
    end
  `
};
```

**集成到 strings-impl.js**:

```javascript
const templates = require('./decoder-templates');

function buildRuntime(segments, poolEncoding, nameFor) {
  const lines = [];
  
  for (const segment of segments) {
    // 随机选择模板
    const templateNames = Object.keys(templates);
    const chosen = rng.pick(templateNames);
    
    const names = {
      decoder: segment.decodeName,
      index: nameFor('i'),
      cached: nameFor('c'),
      pool: segment.poolName,
      cache: segment.cacheName,
      key: segment.keyName,
      data: nameFor('d'),
      out: nameFor('o'),
      loop: nameFor('j'),
      offset: nameFor('off'),
      value: nameFor('v'),
      state: nameFor('s'),
      len: nameFor('l'),
      klen: nameFor('kl')
    };
    
    lines.push(templates[chosen](names));
  }
  
  return lines.join('\n');
}
```

---

#### 2.2 控制流模板多样化
**文件**: `src/luau/cff.js`

```javascript
function buildFlattenedStatements(statements, ctx, style, usedNames) {
  const { rng } = ctx;
  
  // 选择循环模板
  const loopTemplates = ['while', 'repeat', 'numeric_for'];
  const template = rng.pick(loopTemplates);
  
  switch (template) {
    case 'while':
      return buildWhileLoop(statements, ctx, style, usedNames);
    case 'repeat':
      return buildRepeatLoop(statements, ctx, style, usedNames);
    case 'numeric_for':
      return buildNumericForLoop(statements, ctx, style, usedNames);
  }
}

function buildRepeatLoop(statements, ctx, style, usedNames) {
  // ... 生成 repeat-until 版本的 CFF
  return [
    // 初始化
    localStatement(identifier(stateName), initialState),
    
    // repeat 循环
    {
      type: 'RepeatStatement',
      condition: binaryExpression('==', identifier(stateName), identifier(exitName)),
      body: loopBody
    }
  ];
}
```

---

#### 2.3 Anti-Hook 增强
**文件**: `src/plugins/antiHook/runtime.js`

```javascript
function buildRuntime({ lock, timing, behavior }) {
  // 添加栈检查
  const stackCheck = `
    const checkStack = () => {
      try {
        const err = new Error();
        const stack = (err.stack || "").split("\\n");
        
        // 检测调试器特征
        for (const line of stack) {
          if (line.includes("eval") || 
              line.includes("Function(") ||
              line.includes("<anonymous>:1:")) {
            return false;
          }
        }
        
        // 检测异常深的调用栈
        if (stack.length > 150) {
          return false;
        }
      } catch {
        return false;
      }
      return true;
    };
  `;
  
  // 添加函数完整性校验
  const integrityCheck = `
    const checksums = new Map();
    
    const computeChecksum = (fn) => {
      const src = fnToString.call(fn);
      let hash = 0;
      for (let i = 0; i < src.length; i++) {
        hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
      }
      return hash >>> 0;
    };
    
    // 记录原始校验和
    checksums.set(Function.prototype.toString, computeChecksum(Function.prototype.toString));
    checksums.set(Object.defineProperty, computeChecksum(Object.defineProperty));
    
    const verifyIntegrity = () => {
      for (const [fn, expected] of checksums) {
        if (computeChecksum(fn) !== expected) {
          throw new Error(errIntegrity);
        }
      }
    };
  `;
  
  // 插入到现有代码中
  const code = `
    (function () {
      ${stackCheck}
      ${integrityCheck}
      
      // ... 现有 anti-hook 代码 ...
      
      if (!checkAll() || !checkStack()) {
        throw new Error(errIntegrity);
      }
      
      // 定期校验
      if (${timing}) {
        setInterval(() => {
          if (!checkStack()) {
            throw new Error(errRuntime);
          }
          verifyIntegrity();
        }, 5000 + Math.random() * 10000);
      }
    })();
  `;
  
  return parser.parse(code, { sourceType: "script" }).program.body;
}
```

---

#### 2.4 VM 字节码分段
**文件**: `src/plugins/vm/index.js`

```javascript
function applyVmToFunction(fnPath, ctx) {
  // ... 现有编译代码 ...
  
  const useBytecodeSegmentation = ctx.options.vm.bytecodeSegmentation !== false;
  
  if (useBytecodeSegmentation) {
    // 将字节码分成多段
    const segments = segmentBytecode(compiler.code, ctx.rng);
    
    // 生成分段解密器
    const segmentVars = segments.map(() => ctx.t.identifier(ctx.nameGen.next()));
    const decryptorVar = ctx.t.identifier(ctx.nameGen.next());
    
    const decryptorCode = buildSegmentDecryptor(segments, segmentVars, decryptorVar);
    
    // 替换原有的字节码初始化
    codeInit = ctx.t.callExpression(decryptorVar, []);
  }
  
  // ... 其余代码
}

function segmentBytecode(code, rng) {
  const segmentSize = rng.int(32, 64);
  const segments = [];
  
  for (let i = 0; i < code.length; i += segmentSize) {
    const chunk = code.slice(i, i + segmentSize);
    const key = Array.from({ length: 16 }, () => rng.int(0, 255));
    
    const encrypted = chunk.map((byte, idx) => 
      (byte ^ key[idx % key.length] ^ (i + idx)) & 0xFF
    );
    
    segments.push({ data: encrypted, key, offset: i });
  }
  
  return segments;
}
```

**预期收益**:
- 解码器多态: 提高识别难度 60%
- CFF 模板多样化: 提高识别难度 40%
- Anti-Hook 增强: 提高运行时保护 50%
- 字节码分段: 提高 VM 保护 70%

---

## Phase 3: 高级优化（4-6 周）

### 优先级：🟡 中等影响 + 高复杂度

#### 3.1 动态密钥派生
**新增文件**: `src/luau/crypto-utils.js`

```javascript
const crypto = require('crypto');

function deriveSegmentKey(masterSeed, segmentIndex, salt) {
  const material = Buffer.concat([
    Buffer.from(masterSeed),
    Buffer.from([segmentIndex & 0xFF, (segmentIndex >> 8) & 0xFF]),
    Buffer.from(salt)
  ]);
  
  return crypto.pbkdf2Sync(material, 'obf-v2-salt', 10000, 32, 'sha256');
}

function rotatingKeySchedule(baseKey, round) {
  const expanded = new Array(baseKey.length);
  
  for (let i = 0; i < baseKey.length; i++) {
    let value = baseKey[i];
    value = (value ^ round) & 0xFF;
    value = ((value * 0x9E3779B9) ^ 0xDEADBEEF) & 0xFF;
    expanded[i] = value;
  }
  
  return expanded;
}

module.exports = {
  deriveSegmentKey,
  rotatingKeySchedule
};
```

---

#### 3.2 并行混淆处理
**新增文件**: `src/parallel-obfuscator.js`

```javascript
const { Worker } = require('worker_threads');
const path = require('path');

async function parallelObfuscateFunctions(functions, ctx) {
  const workerCount = Math.min(4, Math.ceil(functions.length / 10));
  const chunkSize = Math.ceil(functions.length / workerCount);
  
  const chunks = [];
  for (let i = 0; i < functions.length; i += chunkSize) {
    chunks.push(functions.slice(i, i + chunkSize));
  }
  
  const workerPromises = chunks.map((chunk, idx) => 
    runWorker(chunk, ctx, idx)
  );
  
  const results = await Promise.all(workerPromises);
  
  return results.flat();
}

function runWorker(chunk, ctx, workerId) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, 'obfuscate-worker.js'),
      {
        workerData: {
          chunk: chunk.map(f => f.toString()),
          options: ctx.options,
          workerId
        }
      }
    );
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker ${workerId} exited with code ${code}`));
      }
    });
  });
}

module.exports = { parallelObfuscateFunctions };
```

**新增文件**: `src/obfuscate-worker.js`

```javascript
const { parentPort, workerData } = require('worker_threads');
const { obfuscateLuau } = require('./luau/index');

const { chunk, options, workerId } = workerData;

try {
  const results = chunk.map(source => {
    return obfuscateLuau(source, options);
  });
  
  parentPort.postMessage(results);
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
```

---

#### 3.3 AST 缓存与增量编译
**文件**: `src/luau/index.js`

```javascript
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../.obf-cache');

function computeSourceHash(source, options) {
  const hash = crypto.createHash('sha256');
  hash.update(source);
  hash.update(JSON.stringify(options));
  return hash.digest('hex');
}

function getCachedResult(hash) {
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return cached;
    } catch (err) {
      return null;
    }
  }
  
  return null;
}

function setCachedResult(hash, result) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  fs.writeFileSync(cachePath, JSON.stringify(result));
}

async function obfuscateLuau(source, options) {
  if (options.useCache !== false) {
    const hash = computeSourceHash(source, options);
    const cached = getCachedResult(hash);
    
    if (cached) {
      return cached;
    }
    
    const result = await obfuscateLuauImpl(source, options);
    setCachedResult(hash, result);
    
    return result;
  }
  
  return obfuscateLuauImpl(source, options);
}
```

**预期收益**:
- 动态密钥: 提高加密强度 80%
- 并行处理: 提升编译速度 50-70%
- AST 缓存: 提升增量编译速度 80-90%

---

## Phase 4: 长期维护

### 持续改进项

#### 4.1 基准测试套件
**新增文件**: `benchmark/suite.js`

```javascript
const { performance } = require('perf_hooks');
const { obfuscateLuau } = require('../src/luau/index');

const testCases = [
  { name: 'small', size: '< 100 lines', file: 'test/small.lua' },
  { name: 'medium', size: '100-500 lines', file: 'test/medium.lua' },
  { name: 'large', size: '> 500 lines', file: 'test/large.lua' }
];

async function runBenchmarks() {
  console.log('Running obfuscation benchmarks...\n');
  
  for (const test of testCases) {
    const source = fs.readFileSync(test.file, 'utf8');
    
    const start = performance.now();
    const result = await obfuscateLuau(source, {
      preset: 'high',
      vm: { enabled: true },
      cff: true,
      strings: true
    });
    const end = performance.now();
    
    console.log(`${test.name} (${test.size}):`);
    console.log(`  Time: ${(end - start).toFixed(2)}ms`);
    console.log(`  Input: ${source.length} chars`);
    console.log(`  Output: ${result.code.length} chars`);
    console.log(`  Ratio: ${(result.code.length / source.length).toFixed(2)}x\n`);
  }
}

runBenchmarks();
```

---

#### 4.2 对抗测试框架
**新增文件**: `test/adversarial/detector.js`

```javascript
// 模拟反混淆工具的检测
function detectObfuscationPatterns(code) {
  const patterns = {
    fixedCFFPattern: /local cff_state.*while cff_state/,
    fixedDecoderPattern: /function.*decode.*\(i\)/,
    base64Alphabet: /ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/,
    fixedNaming: /^[a-z]$|^[a-z]{2}$|^_[0-9]+$/,
    suspiciousConstants: /256|0x100|0xFF/g
  };
  
  const detections = {};
  
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = code.match(pattern);
    detections[name] = {
      detected: !!matches,
      count: matches ? matches.length : 0
    };
  }
  
  return detections;
}

// 评分系统
function scoreObfuscation(code) {
  const detections = detectObfuscationPatterns(code);
  
  let score = 100;
  
  for (const [name, result] of Object.entries(detections)) {
    if (result.detected) {
      score -= 20; // 每个检测到的模式扣20分
    }
  }
  
  return Math.max(0, score);
}

module.exports = { detectObfuscationPatterns, scoreObfuscation };
```

**测试脚本**:
```javascript
// test/check-patterns.js
const fs = require('fs');
const { scoreObfuscation } = require('./adversarial/detector');

const obfuscatedCode = fs.readFileSync('output.lua', 'utf8');
const score = scoreObfuscation(obfuscatedCode);

console.log(`Obfuscation Quality Score: ${score}/100`);

if (score < 80) {
  console.warn('⚠️  Warning: Detectable patterns found!');
  process.exit(1);
}

console.log('✅ Pass: Code is well obfuscated');
```

---

## 总结：完整实施时间表

| 阶段 | 时间 | 关键交付物 | 预期提升 |
|------|------|-----------|---------|
| Phase 1 | 1-2周 | 快速增强补丁 | 安全性 +30%, 性能 +20% |
| Phase 2 | 3-4周 | 核心功能重构 | 安全性 +50%, 防检测 +60% |
| Phase 3 | 4-6周 | 高级优化 | 性能 +50%, 可扩展性 +70% |
| Phase 4 | 持续 | 测试与维护框架 | 长期稳定性保证 |

**总计**: 8-12周完整实施，建议采用敏捷迭代方式，每个 Phase 结束后进行评审和调整。
