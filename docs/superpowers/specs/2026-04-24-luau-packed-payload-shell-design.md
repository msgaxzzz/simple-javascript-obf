# Luau Packed Payload Shell Design

**Date**

2026-04-24

**Status**

Approved in chat, pending final spec review before implementation

## Goal

Rework Luau `vm.shellStyle = "packed"` so the output looks materially closer to `Protected_1794780719677333.lua.txt` without sacrificing execution stability on the hard Luau project.

The new packed mode should:

- Hide the VM program body from direct visual inspection.
- Stop exposing stable VM helper names such as `authorize_purchase_flow` and `refresh_payment_session_*`.
- Keep the result executable under `luau`.
- Preserve the current Luau VM semantics.
- Stay within the current output size guard for the hard project.

## User Intent

The user wants packed Luau output that is visibly closer to commercial/protected loader shells, especially in the sense that the real VM-bearing body is no longer plainly readable inside the emitted file.

The user explicitly chose:

- Priority: `balanced`
- Primary concealment target: VM body text, not maximum shell chaos
- Payload style: `Base-N payload + small decoder`

That means this design should prefer readable engineering tradeoffs and hard-project stability over maximal shell theatrics.

## Non-Goals

This design does not aim to:

- Perfectly reproduce `Protected_1794780719677333.lua.txt`
- Create cryptographic protection
- Rewrite the core Luau VM compiler
- Add a second VM layer

The goal is a stronger packed-shell presentation with materially less readable payload text.

## Current Problems

### 1. Plaintext body leakage

Current packed mode still embeds the generated Luau body in directly readable form, only chunked and wrapped.

### 2. Fixed VM helper aliases

The Luau VM currently emits recognizable helper names from a fixed alias pool in [vm.js](/root/project/src/luau/vm.js). These create a visible fingerprint across builds.

### 3. Packed shell size risk

Earlier byte-array packing made the hard project too large and triggered fallback behavior. Any new design must preserve a tighter size profile.

### 4. Custom parser sensitivity

The custom Luau parser is sensitive to some packed literal boundary shapes. The packed payload format must remain parseable by:

- the custom Luau parser
- the `luau` runtime

## Chosen Approach

Use a Luau-only packed payload stage that converts the final VM-bearing Luau program into a compact Base-N text payload, then reconstructs the original source through a small runtime decoder before executing it with `loadstring or load`.

This keeps the current VM pipeline intact and only changes the final shell representation.

## Architecture

### Pipeline

1. Parse source and run current Luau transforms.
2. Run rename and VM passes as today.
3. Generate the final VM-bearing Luau program text.
4. If `vm.shellStyle === "packed"`, encode that final text into a compact Base-N payload.
5. Emit a single-line dominant loader that:
   - stores the payload
   - stores the alphabet table or compact decode mapping
   - decodes the payload into the original Luau body
   - executes the decoded body through `loadstring or load`

### Why encode the final text instead of AST/bytecode

- Lowest implementation risk
- Minimal disruption to the existing VM compiler
- Easier to verify against the hard-project regression
- Easier to bound output size than previous byte-array packing

## Payload Format

### Recommended encoding shape

Use a compact Base-N encoding based on a fixed alphabet chosen for:

- parser-safe characters
- good density
- easy deterministic decode in Luau

The payload should be represented as a compact string, not a numeric byte table and not plaintext source chunks.

### Decoder shape

The emitted shell should:

- declare a compact alphabet
- build a reverse map or direct decode table
- walk the payload string
- reconstruct bytes or character groups
- concatenate decoded fragments
- call `loadstring or load`

### Loader appearance goals

The shell should visually trend toward:

- one dominant loader line
- staged locals
- decode-first structure
- no visible plaintext VM body

The shell does not need to fully imitate the reference file's exact style. It only needs to be recognizably closer to that family than the current plaintext chunk wrapper.

## VM Helper Alias Randomization

The fixed alias pool in [vm.js](/root/project/src/luau/vm.js) should be replaced with seed-driven randomized helper names.

Requirements:

- deterministic for a given seed
- valid Luau identifiers
- no fixed human-readable word stems
- no collisions inside one build

This randomization applies to VM helper aliases only. It should not alter existing semantic behavior.

## Output Constraints

The packed shell must satisfy all of the following:

- No `__obf_` loader variable prefix exposure
- No directly readable plaintext VM body chunks
- No fixed VM helper names from the old alias list
- Hard-project packed output remains below the current maximum output size threshold when feasible
- If size fallback still becomes necessary, it should be explicit and deterministic

## Error Handling

If packed payload encoding fails:

- throw a packed-shell scoped error with a clear message

If encoded output exceeds the Luau output size guard:

- either fall back to the compact non-packed body path, or
- surface a deterministic size error if fallback would violate the user's packed expectation

Implementation should prefer preserving execution success on the hard project.

## Testing Strategy

### Required regressions

Add or update tests in [test/luau-vm.js](/root/project/test/luau-vm.js) to verify:

1. Packed shell still executes for a small whole-program case.
2. Packed shell no longer exposes `__obf_` loader identifiers.
3. Packed shell no longer emits plaintext body chunks with visible escaped newline reconstruction.
4. Packed shell no longer exposes fixed VM helper aliases.
5. Hard-project packed output remains parseable by the custom parser.
6. Hard-project packed output executes under `luau`.

### Required hard-project verification

Run:

- `node test/generate-luau-hard-project.js`
- `luau dist/luau-hard-project.obf.lua`
- `node test/luau-debug.js`

Optionally re-run:

- `node test/luau-vm.js`

### Success criteria

The new packed output is acceptable when:

- the hard project executes correctly
- the emitted shell still uses a packed loader path
- the VM-bearing body is not plainly readable in output
- fixed helper names are gone

## Files To Change

- [src/luau/index.js](/root/project/src/luau/index.js)
  - replace plaintext packed chunk emitter with Base-N payload emitter
  - keep parser-safe packed shell formatting

- [src/luau/vm.js](/root/project/src/luau/vm.js)
  - replace fixed helper alias naming with deterministic randomized aliases

- [test/luau-vm.js](/root/project/test/luau-vm.js)
  - extend packed-shell regressions for payload concealment and helper alias concealment

## Risks

### Size growth

Even a compact Base-N payload can grow output. The hard project remains the controlling regression.

### Decode bugs

Any mismatch in alphabet or group decoding will break runtime execution. Small focused tests must be used before the hard-project run.

### Parser compatibility

The custom parser has already shown sensitivity to some packed literal layouts. The shell emitter must favor parser-safe string forms.

## Recommendation

Implement a balanced packed shell that encodes the final VM-bearing Luau program as a compact Base-N payload with a small Luau decoder, while also randomizing VM helper aliases. This gives the user the main visual property they want, namely that the important body text is no longer directly readable, without jumping to a more fragile multi-layer shell design.
