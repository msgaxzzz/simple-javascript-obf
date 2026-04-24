# Luau Transform Debug Design

## Goal

Add a developer-only Luau transform debug facility that records how each Luau pass changes the program. The feature is meant for internal debugging only and should stay off by default.

The system should answer:

- Which Luau pass first introduced a bad transformation?
- What AST looked like before and after each pass?
- What concrete nodes or symbols changed?
- For complex passes, why a change happened or why a change was skipped?

## Scope

In scope:

- Luau pipeline only
- One debug output directory per obfuscation run
- One subdirectory per Luau pass
- Full pass-level AST snapshots before and after each pass
- Structured per-pass change logs
- Optional per-pass trace logs for high-value decisions
- Pass whitelist support
- Best-effort debug output even when a pass fails

Out of scope for the first version:

- Non-Luau pipelines
- User-facing debug UX
- Environment-variable based enablement
- Disk or performance optimization
- Streaming logs or live viewers

## User Requirements

- The feature is enabled only through code-level options.
- Debug output is developer-oriented and should not be encouraged for normal users.
- The debug mode may be slow and produce large files.
- When enabled, the default behavior records all Luau passes.
- It must also support recording only a whitelist of Luau passes.

## Recommended Approach

Use a hybrid design:

- A unified pass wrapper captures standard artifacts for every Luau pass.
- Individual passes may emit explicit trace events for decision-heavy logic.

This is preferred over a pure wrapper because it gives full pipeline coverage immediately while still allowing high-value reasoning traces in complex passes like `rename`, `maskGlobals`, `strings`, and `vm`.

This is preferred over AST proxy instrumentation because proxying AST mutation is much more invasive and likely to perturb existing pass behavior.

## High-Level Architecture

### Run-Level Debug Context

When `debugLuauTransforms.enabled` is true, Luau obfuscation creates a run-level debug context with:

- a `runId`
- a resolved output root
- selected pass whitelist or full-pass mode
- shared recorder methods
- run metadata

The output root is:

```text
dist/.luau-debug/<run-id>/
```

### Pass Wrapper

Every Luau pass executes through a wrapper that:

1. checks whether the pass should be recorded
2. writes pass start metadata
3. snapshots AST before the pass
4. runs the pass
5. snapshots AST after the pass
6. computes change records
7. writes trace events if the pass emitted any
8. writes pass end metadata or error metadata

Passes that are not in the selected whitelist still run normally. The whitelist controls recording, not transform execution.

### Pass-Level Trace Hooks

Complex passes may call the recorder directly to emit decision events. This is especially useful where a bad transformation is caused by internal classification logic rather than a simple syntax rewrite.

Expected early adopters:

- `rename`
- `maskGlobals`
- `strings`
- `vm`

## Public Option Shape

Add a Luau debug option shaped like:

```js
debugLuauTransforms: {
  enabled: true,
  passes: ["rename", "vm"],
  outputDir: "dist/.luau-debug",
  includeAst: true,
  includeChanges: true,
  includeTrace: true
}
```

### Semantics

- `enabled`
  - Master switch.
  - Default is `false`.

- `passes`
  - Optional whitelist of pass names to record.
  - Missing or empty means record all Luau passes.

- `outputDir`
  - Root debug directory.
  - Actual output path is `<outputDir>/<run-id>/`.

- `includeAst`
  - Write `before-ast.json` and `after-ast.json`.
  - In the selected design, debug mode defaults to keeping these on.

- `includeChanges`
  - Write `changes.json`.

- `includeTrace`
  - Write `trace.json` when a pass emits trace events.

## Directory Layout

```text
dist/.luau-debug/<run-id>/
  meta.json
  pass-order.json
  01-parse/
    meta.json
    before-ast.json
    after-ast.json
    changes.json
  02-mask-globals/
    meta.json
    before-ast.json
    after-ast.json
    changes.json
  03-rename/
    meta.json
    before-ast.json
    after-ast.json
    changes.json
    trace.json
  04-strings/
    meta.json
    before-ast.json
    after-ast.json
    changes.json
    trace.json
  05-vm/
    meta.json
    before-ast.json
    after-ast.json
    changes.json
    trace.json
```

Pass directory names should preserve execution order with a numeric prefix so the filesystem view matches pipeline order.

## File Formats

### Run `meta.json`

Records global run information:

- `runId`
- `timestamp`
- `inputFilename`
- `seed`
- `luauOptions`
- `selectedPasses`
- `version`

### `pass-order.json`

Records the ordered list of Luau passes and their status:

- `passName`
- `index`
- `directory`
- `recorded`
- `status`
  - `completed`
  - `failed`
  - `skipped-after-failure`
- `durationMs`

### Pass `meta.json`

Records pass-local information:

- `passName`
- `index`
- `enabled`
- `startedAt`
- `finishedAt`
- `durationMs`
- `inputHash`
- `outputHash`
- `astNodeCountBefore`
- `astNodeCountAfter`
- `traceHookEnabled`

### `before-ast.json` and `after-ast.json`

These store the full Luau AST snapshot before and after the pass.

The initial implementation uses full AST serialization without truncation.

### `changes.json`

Stores an array of structured change events.

Example:

```json
{
  "id": "chg-000123",
  "pass": "rename",
  "kind": "rename-member",
  "nodeType": "MemberExpression",
  "path": "body[12].body[3].init[0].base.identifier",
  "loc": {
    "start": { "line": 42, "column": 17 },
    "end": { "line": 42, "column": 21 }
  },
  "before": {
    "summary": "deps",
    "node": {}
  },
  "after": {
    "summary": "_X7EqX",
    "node": {}
  },
  "reason": "memberMap rename applied",
  "tags": ["member", "rename", "deterministic"]
}
```

Required fields:

- `id`
- `pass`
- `kind`
- `nodeType`
- `path`
- `before`
- `after`

Optional fields:

- `loc`
- `reason`
- `tags`

### `trace.json`

Stores an array of decision events generated by explicit pass hooks.

Example:

```json
{
  "id": "trace-000045",
  "pass": "rename",
  "phase": "isDynamicMapRecordAccess",
  "decision": true,
  "subject": "self.nodes[name]",
  "context": {
    "basePath": "self.nodes",
    "matchedSet": "dynamicIndexRecordBaseNames",
    "scopeSafe": true
  },
  "reason": "dynamic index assignment to table constructor detected earlier"
}
```

`changes.json` answers what changed. `trace.json` answers why the pass made or skipped a decision.

## Change Capture Strategy

### Baseline

All recorded passes should get:

- AST before snapshot
- AST after snapshot
- pass metadata

### Automatic Change Generation

The wrapper should compute a baseline `changes.json` from AST diffing between the two snapshots.

This gives immediate whole-pipeline coverage without requiring every pass to emit custom events.

### Explicit Trace Generation

High-value passes may emit extra trace events for complex classification or skip logic.

Examples:

- why a member rename was skipped
- why an access was classified as dynamic-map-backed
- why VM emission chose a fallback path
- why a string literal was encoded or left alone

## Failure Behavior

The debug system must be best-effort and must not break normal Luau obfuscation by itself.

Rules:

1. If a Luau pass fails, write all debug artifacts collected so far for that pass.
2. Write `error.json` in the failing pass directory with error message, stack, and pass metadata.
3. Mark that pass as `failed` in `pass-order.json`.
4. Mark later passes as `skipped-after-failure`.
5. If debug writing itself fails, do not fail the obfuscation pipeline solely because of the debug facility.
6. Debug write failures may emit a developer-facing warning, but should not replace the original transform error.

## Testing Strategy

Add targeted tests for:

- debug mode disabled produces no debug directory
- debug mode enabled creates run directory and pass directories
- full-pass mode records every Luau pass
- whitelist mode records only selected passes
- `before-ast.json`, `after-ast.json`, `changes.json`, and `meta.json` exist where expected
- `trace.json` exists for passes with hooks
- failing pass still produces `error.json` and partial artifacts
- debug writer failure does not mask the original transform failure

## Implementation Order

### Phase 1

- Add run-level debug context
- Add pass wrapper
- Emit run `meta.json`
- Emit `pass-order.json`
- Emit per-pass `meta.json`
- Emit `before-ast.json`
- Emit `after-ast.json`

### Phase 2

- Add AST diff based `changes.json`

### Phase 3

- Add explicit `trace.json` hook support
- Integrate first with `rename`

### Phase 4

- Add hooks to `maskGlobals`
- Add hooks to `strings`
- Add hooks to `vm`

## Risks

- Full AST snapshots can become extremely large.
- Full snapshots and diffing can significantly slow Luau obfuscation.
- AST diff quality determines how useful `changes.json` is.
- Trace hooks can drift if pass internals evolve without keeping debug semantics current.

These risks are acceptable in the selected design because the feature is developer-only, disabled by default, and optimized for completeness rather than cost.

## Success Criteria

The feature is successful when a developer can enable one code-level option and answer all of the following without adding ad-hoc print statements:

- which Luau pass first changed behavior
- what exact AST shape changed in that pass
- what node or symbol changed
- why the pass made that decision when trace hooks are available
