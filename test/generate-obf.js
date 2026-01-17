const fs = require("fs");
const path = require("path");
const { obfuscate } = require("../src");

async function main() {
  const inputPath = process.argv[2] || path.join(__dirname, "sample-input.js");
  const outDir = process.argv[3] || path.join(__dirname, "dist");

  const source = fs.readFileSync(inputPath, "utf8");
  fs.mkdirSync(outDir, { recursive: true });

  const baseName = path.basename(inputPath, path.extname(inputPath));

  const obf = await obfuscate(source, {
    preset: "high",
    seed: "test-seed",
    filename: path.basename(inputPath),
  });
  const obfPath = path.join(outDir, `${baseName}.obf.js`);
  fs.writeFileSync(obfPath, obf.code);

  const obfVm = await obfuscate(source, {
    preset: "high",
    seed: "test-seed",
    filename: path.basename(inputPath),
    renameGlobals: true,
    vm: { enabled: true, include: ["fib"], downlevel: true },
  });
  const vmPath = path.join(outDir, `${baseName}.vm.js`);
  fs.writeFileSync(vmPath, obfVm.code);

  console.log("wrote:", obfPath);
  console.log("wrote:", vmPath);
}

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
