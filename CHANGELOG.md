# Changelog

## [Unreleased] - 2026-01-18
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
