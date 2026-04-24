const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { normalizeOptions } = require("../src/options");
const { obfuscateLuau } = require("../src/luau");
const { createLuauDebugRecorder } = require("../src/luau/debug");
const { diffAst } = require("../src/luau/debug/diff");

function runNormalizeLuauDebugDefaults() {
  const options = normalizeOptions({
    lang: "luau",
    debugLuauTransforms: {
      enabled: 1,
    },
  });

  assert.deepStrictEqual(options.debugLuauTransforms, {
    enabled: true,
    passes: [],
    outputDir: "dist/.luau-debug",
    includeAst: true,
    includeChanges: true,
    includeTrace: true,
  });
}

function runNormalizeLuauDebugFallbacksAndExplicitFalse() {
  const options = normalizeOptions({
    lang: "luau",
    debugLuauTransforms: {
      enabled: true,
      passes: "rename",
      outputDir: 123,
      includeAst: false,
      includeChanges: false,
      includeTrace: false,
    },
  });

  assert.deepStrictEqual(options.debugLuauTransforms, {
    enabled: true,
    passes: [],
    outputDir: "dist/.luau-debug",
    includeAst: false,
    includeChanges: false,
    includeTrace: false,
  });
}

function runNormalizeLuauDebugEnabledFalse() {
  const options = normalizeOptions({
    lang: "luau",
    debugLuauTransforms: {
      enabled: false,
    },
  });

  assert.deepStrictEqual(options.debugLuauTransforms, {
    enabled: false,
    passes: [],
    outputDir: "dist/.luau-debug",
    includeAst: true,
    includeChanges: true,
    includeTrace: true,
  });
}

function runNormalizeLuauDebugExplicitValues() {
  const options = normalizeOptions({
    lang: "luau",
    debugLuauTransforms: {
      enabled: true,
      passes: ["rename", "vm"],
      outputDir: "dist/.luau-debug",
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
    },
  });

  assert.deepStrictEqual(options.debugLuauTransforms, {
    enabled: true,
    passes: ["rename", "vm"],
    outputDir: "dist/.luau-debug",
    includeAst: true,
    includeChanges: true,
    includeTrace: true,
  });
}

function runNormalizeLuauDebugPassesCopySemantics() {
  const inputPasses = ["rename", "vm"];
  const options = normalizeOptions({
    lang: "luau",
    debugLuauTransforms: {
      enabled: true,
      passes: inputPasses,
    },
  });

  assert.deepStrictEqual(options.debugLuauTransforms.passes, ["rename", "vm"]);
  assert.notStrictEqual(options.debugLuauTransforms.passes, inputPasses);

  inputPasses.push("strings");
  assert.deepStrictEqual(options.debugLuauTransforms.passes, ["rename", "vm"]);

  options.debugLuauTransforms.passes.push("dead");
  assert.deepStrictEqual(inputPasses, ["rename", "vm", "strings"]);
}

function runRecorderCreatesRunLayout() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-"));
  const originalNow = Date.now;

  try {
    const disabledRecorder = createLuauDebugRecorder({
      enabled: false,
      outputDir: root,
      passes: [],
      filename: "disabled.lua",
      seed: "disabled-seed",
    });
    assert.strictEqual(disabledRecorder, null);

    Date.now = () => 1700000000000;

    const selectedPasses = ["rename", "vm"];
    const recorder = createLuauDebugRecorder({
      enabled: true,
      outputDir: root,
      passes: selectedPasses,
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
      filename: "input.lua",
      seed: "debug-seed",
    });
    const secondRecorder = createLuauDebugRecorder({
      enabled: true,
      outputDir: root,
      passes: selectedPasses,
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
      filename: "input.lua",
      seed: "debug-seed",
    });

    assert.ok(recorder);
    assert.ok(secondRecorder);
    assert.notStrictEqual(recorder.runId, secondRecorder.runId);
    assert.ok(fs.existsSync(recorder.runDir));
    assert.ok(fs.existsSync(path.join(recorder.runDir, "meta.json")));
    assert.ok(fs.existsSync(path.join(recorder.runDir, "pass-order.json")));

    const meta = JSON.parse(fs.readFileSync(path.join(recorder.runDir, "meta.json"), "utf8"));
    const passOrder = JSON.parse(fs.readFileSync(path.join(recorder.runDir, "pass-order.json"), "utf8"));

    assert.strictEqual(meta.inputFilename, "input.lua");
    assert.strictEqual(meta.seed, "debug-seed");
    assert.deepStrictEqual(meta.selectedPasses, selectedPasses);
    assert.deepStrictEqual(passOrder, []);
  } finally {
    Date.now = originalNow;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function findSingleRunDir(root) {
  const runEntries = fs.readdirSync(root, { withFileTypes: true });
  const runDirs = runEntries.filter((entry) => entry.isDirectory());

  assert.strictEqual(runDirs.length, 1);

  return path.join(root, runDirs[0].name);
}

function runDiffAstEncodesPrimitiveAndMissingChanges() {
  const changes = diffAst(
    {
      name: "before",
      nested: {
        type: "Identifier",
      },
    },
    {
      name: "after",
      nested: {
        type: "Identifier",
        extra: null,
      },
    },
    "sample-pass",
  );

  assert.ok(Array.isArray(changes));
  assert.ok(changes.length >= 2);

  const nameChange = changes.find((entry) => entry.path === "root.name");
  const missingChange = changes.find((entry) => entry.path === "root.nested.extra");

  assert.ok(nameChange);
  assert.strictEqual(nameChange.kind, "replace-value");
  assert.strictEqual(nameChange.before.node, "before");
  assert.strictEqual(nameChange.after.node, "after");

  assert.ok(missingChange);
  assert.strictEqual(missingChange.kind, "replace-value");
  assert.deepStrictEqual(missingChange.before.node, { missing: true });
  assert.strictEqual(missingChange.after.node, null);
}

async function runObfuscateLuauWritesPerPassAstSnapshots() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-run-"));

  try {
    await obfuscateLuau("local value = 1\nprint(value)\n", {
      filename: "input.lua",
      debugLuauTransforms: {
        enabled: true,
        outputDir: root,
      },
    });

    const runEntries = fs.readdirSync(root, { withFileTypes: true });
    const runDirs = runEntries.filter((entry) => entry.isDirectory());

    assert.strictEqual(runDirs.length, 1);

    const runDir = path.join(root, runDirs[0].name);
    const passOrderFile = path.join(runDir, "pass-order.json");

    assert.ok(fs.existsSync(passOrderFile));

    const passOrder = JSON.parse(fs.readFileSync(passOrderFile, "utf8"));
    const recordedPasses = passOrder.filter((entry) => entry && typeof entry === "object");
    const completedPasses = recordedPasses.filter((entry) => entry.status === "completed");
    let completedPassWithChanges = null;

    assert.ok(recordedPasses.length >= 1);
    assert.ok(completedPasses.length >= 1);

    for (const entry of completedPasses) {
      assert.ok(typeof entry.dirName === "string" && entry.dirName.length > 0);

      const passDir = path.join(runDir, entry.dirName);

      assert.ok(fs.existsSync(passDir));
      assert.ok(fs.existsSync(path.join(passDir, "before-ast.json")));
      assert.ok(fs.existsSync(path.join(passDir, "after-ast.json")));
      assert.ok(fs.existsSync(path.join(passDir, "meta.json")));

      const beforeAst = JSON.parse(fs.readFileSync(path.join(passDir, "before-ast.json"), "utf8"));
      const afterAst = JSON.parse(fs.readFileSync(path.join(passDir, "after-ast.json"), "utf8"));

      if (JSON.stringify(beforeAst) !== JSON.stringify(afterAst)) {
        completedPassWithChanges = entry;
      }
    }

    assert.ok(completedPassWithChanges);

    const changesPath = path.join(runDir, completedPassWithChanges.dirName, "changes.json");
    const changes = JSON.parse(fs.readFileSync(changesPath, "utf8"));
    const firstChange = changes[0];

    assert.ok(fs.existsSync(changesPath));
    assert.ok(Array.isArray(changes));
    assert.ok(changes.length >= 1);
    assert.ok(firstChange);
    assert.ok(typeof firstChange.pass === "string" && firstChange.pass.length > 0);
    assert.ok(typeof firstChange.kind === "string" && firstChange.kind.length > 0);
    assert.ok(typeof firstChange.path === "string" && firstChange.path.length > 0);
    assert.ok(firstChange.before && typeof firstChange.before === "object");
    assert.ok(firstChange.after && typeof firstChange.after === "object");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runObfuscateLuauWritesRenameTrace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-trace-"));

  try {
    await obfuscateLuau(
      [
        "local value = string.byte('A')",
        "return value",
      ].join("\n"),
      {
        filename: "trace-input.lua",
        rename: true,
        strings: false,
        cff: false,
        dead: false,
        vm: false,
        constArray: false,
        numbers: false,
        proxifyLocals: false,
        padFooter: false,
        debugLuauTransforms: {
          enabled: true,
          outputDir: root,
          passes: ["rename"],
        },
      }
    );

    const runEntries = fs.readdirSync(root, { withFileTypes: true });
    const runDirs = runEntries.filter((entry) => entry.isDirectory());

    assert.strictEqual(runDirs.length, 1);

    const runDir = path.join(root, runDirs[0].name);
    const passOrder = JSON.parse(fs.readFileSync(path.join(runDir, "pass-order.json"), "utf8"));
    const renameEntry = passOrder.find((entry) => entry && entry.passName === "luau-rename");
    const otherEntries = passOrder.filter((entry) => entry && entry.passName !== "luau-rename" && entry.recorded === true);

    assert.ok(renameEntry, "expected luau-rename pass to be recorded");

    const tracePath = path.join(runDir, renameEntry.dirName, "trace.json");

    assert.ok(fs.existsSync(tracePath), "expected trace.json for luau-rename pass");

    const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));

    assert.ok(Array.isArray(trace), "trace.json should contain an array");
    assert.ok(trace.length >= 1, "trace.json should contain at least one entry");
    assert.ok(
      trace.some((entry) =>
        entry &&
        entry.pass === "luau-rename" &&
        typeof entry.kind === "string" &&
        typeof entry.reason === "string"
      ),
      "trace should include luau-rename events with kind and reason"
    );

    otherEntries.forEach((entry) => {
      const otherTracePath = path.join(runDir, entry.dirName, "trace.json");
      assert.ok(!fs.existsSync(otherTracePath), `did not expect trace.json for ${entry.passName}`);
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runObfuscateLuauWritesMultiPassTrace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-multi-trace-"));

  try {
    await obfuscateLuau(
      [
        "local function demo(value)",
        "  print(value)",
        "  return value + 1",
        "end",
        "",
        "return demo(2)",
      ].join("\n"),
      {
        filename: "multi-trace-input.lua",
        rename: false,
        strings: false,
        cff: false,
        dead: false,
        vm: true,
        constArray: false,
        numbers: false,
        proxifyLocals: false,
        padFooter: false,
        renameOptions: {
          maskGlobals: true,
        },
        debugLuauTransforms: {
          enabled: true,
          outputDir: root,
          passes: ["maskGlobals", "vm"],
        },
      }
    );

    const runEntries = fs.readdirSync(root, { withFileTypes: true });
    const runDirs = runEntries.filter((entry) => entry.isDirectory());

    assert.strictEqual(runDirs.length, 1);

    const runDir = path.join(root, runDirs[0].name);
    const passOrder = JSON.parse(fs.readFileSync(path.join(runDir, "pass-order.json"), "utf8"));
    const maskGlobalsEntry = passOrder.find((entry) => entry && entry.recorded === true && entry.passName === "luau-maskGlobals");
    const vmEntry = passOrder.find((entry) =>
      entry &&
      entry.recorded === true &&
      (entry.passName === "luau-vm" || entry.passName === "luau-vm-cff")
    );

    assert.ok(maskGlobalsEntry, "expected luau-maskGlobals pass to be recorded");
    assert.ok(vmEntry, "expected luau-vm or luau-vm-cff pass to be recorded");

    [maskGlobalsEntry, vmEntry].forEach((entry) => {
      const tracePath = path.join(runDir, entry.dirName, "trace.json");

      assert.ok(fs.existsSync(tracePath), `expected trace.json for ${entry.passName}`);

      const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));

      assert.ok(Array.isArray(trace), `trace.json should contain an array for ${entry.passName}`);
      assert.ok(trace.length >= 1, `trace.json should contain at least one entry for ${entry.passName}`);
      assert.ok(
        trace.every((event) =>
          event &&
          event.pass === entry.passName &&
          typeof event.index === "number"
        ),
        `trace entries should include pass metadata for ${entry.passName}`
      );
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runObfuscateLuauWritesStringsTrace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-strings-trace-"));

  try {
    await obfuscateLuau(
      [
        "local message = 'hello world from trace coverage'",
        "return message",
      ].join("\n"),
      {
        filename: "strings-trace-input.lua",
        rename: false,
        strings: true,
        cff: false,
        dead: false,
        vm: false,
        constArray: false,
        numbers: false,
        proxifyLocals: false,
        padFooter: false,
        debugLuauTransforms: {
          enabled: true,
          outputDir: root,
          passes: ["strings"],
        },
      }
    );

    const runEntries = fs.readdirSync(root, { withFileTypes: true });
    const runDirs = runEntries.filter((entry) => entry.isDirectory());

    assert.strictEqual(runDirs.length, 1);

    const runDir = path.join(root, runDirs[0].name);
    const passOrder = JSON.parse(fs.readFileSync(path.join(runDir, "pass-order.json"), "utf8"));
    const stringsEntry = passOrder.find((entry) => entry && entry.recorded === true && entry.passName === "luau-strings");

    assert.ok(stringsEntry, "expected luau-strings pass to be recorded");

    const tracePath = path.join(runDir, stringsEntry.dirName, "trace.json");

    assert.ok(fs.existsSync(tracePath), "expected trace.json for luau-strings pass");

    const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));

    assert.ok(Array.isArray(trace), "trace.json should contain an array for luau-strings");
    assert.ok(trace.length >= 1, "trace.json should contain at least one entry for luau-strings");
    assert.ok(
      trace.some((entry) =>
        entry &&
        entry.pass === "luau-strings" &&
        typeof entry.kind === "string" &&
        (entry.kind === "encode-string" || entry.kind === "skip-string")
      ),
      "trace should include luau-strings encode/skip events"
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runRecorderWritesFailedPassArtifacts() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-fail-"));

  try {
    const recorder = createLuauDebugRecorder({
      enabled: true,
      outputDir: root,
      passes: [],
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
      filename: "failure.lua",
      seed: "failure-seed",
    });
    const pass = recorder.beginPass("luau-rename", 1, {
      type: "Chunk",
      body: [],
    });
    const failure = new Error("expected debug failure");

    pass.fail({
      type: "Chunk",
      body: [{ type: "Identifier", name: "after" }],
    }, failure);

    const passOrder = JSON.parse(fs.readFileSync(path.join(recorder.runDir, "pass-order.json"), "utf8"));
    const entry = passOrder.find((item) => item && item.passName === "luau-rename");

    assert.ok(entry);
    assert.strictEqual(entry.status, "failed");
    assert.strictEqual(entry.recorded, true);
    assert.ok(fs.existsSync(path.join(recorder.runDir, entry.dirName, "error.json")));
    assert.ok(fs.existsSync(path.join(recorder.runDir, entry.dirName, "changes.json")));

    const errorPayload = JSON.parse(fs.readFileSync(path.join(recorder.runDir, entry.dirName, "error.json"), "utf8"));

    assert.strictEqual(errorPayload.message, "expected debug failure");
    assert.strictEqual(errorPayload.name, "Error");
    assert.strictEqual(errorPayload.passName, "luau-rename");
    assert.strictEqual(errorPayload.index, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runWhitelistOnlyRecordsSelectedPasses() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-whitelist-"));

  try {
    await obfuscateLuau("local value = 1\nprint(value)\n", {
      filename: "whitelist.lua",
      rename: true,
      strings: false,
      cff: false,
      dead: false,
      vm: false,
      constArray: false,
      numbers: false,
      proxifyLocals: false,
      padFooter: false,
      debugLuauTransforms: {
        enabled: true,
        outputDir: root,
        passes: ["rename"],
      },
    });

    const runEntries = fs.readdirSync(root, { withFileTypes: true });
    const runDirs = runEntries.filter((entry) => entry.isDirectory());

    assert.strictEqual(runDirs.length, 1);

    const runDir = path.join(root, runDirs[0].name);
    const passOrder = JSON.parse(fs.readFileSync(path.join(runDir, "pass-order.json"), "utf8"));
    const recordedEntries = passOrder.filter((entry) => entry && entry.recorded === true);
    const unrecordedEntries = passOrder.filter((entry) => entry && entry.recorded === false);
    const recordedDirs = fs.readdirSync(runDir)
      .filter((entry) => /^\d+-/.test(entry))
      .sort();

    assert.ok(passOrder.length > recordedEntries.length, "expected unrecorded passes in pass-order.json");
    assert.strictEqual(recordedEntries.length, 1);
    assert.strictEqual(recordedEntries[0].passName, "luau-rename");
    assert.deepStrictEqual(recordedDirs, [recordedEntries[0].dirName]);
    assert.ok(unrecordedEntries.length >= 1);
    assert.ok(
      unrecordedEntries.every((entry) => entry.status === "completed" && entry.recorded === false),
      "expected unrecorded passes to be marked completed without artifacts"
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runObfuscateLuauFailureMarksSkippedPasses() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-luau-debug-failure-run-"));

  try {
    const recorder = createLuauDebugRecorder({
      enabled: true,
      outputDir: root,
      passes: [],
      includeAst: true,
      includeChanges: true,
      includeTrace: true,
      filename: "failure.lua",
      seed: "failure-seed",
    });
    const baseAst = {
      type: "Chunk",
      body: [{ type: "Identifier", name: "before" }],
    };
    const renamePass = recorder.beginPass("luau-rename", 1, baseAst);
    const vmPass = recorder.beginPass("luau-vm", 2, baseAst);

    renamePass.complete({
      type: "Chunk",
      body: [{ type: "Identifier", name: "renamed" }],
    });
    vmPass.fail({
      type: "Chunk",
      body: [{ type: "Identifier", name: "failed" }],
    }, new Error("synthetic vm failure"));
    recorder.markPassSkipped("luau-encodeMembers", 3);
    recorder.markPassSkipped("luau-maskGlobals", 4);

    const runDir = recorder.runDir;
    const passOrder = JSON.parse(fs.readFileSync(path.join(runDir, "pass-order.json"), "utf8"));
    const renameEntry = passOrder.find((entry) => entry && entry.passName === "luau-rename");
    const failingEntry = passOrder.find((entry) => entry && entry.passName === "luau-vm");
    const skippedEntries = passOrder.filter((entry) => entry && entry.status === "skipped-after-failure");

    assert.ok(renameEntry, "expected luau-rename to run before luau-vm");
    assert.strictEqual(renameEntry.status, "completed");
    assert.ok(failingEntry, "expected luau-vm failure entry");
    assert.strictEqual(failingEntry.status, "failed");

    const failingDir = path.join(runDir, failingEntry.dirName);

    assert.ok(fs.existsSync(path.join(failingDir, "before-ast.json")));
    assert.ok(fs.existsSync(path.join(failingDir, "after-ast.json")));
    assert.ok(fs.existsSync(path.join(failingDir, "changes.json")));
    assert.ok(fs.existsSync(path.join(failingDir, "error.json")));

    const errorPayload = JSON.parse(fs.readFileSync(path.join(failingDir, "error.json"), "utf8"));

    assert.strictEqual(errorPayload.passName, "luau-vm");
    assert.strictEqual(errorPayload.index, failingEntry.index);
    assert.strictEqual(errorPayload.message, "synthetic vm failure");
    assert.ok(typeof errorPayload.stack === "string" && errorPayload.stack.length > 0);

    assert.ok(skippedEntries.length >= 1, "expected later passes to be marked skipped-after-failure");
    assert.ok(
      skippedEntries.every((entry) => entry.index > failingEntry.index),
      "only passes after the failure should be marked skipped"
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

(async () => {
  try {
    runNormalizeLuauDebugDefaults();
    runNormalizeLuauDebugFallbacksAndExplicitFalse();
    runNormalizeLuauDebugEnabledFalse();
    runNormalizeLuauDebugExplicitValues();
    runNormalizeLuauDebugPassesCopySemantics();
    runRecorderCreatesRunLayout();
    runDiffAstEncodesPrimitiveAndMissingChanges();
    runRecorderWritesFailedPassArtifacts();
    await runObfuscateLuauWritesPerPassAstSnapshots();
    await runObfuscateLuauWritesRenameTrace();
    await runObfuscateLuauWritesMultiPassTrace();
    await runObfuscateLuauWritesStringsTrace();
    await runWhitelistOnlyRecordsSelectedPasses();
    await runObfuscateLuauFailureMarksSkippedPasses();
    console.log("luau-debug: ok");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
