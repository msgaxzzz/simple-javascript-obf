# Official Luau-Aligned Frontend Design

**Date**

2026-04-25

**Status**

Approved in chat for design direction, pending written-spec review

## Goal

Realign the project's custom Luau frontend around the current official Luau AST and parser model while continuing to own the implementation locally.

The target is not "generic TypeScript coverage." The target is:

- a custom frontend whose AST output is nearly structurally identical to the current official Luau frontend
- parser behavior and grammar coverage that track official Luau closely
- a migration path where existing transforms keep working through a temporary compatibility adapter
- eventual replacement of the current `TS facade + JS impl` checkpoint with real TypeScript implementations

## User Intent

The user explicitly wants:

- the official current Luau AST and parser shape used as the reference model
- the local custom implementation kept, not replaced with official binaries or an embedded native parser
- broad Luau grammar compatibility, including both type-system syntax and statement / expression extensions
- a compatibility-first migration path so transforms do not all break at once
- the final output to feel "the same as official Luau" at the AST and syntax level

The user explicitly chose:

- approach `A`: keep a local implementation, but make it match official Luau
- alignment level `2`: AST output should be almost completely identical to official Luau, except for minimal compatibility fields
- migration strategy `A`: use an official-shape AST plus a compat adapter for existing transforms
- syntax scope `C`: cover the full current official Luau grammar, not a narrow subset

## Official Reference Sources

The implementation should be aligned against the current upstream Luau sources:

- grammar reference: <https://luau.org/grammar/>
- AST definitions: <https://github.com/luau-lang/luau/blob/master/Ast/include/Luau/Ast.h>
- parser behavior: <https://github.com/luau-lang/luau/blob/master/Ast/src/Parser.cpp>
- lexer / parser support code in the same `Ast/` subtree where needed

Important correction: official Luau frontend code is implemented in C++, not C.

## Current Branch Context

The active migration branch at [`.worktrees/ts-luau-core`](/root/project/.worktrees/ts-luau-core) already completed a compatibility-first TypeScript checkpoint:

- TypeScript scaffolding exists
- declaration output is generated
- parser / tokenizer / printer / traversal / transforms / top-level pipeline now have TS facades
- runtime compatibility is preserved with `*-impl.js` files and thin CommonJS shims

This checkpoint is useful, but it is not yet the desired end state:

- many `.ts` files are still declaration facades over JavaScript runtime implementations
- the custom AST contract is only partially aligned with current official Luau
- public declarations are still weaker than the desired long-term typed surface

This design intentionally replaces the "facade-first end state" with a "true TS implementation aligned to official Luau" roadmap.

## Non-Goals

This work does not aim to:

- embed official native Luau parser binaries
- wrap or shell out to official tooling
- exactly mirror the upstream C++ class layout in TypeScript
- force every existing transform to consume the new official-shape AST immediately
- redesign unrelated obfuscation semantics while the frontend alignment is in progress

## Core Decision

The project should maintain a local frontend implementation, but its public AST and parsing behavior should be treated as an official-Luau compatibility target.

That means:

- official Luau grammar is the syntax source of truth
- official Luau AST concepts, node boundaries, and field semantics are the schema source of truth
- local TypeScript implementation details may differ internally
- compatibility helpers are allowed only where existing transforms still depend on the old custom shape

## Design Overview

### 1. Official-shape AST layer

The AST contract under [src/luau/custom](/root/project/.worktrees/ts-luau-core/src/luau/custom) should be redefined so the canonical parser output is an official-style Luau AST.

Canonical means:

- parser returns official-shape nodes first
- printer, validator, traversal, and diagnostics are defined against official-shape nodes
- transforms that still require legacy access patterns go through a dedicated compatibility adapter

The AST layer should align:

- node names
- field names
- location / range semantics
- distinction between statement, expression, type, and support nodes
- syntax ownership boundaries

Minimal compatibility fields may exist, but only if they are:

- clearly prefixed or isolated
- non-canonical
- removable once transforms are migrated

### 2. True TypeScript implementation layer

The existing `*-impl.js` files are a temporary checkpoint, not the target architecture.

The real migration target is:

- core frontend logic implemented directly in `.ts`
- thin `.js` shims only where runtime CommonJS compatibility must be preserved
- no long-lived JavaScript "impl" copies for parser, tokenizer, printer, compatibility layer, top-level pipeline, or migrated transforms

The implementation sequence should still be incremental, but each area should eventually land in real TypeScript rather than permanent facade wrappers.

### 3. Compat adapter between official AST and legacy transform expectations

Existing transforms should not be asked to consume the new official-shape AST all at once.

Instead, introduce a narrow compatibility adapter that translates:

- official-shape parser output
- into the legacy access conventions still expected by transform code

This adapter must be:

- explicit
- centralized
- testable
- removable

It should not become a second hidden AST model.

The adapter should only cover legacy compatibility needed by current transforms. It should not invent a new long-term hybrid schema.

### 4. Grammar coverage priority

The parser alignment target covers the full current official Luau grammar, but implementation order matters.

Priority order:

1. type-system and declaration syntax
2. statement / expression syntax extensions
3. diagnostics and recovery behavior
4. printer alignment and round-trip stability
5. transform migration off the compat layer

The first two areas matter most because they define the AST surface and syntax compatibility the rest of the branch depends on.

## Detailed Alignment Rules

### AST shape

The canonical AST should be "almost completely official" in these ways:

- node concepts must match official Luau concepts
- field names should use official terminology where available
- node ownership should not be optimized around transform convenience
- type syntax nodes should follow official boundaries rather than flattening them into shorthand custom structures

Acceptable deviations:

- `loc` / `range` support for JavaScript tooling ergonomics
- clearly isolated compatibility metadata needed by current transforms
- TypeScript-friendly wrappers around unions / interfaces where C++ class hierarchies do not map directly

Unacceptable deviations:

- keeping old custom field names as canonical output
- inventing transform-specific node kinds where official Luau already has a clear concept
- mixing official-shape and legacy-shape nodes in the same canonical parser output

### Parser behavior

The parser should align not only on acceptance / rejection, but also on how syntax is categorized.

This includes:

- declaration syntax
- type aliases and exported types
- type functions and generic parameter handling
- type packs / variadics
- if-expressions
- compound assignment
- attributes
- interpolated strings
- continue and other Luau-specific statements
- typed locals / functions / returns

Where exact official recovery behavior is impractical, diagnostics may be adapted, but only after syntax categorization and AST shape are aligned.

### Diagnostics

Diagnostics should trend toward official Luau expectations in:

- expected-token messaging
- source span accuracy
- syntax ownership

Exact string-for-string parity is not required in the first wave, but diagnostic structure and error location should improve as alignment work proceeds.

### Printer

The printer should operate on the official-shape AST and preserve round-trip correctness for the aligned grammar.

The printer is allowed to remain style-opinionated where the project needs compact output, but:

- it must understand the official-shape node set
- it must preserve constructs introduced by the aligned parser
- it must not depend on legacy node shortcuts once the canonical AST is changed

## File Strategy

### First-wave files to convert from facade state into true TS implementations

1. frontend schema and parser surface

- [src/luau/custom/nodes.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/nodes.ts)
- [src/luau/custom/types.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/types.ts)
- [src/luau/custom/locations.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/locations.ts)
- [src/luau/custom/diagnostic-types.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/diagnostic-types.ts)
- [src/luau/custom/parser.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/parser.ts)
- [src/luau/custom/tokenizer.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/tokenizer.ts)

2. parser support and canonical frontend boundary

- [src/luau/custom/index.js](/root/project/.worktrees/ts-luau-core/src/luau/custom/index.js)
- new `src/luau/custom/index.ts`
- [src/luau/custom/compat.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/compat.ts)

3. printer / traversal / validation after AST shape stabilizes

- [src/luau/custom/printer.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/printer.ts)
- [src/luau/custom/factory.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/factory.ts)
- [src/luau/custom/validate.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/validate.ts)
- [src/luau/custom/traverse.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/traverse.ts)
- [src/luau/custom/walk.ts](/root/project/.worktrees/ts-luau-core/src/luau/custom/walk.ts)

### Second-wave files

Once the official-shape AST and compat layer are stable:

- [src/luau/index.js](/root/project/.worktrees/ts-luau-core/src/luau/index.js) plus new `src/luau/index.ts`
- [src/luau/rename.ts](/root/project/.worktrees/ts-luau-core/src/luau/rename.ts)
- [src/luau/maskGlobals.ts](/root/project/.worktrees/ts-luau-core/src/luau/maskGlobals.ts)
- [src/luau/strings.ts](/root/project/.worktrees/ts-luau-core/src/luau/strings.ts)

### Final-wave files

After the frontend and transform layers are stable:

- [src/index.ts](/root/project/.worktrees/ts-luau-core/src/index.ts)
- [src/pipeline.ts](/root/project/.worktrees/ts-luau-core/src/pipeline.ts)
- [src/options.ts](/root/project/.worktrees/ts-luau-core/src/options.ts)

The top-level pipeline should not be finalized until the frontend and transform contracts stop moving.

## Data Flow

Target final data flow:

1. source text enters tokenizer / parser
2. parser emits canonical official-shape AST
3. optional compat adapter derives legacy-friendly view for still-legacy transforms
4. transforms progressively move to consume official-shape AST directly
5. printer consumes official-shape AST
6. top-level API exposes typed package entrypoints and declarations

This keeps a single canonical AST model and prevents every layer from inventing its own shape.

## Error Handling

The aligned parser should:

- reject unsupported syntax with consistent diagnostics
- preserve accurate location data
- make unsupported `luaVersion`-style compatibility errors explicit where that API still exists

The compat adapter should fail loudly if it receives nodes that are not canonical official-shape roots.

Transforms should continue to assume valid AST input, but adapter-level validation should help catch schema drift early during migration.

## Testing Strategy

### Parser / AST alignment tests

Add dedicated tests that compare the custom frontend's behavior against official-Luau expectations for:

- accepted grammar samples
- rejected grammar samples
- node shape snapshots for key syntax families
- location / range semantics

### Compatibility tests

Retain and expand tests ensuring:

- official-shape AST can still flow through current transforms via compat adapter
- legacy transforms do not need local AST hacks

### Declaration tests

Strengthen declaration tests so they validate:

- package-level TS entrypoints
- public Luau-facing APIs
- custom frontend typed exports

Direct deep-import declaration checks alone are not enough.

### End-to-end regressions

Retain the current runtime regressions:

- [test/luau-custom-roundtrip.js](/root/project/.worktrees/ts-luau-core/test/luau-custom-roundtrip.js)
- [test/luau-cff.js](/root/project/.worktrees/ts-luau-core/test/luau-cff.js)
- [test/luau-advanced.js](/root/project/.worktrees/ts-luau-core/test/luau-advanced.js)
- [test/luau-mask-globals.js](/root/project/.worktrees/ts-luau-core/test/luau-mask-globals.js)
- [test/luau-rename.js](/root/project/.worktrees/ts-luau-core/test/luau-rename.js)
- [test/luau-long-strings.js](/root/project/.worktrees/ts-luau-core/test/luau-long-strings.js)
- [test/luau-api.js](/root/project/.worktrees/ts-luau-core/test/luau-api.js)
- [test/obf-smoke.js](/root/project/.worktrees/ts-luau-core/test/obf-smoke.js)
- [test/luau-vm.js](/root/project/.worktrees/ts-luau-core/test/luau-vm.js)

## Risks

### 1. Official AST alignment may break transform assumptions

Mitigation:

- keep the compat adapter explicit
- migrate transforms in layers
- add targeted AST-shape regression tests

### 2. Printer may lag parser alignment

Mitigation:

- freeze canonical AST first
- update printer after syntax / node boundaries stabilize
- keep round-trip tests active throughout

### 3. Official Luau source may continue evolving

Mitigation:

- treat upstream AST / parser files as the reference source
- document the exact upstream commit or revision used for each alignment wave in implementation plans

### 4. Facade-based checkpoint may conflict with the new target

Mitigation:

- treat current `*-impl.js` files as transitional only
- explicitly plan their deletion or absorption into `.ts`
- avoid strengthening the temporary facade architecture further unless needed for transition safety

## Recommendation

Proceed with an implementation plan centered on:

1. official Luau AST contract alignment
2. parser / tokenizer true TypeScript implementation against that contract
3. explicit compat adapter for current transforms
4. transform migration off the compat adapter
5. package-level TypeScript surface cleanup

This is the most direct path to what the user asked for:

- not a native wrapper
- not a generic TS facade layer
- a real local TypeScript frontend that behaves like current official Luau
