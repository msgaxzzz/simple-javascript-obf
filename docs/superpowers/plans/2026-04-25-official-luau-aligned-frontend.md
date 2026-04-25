# Official Luau-Aligned Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the custom Luau frontend so its canonical AST and parser behavior align closely with current official Luau while preserving a temporary compat adapter for existing transforms.

**Architecture:** Introduce a canonical official-shape Luau AST in TypeScript, port the tokenizer and parser implementations from facade state into real `.ts` implementations, and route consumers through a centralized compatibility adapter instead of legacy shape assumptions. Keep runtime CommonJS compatibility with thin `.js` shims only where needed, but remove long-lived JavaScript implementation copies from the frontend core as each area is migrated.

**Tech Stack:** TypeScript, Node.js CommonJS shims, official Luau grammar / AST references, existing Luau regression suite under `test/`

---

## File Structure

### Create

- `docs/superpowers/references/official-luau-ast-notes.md`
- `test/luau-official-shape.js`
- `test/luau-official-grammar.js`
- `src/luau/custom/index.ts`
- `src/luau/index.ts`

### Modify

- `src/luau/custom/nodes.ts`
- `src/luau/custom/types.ts`
- `src/luau/custom/locations.ts`
- `src/luau/custom/diagnostic-types.ts`
- `src/luau/custom/parser.ts`
- `src/luau/custom/tokenizer.ts`
- `src/luau/custom/compat.ts`
- `src/luau/custom/index.js`
- `src/luau/custom/printer.ts`
- `src/luau/custom/factory.ts`
- `src/luau/custom/validate.ts`
- `src/luau/custom/traverse.ts`
- `src/luau/custom/walk.ts`
- `src/luau/ast.js`
- `src/luau/index.js`
- `src/luau/rename.ts`
- `src/luau/maskGlobals.ts`
- `src/luau/strings.ts`
- `src/index.ts`
- `src/options.ts`
- `src/pipeline.ts`
- `package.json`
- `test/luau-custom-roundtrip.js`
- `test/luau-mask-globals.js`
- `test/luau-rename.js`
- `test/luau-long-strings.js`
- `test/luau-api.js`
- `test/obf-smoke.js`
- `test/luau-custom-declarations.js`

### Delete Later In Sequence

- `src/luau/custom/parser-impl.js`
- `src/luau/custom/tokenizer-impl.js`
- `src/luau/custom/printer-impl.js`
- `src/luau/custom/factory-impl.js`
- `src/luau/custom/validate-impl.js`
- `src/luau/custom/traverse-impl.js`
- `src/luau/custom/walk-impl.js`
- `src/luau/rename-impl.js`
- `src/luau/maskGlobals-impl.js`
- `src/luau/strings-impl.js`

### Responsibilities

- `official-luau-ast-notes.md`: freeze the exact upstream AST / parser concepts this branch is aligning against
- `luau-official-shape.js`: canonical AST-shape assertions for key syntax families
- `luau-official-grammar.js`: canonical parser acceptance / rejection coverage for official Luau grammar features
- `src/luau/custom/{nodes,types,locations,diagnostic-types}.ts`: canonical AST contracts and metadata
- `src/luau/custom/{tokenizer,parser}.ts`: real TypeScript tokenizer/parser implementation, no long-lived JS impl fallback
- `src/luau/custom/compat.ts`: centralized official-shape -> legacy-shape compatibility adapter
- `src/luau/custom/index.ts`: canonical typed frontend boundary
- `src/luau/index.ts`: typed Luau pipeline entrypoint over canonical frontend + compat layer
- `src/luau/custom/{printer,factory,validate,traverse,walk}.ts`: canonical frontend support against official-shape AST
- `src/luau/{rename,maskGlobals,strings}.ts`: transform-side contracts updated to consume compat layer explicitly
- `src/{index,pipeline,options}.ts`: package-level typed entrypoints once frontend contracts stabilize

### Official References

- Grammar: `https://luau.org/grammar/`
- AST: `https://github.com/luau-lang/luau/blob/master/Ast/include/Luau/Ast.h`
- Parser: `https://github.com/luau-lang/luau/blob/master/Ast/src/Parser.cpp`

### Baseline Verification Before Work

- `npm run typecheck`
- `npm run build:ts`
- `node test/luau-custom-roundtrip.js`
- `node test/luau-mask-globals.js`
- `node test/luau-rename.js`
- `node test/luau-long-strings.js`
- `node test/luau-api.js`
- `node test/obf-smoke.js`
- `node test/luau-vm.js`

---

### Task 1: Freeze the official Luau alignment target in tests and notes

**Files:**
- Create: `docs/superpowers/references/official-luau-ast-notes.md`
- Create: `test/luau-official-shape.js`
- Create: `test/luau-official-grammar.js`

- [ ] **Step 1: Write the failing AST-shape test**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const ast = custom.parseLuau([
  "export type Pair<T> = { value: T }",
  "local function f<T>(x: T): T",
  "  return x",
  "end",
].join("\n"));

assert.strictEqual(ast.type, "Chunk");
assert.ok(Array.isArray(ast.body), "Chunk body should be an array");
assert.strictEqual(ast.body[0].type, "StatTypeAlias", "type alias should use official-style statement naming");
assert.strictEqual(ast.body[1].type, "StatFunction", "function declaration should use official-style statement naming");
```

- [ ] **Step 2: Write the failing grammar-coverage test**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const accepted = [
  "type Result<T, E> = T | E",
  "declare function id<T>(x: T): T",
  "local x = if ok then 1 else 2",
  "x += 1",
  "@native function f() end",
  "local s = `hello {name}`",
];

for (const source of accepted) {
  assert.doesNotThrow(() => custom.parseLuau(source), source);
}
```

- [ ] **Step 3: Run the new tests to verify they fail on the current AST shape**

Run: `node test/luau-official-shape.js`
Expected: FAIL with a node-type mismatch such as `StatTypeAlias`

Run: `node test/luau-official-grammar.js`
Expected: PASS or FAIL depending on current grammar coverage, but `luau-official-shape.js` must be red before proceeding

- [ ] **Step 4: Record the upstream alignment notes**

```md
# Official Luau AST Notes

- Canonical source: `Ast/include/Luau/Ast.h`
- Statement families use `AstStat*`
- Expression families use `AstExpr*`
- Type families use `AstType*`
- Parse output should be modeled in TS with official terminology first, compat second
```

- [ ] **Step 5: Run the failing AST-shape test again to verify it stays red**

Run: `node test/luau-official-shape.js`
Expected: FAIL

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/references/official-luau-ast-notes.md test/luau-official-shape.js test/luau-official-grammar.js
git commit -m "test: lock official luau alignment targets"
```

### Task 2: Redefine the canonical custom AST contracts around official Luau naming

**Files:**
- Modify: `src/luau/custom/nodes.ts`
- Modify: `src/luau/custom/types.ts`
- Modify: `src/luau/custom/locations.ts`
- Modify: `src/luau/custom/diagnostic-types.ts`
- Test: `test/luau-official-shape.js`

- [ ] **Step 1: Update the node metadata test to assert official-style contract metadata**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

assert.ok(custom.types.nodes.nodeTypes.includes("StatTypeAlias"));
assert.ok(custom.types.nodes.nodeTypes.includes("ExprIfElse"));
assert.ok(custom.types.nodes.nodeTypes.includes("TypeReference"));
```

- [ ] **Step 2: Run the metadata test to verify it fails**

Run: `node test/luau-official-shape.js`
Expected: FAIL because the metadata still exposes old custom node names

- [ ] **Step 3: Redefine the node contract around official-style names**

```ts
export interface Chunk {
  type: "Chunk";
  body: Statement[];
  loc?: SourceLocation;
  range?: [number, number];
}

export interface StatTypeAlias extends BaseNode {
  type: "StatTypeAlias";
  name: TypeName;
  generics: GenericTypeList | null;
  type: TypeAnnotation;
}

export interface ExprIfElse extends BaseNode {
  type: "ExprIfElse";
  condition: Expression;
  trueExpression: Expression;
  falseExpression: Expression;
}
```

- [ ] **Step 4: Update exported metadata arrays and contract keys**

```ts
export const nodeTypes = [
  "Chunk",
  "StatTypeAlias",
  "StatFunction",
  "StatDeclareFunction",
  "ExprIfElse",
  "ExprInterpString",
  "TypeReference",
] as const;
```

- [ ] **Step 5: Run the AST-shape test to verify the metadata portion passes or advances to parser-output failure**

Run: `node test/luau-official-shape.js`
Expected: FAIL later in parser output if parser still emits old node shapes

- [ ] **Step 6: Commit**

```bash
git add src/luau/custom/nodes.ts src/luau/custom/types.ts src/luau/custom/locations.ts src/luau/custom/diagnostic-types.ts test/luau-official-shape.js
git commit -m "refactor: define official-style luau ast contracts"
```

### Task 3: Replace the tokenizer facade checkpoint with a true TypeScript tokenizer

**Files:**
- Modify: `src/luau/custom/tokenizer.ts`
- Delete: `src/luau/custom/tokenizer-impl.js`
- Modify: `src/luau/custom/tokenizer.js`
- Test: `test/luau-official-grammar.js`
- Test: `test/luau-custom-roundtrip.js`

- [ ] **Step 1: Add a tokenizer-facing regression case for official Luau tokens**

```js
const assert = require("assert");
const { Tokenizer } = require("../src/luau/custom/tokenizer");

const tokenizer = new Tokenizer("type A<T...> = if x then y else z");
const seen = [];
for (let token = tokenizer.next(); token.type !== "eof"; token = tokenizer.next()) {
  seen.push([token.type, token.value || null]);
}

assert.ok(seen.some(([type, value]) => type === "keyword" && value === "type"));
assert.ok(seen.some(([type, value]) => value === "..."));
assert.ok(seen.some(([type, value]) => type === "keyword" && value === "if"));
```

- [ ] **Step 2: Run tokenizer-facing coverage to verify the current facade still works before implementation replacement**

Run: `node test/luau-official-grammar.js`
Expected: current result recorded before deleting the JS impl

- [ ] **Step 3: Move the tokenizer implementation into `tokenizer.ts`**

```ts
export class Tokenizer {
  private readonly source: string;
  private cursor = 0;

  constructor(source: string) {
    this.source = source;
  }

  next(): Token {
    // move implementation from tokenizer-impl.js here, then align token kinds and spellings
    return this.readToken();
  }
}
```

- [ ] **Step 4: Reduce the JS entry file to a runtime shim**

```js
module.exports = require("./tokenizer");
```

- [ ] **Step 5: Remove the obsolete JS implementation file**

Run: `test ! -f src/luau/custom/tokenizer-impl.js && echo removed`
Expected: `removed`

- [ ] **Step 6: Run tokenizer and round-trip coverage**

Run: `node test/luau-official-grammar.js`
Expected: PASS for tokenizer-facing grammar coverage

Run: `node test/luau-custom-roundtrip.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/luau/custom/tokenizer.ts src/luau/custom/tokenizer.js test/luau-official-grammar.js
git rm src/luau/custom/tokenizer-impl.js
git commit -m "refactor: port luau tokenizer to true typescript"
```

### Task 4: Rebuild the parser in true TypeScript for official type and declaration syntax

**Files:**
- Modify: `src/luau/custom/parser.ts`
- Delete: `src/luau/custom/parser-impl.js`
- Modify: `src/luau/custom/parser.js`
- Test: `test/luau-official-shape.js`
- Test: `test/luau-official-grammar.js`

- [ ] **Step 1: Add a parser-output assertion for official-style type/declaration nodes**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const ast = custom.parseLuau([
  "declare function id<T>(x: T): T",
  "type Box<T> = { value: T }",
].join("\n"));

assert.strictEqual(ast.body[0].type, "StatDeclareFunction");
assert.strictEqual(ast.body[1].type, "StatTypeAlias");
```

- [ ] **Step 2: Run the AST-shape test to verify it fails on old parser output**

Run: `node test/luau-official-shape.js`
Expected: FAIL on statement node types and/or field names

- [ ] **Step 3: Move parser implementation into `parser.ts` and align type/declaration syntax**

```ts
export class Parser {
  parse(): Chunk {
    return this.parseChunk();
  }

  private parseTypeAlias(): StatTypeAlias {
    // align logic with official Parser.cpp terminology and node output
  }

  private parseDeclaredFunction(): StatDeclareFunction {
    // align declaration syntax and generic handling first
  }
}
```

- [ ] **Step 4: Reduce the JS parser entry file to a runtime shim**

```js
module.exports = require("./parser");
```

- [ ] **Step 5: Remove the obsolete JS parser implementation**

Run: `test ! -f src/luau/custom/parser-impl.js && echo removed`
Expected: `removed`

- [ ] **Step 6: Run parser alignment coverage**

Run: `node test/luau-official-shape.js`
Expected: PASS for declaration/type node-shape assertions

Run: `node test/luau-official-grammar.js`
Expected: PASS for type/declaration syntax samples

- [ ] **Step 7: Commit**

```bash
git add src/luau/custom/parser.ts src/luau/custom/parser.js test/luau-official-shape.js test/luau-official-grammar.js
git rm src/luau/custom/parser-impl.js
git commit -m "refactor: align luau parser type syntax with official grammar"
```

### Task 5: Extend the parser to official Luau statement and expression extensions

**Files:**
- Modify: `src/luau/custom/parser.ts`
- Modify: `test/luau-official-grammar.js`
- Modify: `test/luau-custom-roundtrip.js`

- [ ] **Step 1: Add failing coverage for statement and expression extensions**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const samples = [
  "local x = if ok then 1 else 2",
  "x += 1",
  "continue",
  "@native function f() end",
  "local s = `hello {name}`",
];

for (const source of samples) {
  assert.doesNotThrow(() => custom.parseLuau(source), source);
}
```

- [ ] **Step 2: Run grammar coverage to verify at least one sample fails**

Run: `node test/luau-official-grammar.js`
Expected: FAIL on an unsupported extension still missing from parser alignment

- [ ] **Step 3: Implement official-style statement / expression parsing**

```ts
private parseIfElseExpression(): ExprIfElse {
  // align `if ... then ... else ...` expression output
}

private parseCompoundAssignment(): Statement {
  // align compound assignment syntax with official token/category handling
}

private parseInterpolatedString(): Expression {
  // align interpolated-string parsing and segment ownership
}
```

- [ ] **Step 4: Run grammar and round-trip coverage**

Run: `node test/luau-official-grammar.js`
Expected: PASS

Run: `node test/luau-custom-roundtrip.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/luau/custom/parser.ts test/luau-official-grammar.js test/luau-custom-roundtrip.js
git commit -m "feat: align luau parser statement and expression extensions"
```

### Task 6: Introduce the official-shape compat adapter and canonical frontend entrypoint

**Files:**
- Modify: `src/luau/custom/compat.ts`
- Create: `src/luau/custom/index.ts`
- Modify: `src/luau/custom/index.js`
- Modify: `src/luau/ast.js`
- Modify: `src/luau/index.js`
- Create: `src/luau/index.ts`
- Test: `test/luau-mask-globals.js`
- Test: `test/luau-rename.js`
- Test: `test/luau-api.js`

- [ ] **Step 1: Add a failing compat-adapter regression**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");
const { normalizeLegacyNodeShape } = require("../src/luau/custom/compat");

const ast = custom.parseLuau("local x = if ok then 1 else 2");
const legacy = normalizeLegacyNodeShape(ast);

assert.ok(legacy, "compat adapter should produce a transform-consumable AST");
```

- [ ] **Step 2: Run transform-facing regressions to verify at least one still depends on old shape**

Run: `node test/luau-mask-globals.js`
Expected: FAIL or reveal missing old-shape compatibility after parser shape changes

- [ ] **Step 3: Implement a centralized compat adapter**

```ts
export function normalizeLegacyNodeShape(ast: Chunk): Chunk {
  // translate official-shape canonical output into the legacy access patterns still used by transforms
  return ast;
}
```

- [ ] **Step 4: Introduce typed frontend entrypoints**

```ts
export function parseLuau(source: string): Chunk {
  return parse(source);
}

export function generateLuau(ast: Chunk, options?: PrintOptions) {
  return printChunk(ast, options);
}
```

- [ ] **Step 5: Route `src/luau/ast.js` and `src/luau/index.js` through the canonical entrypoint plus compat layer**

```js
const custom = require("./custom");
const { normalizeLegacyNodeShape } = require("./custom/compat");

function parseLuau(source, options = {}) {
  return normalizeLegacyNodeShape(custom.parseLuau(source));
}
```

- [ ] **Step 6: Run transform-facing regressions**

Run: `node test/luau-mask-globals.js`
Expected: PASS

Run: `node test/luau-rename.js`
Expected: PASS

Run: `node test/luau-api.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/luau/custom/compat.ts src/luau/custom/index.ts src/luau/custom/index.js src/luau/ast.js src/luau/index.ts src/luau/index.js test/luau-mask-globals.js test/luau-rename.js test/luau-api.js
git commit -m "refactor: add official-shape luau compat adapter"
```

### Task 7: Port printer, factory, validation, traverse, and walk to canonical official-shape TypeScript

**Files:**
- Modify: `src/luau/custom/printer.ts`
- Modify: `src/luau/custom/factory.ts`
- Modify: `src/luau/custom/validate.ts`
- Modify: `src/luau/custom/traverse.ts`
- Modify: `src/luau/custom/walk.ts`
- Delete: `src/luau/custom/printer-impl.js`
- Delete: `src/luau/custom/factory-impl.js`
- Delete: `src/luau/custom/validate-impl.js`
- Delete: `src/luau/custom/traverse-impl.js`
- Delete: `src/luau/custom/walk-impl.js`
- Modify: `src/luau/custom/printer.js`
- Modify: `src/luau/custom/factory.js`
- Modify: `src/luau/custom/validate.js`
- Modify: `src/luau/custom/traverse.js`
- Modify: `src/luau/custom/walk.js`
- Test: `test/luau-custom-roundtrip.js`
- Test: `test/luau-cff.js`
- Test: `test/luau-advanced.js`

- [ ] **Step 1: Add a failing canonical-printer round-trip assertion**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const source = "local x = if ok then 1 else 2";
const ast = custom.parseLuau(source);
const printed = custom.generateLuau(ast);

assert.ok(printed.includes("if ok then 1 else 2"));
```

- [ ] **Step 2: Run round-trip coverage to verify printer still assumes legacy node shapes**

Run: `node test/luau-custom-roundtrip.js`
Expected: FAIL on a canonical official-shape node not yet handled by the printer

- [ ] **Step 3: Move frontend support implementations into true TypeScript and align them to canonical AST**

```ts
export function printChunk(ast: Chunk, options?: PrintOptions): PrintResult {
  // print canonical official-shape nodes directly
}

export function traverse(root: BaseNode, visitor: TraverseVisitor): BaseNode | null {
  // canonical node walk without legacy shortcuts
}
```

- [ ] **Step 4: Reduce JS entrypoints to shims and remove obsolete impl files**

```js
module.exports = require("./printer");
```

- [ ] **Step 5: Run frontend regressions**

Run: `node test/luau-custom-roundtrip.js`
Expected: PASS

Run: `node test/luau-cff.js`
Expected: PASS

Run: `node test/luau-advanced.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/luau/custom/printer.ts src/luau/custom/factory.ts src/luau/custom/validate.ts src/luau/custom/traverse.ts src/luau/custom/walk.ts src/luau/custom/printer.js src/luau/custom/factory.js src/luau/custom/validate.js src/luau/custom/traverse.js src/luau/custom/walk.js test/luau-custom-roundtrip.js test/luau-cff.js test/luau-advanced.js
git rm src/luau/custom/printer-impl.js src/luau/custom/factory-impl.js src/luau/custom/validate-impl.js src/luau/custom/traverse-impl.js src/luau/custom/walk-impl.js
git commit -m "refactor: port canonical luau frontend support to typescript"
```

### Task 8: Strengthen package-level typed surfaces and declarations

**Files:**
- Modify: `src/luau/index.ts`
- Modify: `src/luau/custom/index.ts`
- Modify: `src/index.ts`
- Modify: `src/options.ts`
- Modify: `src/pipeline.ts`
- Modify: `package.json`
- Modify: `test/luau-custom-declarations.js`
- Test: `test/luau-custom-declarations.js`
- Test: `test/obf-smoke.js`

- [ ] **Step 1: Add a failing declaration-discovery test for package entrypoints**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const pkg = require(path.join(repoRoot, "package.json"));

assert.ok(pkg.types, "package.json should advertise a root types entry");
```

- [ ] **Step 2: Run declaration coverage to verify it fails**

Run: `node test/luau-custom-declarations.js`
Expected: FAIL because package-level type discovery is still incomplete

- [ ] **Step 3: Strengthen package and Luau-facing TS entrypoints**

```ts
export interface LuauApi {
  obfuscateLuau(source: string, options?: Record<string, unknown>): Promise<{ code: string; map: unknown }>;
}
```

```json
{
  "main": "src/index.js",
  "types": "build/src/index.d.ts"
}
```

- [ ] **Step 4: Run declaration and smoke coverage**

Run: `npm run build:ts`
Expected: PASS

Run: `node test/luau-custom-declarations.js`
Expected: PASS

Run: `node test/obf-smoke.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/luau/index.ts src/luau/custom/index.ts src/index.ts src/options.ts src/pipeline.ts package.json test/luau-custom-declarations.js
git commit -m "refactor: strengthen luau and package types"
```

### Task 9: Migrate transforms off the compat layer in the first wave

**Files:**
- Modify: `src/luau/rename.ts`
- Modify: `src/luau/maskGlobals.ts`
- Modify: `src/luau/strings.ts`
- Test: `test/luau-rename.js`
- Test: `test/luau-mask-globals.js`
- Test: `test/luau-long-strings.js`

- [ ] **Step 1: Add a failing assertion that transforms can consume canonical official-shape AST directly**

```js
const assert = require("assert");
const { parseLuau } = require("../src/luau/custom");
const { renameLuau } = require("../src/luau/rename");
const { RNG } = require("../src/utils/rng");

const ast = parseLuau("local t = { foo = 1 } return t.foo");
renameLuau(ast, {
  options: { renameOptions: { renameMembers: true, renameGlobals: false, reserved: [] } },
  rng: new RNG("official-shape"),
});

assert.ok(ast, "rename should accept canonical official-shape AST");
```

- [ ] **Step 2: Run transform regressions to verify any remaining compat-only dependency**

Run: `node test/luau-rename.js`
Expected: FAIL if the transform still depends on legacy-only node access

- [ ] **Step 3: Tighten transform contracts and update them toward canonical AST access**

```ts
export interface RenameContext {
  options: RenameOptions;
  rng: RenameRng;
  // canonical official-shape assumptions only
}
```

- [ ] **Step 4: Run transform regressions**

Run: `node test/luau-rename.js`
Expected: PASS

Run: `node test/luau-mask-globals.js`
Expected: PASS

Run: `node test/luau-long-strings.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/luau/rename.ts src/luau/maskGlobals.ts src/luau/strings.ts test/luau-rename.js test/luau-mask-globals.js test/luau-long-strings.js
git commit -m "refactor: migrate first luau transforms off compat access"
```

### Task 10: Consolidated verification checkpoint

**Files:**
- Test only

- [ ] **Step 1: Run the full TypeScript and Luau regression suite**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run build:ts`
Expected: PASS

Run: `node test/luau-official-shape.js`
Expected: PASS

Run: `node test/luau-official-grammar.js`
Expected: PASS

Run: `node test/luau-custom-roundtrip.js`
Expected: PASS

Run: `node test/luau-cff.js`
Expected: PASS

Run: `node test/luau-advanced.js`
Expected: PASS

Run: `node test/luau-mask-globals.js`
Expected: PASS

Run: `node test/luau-rename.js`
Expected: PASS

Run: `node test/luau-long-strings.js`
Expected: PASS

Run: `node test/luau-api.js`
Expected: PASS

Run: `node test/obf-smoke.js`
Expected: PASS

Run: `node test/luau-vm.js`
Expected: PASS with `luau-vm: ok`

- [ ] **Step 2: Commit any final test-only adjustments if needed**

```bash
git status --short
```

Expected: clean worktree, or only intentional final test tweaks

## Self-Review

### Spec coverage

- Official Luau AST target frozen: Task 1
- Official-style canonical AST contracts: Task 2
- True TS tokenizer implementation: Task 3
- True TS parser implementation aligned to official grammar: Tasks 4-5
- Explicit official-shape compat adapter: Task 6
- Canonical printer / validation / traversal / walk: Task 7
- Stronger package-level type surface: Task 8
- Transform migration off compat for first wave: Task 9
- Consolidated verification: Task 10

### Placeholder scan

- No `TBD` / `TODO` placeholders left in the plan
- Each task names exact files
- Each task includes explicit commands
- Each code-changing task contains concrete code snippets

### Type consistency

- Canonical AST is official-shape throughout the plan
- Compat adapter is centralized in `src/luau/custom/compat.ts`
- Parser/tokenizer/printer support move to true `.ts` implementations instead of long-lived `*-impl.js`
- `src/luau/index.ts` and `src/luau/custom/index.ts` are the typed boundaries after canonical AST stabilization
