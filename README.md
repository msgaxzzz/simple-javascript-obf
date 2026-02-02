# js-obf

A modular JavaScript and Luau obfuscation CLI with control-flow flattening (CFF) and optional VM virtualization.

## Features
- CLI input/output for JavaScript and Luau projects (including a dedicated `luau-obf` wrapper)
- AST-level obfuscation: identifier renaming, string encryption, dead-code injection, control-flow flattening
- JavaScript output minified via Terser (disable with `--no-minify`)
- Optional VM virtualization (both JS + Luau, with Luau VM-CFF support)
- Optional anti-hook runtime guard
- VM opcode randomization, fake opcode insertion, runtime bytecode keying/splitting, and const pool decoding
- Luau-specific options: member/key encoding, string splitting, globals/members rename, homoglyph rename mode
- Modular plugin architecture for easy extension

## Install
```
npm install
```

## Usage
```
node bin/js-obf input.js -o output.js --preset high --vm --seed my-seed
```

Supports stdin (use `-` as input):
```
cat input.js | node bin/js-obf - -o output.js
```

Luau (two options):
```
node bin/js-obf input.lua --lang luau -o output.obf.lua
```
or
```
node bin/luau-obf input.lua -o output.obf.lua
```

### Interactive script
Use the interactive script to choose features and specify input file/directory and output directory:
```
bash bin/obf.sh
```
If an input directory is provided, it will recursively obfuscate all `.js` files and overwrite them, automatically ignoring `node_modules` (also tolerates common misspellings of that directory name).
When string encryption is enabled, the script also prompts whether to skip encoding object literal keys, JSX attribute string values, or template literal static chunks.

## Web UI
Start the local web console (default port `6589`):
```
node webstart.js
```
Then open `http://localhost:6589` to upload or paste JavaScript/Luau, pick options, run obfuscation, and download results.

## CLI options
- `-o, --output <file>` Output file
- `--preset <high|balanced|low>` Preset strength (default `high`)
- `--no-rename` Disable variable renaming
- `--rename-globals` Rename global bindings (Luau)
- `--rename-members` Rename member/table keys (Luau)
- `--rename-homoglyphs` Use l/I/1 homoglyph alphabet (Luau)
- `--no-strings` Disable string encryption
- `--strings-split` Split long strings into fragments (Luau)
- `--strings-split-min <n>` Minimum length to split (Luau)
- `--strings-split-max-parts <n>` Maximum fragments (Luau)
- `--no-strings-object-keys` Skip encoding object literal keys
- `--strings-object-keys` Force encoding object literal keys
- `--no-strings-jsx-attrs` Skip encoding JSX attribute string values
- `--strings-jsx-attrs` Force encoding JSX attribute string values
- `--no-strings-template-chunks` Skip encoding template literal static chunks
- `--strings-template-chunks` Force encoding template literal static chunks
- `--no-cff` Disable control-flow flattening
- `--cff-downlevel` Allow CFF to downlevel `let/const` to `var`
- `--cff-mode <vm|classic>` Luau CFF mode (default `vm`)
- `--cff-opaque` Enable opaque predicates (default on)
- `--no-dead` Disable dead-code injection
- `--vm` Enable VM virtualization (see limitations)
- `--vm-layers <n>` VM layers (Luau)
- `--vm-include name1,name2` Only virtualize the specified function names
- `--vm-opcode-shuffle` Enable VM opcode random mapping (default on)
- `--no-vm-opcode-shuffle` Disable VM opcode random mapping
- `--vm-fake-opcodes <0-1>` Fake opcode injection probability (default 0.15)
- `--vm-bytecode` Enable VM bytecode runtime decryption (default on)
- `--no-vm-bytecode` Disable VM bytecode runtime decryption
- `--vm-consts` Enable VM const pool runtime decryption (default on)
- `--no-vm-consts` Disable VM const pool runtime decryption
- `--vm-runtime-key` Luau VM runtime key (default on)
- `--vm-runtime-split` Luau VM runtime split (default on)
- `--vm-downlevel` Allow VM to downlevel `let/const` to `var`
- `--anti-hook` Enable anti-hook runtime guard
- `--anti-hook-lock` Enable anti-hook and freeze built-in prototype chains
- `--seed <value>` PRNG seed
- `--ecma <version>` Terser output ECMAScript version (default 2020)
- `--sourcemap` Emit source map
- `--compact` Compact output
- `--no-minify` Skip Terser minification
- `--beautify` Beautify Terser output (multi-line, requires minify)
- `--lang <js|luau>` Select language (default `js`, inferred from `.lua/.luau`)
- `--luau-parser <luaparse|custom>` Luau parser backend (default `luaparse`)

Default output is ES2020 to support optional chaining/nullish coalescing. For older targets, set `--ecma 2015` or `--ecma 5`.

## VM virtualization coverage
VM supports most common syntax while keeping performance and memory overhead reasonable:
- Control flow: `if/else`, `for/while/do-while`, `switch`, `break/continue`
- Exceptions: `try/catch/finally` (supports `throw`)
- `async/await` (only inside `async` functions)
- Variables: `var` (`let/const` are skipped by default; use `--vm-downlevel` to force)
- Parameters: defaults, rest params, parameter destructuring (object/array)
- Expressions: literals, member access, optional chaining/nullish coalescing, function calls, object/array literals (including spread), `new`, template strings, etc.

### VM limitations
- Generator function bodies are not virtualized (functions containing `yield` are skipped, but you can declare generators inside normal functions)
- Destructuring assignment expressions are not supported (only parameter/variable declaration destructuring)
- Complex or unsupported nodes are skipped for that function
- VM uses the `Function` constructor to create closures; CSP-restricted environments may not run

## Luau VM coverage
Luau VM targets common Luau syntax and will skip functions containing unsupported nodes:
- Statements: local/assignment, call, return, if/else, while/repeat, numeric and generic `for`, do-blocks, break/continue
- Expressions: literals, unary/binary, member/index, calls/method calls, tables, if-expr, type assertion, interpolated strings
- Skips: `goto/label`, vararg functions, nested functions

## Structure
- `src/index.js`: core API
- `src/pipeline.js`: plugin pipeline
- `src/luau/*`: Luau parser + obfuscation plugins
- `src/plugins/*`: obfuscation plugins
- `src/utils/*`: utilities and RNG
- `bin/js-obf`: CLI entry
- `bin/luau-obf`: Luau CLI wrapper

## License
MIT License. See `LICENSE`.

## Third-Party Notices
Some dependencies require preserving author and license notices. See `THIRD_PARTY_NOTICES.md`.
