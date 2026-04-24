# Luau Packed Payload Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Luau `vm.shellStyle = "packed"` hide the VM-bearing body behind a compact Base-N payload shell while randomizing VM helper aliases and preserving hard-project execution.

**Architecture:** Keep the current Luau VM pipeline as the semantic core, then replace the final plaintext packed wrapper in `src/luau/index.js` with a compact payload encoder plus small Luau decoder. Randomize VM helper aliases inside `src/luau/vm.js` using deterministic seed-driven identifiers so packed output loses stable helper fingerprints as well as plaintext body text.

**Tech Stack:** Node.js, custom Luau parser/printer, Luau runtime, existing test scripts in `test/`

---

### Task 1: Lock the New Packed-Shell Expectations in Tests

**Files:**
- Modify: `test/luau-vm.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Write the failing test for compact concealed packed output**

Add or update a focused packed-shell regression near the existing packed tests in `test/luau-vm.js`:

```js
async function runPackedShellPayloadConcealment() {
  const packedSource = [
    "local function demo()",
    "  local items = { 'alpha', 'beta' }",
    "  return table.concat(items, '|')",
    "end",
    "print(demo())",
  ].join("\n");

  const { code } = await obfuscateLuau(packedSource, {
    lang: "luau",
    luauParser: "custom",
    strings: false,
    rename: false,
    dead: false,
    cff: false,
    wrap: false,
    constArray: false,
    numbers: false,
    proxifyLocals: false,
    padFooter: false,
    vm: {
      enabled: true,
      shellStyle: "packed",
    },
    seed: "vm-packed-payload-concealment",
  });

  parseCustom(code);
  assert.strictEqual(runLuau(code), "alpha|beta", "packed payload shell should still execute");
  assert.ok(hasPackedShellShape(code), "packed payload shell should keep a loader shape");
  assert.ok(!code.includes("__obf_"), "packed payload shell should not expose __obf_* loader locals");
  assert.ok(!code.includes("\\n"), "packed payload shell should not materialize plaintext chunks via escaped newlines");
  assert.ok(!code.includes("local function demo"), "packed payload shell should not expose plaintext function bodies");
}
```

- [ ] **Step 2: Extend the hard-project regression to reject old helper aliases**

Update the existing hard-project packed regression in `test/luau-vm.js` so it also asserts that old fixed helper aliases are absent:

```js
assert.ok(
  !packedCode.includes("authorize_purchase_flow") &&
  !packedCode.includes("refresh_payment_session"),
  "packed hard project output should not expose fixed VM helper aliases"
);
```

- [ ] **Step 3: Wire the new regression into the test runner**

Add the new test function to the async test list near the other packed-shell checks:

```js
  await runPackedShellWholeProgramDefault();
  await runPackedShellPayloadConcealment();
  await runPackedShellExplicitIncludeOverride();
  await runPackedShellHardProjectRegression();
```

- [ ] **Step 4: Run the focused test script to verify it fails**

Run: `node test/luau-vm.js`

Expected: FAIL on one of the new concealment assertions because the current packed shell still exposes plaintext body text and/or fixed helper aliases.

- [ ] **Step 5: Commit**

```bash
git add test/luau-vm.js
git commit -m "test: lock packed luau payload concealment expectations"
```

### Task 2: Randomize VM Helper Aliases Deterministically

**Files:**
- Modify: `src/luau/vm.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Locate the fixed helper alias pool and replace it with a generator**

In `src/luau/vm.js`, replace the fixed readable alias stems with a deterministic helper-name generator that uses the existing RNG context and guarantees unique Luau identifiers:

```js
function makeVmAliasName(rng, usedNames) {
  const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alnum = `${alpha}0123456789`;
  let candidate = "";
  do {
    const size = rng.int(8, 14);
    candidate = alpha[rng.int(0, alpha.length - 1)];
    while (candidate.length < size) {
      candidate += alnum[rng.int(0, alnum.length - 1)];
    }
  } while (usedNames.has(candidate));
  usedNames.add(candidate);
  return candidate;
}
```

- [ ] **Step 2: Build alias assignments from the generator instead of fixed words**

Update the alias construction block so it allocates every helper alias through the generator:

```js
const usedAliasNames = new Set(addIdentifierNames(ast, new Set()));
const aliases = {};
[
  "toNumber",
  "charAt",
  "substring",
  "byteAt",
  "concat",
  "insert",
].forEach((slot) => {
  aliases[slot] = makeVmAliasName(rng, usedAliasNames);
});
```

- [ ] **Step 3: Preserve current rename behavior**

Keep the existing `renameVmCoreIdentifiers(vmAst, aliases)` call pattern intact so only the helper names change, not the VM structure:

```js
renameVmCoreIdentifiers(vmAst, aliases);
```

- [ ] **Step 4: Run the packed regression to verify the old helper names disappear**

Run: `node test/luau-vm.js`

Expected: the new helper-alias assertion advances past the old readable names, with failures now limited to plaintext packed payload behavior if that still remains.

- [ ] **Step 5: Commit**

```bash
git add src/luau/vm.js test/luau-vm.js
git commit -m "feat: randomize luau vm helper aliases"
```

### Task 3: Replace the Plaintext Packed Shell with a Base-N Payload Loader

**Files:**
- Modify: `src/luau/index.js`
- Test: `test/luau-vm.js`

- [ ] **Step 1: Add a deterministic Base-N payload encoder**

In `src/luau/index.js`, add a helper that converts the final Luau program bytes into a compact textual payload using a parser-safe alphabet:

```js
const PACKED_PAYLOAD_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-";

function encodePackedPayload(source) {
  const bytes = Buffer.from(String(source), "utf8");
  let out = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] || 0;
    const b = bytes[index + 1] || 0;
    const c = bytes[index + 2] || 0;
    const width = Math.min(3, bytes.length - index);
    const value = (a << 16) | (b << 8) | c;
    let block = "";
    let cursor = value;
    for (let step = 0; step < 4; step += 1) {
      block = PACKED_PAYLOAD_ALPHABET[cursor % 64] + block;
      cursor = Math.floor(cursor / 64);
    }
    out += String(width) + block;
  }
  return out;
}
```

- [ ] **Step 2: Emit parser-safe payload literals**

Keep the payload and alphabet in parser-safe strings instead of plaintext code chunks:

```js
function makePayloadLiteral(text) {
  const value = String(text).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  return `"${value}"`;
}
```

- [ ] **Step 3: Rewrite `buildPackedLuauShell` around decode-first execution**

Replace the current plaintext chunk wrapper with a compact decode shell:

```js
function buildPackedLuauShell(code, rng) {
  const payload = encodePackedPayload(code);
  const alphabetVar = makePackedIdentifier(rng);
  const payloadVar = makePackedIdentifier(rng);
  const outVar = makePackedIdentifier(rng);
  const loaderVar = makePackedIdentifier(rng);
  const mapVar = makePackedIdentifier(rng);
  const idxVar = makePackedIdentifier(rng);
  const widthVar = makePackedIdentifier(rng);
  const blockVar = makePackedIdentifier(rng);
  const valueVar = makePackedIdentifier(rng);

  return [
    "return(function(...)",
    `local ${alphabetVar}=${makePayloadLiteral(PACKED_PAYLOAD_ALPHABET)};`,
    `local ${payloadVar}=${makePayloadLiteral(payload)};`,
    `local ${mapVar}={};`,
    `for ${idxVar}=1,#${alphabetVar} do ${mapVar}[${alphabetVar}:sub(${idxVar},${idxVar})]=${idxVar}-1 end;`,
    `local ${outVar}={};`,
    `for ${idxVar}=1,#${payloadVar},5 do `,
    `local ${widthVar}=tonumber(${payloadVar}:sub(${idxVar},${idxVar})) or 0;`,
    `local ${blockVar}=${payloadVar}:sub(${idxVar}+1,${idxVar}+4);`,
    `local ${valueVar}=0;`,
    `for j=1,4 do ${valueVar}=${valueVar}*64+(${mapVar}[${blockVar}:sub(j,j)] or 0) end;`,
    `if ${widthVar}>=1 then ${outVar}[#${outVar}+1]=string.char(math.floor(${valueVar}/65536)%256) end;`,
    `if ${widthVar}>=2 then ${outVar}[#${outVar}+1]=string.char(math.floor(${valueVar}/256)%256) end;`,
    `if ${widthVar}>=3 then ${outVar}[#${outVar}+1]=string.char(${valueVar}%256) end;`,
    "end;",
    `local ${loaderVar}=loadstring or load;`,
    `return ${loaderVar}(table.concat(${outVar}))(...);`,
    "end)()",
  ].join("");
}
```

- [ ] **Step 4: Keep the size guard and packed-path semantics unchanged**

Leave the surrounding output-size guard in place, only changing the packed body generator call:

```js
if (usePackedShell) {
  const packedBody = buildPackedLuauShell(code, rng);
  code = `${LUAU_WATERMARK}\n${packedBody}`;
}
```

- [ ] **Step 5: Run the packed regression to verify it passes**

Run: `node test/luau-vm.js`

Expected: PASS for the small packed concealment checks; if the hard-project regression still fails, the next task fixes size/compatibility issues without reverting to plaintext body chunks.

- [ ] **Step 6: Commit**

```bash
git add src/luau/index.js test/luau-vm.js
git commit -m "feat: encode luau packed shell payloads"
```

### Task 4: Validate and Tune the Hard-Project Packed Output

**Files:**
- Modify: `src/luau/index.js`
- Test: `test/generate-luau-hard-project.js`
- Test: `dist/luau-hard-project.obf.lua`
- Test: `test/luau-debug.js`

- [ ] **Step 1: Regenerate the hard-project packed output**

Run: `node test/generate-luau-hard-project.js`

Expected: the generator completes and rewrites `dist/luau-hard-project.obf.lua`.

- [ ] **Step 2: Execute the generated packed hard-project output**

Run: `luau dist/luau-hard-project.obf.lua`

Expected:

```text
== hard-project summary ==
checksum=863327333 attempts=5 retries=1
trace=4 hottest=expand
[$TOP] delta => 480 (burst)
[$TOP] beta => 421 (burst)
[$REST] alpha => 240 (mixed)
[$REST] gamma => 158 (burst)
```

- [ ] **Step 3: If size fallback still triggers, reduce payload overhead without reintroducing plaintext**

Tune only the payload representation or decoder overhead. Do not revert to readable source chunks. Allowed adjustments:

```js
const PACKED_PAYLOAD_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-";
```

or:

```js
const PACKED_PAYLOAD_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_";
```

The key requirement is that the emitted payload remains encoded text, not plaintext body source.

- [ ] **Step 4: Re-run the Luau debug regression**

Run: `node test/luau-debug.js`

Expected: `luau-debug: ok`

- [ ] **Step 5: Commit**

```bash
git add src/luau/index.js dist/luau-hard-project.obf.lua dist/luau-hard-project.obf.lua.map
git commit -m "fix: keep packed luau hard-project output executable"
```

### Task 5: Final Verification Sweep

**Files:**
- Test: `test/luau-vm.js`
- Test: `test/luau-debug.js`
- Test: `dist/luau-hard-project.obf.lua`

- [ ] **Step 1: Run the packed-shell regression suite**

Run: `node test/luau-vm.js`

Expected: `luau-vm: ok`

- [ ] **Step 2: Run the debug artifact regression**

Run: `node test/luau-debug.js`

Expected: `luau-debug: ok`

- [ ] **Step 3: Re-run the hard-project artifact directly**

Run: `luau dist/luau-hard-project.obf.lua`

Expected:

```text
== hard-project summary ==
checksum=863327333 attempts=5 retries=1
trace=4 hottest=expand
[$TOP] delta => 480 (burst)
[$TOP] beta => 421 (burst)
[$REST] alpha => 240 (mixed)
[$REST] gamma => 158 (burst)
```

- [ ] **Step 4: Commit**

```bash
git add src/luau/index.js src/luau/vm.js test/luau-vm.js
git commit -m "feat: strengthen luau packed payload shell"
```
