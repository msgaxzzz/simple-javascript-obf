const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  resolvePrebuiltModulePath,
  loadPrebuiltModuleIfAvailable,
} = require("../src/luau/custom/runtime-loader");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "luau-runtime-loader-"));

try {
  const tsPath = path.join(tempRoot, "src", "luau", "custom", "parser.ts");
  const jsPath = path.join(tempRoot, "build", "src", "luau", "custom", "parser.js");

  fs.mkdirSync(path.dirname(tsPath), { recursive: true });
  fs.mkdirSync(path.dirname(jsPath), { recursive: true });
  fs.writeFileSync(tsPath, "export const marker: string = 'ts';\n");
  fs.writeFileSync(jsPath, "module.exports = { marker: 'build-js' };\n");

  assert.strictEqual(
    resolvePrebuiltModulePath(tsPath),
    jsPath,
    "should map src/*.ts to build/src/*.js"
  );

  const loaded = loadPrebuiltModuleIfAvailable(tsPath, module);
  assert(loaded, "expected prebuilt module to load");
  assert.strictEqual(loaded.marker, "build-js", "should prefer prebuilt js output");

  console.log("luau-runtime-loader: ok");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
