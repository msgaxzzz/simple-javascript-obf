const fs = require("fs");
const path = require("path");
const { serializeAst, countAstNodes } = require("./serialize");
const { diffAst } = require("./diff");

let runCounter = 0;

function makeRunId() {
  runCounter += 1;
  return `${Date.now()}-${process.pid}-${runCounter}`;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function sanitizePassName(passName) {
  return String(passName || "pass").replace(/[^A-Za-z0-9._-]+/g, "-");
}

function makePassDirName(index, passName) {
  return `${String(index).padStart(2, "0")}-${sanitizePassName(passName)}`;
}

function normalizeError(error, passName, index) {
  if (!error) {
    return {
      passName,
      index,
      message: "Unknown error",
    };
  }

  return {
    passName,
    index,
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null,
  };
}

function normalizeTraceEvent(passName, event, index) {
  const baseEvent = event && typeof event === "object" && !Array.isArray(event)
    ? { ...event }
    : { message: event == null ? "" : String(event) };

  return {
    ...baseEvent,
    pass: passName,
    index,
  };
}

function shouldRecordPass(options, passName) {
  if (!Array.isArray(options.passes) || options.passes.length === 0) {
    return true;
  }

  const shortName = String(passName || "").replace(/^luau-/, "");
  return options.passes.includes(passName) || options.passes.includes(shortName);
}

function createLuauDebugRecorder(options) {
  if (!options || !options.enabled) {
    return null;
  }

  const runId = makeRunId();
  const runDir = path.join(options.outputDir, runId);
  const passOrder = [];

  fs.mkdirSync(runDir, { recursive: true });

  writeJson(path.join(runDir, "meta.json"), {
    runId,
    timestamp: new Date().toISOString(),
    inputFilename: options.filename,
    seed: options.seed,
    selectedPasses: options.passes,
  });
  writeJson(path.join(runDir, "pass-order.json"), passOrder);

  function writePassOrder() {
    writeJson(path.join(runDir, "pass-order.json"), passOrder);
  }

  function markPassSkipped(passName, index) {
    const existing = passOrder.find((entry) => entry && entry.index === index && entry.passName === passName);
    if (existing) {
      existing.status = "skipped-after-failure";
      writePassOrder();
      return;
    }

    passOrder.push({
      index,
      passName,
      dirName: null,
      recorded: shouldRecordPass(options, passName),
      status: "skipped-after-failure",
    });
    writePassOrder();
  }

  return {
    runId,
    runDir,
    beginPass(passName, index, ast) {
      if (!shouldRecordPass(options, passName)) {
        passOrder.push({
          index,
          passName,
          dirName: null,
          recorded: false,
          status: "completed",
        });
        writePassOrder();
        return {
          recordTrace() {},
          complete() {},
          fail() {},
        };
      }

      const dirName = makePassDirName(index, passName);
      const passDir = path.join(runDir, dirName);
      const entry = {
        index,
        passName,
        dirName,
        recorded: true,
        status: "started",
      };
      const beforeAst = serializeAst(ast);
      const trace = [];

      fs.mkdirSync(passDir, { recursive: true });
      passOrder.push(entry);
      writePassOrder();

      if (options.includeAst !== false) {
        writeJson(path.join(passDir, "before-ast.json"), beforeAst);
      }

      const astNodeCountBefore = countAstNodes(ast);

      return {
        recordTrace(event) {
          trace.push(normalizeTraceEvent(passName, event, index));
        },
        complete(nextAst) {
          const astNodeCountAfter = countAstNodes(nextAst);
          const afterAst = serializeAst(nextAst);

          if (options.includeAst !== false) {
            writeJson(path.join(passDir, "after-ast.json"), afterAst);
          }

          if (options.includeChanges !== false) {
            writeJson(path.join(passDir, "changes.json"), diffAst(beforeAst, afterAst, passName));
          }

          if (options.includeTrace !== false && trace.length > 0) {
            writeJson(path.join(passDir, "trace.json"), trace);
          }

          writeJson(path.join(passDir, "meta.json"), {
            passName,
            index,
            enabled: true,
            astNodeCountBefore,
            astNodeCountAfter,
            traceHookEnabled: trace.length > 0,
          });

          entry.status = "completed";
          writePassOrder();
        },
        fail(nextAst, error) {
          const astNodeCountAfter = countAstNodes(nextAst);
          const afterAst = serializeAst(nextAst);

          if (options.includeAst !== false) {
            writeJson(path.join(passDir, "after-ast.json"), afterAst);
          }

          if (options.includeChanges !== false) {
            writeJson(path.join(passDir, "changes.json"), diffAst(beforeAst, afterAst, passName));
          }

          if (options.includeTrace !== false && trace.length > 0) {
            writeJson(path.join(passDir, "trace.json"), trace);
          }

          writeJson(path.join(passDir, "meta.json"), {
            passName,
            index,
            enabled: true,
            astNodeCountBefore,
            astNodeCountAfter,
            traceHookEnabled: trace.length > 0,
          });

          writeJson(path.join(passDir, "error.json"), normalizeError(error, passName, index));

          entry.status = "failed";
          writePassOrder();
        },
      };
    },
    markPassSkipped,
    endPass(passName, index) {},
    recordFailure(passName, index, error) {},
    writePassOrder,
  };
}

module.exports = {
  createLuauDebugRecorder,
};
