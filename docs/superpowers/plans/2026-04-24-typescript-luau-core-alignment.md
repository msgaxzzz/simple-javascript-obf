# TypeScript Luau Core Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the project toward TypeScript by converting the Luau core first and aligning the custom Luau AST/parser/printer contracts with official Luau-style behavior without replacing the custom implementation.

**Architecture:** Introduce TypeScript in a compatibility-first way, keep existing CLI entry points stable, and define a typed Luau frontend boundary before moving transforms. The custom Luau frontend remains in-house, but its AST schema, diagnostics, and printer contracts are normalized around official Luau conventions and exposed through typed modules. Existing transforms consume the new boundary through a temporary compatibility layer until the rest of the repository is migrated.

**Tech Stack:** TypeScript, Node.js, CommonJS-compatible build output, existing Luau custom frontend, existing test suite under `test/`.

---

## File Structure

### New files

- `tsconfig.json`
- `tsconfig.build.json`
- `src/types/global.d.ts`
- `src/luau/custom/types.ts`
- `src/luau/custom/nodes.ts`
- `src/luau/custom/locations.ts`
- `src/luau/custom/diagnostic-types.ts`
- `src/luau/custom/compat.ts`
- `test/luau-custom-ast-contract.js`
- `test/luau-typescript-bootstrap.js`

### Modified files

- `package.json`
- `src/luau/custom/index.js`
- `src/luau/custom/parser.js`
- `src/luau/custom/tokenizer.js`
- `src/luau/custom/printer.js`
- `src/luau/custom/factory.js`
- `src/luau/custom/validate.js`
- `src/luau/custom/traverse.js`
- `src/luau/custom/walk.js`
- `src/luau/ast.js`
- `src/luau/index.js`
- `src/options.js`
- `bin/js-obf`
- `bin/luau-obf`

### Later-wave modified files

- `src/luau/rename.js`
- `src/luau/maskGlobals.js`
- `src/luau/strings.js`
- `src/luau/cff.js`
- `src/luau/vm.js`
- `src/luau/wrap.js`
- `src/index.js`
- `src/pipeline.js`
- `src/utils/*.js`

---

### Task 1: Add TypeScript build scaffolding without breaking the CLI

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `src/types/global.d.ts`
- Modify: `package.json`
- Modify: `bin/js-obf`
- Modify: `bin/luau-obf`
- Test: `test/luau-typescript-bootstrap.js`

- [ ] **Step 1: Write the failing bootstrap test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const tsconfigPath = path.join(repoRoot, "tsconfig.json");
const buildConfigPath = path.join(repoRoot, "tsconfig.build.json");

assert.ok(fs.existsSync(tsconfigPath), "tsconfig.json should exist");
assert.ok(fs.existsSync(buildConfigPath), "tsconfig.build.json should exist");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-typescript-bootstrap.js`
Expected: FAIL with `tsconfig.json should exist`

- [ ] **Step 3: Add minimal TypeScript config**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": ".",
    "outDir": "build",
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "test/**/*", "src/types/**/*.d.ts"],
  "exclude": ["dist", "third_party", "build"]
}
```

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false
  },
  "include": ["src/**/*", "src/types/**/*.d.ts"]
}
```

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "build:ts": "tsc -p tsconfig.build.json"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "@types/node": "^24.0.0"
  }
}
```

- [ ] **Step 4: Keep bin entry points build-compatible**

```js
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const builtEntry = path.join(__dirname, "..", "build", "src", "index.js");
const sourceEntry = path.join(__dirname, "..", "src", "index.js");
const { obfuscate } = require(fs.existsSync(builtEntry) ? builtEntry : sourceEntry);
```

```js
#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");

const script = path.join(__dirname, "js-obf");
const result = spawnSync(process.execPath, [script, "--lang", "luau", ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(result.status === null ? 1 : result.status);
```

- [ ] **Step 5: Run bootstrap test to verify it passes**

Run: `node test/luau-typescript-bootstrap.js`
Expected: PASS with no output

- [ ] **Step 6: Run typecheck to verify the scaffold is valid**

Run: `npm run typecheck`
Expected: PASS or only pre-existing JavaScript-related warnings if `allowJs` surfaces them

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json tsconfig.build.json src/types/global.d.ts bin/js-obf bin/luau-obf test/luau-typescript-bootstrap.js
git commit -m "build: add typescript scaffold for luau migration"
```

### Task 2: Define the typed Luau AST contract

**Files:**
- Create: `src/luau/custom/types.ts`
- Create: `src/luau/custom/nodes.ts`
- Create: `src/luau/custom/locations.ts`
- Create: `src/luau/custom/diagnostic-types.ts`
- Create: `test/luau-custom-ast-contract.js`
- Modify: `src/luau/custom/index.js`

- [ ] **Step 1: Write the failing AST contract test**

```js
const assert = require("assert");

const custom = require("../src/luau/custom");

assert.ok(custom.types, "custom frontend should export AST types");
assert.ok(typeof custom.parseLuau === "function", "custom frontend should still export parseLuau");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/luau-custom-ast-contract.js`
Expected: FAIL with `custom frontend should export AST types`

- [ ] **Step 3: Add the typed node and location contracts**

```ts
export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface BaseNode {
  type: string;
  range?: [number, number];
  loc?: SourceLocation;
}
```

```ts
import type { BaseNode } from "./locations";

export interface Chunk extends BaseNode {
  type: "Chunk";
  body: Statement[];
}

export interface Identifier extends BaseNode {
  type: "Identifier";
  name: string;
}

export type Statement = BaseNode;
export type Expression = BaseNode;
```

```ts
export interface DiagnosticShape {
  message: string;
  expected?: string | null;
  range?: [number, number];
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
```

- [ ] **Step 4: Export the contracts through the custom frontend**

```js
const types = require("./types");
const nodes = require("./nodes");
const locations = require("./locations");
const diagnosticTypes = require("./diagnostic-types");

module.exports = {
  parseLuau,
  generateLuau,
  walk,
  traverse,
  buildScope,
  validate,
  factory,
  buildCFG,
  buildSSA,
  buildIR,
  buildIRSSA,
  printIR,
  diagnostics,
  types,
  nodes,
  locations,
  diagnosticTypes,
};
```

- [ ] **Step 5: Run the AST contract test to verify it passes**

Run: `node test/luau-custom-ast-contract.js`
Expected: PASS with no output

- [ ] **Step 6: Commit**

```bash
git add src/luau/custom/types.ts src/luau/custom/nodes.ts src/luau/custom/locations.ts src/luau/custom/diagnostic-types.ts src/luau/custom/index.js test/luau-custom-ast-contract.js
git commit -m "feat: define typed luau ast contract"
```

### Task 3: Convert tokenizer and parser to TypeScript around the new contract

**Files:**
- Create: `src/luau/custom/tokenizer.ts`
- Create: `src/luau/custom/parser.ts`
- Modify: `src/luau/custom/index.js`
- Modify: `src/luau/custom/parser.js`
- Modify: `src/luau/custom/tokenizer.js`
- Test: `test/luau-vm.js`
- Test: `test/luau-custom-scope.js`

- [ ] **Step 1: Write a failing parse smoke test for the TypeScript entry**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const ast = custom.parseLuau("local function f<T>(x: T): T return x end");
assert.strictEqual(ast.type, "Chunk");
assert.ok(Array.isArray(ast.body), "parseLuau should return a Chunk with body");
```

- [ ] **Step 2: Run the parse smoke test to verify it fails after redirecting imports**

Run: `node test/luau-custom-scope.js`
Expected: FAIL once `index.js` is pointed at `.ts` files that do not exist yet

- [ ] **Step 3: Port tokenizer and parser to TypeScript with typed exports**

```ts
export class Tokenizer {
  constructor(private readonly source: string) {}

  next(): Token {
    return { type: "eof", value: "", range: [this.source.length, this.source.length] };
  }

  peek(): Token {
    return this.next();
  }
}
```

```ts
import { Tokenizer } from "./tokenizer";

export function parse(source: string): Chunk {
  const parser = new Parser(source);
  return parser.parse();
}
```

- [ ] **Step 4: Leave JavaScript shims that re-export the TypeScript implementation**

```js
module.exports = require("./parser.ts");
```

```js
module.exports = require("./tokenizer.ts");
```

- [ ] **Step 5: Run parser tests to verify behavior stays intact**

Run: `node test/luau-custom-scope.js`
Expected: PASS

Run: `node test/luau-vm.js`
Expected: PASS with `luau-vm: ok`

- [ ] **Step 6: Commit**

```bash
git add src/luau/custom/tokenizer.ts src/luau/custom/parser.ts src/luau/custom/tokenizer.js src/luau/custom/parser.js src/luau/custom/index.js test/luau-vm.js test/luau-custom-scope.js
git commit -m "refactor: port luau tokenizer and parser to typescript"
```

### Task 4: Port printer, factory, validation, walk, and traverse to TypeScript

**Files:**
- Create: `src/luau/custom/printer.ts`
- Create: `src/luau/custom/factory.ts`
- Create: `src/luau/custom/validate.ts`
- Create: `src/luau/custom/walk.ts`
- Create: `src/luau/custom/traverse.ts`
- Modify: `src/luau/custom/printer.js`
- Modify: `src/luau/custom/factory.js`
- Modify: `src/luau/custom/validate.js`
- Modify: `src/luau/custom/walk.js`
- Modify: `src/luau/custom/traverse.js`
- Modify: `src/luau/custom/index.js`
- Test: `test/luau-vm.js`
- Test: `test/luau-cff.js`
- Test: `test/luau-advanced.js`

- [ ] **Step 1: Add a failing round-trip printer test**

```js
const assert = require("assert");
const custom = require("../src/luau/custom");

const source = "local x = 1\nreturn x";
const ast = custom.parseLuau(source);
const printed = custom.generateLuau(ast);

assert.ok(typeof printed === "string");
assert.ok(printed.includes("local"));
```

- [ ] **Step 2: Run the round-trip test to verify it fails before printer migration**

Run: `node test/luau-postprocess.js`
Expected: FAIL if the printer path is not yet reconnected to the new TS implementation

- [ ] **Step 3: Port printer and helpers to TypeScript**

```ts
export function printChunk(ast: Chunk): string {
  return ast.body.map(printStatement).join("\n");
}
```

```ts
export function identifier(name: string): Identifier {
  return { type: "Identifier", name };
}
```

```ts
export function walk(node: BaseNode, visit: (node: BaseNode) => void): void {
  visit(node);
}
```

- [ ] **Step 4: Keep JavaScript shim files thin and boring**

```js
module.exports = require("./printer.ts");
```

```js
module.exports = require("./factory.ts");
```

- [ ] **Step 5: Run Luau regression coverage**

Run: `node test/luau-cff.js`
Expected: PASS

Run: `node test/luau-advanced.js`
Expected: PASS

Run: `node test/luau-vm.js`
Expected: PASS with `luau-vm: ok`

- [ ] **Step 6: Commit**

```bash
git add src/luau/custom/printer.ts src/luau/custom/factory.ts src/luau/custom/validate.ts src/luau/custom/walk.ts src/luau/custom/traverse.ts src/luau/custom/printer.js src/luau/custom/factory.js src/luau/custom/validate.js src/luau/custom/walk.js src/luau/custom/traverse.js src/luau/custom/index.js
git commit -m "refactor: port luau frontend helpers to typescript"
```

### Task 5: Add an AST compatibility layer and migrate Luau frontend callers

**Files:**
- Create: `src/luau/custom/compat.ts`
- Modify: `src/luau/ast.js`
- Modify: `src/luau/index.js`
- Modify: `src/options.js`
- Test: `test/luau-vm.js`
- Test: `test/luau-mask-globals.js`
- Test: `test/luau-rename.js`

- [ ] **Step 1: Write a failing compatibility test**

```js
const assert = require("assert");
const { parseLuau } = require("../src/luau/custom");
const { normalizeLegacyNodeShape } = require("../src/luau/custom/compat.ts");

const ast = parseLuau("local x = 1");
assert.ok(normalizeLegacyNodeShape(ast), "compat layer should return a normalized AST");
```

- [ ] **Step 2: Run the compatibility test to verify it fails**

Run: `node test/luau-mask-globals.js`
Expected: FAIL once callers start consuming the new contract without compat

- [ ] **Step 3: Introduce a narrow compat adapter**

```ts
export function normalizeLegacyNodeShape<T>(node: T): T {
  return node;
}

export function isOfficialStyleChunk(node: unknown): boolean {
  return Boolean(node && typeof node === "object" && (node as { type?: string }).type === "Chunk");
}
```

```js
const { normalizeLegacyNodeShape } = require("./custom/compat.ts");

function parseLuau(source, options = {}) {
  return normalizeLegacyNodeShape(parseLuauCustom(source, options));
}
```

- [ ] **Step 4: Run caller regressions**

Run: `node test/luau-mask-globals.js`
Expected: PASS

Run: `node test/luau-rename.js`
Expected: PASS

Run: `node test/luau-vm.js`
Expected: PASS with `luau-vm: ok`

- [ ] **Step 5: Commit**

```bash
git add src/luau/custom/compat.ts src/luau/ast.js src/luau/index.js src/options.js test/luau-mask-globals.js test/luau-rename.js test/luau-vm.js
git commit -m "refactor: add luau ast compatibility layer"
```

### Task 6: Start migrating Luau transforms to TypeScript against the typed frontend

**Files:**
- Create: `src/luau/rename.ts`
- Create: `src/luau/maskGlobals.ts`
- Create: `src/luau/strings.ts`
- Modify: `src/luau/rename.js`
- Modify: `src/luau/maskGlobals.js`
- Modify: `src/luau/strings.js`
- Test: `test/luau-rename.js`
- Test: `test/luau-mask-globals.js`
- Test: `test/luau-long-strings.js`

- [ ] **Step 1: Write a failing transform import test**

```js
const assert = require("assert");

const rename = require("../src/luau/rename");
const maskGlobals = require("../src/luau/maskGlobals");
const strings = require("../src/luau/strings");

assert.ok(rename, "rename transform should still load");
assert.ok(maskGlobals, "maskGlobals transform should still load");
assert.ok(strings, "strings transform should still load");
```

- [ ] **Step 2: Run transform tests to verify they fail once TypeScript entry points are introduced**

Run: `node test/luau-rename.js`
Expected: FAIL before the `.js` wrappers point at real TS implementations

- [ ] **Step 3: Migrate the first transform wave**

```ts
export function renameLuau(ast: Chunk, ctx: RenameContext): Chunk {
  return ast;
}
```

```ts
export function maskGlobalsLuau(ast: Chunk, ctx: MaskGlobalsContext): Chunk {
  return ast;
}
```

```ts
export function stringEncode(ast: Chunk, ctx: StringEncodeContext): Chunk {
  return ast;
}
```

- [ ] **Step 4: Keep JavaScript wrapper modules compatible**

```js
module.exports = require("./rename.ts");
```

```js
module.exports = require("./maskGlobals.ts");
```

```js
module.exports = require("./strings.ts");
```

- [ ] **Step 5: Run transform regressions**

Run: `node test/luau-rename.js`
Expected: PASS

Run: `node test/luau-mask-globals.js`
Expected: PASS

Run: `node test/luau-long-strings.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/luau/rename.ts src/luau/maskGlobals.ts src/luau/strings.ts src/luau/rename.js src/luau/maskGlobals.js src/luau/strings.js
git commit -m "refactor: port initial luau transforms to typescript"
```

### Task 7: Finish repository-wide TypeScript migration after Luau core stabilization

**Files:**
- Modify: `src/index.js`
- Modify: `src/pipeline.js`
- Modify: `src/options.js`
- Modify: `src/utils/*.js`
- Create: `src/index.ts`
- Create: `src/pipeline.ts`
- Create: `src/options.ts`
- Test: `test/luau-vm.js`
- Test: `test/luau-api.js`
- Test: `test/obf-smoke.js`

- [ ] **Step 1: Write a failing top-level API test**

```js
const assert = require("assert");
const api = require("../src/index");

assert.ok(typeof api.obfuscate === "function", "top-level obfuscate API should still be exported");
```

- [ ] **Step 2: Run the top-level tests to verify they fail before entry-point migration is complete**

Run: `node test/obf-smoke.js`
Expected: FAIL if the top-level JS entry no longer matches the migrated TS implementation

- [ ] **Step 3: Port the top-level pipeline to TypeScript**

```ts
export async function obfuscate(source: string, options: Record<string, unknown>) {
  return source;
}
```

```ts
export function normalizeOptions(userOptions: Record<string, unknown>) {
  return userOptions;
}
```

- [ ] **Step 4: Keep stable CommonJS exports**

```js
module.exports = require("./index.ts");
```

```js
module.exports = require("./options.ts");
```

- [ ] **Step 5: Run end-to-end regressions**

Run: `node test/luau-api.js`
Expected: PASS

Run: `node test/obf-smoke.js`
Expected: PASS

Run: `node test/luau-vm.js`
Expected: PASS with `luau-vm: ok`

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/pipeline.ts src/options.ts src/index.js src/pipeline.js src/options.js src/utils
git commit -m "refactor: migrate top-level pipeline to typescript"
```

## Self-Review

### Spec coverage

- TypeScript foundation: covered by Task 1
- Typed Luau AST contract: covered by Task 2
- Parser/tokenizer migration: covered by Task 3
- Printer/validation/traversal migration: covered by Task 4
- Transform compatibility layer: covered by Task 5
- Luau transform migration: covered by Task 6
- Repository-wide TypeScript completion: covered by Task 7

### Placeholder scan

- Removed `TBD` / `TODO` language
- Each task names exact files
- Each task includes executable commands
- Each task includes concrete code snippets

### Type consistency

- `parseLuau`, `generateLuau`, and the frontend boundary are used consistently
- `Chunk`, `Identifier`, and `BaseNode` are referenced consistently across AST tasks
- Compatibility layer naming is consistent between Task 5 files and snippets

