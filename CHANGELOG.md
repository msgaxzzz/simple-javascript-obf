# Changelog

## [Unreleased]

## [1.2.2] - 2026-02-02
### Added
- Luau VM hardening: per-instruction key schedule, encoded opcode map generation, and lazy constant decoding.
- Luau VM debug mode (`--vm-debug`) to log virtualizer compile failures.
- Decoy VM runtime injection (`--vm-decoy-runtime`, `--vm-decoy-probability`, `--vm-decoy-strings`) to embed fake VM/runtime bait blocks that mislead static analysis.
- Symbol-heavy noise block injection (`--vm-symbol-noise`) to pad Luau VM output with meaningless symbol expressions.
- VM instruction fusion (`--vm-instruction-fusion`) to collapse common VM instruction sequences into single custom opcodes.
- Semantic misdirection (`--vm-semantic-misdirection`) to replace generated VM identifiers with misleading semantic-style names.
- Runtime state-coupled opcode matching (`--vm-dynamic-coupling`) so opcode dispatch depends on accumulated runtime state.
- Polymorphic ISA variants (`--vm-isa-polymorph`) to generate structurally distinct VM ISA shapes per obfuscation run.
- Fake dispatch-graph edges (`--vm-fake-edges`) to add unreachable branches to the sparse Luau VM dispatch graph.
- Numeric literal style control (`--vm-numeric-style <plain|mixed|chaos>`) for Luau VM output constants.

### Changed
- Luau VM call/return handling now uses stack-frame bases for less regular patterns.

## [1.2.1] - 2026-02-02
### Added
- Luau global masking to rewrite global reads via `_ENV[...]` for fewer exposed identifiers (`--mask-globals` / `--no-mask-globals`).

## [1.2.0] - 2026-02-02
### Added
- Luau CLI wrapper (`luau-obf`) and expanded CLI flags for Luau-specific VM/CFF/rename/string options.
- Luau obfuscation pipeline features: VM virtualization (multi-layer via `--vm-layers`), VM-CFF mode, anti-hook guard, dead-code filler, entry rewriting, and member encoding.
- Luau VM hardening: runtime bytecode split, runtime key masking, fake opcodes, and encrypted const pool decoding.
- Luau VM dispatch-graph style control (`--vm-dispatch-graph <auto|tree|sparse>`) and stack-protocol selection (`--vm-stack-protocol <auto|direct|api>`).
- Block-dispatch VM mode (`--vm-block-dispatch`) that hides the bytecode dispatch table inside opaque conditional blocks.
- Luau string splitting (fragmented decode + concat via `--strings-split`) and optional homoglyph rename mode (`--rename-homoglyphs`).
- `--strings-segment-size` to cap the number of entries per Luau string pool segment (default 120).
- `--strings-value-fallback` / `--no-strings-value-fallback` to control whether `StringLiteral.value` is used when the raw source is unavailable.
- Proxy-locals pass (`--proxify-locals` / `--no-proxify-locals`) to wrap Luau local variables inside single-entry table indirection.
- Footer padding (`--pad-footer`, `--pad-footer-blocks`) to append structurally-valid but unreachable fake Luau blocks after the real code.
- Numeric-literal-to-expression conversion (`--numbers-expr`, `--numbers-expr-threshold`, `--numbers-expr-inner`, `--numbers-expr-max-depth`) for Luau numeric constants.
- Constant-array extraction (`--const-array`, `--const-array-threshold`, `--const-array-strings-only`, `--const-array-shuffle`, `--const-array-rotate`, `--const-array-encoding`, `--const-array-wrapper`) to hoist Luau literals into an encoded, shuffled/rotated lookup table.
- Chunk-wrapping pass (`--wrap`, `--wrap-iterations`) to nest Luau source inside one or more closure layers.
- Custom Luau AST parser/backend replacing `luaparse` for full round-trip fidelity and extended Luau syntax support.
- Web UI language selector (JavaScript/Luau) with Luau-specific controls and file support.

## [1.1.1] - 2026-01-18
### Added
- Local web UI (`web/` + `webstart.js`) for uploading/pasting JavaScript and downloading obfuscated output.
- CLI flags to control string encoding for object keys, JSX attribute values, and template literal static chunks (`--no-strings-object-keys`, `--no-strings-jsx-attrs`, `--no-strings-template-chunks` and their `--force` counterparts).
- `--cff-downlevel` option to allow control-flow flattening to downlevel `let/const` to `var`.
- Output controls: `--no-minify` to skip Terser and `--beautify` to format minified output.
- Per-plugin timing output (`--timing` / `--no-timing`) printed to stderr after each obfuscation run (default on).

### Changed
- Updated README and interactive `bin/obf.sh` prompts to expose the new options.
- Refactored string encoding logic/runtime to reduce obvious literals while keeping behavior the same.
- Refreshed generated test fixtures to match the new outputs.

### Fixed
- Terser mangling now respects the rename toggle when minifying.
