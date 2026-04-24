# TypeScript Luau Core Alignment Design

**Date**

2026-04-24

**Status**

Approved in chat for approach 1, pending written-spec review

## Goal

Rewrite the project toward TypeScript, starting with the Luau pipeline, while keeping the custom Luau AST/parser implementation and upgrading it so its structure, semantics, diagnostics, and printer behavior align as closely as practical with official Luau conventions.

## User Intent

The user does **not** want to replace the custom Luau parser with an official binary or external official parser library.

The user wants:

- the project rewritten in TypeScript
- the Luau core migrated first
- the custom AST/parser improved so it behaves and reads like the official Luau implementation
- the resulting AST contracts to stop feeling “custom for its own sake”

## Current Project Context

The repository is currently a CommonJS JavaScript project with:

- package entry points in [package.json](/root/project/package.json)
- a mixed JavaScript/Luau obfuscation pipeline rooted at [src/index.js](/root/project/src/index.js), [src/pipeline.js](/root/project/src/pipeline.js), and [src/options.js](/root/project/src/options.js)
- a large Luau-specific pipeline under [src/luau](/root/project/src/luau)
- a custom Luau frontend under [src/luau/custom](/root/project/src/luau/custom)

The custom Luau frontend currently owns:

- tokenization
- parsing
- AST construction helpers
- traversal and validation
- printing
- CFG / SSA / IR helpers

Many Luau transforms and tests assume the current custom AST shape directly.

## Non-Goals

This effort does not aim to:

- embed or depend on official Luau parser binaries
- rewrite the VM backend semantics in the first phase
- redesign every obfuscation pass before the TypeScript migration starts
- make the custom AST byte-for-byte identical to official internal Luau C++ structures where that would harm JavaScript/TypeScript ergonomics without behavior benefit

## Options Considered

### Option 1: Gradual migration, Luau core first

Convert the Luau core to TypeScript first, establish an official-style AST contract, then migrate the surrounding Luau transforms and finally the rest of the repository.

**Pros**

- lowest migration risk
- lets the highest-risk parser/printer work settle before broad TypeScript conversion
- avoids retyping the same AST assumptions twice
- keeps CLI compatibility while the core evolves

**Cons**

- temporary mixed `.js` and `.ts` repository state
- requires short-term compatibility layers

### Option 2: Whole-repo TypeScript first, Luau core later

Convert the general project scaffolding to TypeScript first and defer the parser/AST redesign.

**Pros**

- faster repository-wide TypeScript adoption
- simpler initial tooling shift

**Cons**

- Luau core types would be provisional and likely wrong
- downstream transforms would need to be retyped again after AST alignment

### Option 3: One-shot full TypeScript + Luau AST redesign

Rewrite the project and Luau core in one large cutover.

**Pros**

- cleanest theoretical end state

**Cons**

- highest breakage risk
- too much surface area for one migration stream
- poor fit for the current dirty worktree and active Luau feature work

## Chosen Approach

Use **Option 1**.

The migration should be staged:

1. establish TypeScript tooling and runtime compatibility
2. migrate the custom Luau frontend to TypeScript
3. align the custom Luau AST/parser/printer with official Luau conventions
4. migrate the remaining Luau transform pipeline to TypeScript against the new typed AST contract
5. migrate the rest of the repository to TypeScript

## Architecture

### 1. TypeScript platform layer

Introduce a TypeScript build that preserves current CLI behavior and CommonJS-compatible runtime entry points during migration.

The platform layer should:

- add a `tsconfig` that supports incremental migration
- compile source into a predictable output directory
- keep existing bin entry points working
- allow JavaScript files to coexist temporarily while TypeScript coverage grows

### 2. Official-style Luau AST contract

Define a new typed AST contract that keeps the custom implementation but aligns it to official Luau naming and structure wherever practical.

Alignment means:

- node kinds and field names should prefer official Luau terminology
- location and diagnostics data should behave like official parser outputs
- syntax constructs should be represented with the same conceptual boundaries as official Luau
- parser output and printer output should round-trip with official-style expectations

This is a behavior and schema alignment target, not a binary-compatibility target.

### 3. Luau frontend boundary

The Luau frontend should be treated as a stable internal package with a clear surface:

- `parseLuau`
- `generateLuau`
- diagnostics / validation
- traversal / walking
- factory helpers
- CFG / SSA / IR entry points

Everything outside [src/luau/custom](/root/project/src/luau/custom) should depend on that surface, not on parser internals.

### 4. Transform compatibility layer

During migration, transforms in [src/luau](/root/project/src/luau) will need an adapter layer so existing passes can keep working while node shapes and helper contracts are normalized.

This compatibility layer should be temporary and intentionally narrow:

- normalize old-to-new node access where necessary
- centralize AST shape translation
- prevent every transform from inventing local compatibility hacks

### 5. Repository-wide TypeScript migration

Once the Luau core contract is stable, migrate:

- [src/luau](/root/project/src/luau) transforms
- shared utilities under [src/utils](/root/project/src/utils)
- top-level pipeline files like [src/index.js](/root/project/src/index.js), [src/pipeline.js](/root/project/src/pipeline.js), and [src/options.js](/root/project/src/options.js)

CLI entry points can remain thin JavaScript launchers if desired, but the application logic should move to TypeScript.

## File Strategy

### Luau core first

Primary first-wave files:

- [src/luau/custom/parser.js](/root/project/src/luau/custom/parser.js)
- [src/luau/custom/tokenizer.js](/root/project/src/luau/custom/tokenizer.js)
- [src/luau/custom/printer.js](/root/project/src/luau/custom/printer.js)
- [src/luau/custom/factory.js](/root/project/src/luau/custom/factory.js)
- [src/luau/custom/validate.js](/root/project/src/luau/custom/validate.js)
- [src/luau/custom/traverse.js](/root/project/src/luau/custom/traverse.js)
- [src/luau/custom/walk.js](/root/project/src/luau/custom/walk.js)
- [src/luau/custom/index.js](/root/project/src/luau/custom/index.js)
- [src/luau/ast.js](/root/project/src/luau/ast.js)
- [src/luau/index.js](/root/project/src/luau/index.js)

Recommended new TypeScript support files:

- `src/luau/custom/types.ts`
- `src/luau/custom/nodes.ts`
- `src/luau/custom/locations.ts`
- `src/luau/custom/diagnostic-types.ts`
- `src/luau/custom/compat.ts`

These files should separate:

- AST schema definitions
- factory creation helpers
- diagnostics contracts
- temporary compatibility helpers

### Later migration waves

After the frontend is stable, move:

- [src/luau/rename.js](/root/project/src/luau/rename.js)
- [src/luau/maskGlobals.js](/root/project/src/luau/maskGlobals.js)
- [src/luau/strings.js](/root/project/src/luau/strings.js)
- [src/luau/cff.js](/root/project/src/luau/cff.js)
- [src/luau/vm.js](/root/project/src/luau/vm.js)
- [src/luau/wrap.js](/root/project/src/luau/wrap.js)
- remaining Luau passes and shared utilities

## AST Alignment Rules

The custom Luau AST should adopt these rules:

1. Prefer official Luau conceptual node boundaries over transform-convenient shortcuts.
2. Represent syntax explicitly rather than encoding parser assumptions in ad hoc booleans when official Luau treats the construct as a distinct shape.
3. Keep source locations on all parse-originating nodes that official diagnostics would naturally reference.
4. Keep diagnostics deterministic and positionally accurate.
5. Keep printer output stable and canonical enough for regression tests.

Where exact internal official parity would create awkward or noisy TypeScript APIs, the implementation may deviate, but every deviation should be intentional and documented in the AST contract notes.

## Migration Phases

### Phase 1: TypeScript foundation

- add TypeScript compiler configuration
- define module resolution and output layout
- keep runtime entry points compatible
- allow mixed JS/TS until migration completes

### Phase 2: Typed Luau AST contract

- define all core node interfaces and discriminated unions
- type locations, tokens, diagnostics, visitors, and printer contracts
- freeze a first compatible AST contract before broad transform migration

### Phase 3: Parser / tokenizer / printer rewrite in TypeScript

- migrate tokenizer
- migrate parser
- migrate factory and validation helpers
- migrate printer and traversal helpers
- preserve behavior with explicit regression coverage

### Phase 4: Luau transform migration

- migrate each transform to TypeScript
- remove direct dependency on parser internals
- narrow compatibility shims over time

### Phase 5: Repository-wide TypeScript completion

- migrate non-Luau pipeline code
- migrate shared utilities
- reduce remaining JavaScript files to optional CLI/bootstrap wrappers only

## Testing Strategy

The migration must preserve existing behavior through staged regression coverage.

Testing should include:

- existing Luau parser/printer tests
- existing transform tests under `test/luau-*.js`
- round-trip parse -> print -> parse stability cases
- diagnostic location tests
- compatibility tests for packed-shell and VM-bearing output
- focused AST schema tests for official-style node shapes

The first migration stages should prioritize parser/printer/diagnostic regression tests before broad transform rewrites.

## Risks

### AST churn risk

Many transforms currently depend on current custom node details. AST realignment will ripple through rename, masking, VM, wrap, strings, and related passes.

### Printer/parser mismatch risk

If parser and printer are migrated separately without a clear shared contract, round-trip behavior will destabilize quickly.

### Mixed-module risk

During migration, the repository will temporarily mix CommonJS JavaScript and TypeScript outputs. Build and test commands must stay explicit and boring.

### Scope risk

“Rewrite the whole project in TypeScript” is too large for a single unsafe implementation pass. The phased plan is required to keep this tractable.

## Recommendation

Proceed with a phased TypeScript migration that starts by defining and implementing a typed, official-style custom Luau frontend. Treat AST contract alignment as the foundation, not a side effect. Once the Luau frontend contract is stable, migrate the Luau transforms and only then finish the rest of the repository.
