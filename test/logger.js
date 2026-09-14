const assert = require("assert");
const babelParser = require("@babel/parser");
const { formatError } = require("../src/utils/logger");
const { isLikelyLuauSource, validateInputSource } = require("../src/utils/inputDiagnostics");
const { parse: parseLuau } = require("../src/luau/custom/parser");

function captureBabelError(source) {
  try {
    babelParser.parse(source, { sourceType: "unambiguous" });
  } catch (err) {
    return err;
  }
  throw new Error("expected Babel parse to fail");
}

function captureLuauError(source) {
  try {
    parseLuau(source);
  } catch (err) {
    return err;
  }
  throw new Error("expected Luau parse to fail");
}

function runJavaScriptMissingSemicolonRegression() {
  const source = "const a = 1 const b = 2";
  const output = formatError(captureBabelError(source), {
    source,
    filename: "bad.js",
    lang: "js",
  });

  assert.ok(output.includes("[js-obf] Syntax error"), "should classify parser errors as syntax errors");
  assert.ok(output.includes("Likely cause:"), "should explain the likely cause");
  assert.ok(output.includes("How to fix:"), "should print fix steps");
  assert.ok(output.includes("const a = 1; const b = 2"), "should show a concrete semicolon fix");
  assert.ok(!output.includes("Debug stack:"), "default output should not dump an internal stack");
}

function runDebugStackRegression() {
  const source = "const a = 1 const b = 2";
  const output = formatError(captureBabelError(source), {
    source,
    filename: "bad.js",
    lang: "js",
    debug: true,
  });

  assert.ok(output.includes("Debug stack:"), "debug output should include the stack");
}

function runJavaScriptCommaRegression() {
  const source = "const x = { a: 1 b: 2 };";
  const output = formatError(captureBabelError(source), {
    source,
    filename: "bad.js",
    lang: "js",
  });

  assert.ok(output.includes("Expected: `,`"), "should extract quoted expected punctuation from Babel errors");
  assert.ok(output.includes("Add a comma"), "should suggest comma separators");
}

function runLuauThenRegression() {
  const source = "if true print(1) end";
  const output = formatError(captureLuauError(source), {
    source,
    filename: "bad.lua",
    lang: "luau",
  });

  assert.ok(output.includes("Expected: `then` keyword"), "should render Luau expected tokens clearly");
  assert.ok(output.includes("Insert `then`"), "should suggest the Luau keyword fix");
}

function runLuauBareIdentifierRegression() {
  const source = "gds";
  const output = formatError(captureLuauError(source), {
    source,
    filename: "input.js",
    lang: "luau",
  });

  assert.ok(output.includes("Luau does not allow a bare variable name"), "should not guess that a lone name is an assignment");
  assert.ok(output.includes("switch the language option to JavaScript"), "should point out likely JS/Luau mode mismatch");
  assert.ok(output.includes("gds()"), "should suggest a call only as one valid Luau option");
  assert.ok(output.includes("gds = value"), "should suggest assignment with an explicit value");
  assert.ok(!output.includes("Luau found an assignment target but no `=`"), "should avoid overconfident assignment advice");
}

async function runBareIdentifierInputValidationRegression() {
  const source = "gds";
  let error = null;
  try {
    validateInputSource(source, {
      lang: "js",
      filename: "input.js",
    });
  } catch (err) {
    error = err;
  }

  assert.ok(error, "single bare identifier input should be rejected before obfuscation");
  const output = formatError(error, {
    source,
    filename: "input.js",
    lang: "js",
  });

  assert.ok(output.includes("[js-obf] Input error"), "bare names should be reported as input errors");
  assert.ok(output.includes("not a complete script"), "should explain that a lone name is incomplete");
  assert.ok(output.includes("include where it is declared or assigned"), "should not assume the name exists");
  assert.ok(!output.includes("Syntax error"), "should not call this a parser syntax error");
}

function runLuauAsJavaScriptInputValidationRegression() {
  const source = [
    'local Players = game:GetService("Players")',
    'local ReplicatedStorage = game:GetService("ReplicatedStorage")',
  ].join("\n");
  let error = null;
  try {
    validateInputSource(source, {
      lang: "js",
      filename: "input.js",
    });
  } catch (err) {
    error = err;
  }

  assert.ok(isLikelyLuauSource(source), "Roblox Luau source should be detected before JavaScript parsing");
  assert.ok(error, "Luau source selected as JavaScript should be rejected before Babel");
  const output = formatError(error, {
    source,
    filename: "input.js",
    lang: "js",
  });

  assert.ok(output.includes("[js-obf] Input error"), "language mismatch should be an input error");
  assert.ok(output.includes("source looks like Luau"), "should explain the actual language mismatch");
  assert.ok(output.includes("Switch the language option to Luau"), "should tell the user to select Luau");
  assert.ok(!output.includes("Missing semicolon"), "should not surface a JavaScript parser guess");
}

function runLuauEndRegression() {
  const source = [
    "local function demo()",
    "  print(1)",
  ].join("\n");
  const output = formatError(captureLuauError(source), {
    source,
    filename: "bad.lua",
    lang: "luau",
  });

  assert.ok(output.includes("Add `end`"), "should explain missing Luau block endings");
  assert.ok(output.includes("line 2"), "should include the source location");
}

(async () => {
  runJavaScriptMissingSemicolonRegression();
  runDebugStackRegression();
  runJavaScriptCommaRegression();
  runLuauThenRegression();
  runLuauBareIdentifierRegression();
  await runBareIdentifierInputValidationRegression();
  runLuauAsJavaScriptInputValidationRegression();
  runLuauEndRegression();
  console.log("logger: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
