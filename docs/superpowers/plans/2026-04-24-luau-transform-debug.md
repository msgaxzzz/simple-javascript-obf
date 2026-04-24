# Luau Transform Debug Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a developer-only Luau transform debug facility that records per-pass AST snapshots, change logs, and optional trace logs under `dist/.luau-debug/<run-id>/`.

**Architecture:** Add a Luau-only debug option in normalized options, create a shared debug recorder for run-level and pass-level artifacts, then wrap each Luau pass in `src/luau/index.js` so the pipeline can emit `meta.json`, `pass-order.json`, `before-ast.json`, `after-ast.json`, `changes.json`, and optional `trace.json`. Start with automatic AST snapshot and diff capture, then layer explicit trace hooks into `rename`, followed by `maskGlobals`, `strings`, and `vm`.

**Tech Stack:** Node.js, existing Luau AST/parser/printer modules in `src/luau/custom`, JSON file output via `fs`, existing test runner patterns in `test/luau-*.js`.

---

## File Structure

### New Files

- `src/luau/debug/index.js`
  - Run-level and pass-level debug recorder entry points.
- `src/luau/debug/serialize.js`
  - Stable AST serialization helpers and lightweight metadata helpers.
- `src/luau/debug/diff.js`
  - AST diff logic that produces baseline `changes.json`.
- `test/luau-debug.js`
  - Dedicated tests for Luau transform debug output.

### Modified Files

- `src/options.js`
  - Normalize and default `debugLuauTransforms`.
- `src/luau/index.js`
  - Create the Luau debug context and wrap each pass with recorder logic.
- `src/luau/rename.js`
  - Add optional `recordTrace()` hook calls for classification and skip logic.
- `src/luau/maskGlobals.js`
  - Add optional `recordTrace()` hook calls for high-value decisions.
- `src/luau/strings.js`
  - Add optional `recordTrace()` hook calls where string transforms decide to encode or skip.
- `src/luau/vm.js`
  - Add optional `recordTrace()` hook calls for virtualization and fallback decisions.
- `test/luau-rename.js`
  - Extend or reuse existing rename-heavy cases under debug mode when needed.
- `test/luau-vm.js`
  - Add VM debug hook coverage if needed.

### Existing Files To Read Before Editing

- `src/luau/index.js`
- `src/options.js`
- `src/luau/custom/parser.js`
- `src/luau/custom/printer.js`
- `src/luau/rename.js`
- `src/luau/maskGlobals.js`
- `src/luau/strings.js`
- `src/luau/vm.js`
- `test/luau-rename.js`
- `test/luau-vm.js`

## Task 1: Add Luau Debug Option Normalization

**Files:**
- Modify: `src/options.js`
- Test: `test/luau-debug.js`

- [ ] **Step 1: Write the failing option-normalization test**

```js
const assert = require("assert");
const { normalizeOptions } = require("../src/options");

function runNormalizeLuauDebugOptions() {
  const options = normalizeOptions({
    lang: "luau",
    debugLuauTransforms: {
      enabled: true,
      passes: ["rename", "vm"],
      outputDir: "dist/.luau-debug",
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
    },
  });

  assert.deepStrictEqual(options.debugLuauTransforms, {
    enabled: true,
    passes: ["rename", "vm"],
    outputDir: "dist/.luau-debug",
    includeAst: true,
    includeChanges: true,
    includeTrace: true,
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because `debugLuauTransforms` is missing or not normalized.

- [ ] **Step 3: Write the minimal normalization logic**

```js
const debugUserOptions = userOptions.debugLuauTransforms || {};

options.debugLuauTransforms = {
  enabled: Boolean(debugUserOptions.enabled),
  passes: Array.isArray(debugUserOptions.passes) ? debugUserOptions.passes.slice() : [],
  outputDir: typeof debugUserOptions.outputDir === "string"
    ? debugUserOptions.outputDir
    : "dist/.luau-debug",
  includeAst: debugUserOptions.includeAst !== false,
  includeChanges: debugUserOptions.includeChanges !== false,
  includeTrace: debugUserOptions.includeTrace !== false,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-debug.js`  
Expected: PASS for the normalization assertion.

- [ ] **Step 5: Commit**

```bash
git add src/options.js test/luau-debug.js
git commit -m "feat: normalize luau transform debug options"
```

## Task 2: Build the Luau Debug Recorder

**Files:**
- Create: `src/luau/debug/index.js`
- Create: `src/luau/debug/serialize.js`
- Test: `test/luau-debug.js`

- [ ] **Step 1: Write the failing recorder test**

```js
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createLuauDebugRecorder } = require("../src/luau/debug");

function runRecorderCreatesRunLayout() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "luau-debug-"));
  const recorder = createLuauDebugRecorder({
    enabled: true,
    outputDir: root,
    passes: [],
    includeAst: true,
    includeChanges: true,
    includeTrace: true,
    filename: "input.lua",
    seed: "debug-seed",
  });

  assert.ok(fs.existsSync(recorder.runDir));
  assert.ok(fs.existsSync(path.join(recorder.runDir, "meta.json")));
  assert.ok(fs.existsSync(path.join(recorder.runDir, "pass-order.json")));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because `createLuauDebugRecorder` does not exist.

- [ ] **Step 3: Write the recorder and serialization skeleton**

```js
// src/luau/debug/index.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { serializeAst, countAstNodes } = require("./serialize");

function makeRunId() {
  return `${Date.now()}-${process.pid}`;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function createLuauDebugRecorder(options) {
  if (!options || !options.enabled) {
    return null;
  }
  const runId = makeRunId();
  const runDir = path.join(options.outputDir, runId);
  const passOrder = [];

  fs.mkdirSync(runDir, { recursive: true });
  writeJson(path.join(runDir, "meta.json"), {
    runId,
    timestamp: new Date().toISOString(),
    inputFilename: options.filename,
    seed: options.seed,
    selectedPasses: options.passes,
  });
  writeJson(path.join(runDir, "pass-order.json"), passOrder);

  return {
    runId,
    runDir,
    beginPass(passName, index) {},
    endPass(passName, index) {},
    recordFailure(passName, index, error) {},
    writePassOrder() {},
  };
}

module.exports = {
  createLuauDebugRecorder,
};
```

```js
// src/luau/debug/serialize.js
function serializeAst(ast) {
  return JSON.parse(JSON.stringify(ast));
}

function countAstNodes(ast) {
  let count = 0;
  (function visit(value) {
    if (!value || typeof value !== "object") {
      return;
    }
    count += 1;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    Object.keys(value).forEach((key) => visit(value[key]));
  })(ast);
  return count;
}

module.exports = {
  serializeAst,
  countAstNodes,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-debug.js`  
Expected: PASS for recorder bootstrap assertions.

- [ ] **Step 5: Commit**

```bash
git add src/luau/debug/index.js src/luau/debug/serialize.js test/luau-debug.js
git commit -m "feat: add luau debug recorder scaffold"
```

## Task 3: Wrap Luau Passes and Emit Per-Pass AST Snapshots

**Files:**
- Modify: `src/luau/index.js`
- Modify: `src/luau/debug/index.js`
- Test: `test/luau-debug.js`

- [ ] **Step 1: Write the failing pass-wrapper test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { obfuscateLuau } = require("../src/luau");

async function runPassSnapshotsAreWritten() {
  const outputRoot = path.join("dist", ".luau-debug");
  await obfuscateLuau("local x = 1\nprint(x)\n", {
    lang: "luau",
    rename: true,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
    debugLuauTransforms: {
      enabled: true,
      passes: ["luau-entry", "luau-rename", "luau-maskGlobals"],
      outputDir: outputRoot,
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
    },
    seed: "debug-pass-snapshots",
  });

  const runDirs = fs.readdirSync(outputRoot).sort();
  const latest = path.join(outputRoot, runDirs[runDirs.length - 1]);
  assert.ok(fs.existsSync(path.join(latest, "01-luau-entry", "before-ast.json")));
  assert.ok(fs.existsSync(path.join(latest, "01-luau-entry", "after-ast.json")));
  assert.ok(fs.existsSync(path.join(latest, "pass-order.json")));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because `obfuscateLuau()` does not create pass directories or AST snapshots.

- [ ] **Step 3: Integrate recorder into `src/luau/index.js`**

```js
const { createLuauDebugRecorder } = require("./debug");

async function obfuscateLuau(source, options) {
  options = normalizeLuauOptions(options);
  const debugRecorder = createLuauDebugRecorder({
    ...options.debugLuauTransforms,
    filename: options.filename,
    seed: options.seed,
    luauOptions: options,
  });

  let passIndex = 0;
  const runLuauPlugin = (name, fn) => {
    passIndex += 1;
    const passHandle = debugRecorder
      ? debugRecorder.beginPass(name, passIndex, ast)
      : null;
    try {
      const result = fn();
      if (passHandle) {
        passHandle.complete(ast);
      }
      return result;
    } catch (err) {
      if (passHandle) {
        passHandle.fail(ast, err);
      }
      throw err;
    }
  };
}
```

```js
// src/luau/debug/index.js
beginPass(passName, index, ast) {
  const dir = path.join(runDir, `${String(index).padStart(2, "0")}-${passName}`);
  const beforeAst = serializeAst(ast);
  writeJson(path.join(dir, "before-ast.json"), beforeAst);
  const entry = { passName, index, directory: path.basename(dir), recorded: true, status: "running" };
  passOrder.push(entry);
  writeJson(path.join(runDir, "pass-order.json"), passOrder);

  return {
    complete(nextAst) {
      const afterAst = serializeAst(nextAst);
      writeJson(path.join(dir, "after-ast.json"), afterAst);
      writeJson(path.join(dir, "meta.json"), {
        passName,
        index,
        enabled: true,
        astNodeCountBefore: countAstNodes(beforeAst),
        astNodeCountAfter: countAstNodes(afterAst),
        traceHookEnabled: false,
      });
      entry.status = "completed";
      writeJson(path.join(runDir, "pass-order.json"), passOrder);
    },
    fail(nextAst, error) {
      const afterAst = serializeAst(nextAst);
      writeJson(path.join(dir, "after-ast.json"), afterAst);
      writeJson(path.join(dir, "error.json"), {
        message: error.message,
        stack: error.stack,
      });
      entry.status = "failed";
      writeJson(path.join(runDir, "pass-order.json"), passOrder);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-debug.js`  
Expected: PASS with per-pass directories and AST snapshot files.

- [ ] **Step 5: Commit**

```bash
git add src/luau/index.js src/luau/debug/index.js test/luau-debug.js
git commit -m "feat: write luau pass debug snapshots"
```

## Task 4: Generate `changes.json` from AST Diffs

**Files:**
- Create: `src/luau/debug/diff.js`
- Modify: `src/luau/debug/index.js`
- Test: `test/luau-debug.js`

- [ ] **Step 1: Write the failing change-diff test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runChangesJsonContainsRenameEvent(runDir) {
  const renameDir = fs.readdirSync(runDir).find((entry) => entry.endsWith("luau-rename"));
  const changes = JSON.parse(fs.readFileSync(path.join(runDir, renameDir, "changes.json"), "utf8"));

  assert.ok(Array.isArray(changes));
  assert.ok(changes.some((entry) => entry.pass === "luau-rename"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because `changes.json` is missing.

- [ ] **Step 3: Implement the minimal AST diff**

```js
// src/luau/debug/diff.js
function diffAst(before, after, passName, basePath = "root", out = []) {
  if (JSON.stringify(before) === JSON.stringify(after)) {
    return out;
  }
  if (!before || !after || typeof before !== "object" || typeof after !== "object") {
    out.push({
      id: `chg-${String(out.length + 1).padStart(6, "0")}`,
      pass: passName,
      kind: "replace-node",
      nodeType: (after && after.type) || (before && before.type) || typeof after,
      path: basePath,
      before: { summary: String(before), node: before },
      after: { summary: String(after), node: after },
    });
    return out;
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    diffAst(before[key], after[key], passName, `${basePath}.${key}`, out);
  }
  return out;
}

module.exports = {
  diffAst,
};
```

```js
// src/luau/debug/index.js
const { diffAst } = require("./diff");

const changes = diffAst(beforeAst, afterAst, passName);
writeJson(path.join(dir, "changes.json"), changes);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-debug.js`  
Expected: PASS with `changes.json` present and containing at least one entry for a mutating pass.

- [ ] **Step 5: Commit**

```bash
git add src/luau/debug/diff.js src/luau/debug/index.js test/luau-debug.js
git commit -m "feat: add luau debug ast diff output"
```

## Task 5: Add Explicit Trace Hooks to `rename`

**Files:**
- Modify: `src/luau/rename.js`
- Modify: `src/luau/debug/index.js`
- Test: `test/luau-debug.js`
- Test: `test/luau-rename.js`

- [ ] **Step 1: Write the failing trace-hook test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runRenameTraceIsWritten(runDir) {
  const renameDir = fs.readdirSync(runDir).find((entry) => entry.endsWith("luau-rename"));
  const traceFile = path.join(runDir, renameDir, "trace.json");
  const trace = JSON.parse(fs.readFileSync(traceFile, "utf8"));

  assert.ok(trace.some((entry) => entry.pass === "luau-rename"));
  assert.ok(trace.some((entry) => entry.phase === "isDynamicMapRecordAccess"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because `trace.json` is missing for rename.

- [ ] **Step 3: Add `recordTrace()` support to the recorder and pass context**

```js
// src/luau/debug/index.js
const trace = [];

return {
  recordTrace(event) {
    trace.push({
      id: `trace-${String(trace.length + 1).padStart(6, "0")}`,
      pass: passName,
      ...event,
    });
  },
  complete(nextAst) {
    if (trace.length) {
      writeJson(path.join(dir, "trace.json"), trace);
    }
  },
};
```

```js
// src/luau/index.js
const passHandle = debugRecorder ? debugRecorder.beginPass(name, passIndex, ast) : null;
const pluginCtx = passHandle ? { ...ctx, debugTrace: passHandle.recordTrace } : ctx;
runLuauPlugin("luau-rename", () => renameLuau(ast, { ...pluginCtx, options }));
```

```js
// src/luau/rename.js
function traceRename(ctx, event) {
  if (ctx && typeof ctx.debugTrace === "function") {
    ctx.debugTrace(event);
  }
}

traceRename(ctx, {
  phase: "isDynamicMapRecordAccess",
  decision: true,
  subject: basePath,
  context: {
    matchedSet: "dynamicIndexRecordBaseNames",
    scopeSafe: true,
  },
  reason: "dynamic index assignment to table constructor detected earlier",
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node test/luau-debug.js`  
Expected: PASS with `trace.json` generated for rename.

Run: `node test/luau-rename.js`  
Expected: PASS with existing rename behavior unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/luau/index.js src/luau/debug/index.js src/luau/rename.js test/luau-debug.js test/luau-rename.js
git commit -m "feat: add luau rename debug trace hooks"
```

## Task 6: Add Explicit Trace Hooks to `maskGlobals`, `strings`, and `vm`

**Files:**
- Modify: `src/luau/maskGlobals.js`
- Modify: `src/luau/strings.js`
- Modify: `src/luau/vm.js`
- Test: `test/luau-debug.js`
- Test: `test/luau-mask-globals.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Write the failing multi-pass trace test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runSelectedPassesWriteTrace(runDir) {
  const dirs = fs.readdirSync(runDir);
  const vmDir = dirs.find((entry) => entry.endsWith("luau-vm"));
  const maskDir = dirs.find((entry) => entry.endsWith("luau-maskGlobals"));
  const vmTrace = JSON.parse(fs.readFileSync(path.join(runDir, vmDir, "trace.json"), "utf8"));
  const maskTrace = JSON.parse(fs.readFileSync(path.join(runDir, maskDir, "trace.json"), "utf8"));

  assert.ok(vmTrace.length > 0);
  assert.ok(maskTrace.length > 0);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because these passes do not emit trace events yet.

- [ ] **Step 3: Add minimal hook points**

```js
// src/luau/maskGlobals.js
if (ctx && typeof ctx.debugTrace === "function") {
  ctx.debugTrace({
    phase: "mask-global",
    decision: "rewrite",
    subject: globalName,
    reason: "global access routed through masked environment table",
  });
}
```

```js
// src/luau/strings.js
if (ctx && typeof ctx.debugTrace === "function") {
  ctx.debugTrace({
    phase: "encode-string",
    decision: "rewrite",
    subject: literalValue,
    reason: "string literal selected by luau string encoding pass",
  });
}
```

```js
// src/luau/vm.js
if (ctx && typeof ctx.debugTrace === "function") {
  ctx.debugTrace({
    phase: "virtualize-luau",
    decision: "fallback",
    subject: functionName,
    reason: "virtualization path disabled or rejected for current node shape",
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node test/luau-debug.js`  
Expected: PASS with trace files for instrumented passes.

Run: `node test/luau-mask-globals.js`  
Expected: PASS.

Run: `node test/luau-vm.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/luau/maskGlobals.js src/luau/strings.js src/luau/vm.js test/luau-debug.js test/luau-mask-globals.js test/luau-vm.js
git commit -m "feat: add luau transform trace hooks"
```

## Task 7: Failure Handling and Whitelist Coverage

**Files:**
- Modify: `src/luau/debug/index.js`
- Modify: `src/luau/index.js`
- Test: `test/luau-debug.js`

- [ ] **Step 1: Write the failing failure-handling tests**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runFailureWritesErrorJson(runDir) {
  const failingDir = fs.readdirSync(runDir).find((entry) => entry.endsWith("luau-rename"));
  assert.ok(fs.existsSync(path.join(runDir, failingDir, "error.json")));
}

function runWhitelistOnlyRecordsSelectedPasses(runDir) {
  const dirs = fs.readdirSync(runDir).filter((entry) => /^\d+-/.test(entry));
  assert.deepStrictEqual(dirs, ["01-luau-rename"]);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-debug.js`  
Expected: FAIL because error metadata and whitelist filtering are incomplete.

- [ ] **Step 3: Implement failure and whitelist behavior**

```js
function shouldRecordPass(debugOptions, passName) {
  return !debugOptions.passes.length || debugOptions.passes.includes(passName);
}

beginPass(passName, index, ast) {
  if (!shouldRecordPass(options, passName)) {
    passOrder.push({
      passName,
      index,
      recorded: false,
      status: "completed",
    });
    writeJson(path.join(runDir, "pass-order.json"), passOrder);
    return null;
  }
}

fail(nextAst, error) {
  writeJson(path.join(dir, "error.json"), {
    passName,
    index,
    message: error.message,
    stack: error.stack,
  });
  entry.status = "failed";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node test/luau-debug.js`  
Expected: PASS for whitelist and failure behavior.

- [ ] **Step 5: Commit**

```bash
git add src/luau/debug/index.js src/luau/index.js test/luau-debug.js
git commit -m "feat: finalize luau debug failure handling"
```

## Task 8: Full Verification Sweep

**Files:**
- Modify: `test/luau-debug.js`
- Test: `test/luau-debug.js`
- Test: `test/luau-rename.js`
- Test: `test/luau-mask-globals.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Expand the final integration assertions**

```js
assert.ok(fs.existsSync(path.join(runDir, "meta.json")));
assert.ok(fs.existsSync(path.join(runDir, "pass-order.json")));
assert.ok(fs.existsSync(path.join(runDir, renameDir, "before-ast.json")));
assert.ok(fs.existsSync(path.join(runDir, renameDir, "after-ast.json")));
assert.ok(fs.existsSync(path.join(runDir, renameDir, "changes.json")));
assert.ok(fs.existsSync(path.join(runDir, renameDir, "trace.json")));
```

- [ ] **Step 2: Run the dedicated debug test suite**

Run: `node test/luau-debug.js`  
Expected: PASS.

- [ ] **Step 3: Run regression suites**

Run: `node test/luau-rename.js`  
Expected: PASS.

Run: `node test/luau-mask-globals.js`  
Expected: PASS.

Run: `node test/luau-vm.js`  
Expected: PASS.

- [ ] **Step 4: Verify generated debug output manually**

Run: `find dist/.luau-debug -maxdepth 2 -type f | sort | tail -n 40`  
Expected: visible `meta.json`, `pass-order.json`, pass directories, AST snapshots, change logs, and trace logs.

- [ ] **Step 5: Commit**

```bash
git add test/luau-debug.js
git commit -m "test: verify luau transform debug output"
```

## Self-Review

### Spec coverage

- Luau-only scope is implemented through Luau-specific option wiring and `src/luau/index.js` wrapper tasks.
- Run directory and per-pass directory structure is covered by Tasks 2 and 3.
- Full AST snapshots are covered by Task 3.
- Automatic `changes.json` generation is covered by Task 4.
- Explicit `trace.json` for `rename`, `maskGlobals`, `strings`, and `vm` is covered by Tasks 5 and 6.
- Whitelist behavior and failure behavior are covered by Task 7.
- Final end-to-end verification is covered by Task 8.

### Placeholder scan

- No `TODO`, `TBD`, or deferred placeholders remain.
- All tasks name exact files and commands.
- Code-changing steps include concrete code blocks.

### Type consistency

- Option name is consistently `debugLuauTransforms`.
- Recorder entry point is consistently `createLuauDebugRecorder`.
- Trace hook method is consistently `recordTrace`.
- Output files are consistently `meta.json`, `pass-order.json`, `before-ast.json`, `after-ast.json`, `changes.json`, `trace.json`, and `error.json`.
