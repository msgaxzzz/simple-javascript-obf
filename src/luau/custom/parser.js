const fs = require("fs");
const path = require("path");
const Module = require("module");

function loadParserFromTs() {
  const tsPath = path.join(__dirname, "parser.ts");

  try {
    return require(tsPath);
  } catch (error) {
    if (!error || !String(error.message || error).includes("Unexpected token")) {
      throw error;
    }
  }

  const ts = require("typescript");
  const source = fs.readFileSync(tsPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: tsPath,
  });
  const runtimeModule = new Module(tsPath, module);
  runtimeModule.filename = tsPath;
  runtimeModule.paths = Module._nodeModulePaths(__dirname);
  runtimeModule._compile(transpiled.outputText, tsPath);
  return runtimeModule.exports;
}

module.exports = loadParserFromTs();
