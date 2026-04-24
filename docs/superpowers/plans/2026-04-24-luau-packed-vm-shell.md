# Luau Packed VM Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Luau-only `vm.shellStyle = "packed"` option that defaults to whole-program VM coverage when scope is unspecified, emits a packed loader shell, and still runs under `luau`.

**Architecture:** Reuse the existing Luau VM compiler as the semantic backend, then add a Luau packed-shell stage that wraps VM-bearing output in a packed loader/decoder/bootstrap shell. Normalize VM scope defaults only for packed mode and only when the caller did not explicitly set `include`, `all`, or `topLevel`.

**Tech Stack:** Node.js, existing custom Luau parser/printer, existing Luau VM backend, `luau` CLI for runtime verification.

---

### Task 1: Add packed-shell regression tests

**Files:**
- Modify: `test/luau-vm.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Write the failing test**

Add focused tests covering:

```js
async function runPackedShellWholeProgramDefault() {
  const source = [
    "local function demo(a, b)",
    "  local sum = a + b",
    "  return sum * 2",
    "end",
    "print(demo(2, 5))",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    dead: false,
    cff: false,
    wrap: true,
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
    seed: "packed-shell-whole-program",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "14");
  assert.ok(code.includes("load(") || code.includes("loadstring(") || code.includes("string.char"));
}

async function runPackedShellExplicitIncludeOverride() {
  const source = [
    "local function alpha()",
    "  return 4",
    "end",
    "local function beta()",
    "  return alpha() + 3",
    "end",
    "print(beta())",
  ].join("\n");

  const { code } = await obfuscateLuau(source, {
    lang: "luau",
    luauParser: "custom",
    rename: true,
    strings: true,
    dead: false,
    cff: false,
    wrap: true,
    vm: {
      enabled: true,
      shellStyle: "packed",
      include: ["beta"],
      topLevel: false,
    },
    seed: "packed-shell-explicit-include",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "7");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-vm.js`
Expected: FAIL because `shellStyle: "packed"` is not implemented yet and the output does not satisfy the new packed-shell expectations.

- [ ] **Step 3: Write minimal implementation**

Implement only the option plumbing and packed-shell generation required for these tests.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-vm.js`
Expected: `luau-vm: ok`

- [ ] **Step 5: Commit**

```bash
git add test/luau-vm.js src/options.js src/luau/index.js src/luau/vm.js
git commit -m "feat: add luau packed vm shell mode"
```

### Task 2: Normalize packed-shell VM options

**Files:**
- Modify: `src/options.js`
- Modify: `src/luau/index.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Write the failing test**

Use the packed-shell default/override tests from Task 1 as the failing proof that normalization is wrong or missing.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-vm.js`
Expected: FAIL at packed-shell cases.

- [ ] **Step 3: Write minimal implementation**

Add normalized VM fields and explicit-scope tracking, for example:

```js
options.vm = {
  enabled: Boolean(vmOptions.enabled),
  include: vmOptions.include || [],
  all: computedAll,
  topLevel: computedTopLevel,
  shellStyle: typeof vmOptions.shellStyle === "string" ? vmOptions.shellStyle.toLowerCase() : null,
  explicitScope: {
    include: Array.isArray(vmOptions.include),
    all: vmOptions.all !== undefined,
    topLevel: vmOptions.topLevel !== undefined,
  },
  // existing fields...
};
```

Then apply:

```js
const packedShell = options.lang === "luau" && options.vm.shellStyle === "packed";
if (packedShell && !options.vm.explicitScope.include && !options.vm.explicitScope.all && !options.vm.explicitScope.topLevel) {
  options.vm.all = true;
  options.vm.topLevel = true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-vm.js`
Expected: packed-shell coverage behavior now matches the tests.

- [ ] **Step 5: Commit**

```bash
git add src/options.js src/luau/index.js test/luau-vm.js
git commit -m "feat: normalize packed shell vm defaults"
```

### Task 3: Add Luau packed-shell emitter

**Files:**
- Modify: `src/luau/vm.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Write the failing test**

Reuse the packed-shell tests and ensure at least one checks for visible packed-loader traits while still executing successfully.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-vm.js`
Expected: FAIL because VM output is not wrapped in a packed loader shell.

- [ ] **Step 3: Write minimal implementation**

Add a helper that rewrites generated Luau VM output into a packed loader shape, for example:

```js
function buildPackedLuauShell(source, rng) {
  const bytes = Array.from(Buffer.from(source, "utf8"));
  const chunkVar = makePackedName(rng, "packed_chunks");
  const payload = buildPackedByteString(bytes, rng);
  return [
    "return(function()",
    `local ${chunkVar} = ${payload}`,
    "local function __obf_unpack() ... end",
    "local __obf_src = __obf_unpack()",
    "local __obf_loader = loadstring or load",
    "return __obf_loader(__obf_src)()",
    "end)()",
  ].join("");
}
```

Integrate it after VM source generation in the Luau VM path only when `shellStyle === "packed"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/luau-vm.js`
Expected: `luau-vm: ok`

- [ ] **Step 5: Commit**

```bash
git add src/luau/vm.js test/luau-vm.js
git commit -m "feat: emit packed luau vm shell wrapper"
```

### Task 4: Apply packed-shell mode to hard-project verification

**Files:**
- Modify: `test/generate-luau-hard-project.js`
- Test: `test/generate-luau-hard-project.js`
- Test: `dist/luau-hard-project.obf.lua`

- [ ] **Step 1: Write the failing test**

Update the hard-project generator config:

```js
vm: {
  enabled: true,
  shellStyle: "packed",
}
```

This should initially fail if packed-shell mode is still incomplete.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/generate-luau-hard-project.js`
Then run: `luau dist/luau-hard-project.obf.lua`
Expected: failure until packed mode is stable for the real project.

- [ ] **Step 3: Write minimal implementation**

Fix any packed-shell integration issues required for hard-project execution without weakening the new mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/generate-luau-hard-project.js`
Expected: writes the updated hard-project output

Run: `luau dist/luau-hard-project.obf.lua`
Expected:

```text
== hard-project summary ==
checksum=...
attempts=...
retries=...
trace=...
```

- [ ] **Step 5: Commit**

```bash
git add test/generate-luau-hard-project.js dist/luau-hard-project.obf.lua dist/luau-hard-project.obf.lua.map
git commit -m "test: verify packed vm shell on hard project"
```

### Task 5: Final verification

**Files:**
- Test: `test/luau-vm.js`
- Test: `test/generate-luau-hard-project.js`
- Test: `dist/luau-hard-project.obf.lua`

- [ ] **Step 1: Run the full VM regression**

Run: `node test/luau-vm.js`
Expected: `luau-vm: ok`

- [ ] **Step 2: Regenerate the hard-project output**

Run: `node test/generate-luau-hard-project.js`
Expected:

```text
hard project source -> /root/project/dist/luau-hard-project.lua
hard project obf -> /root/project/dist/luau-hard-project.obf.lua
hard project map -> /root/project/dist/luau-hard-project.obf.lua.map
```

- [ ] **Step 3: Run the obfuscated hard-project with Luau**

Run: `luau dist/luau-hard-project.obf.lua`
Expected: successful summary/report output with exit code `0`

- [ ] **Step 4: Commit**

```bash
git add src/options.js src/luau/index.js src/luau/vm.js test/luau-vm.js test/generate-luau-hard-project.js docs/superpowers/specs/2026-04-24-luau-packed-vm-shell-design.md docs/superpowers/plans/2026-04-24-luau-packed-vm-shell.md
git commit -m "feat: add packed luau vm shell mode"
```
