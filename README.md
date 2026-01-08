# js-obf

A modular JavaScript obfuscation CLI with control-flow flattening (CFF) and optional VM virtualization.

## Features
- CLI input/output for Node.js and browser-targeted bundles
- AST-level obfuscation: variable renaming, string encryption (Base64 + custom stream cipher / polymorphic variants), dead-code injection, control-flow flattening
- Always runs Terser compression on output
- Optional VM virtualization (covers common syntax; see limitations)
- Optional anti-hook runtime guard (detects tampering of common built-ins)
- VM opcode mapping randomization and mask obfuscation, fake opcode injection (configurable via `vm.opcodeShuffle` / `vm.fakeOpcodes`)
- VM bytecode runtime decryption (can be disabled via `vm.bytecodeEncrypt`)
- VM const pool runtime decryption (can be disabled via `vm.constsEncrypt`)
- Highly modular plugin architecture for easy extension

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

### Interactive script
Use the interactive script to choose features and specify input file/directory and output directory:
```
bash bin/obf.sh
```
If an input directory is provided, it will recursively obfuscate all `.js` files and overwrite them, automatically ignoring `node_modules` (also tolerates common misspellings of that directory name).

## CLI options
- `-o, --output <file>` Output file
- `--preset <high|balanced|low>` Preset strength (default `high`)
- `--no-rename` Disable variable renaming
- `--no-strings` Disable string encryption
- `--no-cff` Disable control-flow flattening
- `--no-dead` Disable dead-code injection
- `--vm` Enable VM virtualization (see limitations)
- `--vm-include name1,name2` Only virtualize the specified function names
- `--vm-opcode-shuffle` Enable VM opcode random mapping (default on)
- `--no-vm-opcode-shuffle` Disable VM opcode random mapping
- `--vm-fake-opcodes <0-1>` Fake opcode injection probability (default 0.15)
- `--vm-bytecode` Enable VM bytecode runtime decryption (default on)
- `--no-vm-bytecode` Disable VM bytecode runtime decryption
- `--vm-consts` Enable VM const pool runtime decryption (default on)
- `--no-vm-consts` Disable VM const pool runtime decryption
- `--vm-downlevel` Allow VM to downlevel `let/const` to `var`
- `--anti-hook` Enable anti-hook runtime guard
- `--anti-hook-lock` Enable anti-hook and freeze built-in prototype chains
- `--seed <value>` PRNG seed
- `--ecma <version>` Terser output ECMAScript version (default 2020)
- `--sourcemap` Emit source map
- `--compact` Compact output

Default output is ES2020 to support optional chaining/nullish coalescing. For older targets, set `--ecma 2015` or `--ecma 5`.

## VM virtualization coverage
VM supports most common syntax while keeping performance and memory overhead reasonable:
- Control flow: `if/else`, `for/while/do-while`, `switch`, `break/continue`
- Exceptions: `try/catch/finally` (supports `throw`)
- `async/await` (only inside `async` functions)
- Variables: `var` (`let/const` are skipped by default; use `--vm-downlevel` to force)
- Parameters: defaults, rest params, parameter destructuring (object/array)
- Expressions: literals, member access, optional chaining/nullish coalescing, function calls, object/array literals, `new`, template strings, etc.

### VM limitations
- Generator function bodies are not virtualized (functions containing `yield` are skipped, but you can declare generators inside normal functions)
- `spread` (call/array/object) and object rest destructuring not supported
- Destructuring assignment expressions are not supported (only parameter/variable declaration destructuring)
- Complex or unsupported nodes are skipped for that function
- VM uses the `Function` constructor to create closures; CSP-restricted environments may not run

## Structure
- `src/index.js`: core API
- `src/pipeline.js`: plugin pipeline
- `src/plugins/*`: obfuscation plugins
- `src/utils/*`: utilities and RNG
- `bin/js-obf`: CLI entry

## License
MIT License. See `LICENSE`.

## Third-Party Notices
Some dependencies require preserving author and license notices. See `THIRD_PARTY_NOTICES.md`.
