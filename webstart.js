const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const WEB_DIR = path.join(__dirname, "web");
const PORT = Number(process.env.PORT) || 6589;
const MAX_BODY_SIZE = 5 * 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function safePath(requestPath) {
  const normalized = path.normalize(requestPath).replace(/^([\/\\])+/, "");
  const fullPath = path.join(WEB_DIR, normalized);
  const base = WEB_DIR.endsWith(path.sep) ? WEB_DIR : WEB_DIR + path.sep;
  if (fullPath !== WEB_DIR && !fullPath.startsWith(base)) {
    return null;
  }
  return fullPath;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY_SIZE) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

async function handleObfuscate(req, res) {
  try {
    const body = await readJson(req);
    const source = body.source || body.code || "";

    if (!source.trim()) {
      sendJson(res, 400, { error: "No source code provided." });
      return;
    }

    const filename = body.filename || "input.js";
    const options = body.options || {};

    const result = await runCliObfuscate(source, filename, options);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Obfuscation failed." });
  }
}

function buildCliArgs(options = {}) {
  const args = [];

  if (options.preset) {
    args.push("--preset", String(options.preset));
  }
  if (options.lang) {
    args.push("--lang", String(options.lang));
  }
  if (options.rename === false) {
    args.push("--no-rename");
  }
  if (options.renameOptions) {
    if (options.renameOptions.renameGlobals === true) {
      args.push("--rename-globals");
    } else if (options.renameOptions.renameGlobals === false) {
      args.push("--no-rename-globals");
    }
    if (options.renameOptions.renameMembers === true) {
      args.push("--rename-members");
    } else if (options.renameOptions.renameMembers === false) {
      args.push("--no-rename-members");
    }
    if (options.renameOptions.homoglyphs === true) {
      args.push("--rename-homoglyphs");
    } else if (options.renameOptions.homoglyphs === false) {
      args.push("--no-rename-homoglyphs");
    }
    if (options.renameOptions.maskGlobals === true) {
      args.push("--mask-globals");
    } else if (options.renameOptions.maskGlobals === false) {
      args.push("--no-mask-globals");
    }
  }
  if (options.strings === false) {
    args.push("--no-strings");
  }

  const stringsOptions = options.stringsOptions || {};
  if (stringsOptions.split === true) {
    args.push("--strings-split");
  } else if (stringsOptions.split === false) {
    args.push("--no-strings-split");
  }
  if (stringsOptions.splitMin !== undefined && stringsOptions.splitMin !== null) {
    args.push("--strings-split-min", String(stringsOptions.splitMin));
  }
  if (stringsOptions.splitMaxParts !== undefined && stringsOptions.splitMaxParts !== null) {
    args.push("--strings-split-max-parts", String(stringsOptions.splitMaxParts));
  }
  if (stringsOptions.segmentSize !== undefined && stringsOptions.segmentSize !== null) {
    args.push("--strings-segment-size", String(stringsOptions.segmentSize));
  }
  if (stringsOptions.encodeValueFallback === false) {
    args.push("--no-strings-value-fallback");
  } else if (stringsOptions.encodeValueFallback === true) {
    args.push("--strings-value-fallback");
  }
  if (stringsOptions.encodeObjectKeys === false) {
    args.push("--no-strings-object-keys");
  } else if (stringsOptions.encodeObjectKeys === true) {
    args.push("--strings-object-keys");
  }
  if (stringsOptions.encodeJSXAttributes === false) {
    args.push("--no-strings-jsx-attrs");
  } else if (stringsOptions.encodeJSXAttributes === true) {
    args.push("--strings-jsx-attrs");
  }
  if (stringsOptions.encodeTemplateChunks === false) {
    args.push("--no-strings-template-chunks");
  } else if (stringsOptions.encodeTemplateChunks === true) {
    args.push("--strings-template-chunks");
  }
  if (options.wrap) {
    args.push("--wrap");
  }
  if (options.wrapOptions && options.wrapOptions.iterations) {
    args.push("--wrap-iterations", String(options.wrapOptions.iterations));
  }
  if (options.proxifyLocals) {
    args.push("--proxify-locals");
  } else if (options.proxifyLocals === false) {
    args.push("--no-proxify-locals");
  }
  if (options.numbers === true) {
    args.push("--numbers-expr");
  } else if (options.numbers === false) {
    args.push("--no-numbers-expr");
  }
  if (options.numbersOptions) {
    if (options.numbersOptions.probability !== undefined && options.numbersOptions.probability !== null) {
      args.push("--numbers-expr-threshold", String(options.numbersOptions.probability));
    }
    if (options.numbersOptions.innerProbability !== undefined && options.numbersOptions.innerProbability !== null) {
      args.push("--numbers-expr-inner", String(options.numbersOptions.innerProbability));
    }
    if (options.numbersOptions.maxDepth !== undefined && options.numbersOptions.maxDepth !== null) {
      args.push("--numbers-expr-max-depth", String(options.numbersOptions.maxDepth));
    }
  }
  if (options.constArray === true) {
    args.push("--const-array");
  } else if (options.constArray === false) {
    args.push("--no-const-array");
  }
  if (options.constArrayOptions) {
    if (options.constArrayOptions.probability !== undefined && options.constArrayOptions.probability !== null) {
      args.push("--const-array-threshold", String(options.constArrayOptions.probability));
    }
    if (options.constArrayOptions.stringsOnly === true) {
      args.push("--const-array-strings-only");
    } else if (options.constArrayOptions.stringsOnly === false) {
      args.push("--no-const-array-strings-only");
    }
    if (options.constArrayOptions.shuffle === true) {
      args.push("--const-array-shuffle");
    } else if (options.constArrayOptions.shuffle === false) {
      args.push("--no-const-array-shuffle");
    }
    if (options.constArrayOptions.rotate === true) {
      args.push("--const-array-rotate");
    } else if (options.constArrayOptions.rotate === false) {
      args.push("--no-const-array-rotate");
    }
    if (options.constArrayOptions.encoding) {
      args.push("--const-array-encoding", String(options.constArrayOptions.encoding));
    }
    if (options.constArrayOptions.wrapper === true) {
      args.push("--const-array-wrapper");
    } else if (options.constArrayOptions.wrapper === false) {
      args.push("--no-const-array-wrapper");
    }
  }
  if (options.padFooter === true) {
    args.push("--pad-footer");
  } else if (options.padFooter === false) {
    args.push("--no-pad-footer");
  }
  if (options.padFooterOptions && options.padFooterOptions.blocks !== undefined && options.padFooterOptions.blocks !== null) {
    args.push("--pad-footer-blocks", String(options.padFooterOptions.blocks));
  }

  if (options.cff === false) {
    args.push("--no-cff");
  }
  const cffOptions = options.cffOptions || {};
  if (cffOptions.downlevel) {
    args.push("--cff-downlevel");
  }
  if (cffOptions.mode) {
    args.push("--cff-mode", String(cffOptions.mode));
  }
  if (cffOptions.opaque === true) {
    args.push("--cff-opaque");
  } else if (cffOptions.opaque === false) {
    args.push("--no-cff-opaque");
  }
  if (options.dead === false) {
    args.push("--no-dead");
  }

  const vm = options.vm || {};
  if (vm.enabled) {
    args.push("--vm");
  }
  if (vm.layers !== undefined && vm.layers !== null) {
    args.push("--vm-layers", String(vm.layers));
  }
  if (vm.topLevel === true) {
    args.push("--vm-top-level");
  } else if (vm.topLevel === false) {
    args.push("--no-vm-top-level");
  }
  if (Array.isArray(vm.include) && vm.include.length > 0) {
    args.push("--vm-include", vm.include.join(","));
  }
  if (vm.opcodeShuffle === false) {
    args.push("--no-vm-opcode-shuffle");
  } else if (vm.opcodeShuffle === true) {
    args.push("--vm-opcode-shuffle");
  }
  if (vm.fakeOpcodes !== undefined && vm.fakeOpcodes !== null && vm.fakeOpcodes !== "") {
    args.push("--vm-fake-opcodes", String(vm.fakeOpcodes));
  }
  if (vm.bytecodeEncrypt === false) {
    args.push("--no-vm-bytecode");
  } else if (vm.bytecodeEncrypt === true) {
    args.push("--vm-bytecode");
  }
  if (vm.constsEncrypt === false) {
    args.push("--no-vm-consts");
  } else if (vm.constsEncrypt === true) {
    args.push("--vm-consts");
  }
  if (vm.constsSplit === false) {
    args.push("--no-vm-consts-split");
  } else if (vm.constsSplit === true) {
    args.push("--vm-consts-split");
  }
  if (vm.constsSplitSize !== undefined && vm.constsSplitSize !== null && vm.constsSplitSize !== "") {
    args.push("--vm-consts-split-size", String(vm.constsSplitSize));
  }
  if (vm.constsEncoding) {
    args.push("--vm-consts-encoding", String(vm.constsEncoding));
  }
  if (vm.runtimeKey === false) {
    args.push("--no-vm-runtime-key");
  } else if (vm.runtimeKey === true) {
    args.push("--vm-runtime-key");
  }
  if (vm.runtimeSplit === false) {
    args.push("--no-vm-runtime-split");
  } else if (vm.runtimeSplit === true) {
    args.push("--vm-runtime-split");
  }
  if (vm.decoyRuntime === false) {
    args.push("--no-vm-decoy-runtime");
  } else if (vm.decoyRuntime === true) {
    args.push("--vm-decoy-runtime");
  }
  if (vm.decoyProbability !== undefined && vm.decoyProbability !== null && vm.decoyProbability !== "") {
    args.push("--vm-decoy-probability", String(vm.decoyProbability));
  }
  if (vm.decoyStrings !== undefined && vm.decoyStrings !== null && vm.decoyStrings !== "") {
    args.push("--vm-decoy-strings", String(vm.decoyStrings));
  }
  if (vm.dispatchGraph) {
    args.push("--vm-dispatch-graph", String(vm.dispatchGraph));
  }
  if (vm.stackProtocol) {
    args.push("--vm-stack-protocol", String(vm.stackProtocol));
  }
  if (vm.isaPolymorph === true) {
    args.push("--vm-isa-polymorph");
  } else if (vm.isaPolymorph === false) {
    args.push("--no-vm-isa-polymorph");
  }
  if (vm.fakeEdges === true) {
    args.push("--vm-fake-edges");
  } else if (vm.fakeEdges === false) {
    args.push("--no-vm-fake-edges");
  }
  if (vm.blockDispatch === true) {
    args.push("--vm-block-dispatch");
  } else if (vm.blockDispatch === false) {
    args.push("--no-vm-block-dispatch");
  }
  if (vm.numericStyle) {
    args.push("--vm-numeric-style", String(vm.numericStyle));
  }
  if (vm.downlevel) {
    args.push("--vm-downlevel");
  }
  if (vm.debug) {
    args.push("--vm-debug");
  }

  if (options.antiHook && options.antiHook.lock) {
    args.push("--anti-hook-lock");
  } else if (options.antiHook && options.antiHook.enabled) {
    args.push("--anti-hook");
  }

  if (options.seed) {
    args.push("--seed", String(options.seed));
  }
  if (options.ecma !== undefined && options.ecma !== null && options.ecma !== "") {
    args.push("--ecma", String(options.ecma));
  }
  if (options.sourceMap) {
    args.push("--sourcemap");
  }
  if (options.minify === false) {
    args.push("--no-minify");
  }
  if (options.beautify && options.minify !== false) {
    args.push("--beautify");
  }
  if (options.compact) {
    args.push("--compact");
  }
  if (options.timing === true) {
    args.push("--timing");
  } else if (options.timing === false) {
    args.push("--no-timing");
  }

  return args;
}

function safeFilename(name) {
  const base = path.basename(name || "input.js");
  return base || "input.js";
}

async function runCliObfuscate(source, filename, options) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "js-obf-"));
  const safeName = safeFilename(filename);
  const inputPath = path.join(tempDir, safeName);
  const ext = path.extname(safeName);
  const inferredLang =
    ext === ".lua" || ext === ".luau" ? "luau" : "js";
  const lang = options.lang || inferredLang;
  const outputExt = lang === "luau"
    ? (ext === ".lua" || ext === ".luau" ? ext : ".lua")
    : ".js";
  const outputPath = path.join(
    tempDir,
    `${path.basename(safeName, path.extname(safeName))}.obf${outputExt}`
  );

  fs.writeFileSync(inputPath, source, "utf8");

  const args = ["bin/js-obf", inputPath, "-o", outputPath, ...buildCliArgs(options)];

  try {
    const { stdout, stderr, code } = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd: __dirname,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdoutData = "";
      let stderrData = "";

      child.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (exitCode) => {
        resolve({ stdout: stdoutData, stderr: stderrData, code: exitCode });
      });
    });

    if (code !== 0) {
      throw new Error((stderr || stdout || "").trim() || "Obfuscation failed.");
    }

    const result = {
      code: fs.readFileSync(outputPath, "utf8"),
      map: null,
    };
    const mapPath = `${outputPath}.map`;
    if (fs.existsSync(mapPath)) {
      try {
        result.map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
      } catch {
        result.map = null;
      }
    }

    return result;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function handleStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const fullPath = safePath(requestPath);

  if (!fullPath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/api/obfuscate")) {
    handleObfuscate(req, res);
    return;
  }

  if (req.method === "GET") {
    handleStatic(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method Not Allowed");
});

server.listen(PORT, () => {
  console.log(`JS Obfuscator web UI running at http://localhost:${PORT}`);
});
