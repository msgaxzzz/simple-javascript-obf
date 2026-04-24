# Luau Packed VM Shell Design

**Goal**

Add a new Luau-only VM option that can produce a packed, whole-program VM shell style closer to `Protected_1794780719677333.lua.txt`, while preserving current VM behavior when the option is not enabled.

**User Intent**

The new mode should make output look less like transformed source code and more like a packed loader plus VM runtime shell. The mode should prefer whole-program coverage by default, but still allow explicit `include`, `all`, and `topLevel` overrides. The result must still execute under `luau`.

## API

Add a new Luau VM option:

```js
vm: {
  enabled: true,
  shellStyle: "packed",
}
```

Semantics:

- Only meaningful for `lang: "luau"`.
- Default behavior in `shellStyle: "packed"` mode:
  - If the user does not explicitly set `vm.include`, `vm.all`, or `vm.topLevel`, treat the request as whole-program:
    - `vm.all = true`
    - `vm.topLevel = true`
- Mixed-mode override:
  - If the user explicitly provides `include`, `all`, or `topLevel`, respect that configuration and apply only the packed shell output style.
- Existing behavior remains unchanged when `shellStyle` is absent.

## Output Style

Packed shell mode should push output toward a protected-loader appearance without replacing the existing Luau VM compiler.

Desired visible traits:

- Output is compressed into a very small number of lines, ideally a single dominant loader line.
- The VM runtime and payload are wrapped in a packed loader instead of appearing as readable Luau function bodies.
- Introduce a decode stage that reconstructs packed fragments before execution.
- Introduce shell-level noise such as staged locals, synthetic state progression, and indirection around runtime/bootstrap setup.
- Keep the result deterministic for a fixed seed.

This mode is not required to exactly reproduce the reference file. The goal is the same family of appearance and reverse-engineering friction, not byte-for-byte imitation.

## Architecture

Use the existing Luau VM as the semantic core, then add a Luau-specific packed-shell postprocess layer after VM generation.

Pipeline shape:

1. Parse and run existing Luau transforms.
2. Run `rename` before VM when current rules require it.
3. Run `virtualizeLuau(...)` using current compiler/runtime generation.
4. If `vm.shellStyle === "packed"` for Luau, run a new packed-shell stage that:
   - serializes the VM-bearing output into packed chunks,
   - emits a packed loader/decoder/bootstrap wrapper,
   - re-injects the original VM program through the loader at runtime,
   - optionally adds shell-only decoy state and bootstrap indirection.
5. Continue with compatible downstream transforms only if they do not destabilize the packed shell.

This keeps semantic risk localized in one new stage instead of rewriting the VM compiler.

## Components

### 1. Option normalization

Files:

- `src/options.js`
- `src/luau/index.js`

Responsibilities:

- Normalize `vm.shellStyle`.
- Detect explicit user overrides for `include`, `all`, and `topLevel`.
- Apply packed-mode defaults only when the user left coverage unspecified.

### 2. Packed shell emitter

Files:

- `src/luau/vm.js`
- optionally a new helper such as `src/luau/vmPackedShell.js`

Responsibilities:

- Accept VM-generated Luau source or AST.
- Pack it into an encoded payload.
- Emit a Luau loader with decode/bootstrap logic and shell noise.
- Return parseable Luau that still runs through the rest of the pipeline.

### 3. Verification coverage

Files:

- `test/luau-vm.js`
- `test/generate-luau-hard-project.js`
- optionally a new focused regression fixture if needed

Responsibilities:

- Verify packed mode produces parseable output.
- Verify packed mode defaults to whole-program behavior when coverage is unspecified.
- Verify explicit `include`/`topLevel`/`all` overrides still work.
- Verify the hard-project output runs under `luau`.

## Data Flow

Normal mode:

- AST -> existing transforms -> optional VM -> existing output path

Packed shell mode:

- AST -> existing transforms -> VM output -> packed shell encoder -> packed loader Luau -> printer/output

The packed shell stage should operate after VM has already encoded semantics, so the shell is wrapping VM output rather than raw business source.

## Error Handling

- If `shellStyle: "packed"` is requested for non-Luau languages, ignore it or normalize it away without changing existing behavior.
- If packed-shell generation fails, surface a plugin-scoped error that clearly identifies the packed-shell stage.
- If downstream transforms are incompatible with packed mode, skip or reorder those transforms rather than emitting broken code.

## Compatibility Rules

- Do not change behavior for existing Luau users unless they opt into `vm.shellStyle = "packed"`.
- Respect explicit VM scope options from the caller.
- Keep current seed-based determinism behavior.
- Preserve ability to parse with the custom Luau parser and execute with `luau`.

## Testing Strategy

Minimum required checks:

1. A red-green regression in `test/luau-vm.js` for packed shell output.
2. A coverage-default test showing packed mode becomes whole-program when scope is unspecified.
3. A mixed-override test showing explicit `include` or `topLevel` still wins.
4. Regenerate `dist/luau-hard-project.obf.lua` with packed mode and run it with `luau`.

## Risks

- Packed shell mode may increase output size significantly.
- Extra decode/bootstrap logic may expose parser or runtime edge cases.
- Existing postprocess steps may need ordering changes to avoid corrupting packed output.
- Aggressive shell noise can make the output look stronger while also making it more fragile, so the first version should prioritize stable execution over maximal noise density.

## Recommendation

Implement `vm.shellStyle = "packed"` as a Luau-only option layered on top of the current VM backend. Default it to whole-program VM coverage only when the caller did not explicitly request a narrower scope. Start with a stable packed loader plus light shell noise, then iterate the appearance upward once tests and `luau` execution are green.
