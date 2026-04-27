const path = require("path");
const {
  loadPrebuiltModuleIfAvailable,
  compileTsModule,
} = require("./runtime-loader");

function loadParserFromTs() {
  const tsPath = path.join(__dirname, "parser.ts");
  const prebuilt = loadPrebuiltModuleIfAvailable(tsPath, module);
  if (prebuilt) {
    return prebuilt;
  }
  return compileTsModule(tsPath, module);
}

module.exports = loadParserFromTs();
