const path = require("path");
const {
  loadPrebuiltModuleIfAvailable,
  compileTsModule,
} = require("./runtime-loader");

function loadTokenizerFromTs() {
  const tsPath = path.join(__dirname, "tokenizer.ts");
  const prebuilt = loadPrebuiltModuleIfAvailable(tsPath, module);
  if (prebuilt) {
    return prebuilt;
  }

  try {
    return require(tsPath);
  } catch (error) {
    if (!error || !String(error.message || error).includes("Unexpected token")) {
      throw error;
    }
  }

  return compileTsModule(tsPath, module);
}

module.exports = loadTokenizerFromTs();
