const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const exe = path.resolve(
  process.argv[2] ||
    (process.platform === "win32"
      ? "dist/obveil.exe"
      : process.platform === "darwin"
        ? `dist/obveil-macos-${process.arch}`
        : "dist/obveil")
);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "obveil-exe-verify-"));

try {
  const input = path.join(dir, "input.js");
  const output = path.join(dir, "output.js");
  fs.writeFileSync(
    input,
    "function f(a) { var b = a + 1; return b * 2; }\nconsole.log(f(3));\n"
  );

  execFileSync(
    exe,
    [
      input,
      "-o",
      output,
      "--preset",
      "high",
      "--seed",
      "ci-exe",
      "--vm",
      "--vm-downlevel",
      "--cff-downlevel",
      "--cff-min-statements",
      "2",
    ],
    { stdio: "inherit", timeout: 120000 }
  );

  const stdout = execFileSync(process.execPath, [output], {
    encoding: "utf8",
    timeout: 30000,
  }).trim();
  assert.strictEqual(stdout, "8");
  console.log(`verified ${exe}`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
