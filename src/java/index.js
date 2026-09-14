const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFile, spawnSync } = require("node:child_process");
const { promisify } = require("node:util");
const { normalizeOptions } = require("../options");

const run = promisify(execFile);

function resolveTool(toolName) {
  const exe = process.platform === "win32" ? `${toolName}.exe` : toolName;
  if (process.env.JAVA_HOME) {
    return path.join(process.env.JAVA_HOME, "bin", exe);
  }
  return exe;
}

function getSourceJavaDir() {
  if (fsSync.existsSync(path.join(__dirname, "engine"))) {
    return __dirname;
  }
  const rootRel = path.resolve(__dirname, "../../src/java");
  if (fsSync.existsSync(path.join(rootRel, "engine"))) {
    return rootRel;
  }
  const deeperRel = path.resolve(__dirname, "../../../src/java");
  if (fsSync.existsSync(path.join(deeperRel, "engine"))) {
    return deeperRel;
  }
  return __dirname;
}

function ensureClasses() {
  const javaDir = getSourceJavaDir();
  const classesDir = path.join(javaDir, "classes");
  const marker = path.join(classesDir, "engine", "ObveilTransformer.class");
  if (fsSync.existsSync(marker)) {
    return classesDir;
  }
  fsSync.mkdirSync(classesDir, { recursive: true });
  const javac = resolveTool("javac");
  const engineFiles = fsSync.readdirSync(path.join(javaDir, "engine"))
    .filter(f => f.endsWith(".java"))
    .map(f => path.join(javaDir, "engine", f));
  const mainFile = path.join(javaDir, "ObveilJava.java");
  const res = spawnSync(javac, ["-encoding", "UTF-8", "-d", classesDir, ...engineFiles, mainFile], {
    windowsHide: true,
    encoding: "utf8",
  });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error("Failed to compile Java obfuscator engine: " + (res.stderr || res.stdout));
  }
  return classesDir;
}

async function obfuscateJava(source, userOptions = {}) {
  if (typeof source !== "string") {
    throw new TypeError("Java source must be a string.");
  }
  const options = normalizeOptions({ ...userOptions, lang: "java" });
  if (options.vm === true || (options.vm && options.vm.enabled)) {
    throw new Error("Java source mode does not support VM virtualization.");
  }
  if (options.sourceMap) {
    throw new Error("Java source mode does not support source maps.");
  }
  if (userOptions.antiHook === true || (userOptions.antiHook && userOptions.antiHook.enabled)) {
    throw new Error("Java source mode does not support anti-hook guards.");
  }
  const javaOptions = options.javaOptions || {};
  const release = javaOptions.release == null ? "" : String(javaOptions.release);
  if (release && !/^\d+$/.test(release)) {
    throw new Error("javaOptions.release must be a Java release number, for example 17.");
  }
  if (javaOptions.classpath != null && typeof javaOptions.classpath !== "string") {
    throw new TypeError("javaOptions.classpath must be a string.");
  }

  const java = resolveTool("java");
  const timeoutMs = Number(javaOptions.timeoutMs) || 60000;
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "obveil-java-"));
  try {
    const classesDir = ensureClasses();
    const input = path.join(temp, "Input.java");
    const output = path.join(temp, "Output.java");
    await fs.writeFile(input, source, "utf8");

    const renameMembers = Boolean(
      userOptions.renameMembers ||
      javaOptions.renameMembers ||
      userOptions.javaRenameMembers ||
      (options.renameOptions && options.renameOptions.renameMembers)
    );
    const numbers = Boolean(
      javaOptions.numbers ||
      userOptions.numbers ||
      userOptions.javaNumbers
    );
    const antiDebug = Boolean(
      javaOptions.antiDebug ||
      userOptions.antiDebug ||
      userOptions.javaAntiDebug
    );
    const cff = Boolean(
      javaOptions.cff ||
      userOptions.cff ||
      userOptions.javaCff
    );
    const dead = Boolean(
      userOptions.javaDead !== undefined ? userOptions.javaDead :
      (javaOptions.dead !== undefined ? javaOptions.dead :
      Boolean(userOptions.dead || userOptions.javaDead))
    );
    const wrap = Boolean(
      userOptions.javaWrap !== undefined ? userOptions.javaWrap :
      (javaOptions.wrap !== undefined ? javaOptions.wrap :
      Boolean(userOptions.wrap || userOptions.javaWrap))
    );
    const idStyle = javaOptions.idStyle ||
      userOptions.javaIdStyle ||
      (options.renameOptions && options.renameOptions.style === "confusable" ? "confusable" :
       options.renameOptions && options.renameOptions.style === "short" ? "short" : "hex");

    const flags = [
      options.rename !== false ? "r" : "",
      renameMembers ? "m" : "",
      options.strings !== false ? "s" : "",
      cff ? "f" : "",
      numbers ? "n" : "",
      antiDebug ? "a" : "",
      dead ? "d" : "",
      wrap ? "w" : "",
      idStyle === "confusable" ? "I" : (idStyle === "short" ? "H" : ""),
      options.compact || (options.minify !== false && !options.beautify) ? "c" : "",
    ].join("");

    await run(java, [
      "-cp", classesDir,
      "ObveilJava", input, output, flags,
      options.seed == null ? require("node:crypto").randomBytes(16).toString("hex") : String(options.seed),
      path.basename(options.filename || "Input.java"),
      javaOptions.classpath || "", release,
    ], {
      timeout: Math.max(1000, Math.min(120000, timeoutMs)),
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, CLASSPATH: "" },
    });
    return { code: await fs.readFile(output, "utf8"), map: null };
  } catch (error) {
    if (error.code === "ENOENT" || (error.message && error.message.includes("spawnSync") && error.message.includes("ENOENT"))) {
      const missing = new Error("Java source obfuscation requires a JDK (17+ recommended). Install a JDK and set JAVA_HOME or put java on PATH.");
      missing.code = "JAVA_TOOLCHAIN_MISSING";
      throw missing;
    }
    if (error.killed || error.code === "ETIMEDOUT") {
      throw new Error("Java source obfuscation timed out.");
    }
    const message = (error.stderr || error.message || String(error)).trim();
    const failure = new Error("Java obfuscation failed: " + message);
    failure.code = "JAVA_OBFUSCATION_ERROR";
    throw failure;
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

module.exports = { obfuscateJava };
