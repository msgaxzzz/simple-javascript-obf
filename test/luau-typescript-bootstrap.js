const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;

function mergeNodeOptions(extraNodeOptions) {
  return process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} ${extraNodeOptions}`
    : extraNodeOptions;
}

function runCommand(command, args, label, extra = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...extra,
  });

  assert.strictEqual(
    result.status,
    0,
    `${label} should pass\nstdout:\n${result.stdout || ""}\nstderr:\n${result.stderr || ""}`
  );

  return result;
}

function runNodeEval(script, env) {
  return runCommand(nodeCommand, ["-e", script], "node probe", {
    env: {
      ...process.env,
      ...env,
    },
  });
}

function probeJsBootstrapTarget() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ts-bootstrap-js-"));
  const probePath = path.join(tempDir, "probe.js");
  const outputPath = path.join(tempDir, "output.json");

  fs.writeFileSync(
    probePath,
    [
      'const fs = require("fs");',
      'const Module = require("module");',
      'const path = require("path");',
      "const seen = [];",
      "const outputPath = process.env.BOOTSTRAP_OUTPUT_PATH;",
      "const originalLoad = Module._load;",
      "Module._load = function patchedLoad(request, parent, isMain) {",
      "  const resolved = Module._resolveFilename(request, parent, isMain);",
      "  seen.push(resolved);",
      "  return originalLoad.apply(this, arguments);",
      "};",
      'process.on("exit", () => {',
      "  const target = seen.find((entry) =>",
      '    entry.endsWith(path.join("build", "src", "index.js")) ||',
      '    entry.endsWith(path.join("src", "index.js"))',
      "  );",
      "  fs.writeFileSync(outputPath, JSON.stringify({ target: target || null }), \"utf8\");",
      "});",
    ].join("\n"),
    "utf8"
  );

  try {
    runCommand(nodeCommand, ["bin/js-obf", "--help"], "js-obf bootstrap probe", {
      env: {
        ...process.env,
        NODE_OPTIONS: mergeNodeOptions(`--require ${probePath}`),
        BOOTSTRAP_OUTPUT_PATH: outputPath,
      },
      stdio: "pipe",
    });

    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function probeLuauWrapper(args) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ts-bootstrap-luau-"));
  const probePath = path.join(tempDir, "probe.js");
  const outputPath = path.join(tempDir, "output.json");

  fs.writeFileSync(
    probePath,
    [
      'const fs = require("fs");',
      'const childProcess = require("child_process");',
      "const outputPath = process.env.BOOTSTRAP_OUTPUT_PATH;",
      "let captured = null;",
      "childProcess.spawnSync = (command, spawnArgs, options) => {",
      "  captured = { command, spawnArgs, stdio: options && options.stdio };",
      "  return { status: 0 };",
      "};",
      'process.on("exit", () => {',
      "  fs.writeFileSync(outputPath, JSON.stringify(captured), \"utf8\");",
      "});",
    ].join("\n"),
    "utf8"
  );

  try {
    runCommand(nodeCommand, ["bin/luau-obf", ...args], "luau-obf wrapper probe", {
      env: {
        ...process.env,
        NODE_OPTIONS: mergeNodeOptions(`--require ${probePath}`),
        BOOTSTRAP_OUTPUT_PATH: outputPath,
      },
      stdio: "pipe",
    });

    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function run() {
  const packageLock = require(path.join(repoRoot, "package-lock.json"));
  const tsconfigPath = path.join(repoRoot, "tsconfig.json");
  const buildConfigPath = path.join(repoRoot, "tsconfig.build.json");
  const globalTypesPath = path.join(repoRoot, "src", "types", "global.d.ts");
  const buildEntryPath = path.join(repoRoot, "build", "src", "index.js");
  const buildTypesPath = path.join(repoRoot, "build", "src", "index.d.ts");

  assert.ok(fs.existsSync(tsconfigPath), "tsconfig.json should exist");
  assert.ok(fs.existsSync(buildConfigPath), "tsconfig.build.json should exist");
  assert.ok(fs.existsSync(globalTypesPath), "src/types/global.d.ts should exist");
  assert.ok(
    packageLock.packages && packageLock.packages["node_modules/typescript"],
    "package-lock.json should pin the typescript toolchain"
  );
  assert.ok(
    packageLock.packages && packageLock.packages["node_modules/@types/node"],
    "package-lock.json should pin @types/node for clean installs"
  );

  const buildDir = path.join(repoRoot, "build");
  try {
    runCommand(npmCommand, ["run", "typecheck"], "npm run typecheck");
    runCommand(npmCommand, ["run", "build:ts"], "npm run build:ts");

    assert.ok(fs.existsSync(buildEntryPath), "build:ts should emit build/src/index.js");
    assert.ok(fs.existsSync(buildTypesPath), "build:ts should emit build/src/index.d.ts");

    const builtProbe = probeJsBootstrapTarget();
    assert.ok(
      builtProbe.target.endsWith(path.join("build", "src", "index.js")),
      `js-obf should prefer build output when available, got ${builtProbe.target}`
    );

    const hiddenBuildDir = path.join(repoRoot, "build.__ts_bootstrap_backup__");
    fs.renameSync(buildDir, hiddenBuildDir);
    try {
      const sourceProbe = probeJsBootstrapTarget();
      assert.ok(
        sourceProbe.target.endsWith(path.join("src", "index.js")),
        `js-obf should fall back to source output when build output is absent, got ${sourceProbe.target}`
      );
    } finally {
      fs.renameSync(hiddenBuildDir, buildDir);
    }

    const defaultLuauProbe = probeLuauWrapper(["--help"]);
    assert.deepStrictEqual(
      defaultLuauProbe.spawnArgs.slice(1, 3),
      ["--lang", "luau"],
      "luau-obf should inject --lang luau when the caller does not provide --lang"
    );

    const explicitLuauProbe = probeLuauWrapper(["--lang", "js", "--help"]);
    assert.deepStrictEqual(
      explicitLuauProbe.spawnArgs.slice(1),
      ["--lang", "js", "--help"],
      "luau-obf should preserve an explicit --lang argument"
    );
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
    fs.rmSync(path.join(repoRoot, "build.__ts_bootstrap_backup__"), { recursive: true, force: true });
  }
}

run();
