# Changelog

## [Unreleased]

## [1.2.2] - 2026-02-02
### Added
- Luau VM hardening: per-instruction key schedule, encoded opcode map generation, and lazy constant decoding.
- Luau VM debug mode (`--vm-debug`) to log virtualizer compile failures.

### Changed
- Luau VM call/return handling now uses stack-frame bases for less regular patterns.

## [1.2.1] - 2026-02-02
### Added
- Luau global masking to rewrite global reads via `_ENV[...]` for fewer exposed identifiers.

## [1.2.0] - 2026-02-02
### Added
- Luau CLI wrapper (`luau-obf`) and expanded CLI flags for Luau-specific VM/CFF/rename/string options.
- Luau obfuscation pipeline features: VM virtualization (multi-layer), VM-CFF mode, anti-hook guard, dead-code filler, entry rewriting, and member encoding.
- Luau VM hardening: runtime bytecode split, runtime key masking, fake opcodes, and encrypted const pool decoding.
- Luau string splitting (fragmented decode + concat) and optional homoglyph rename mode.
- Web UI language selector (JavaScript/Luau) with Luau-specific controls and file support.

## [1.1.1] - 2026-01-18
### Added
- Local web UI (`web/` + `webstart.js`) for uploading/pasting JavaScript and downloading obfuscated output.
- CLI flags to control string encoding for object keys, JSX attribute values, and template literal static chunks.
- `--cff-downlevel` option to allow control-flow flattening to downlevel `let/const` to `var`.
- Output controls: `--no-minify` to skip Terser and `--beautify` to format minified output.

### Changed
- Updated README and interactive `bin/obf.sh` prompts to expose the new options.
- Refactored string encoding logic/runtime to reduce obvious literals while keeping behavior the same.
- Refreshed generated test fixtures to match the new outputs.

### Fixed
- Terser mangling now respects the rename toggle when minifying.
