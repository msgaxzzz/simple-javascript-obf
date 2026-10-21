const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const { execFile, spawn } = require("node:child_process");
const { promisify } = require("node:util");
const { once } = require("node:events");
const { obfuscate, obfuscateJava } = require("../src");
const { normalizeOptions } = require("../src/options");
const { buildCliArgs } = require("../src/lib/web-cli-args");
const run = promisify(execFile);
const root = path.resolve(__dirname, "..");
const simple = 'public class Hello { public static void main(String[] args) { String message = "Obveil"; int answer = 6 * 7; System.out.println(message + ":" + answer); } }';
const java = name => process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, "bin", name + (process.platform === "win32" ? ".exe" : ""))
  : name;

async function temporary(action) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "obveil-java-test-"));
  try { return await action(dir); }
  finally { await fs.rm(dir, { recursive: true, force: true }); }
}

async function execute(source, name = "Hello", classpath = "") {
  return temporary(async dir => {
    const file = path.join(dir, name + ".java");
    await fs.writeFile(file, source);
    await run(java("javac"), ["-proc:none", "-encoding", "UTF-8", "-classpath", classpath, "-d", dir, file], { timeout: 30000 });
    const result = await run(java("java"), ["-cp", [dir, classpath].filter(Boolean).join(path.delimiter), name], { timeout: 30000 });
    return result.stdout.replace(/\r\n/g, "\n");
  });
}

test("package, aliases and Java language dispatch are wired", () => {
  const pkg = require("../package.json");
  assert.equal(pkg.name, "obveil");
  assert.equal(pkg.bin.obveil, "bin/obveil");
  assert.equal(pkg.bin["java-obf"], "bin/java-obf");
  assert.equal(pkg.bin["js-obf"], "bin/js-obf");
  assert.equal(normalizeOptions({ filename: "Hello.JAVA" }).lang, "java");
  assert.equal(normalizeOptions({ lang: "JAVA" }).lang, "java");
  assert.throws(() => normalizeOptions({ lang: "python" }), /Unsupported language/);
  assert.deepEqual(buildCliArgs({ lang: "java", javaOptions: { release: 17 } }), ["--lang", "java", "--java-release", "17"]);
});

test("Java AST transforms preserve scopes, records, patterns, constants, annotations and text blocks", async () => {
  const source = await fs.readFile(path.join(__dirname, "fixtures/java/Main.java"), "utf8");
  const baseline = await execute(source, "Main");
  const result = await obfuscate(source, { lang: "java", filename: "Main.java", seed: "java-fixture", javaOptions: { release: 17 } });
  assert.equal(await execute(result.code, "Main"), baseline);
  assert.equal(result.map, null);
  assert.match(result.code, /_0x[0-9a-f]+/);
  assert.doesNotMatch(result.code, /\blocalSum\b/);
  assert.match(result.code, /private int value/);
  assert.match(result.code, /record Pair\(int left, int right\)/);
  assert.match(result.code, /viaReceiver\(Main this\)/);
  assert.doesNotMatch(result.code, /This comment should disappear/);
  assert.doesNotMatch(result.code, /"label"/);
});

test("seeds are reproducible and different seeds change local names", async () => {
  const a = await obfuscateJava(simple, { seed: "first" });
  const b = await obfuscateJava(simple, { seed: "first" });
  const c = await obfuscateJava(simple, { seed: "second" });
  assert.equal(a.code, b.code);
  assert.notEqual(a.code, c.code);
  assert.equal(await execute(a.code), "Obveil:42\n");
  assert.equal(await execute(c.code), "Obveil:42\n");
});

test("rename, string and layout toggles remain usable", async () => {
  const source = simple.replace("String message", "\n  String message");
  const result = await obfuscateJava(source, { rename: false, strings: false, minify: false });
  assert.match(result.code, /String message = "Obveil"/);
  assert.match(result.code, /\n  String message/);
  assert.equal(await execute(result.code), await execute(source));
});

test("Unicode-escaped syntax is preserved conservatively", async () => {
  const source = 'public class Hello { public static void main(String[] args) { int answer = 42; // line ' + String.fromCharCode(92) + 'u000a System.out.println(answer); } }';
  const result = await obfuscateJava(source, { seed: "unicode-syntax" });
  assert.match(result.code, /int answer/);
  assert.equal(await execute(result.code), await execute(source));
});

test("CLI infers .java and keeps the filename under an obfuscated directory", async () => {
  await temporary(async dir => {
    const input = path.join(dir, "Hello.java");
    await fs.writeFile(input, simple);
    await run(process.execPath, [path.join(root, "bin/obveil"), input, "--seed", "cli"], { cwd: root, timeout: 30000 });
    assert.equal(await fs.readFile(input, "utf8"), simple);
    const result = await fs.readFile(path.join(dir, "obfuscated/Hello.java"), "utf8");
    assert.equal(await execute(result), "Obveil:42\n");
  });
});

test("Java wrapper and stdin support explicit output and --lang=java", async () => {
  await temporary(async dir => {
    const input = path.join(dir, "Hello.java");
    const output = path.join(dir, "nested/out/Hello.java");
    await fs.writeFile(input, simple);
    await run(process.execPath, [path.join(root, "bin/java-obf"), input, "-o", output, "--java-release", "17"], { cwd: root, timeout: 30000 });
    assert.equal(await execute(await fs.readFile(output, "utf8")), "Obveil:42\n");
    const child = spawn(process.execPath, [path.join(root, "bin/obveil"), "-", "--lang=java"], { cwd: root });
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.stdin.end(simple);
    const [code] = await once(child, "close");
    assert.equal(code, 0, stderr);
    assert.equal(await execute(stdout), "Obveil:42\n");
  });
});

test("external compiled dependencies can be supplied by classpath", async () => {
  await temporary(async dir => {
    const library = path.join(dir, "Helper.java");
    await fs.writeFile(library, 'package sample; public class Helper { public static int value() { return 42; } }');
    await run(java("javac"), ["-d", dir, library]);
    const source = 'import sample.Helper; public class Hello { public static void main(String[] args) { int result = Helper.value(); System.out.println(result); } }';
    const result = await obfuscateJava(source, { javaOptions: { classpath: dir, release: 17 } });
    assert.equal(await execute(result.code, "Hello", dir), "42\n");
    const input = path.join(dir, "Hello.java");
    await fs.writeFile(input, source);
    await run(process.execPath, [path.join(root, "bin/obveil"), input, "--java-classpath", dir], { cwd: root, timeout: 30000 });
    assert.equal(await execute(await fs.readFile(path.join(dir, "obfuscated/Hello.java"), "utf8"), "Hello", dir), "42\n");
  });
});

test("invalid Java and unsupported features fail explicitly", async () => {
  await assert.rejects(() => obfuscateJava("public class Broken { void nope( }"), /Java obfuscation failed:.*line/s);
  await assert.rejects(() => obfuscateJava(simple, { sourceMap: true }), /does not support source maps/);
  await assert.rejects(() => obfuscateJava(simple, { antiHook: true }), /does not support anti-hook/);
  await assert.rejects(() => obfuscateJava(simple, { javaOptions: { release: "bad" } }), /release number/);
  await assert.rejects(() => run(process.execPath, ["bin/obveil", "input.jar"], { cwd: root }), error => /\.jar\/.class bytecode/.test(error.stderr));
});

test("missing JDK has an actionable error, without producing output", async () => {
  await temporary(async dir => {
    const input = path.join(dir, "Hello.java");
    const output = path.join(dir, "out/Hello.java");
    await fs.writeFile(input, simple);
    await assert.rejects(() => run(process.execPath, ["bin/obveil", input, "-o", output], {
      cwd: root, env: { ...process.env, JAVA_HOME: path.join(dir, "missing-jdk") },
    }), error => /requires a JDK/.test(error.stderr));
    await assert.rejects(() => fs.access(output), { code: "ENOENT" });
    assert.equal(await fs.readFile(input, "utf8"), simple);
  });
});

test("web Java mode exposes only supported options and preserves .java download names", async () => {
  const html = await fs.readFile(path.join(root, "web/index.html"), "utf8");
  assert.match(html, /<title>Obveil<\/title>/);
  assert.match(html, /<option value="java">Java \(source\)<\/option>/);
  assert.match(html, /accept="[^"]*\.java/);
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(inline);
  const collection = inline.slice(inline.indexOf("function collectOptions()"), inline.indexOf("function collectOptions()") + 800);
  const body = collection.slice(0, collection.indexOf("const includeText"));
  const context = { langEl: { value: "java" }, presetEl: { value: "high" }, optRename: { checked: true }, optStrings: { checked: true },
    optCompact: { checked: true }, optMinify: { checked: true }, optBeautify: { checked: false },
    document: { getElementById: () => ({ value: "web-seed" }) } };
  const options = vm.runInNewContext(body + "}\ncollectOptions();", context);
  assert.equal(options.lang, "java");
  assert.equal(options.vm, undefined);
  assert.equal(options.sourceMap, undefined);
  const names = inline.slice(inline.indexOf("function buildOutputName("), inline.indexOf("function setStatus("));
  assert.equal(vm.runInNewContext(names + '\nbuildOutputName("Hello.java", "java");'), "Hello.java");
});

test("local HTTP API infers Java, obfuscates, and returns compilable source", async () => {
  const child = spawn(process.execPath, ["webstart.js"], {
    cwd: root, env: { ...process.env, PORT: "0", APPWRITE_ENDPOINT: "", APPWRITE_PROJECT_ID: "", APPWRITE_OBF_FUNCTION_ID: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk; });
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Web server startup timeout: " + stderr)), 15000);
      child.on("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", code => { clearTimeout(timer); reject(new Error("Web server exited: " + code + " " + stderr)); });
      child.stdout.on("data", chunk => {
        const match = String(chunk).match(/http:\/\/localhost:(\d+)/);
        if (match) { clearTimeout(timer); resolve(Number(match[1])); }
      });
    });
    const response = await fetch("http://127.0.0.1:" + port + "/api/obfuscate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: simple, filename: "Hello.java", options: { seed: "web" } }),
      signal: AbortSignal.timeout(30000),
    });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(await execute(result.code), "Obveil:42\n");
  } finally {
    if (child.exitCode == null) {
      const closed = once(child, "exit");
      child.kill();
      await closed;
    }
  }
});

test("advanced Java protections: MBA numbers, anti-debug, confusable identifiers and CFF", async () => {
  const source = 'public class Hello { public static void main(String[] args) { int a = 1234; String s = "Secret"; System.out.println(s + ":" + a); } }';
  const result = await obfuscateJava(source, {
    seed: "sec-seed-1",
    javaOptions: {
      numbers: true,
      antiDebug: true,
      cff: true,
      idStyle: "confusable"
    }
  });

  // Check MBA numbers expression
  assert.match(result.code, /\(\(\(\d+\s*\^\s*0x[0-9a-f]+\)/);
  // Check anti-debug runtime inspection
  assert.match(result.code, /ManagementFactory\.getRuntimeMXBean/);
  assert.match(result.code, /jdwp/);
  // Check control-flow opaque predicate
  assert.match(result.code, /System\.nanoTime/);
  // Check confusable identifiers (I/l/1/0/O pattern)
  assert.match(result.code, /_[I1l0O]{6,}/);
  // Verify execution correctness
  assert.equal(await execute(result.code), "Secret:1234\n");
});

test("CLI flags wire MBA numbers, anti-debug and confusable IDs", async () => {
  await temporary(async dir => {
    const input = path.join(dir, "Hello.java");
    const output = path.join(dir, "out/Hello.java");
    await fs.writeFile(input, simple);
    await run(process.execPath, [
      path.join(root, "bin/obveil"), input, "-o", output,
      "--java-numbers", "--java-anti-debug", "--java-cff",
      "--java-id-style", "confusable", "--java-release", "17"
    ], { cwd: root, timeout: 30000 });
    const code = await fs.readFile(output, "utf8");
    assert.match(code, /ManagementFactory/);
    assert.match(code, /\(\(\(\d+\s*\^\s*0x[0-9a-f]+\)/);
    assert.match(code, /_[I1l0O]{6,}/);
    assert.equal(await execute(code), "Obveil:42\n");
  });
});

test("Java dead code injection adds opaque blocks and dummy methods while preserving execution", async () => {
  const source = 'public class Hello { public static void main(String[] args) { int answer = 42; System.out.println("Result:" + answer); } }';
  const result = await obfuscateJava(source, {
    seed: "dead-test-1",
    javaOptions: {
      dead: true
    }
  });

  assert.match(result.code, /private static int _0x[0-9a-f]+/);
  assert.equal(await execute(result.code), "Result:42\n");
});

test("CLI flag --java-dead injects dead code and executes correctly", async () => {
  await temporary(async dir => {
    const input = path.join(dir, "Hello.java");
    const output = path.join(dir, "out/Hello.java");
    await fs.writeFile(input, simple);
    await run(process.execPath, [
      path.join(root, "bin/obveil"), input, "-o", output,
      "--java-dead", "--java-release", "17"
    ], { cwd: root, timeout: 30000 });
    const code = await fs.readFile(output, "utf8");
    assert.match(code, /_0x[0-9a-f]+/);
    assert.equal(await execute(code), "Obveil:42\n");
  });
});

test("Java proxy wrap and class splitting decomposes into cooperating classes and preserves execution", async () => {
  const result = await obfuscateJava(simple, {
    seed: "wrap-test-1",
    javaOptions: {
      wrap: true
    }
  });

  assert.match(result.code, /class _0xW[0-9a-f]+/);
  assert.match(result.code, /public class Hello extends _0xW[0-9a-f]+/);
  assert.match(result.code, /class _0xP[0-9a-f]+/);
  assert.match(result.code, /class _0xG[0-9a-f]+/);
  assert.match(result.code, /class _0xS[0-9a-f]+/);
  assert.equal(await execute(result.code), "Obveil:42\n");
});

test("CLI flag --java-wrap wraps public class with proxy and executes correctly", async () => {
  await temporary(async dir => {
    const input = path.join(dir, "Hello.java");
    const output = path.join(dir, "out/Hello.java");
    await fs.writeFile(input, simple);
    await run(process.execPath, [
      path.join(root, "bin/obveil"), input, "-o", output,
      "--java-wrap", "--java-release", "17"
    ], { cwd: root, timeout: 30000 });
    const code = await fs.readFile(output, "utf8");
    assert.match(code, /public class Hello extends _0xW[0-9a-f]+/);
    assert.match(code, /class _0xP[0-9a-f]+/);
    assert.equal(await execute(code), "Obveil:42\n");
  });
});

test("static final String constants in switch cases retain compile-time constant semantics", async () => {
  const source = `public class SwitchCaseTest {
    public static final String ACTION_A = "START";
    public static final String ACTION_B = "STOP";
    public static String run(String cmd) {
      switch (cmd) {
        case ACTION_A: return "started";
        case ACTION_B: return "stopped";
        default: return "unknown";
      }
    }
    public static void main(String[] args) {
      System.out.println(run(ACTION_A) + ":" + run(ACTION_B));
    }
  }`;
  const result = await obfuscateJava(source, {
    strings: true,
    rename: true,
    javaOptions: { release: 17 }
  });
  assert.equal(await execute(result.code, "SwitchCaseTest"), "started:stopped\n");
});

test("cross-top-level class calls work with string decryption and dead code", async () => {
  const source = `public class MultiTop {
    public static void main(String[] args) {
      System.out.println(MultiTopHelper.get());
    }
  }
  class MultiTopHelper {
    public static String get() {
      return "ok";
    }
  }`;
  const result = await obfuscateJava(source, {
    strings: true,
    javaDead: true,
    javaOptions: { release: 17 }
  });
  assert.equal(await execute(result.code, "MultiTop"), "ok\n");
});

test("method override hierarchy preserves polymorphism when member renaming is enabled", async () => {
  const source = `public class InheritanceTest {
    public static void main(String[] args) {
      Parent p = new Child();
      System.out.println(p.getValue());
    }
  }
  class Parent {
    int getValue() { return 1; }
  }
  class Child extends Parent {
    @Override
    int getValue() { return 2; }
  }`;
  const result = await obfuscateJava(source, {
    rename: true,
    javaRenameMembers: true,
    javaOptions: { release: 17 }
  });
  assert.equal(await execute(result.code, "InheritanceTest"), "2\n");
});

test("class wrapper preserves private member access and main throws IOException", async () => {
  const source = `public class WrapPrivateThrows {
    private int secret = 42;
    public static void main(String[] args) throws java.io.IOException {
      WrapPrivateThrows app = new WrapPrivateThrows();
      if (app.secret != 42) throw new java.io.IOException("failed");
      System.out.println("WRAP_OK:" + app.secret);
    }
  }`;
  const result = await obfuscateJava(source, {
    javaWrap: true,
    javaOptions: { release: 17 }
  });
  assert.equal(await execute(result.code, "WrapPrivateThrows"), "WRAP_OK:42\n");
});

test("control flow flattener flattens business statements into switch state machine", async () => {
  const source = `public class CffBusinessTest {
    public static int run(int x) {
      int a = x * 2;
      int b = a + 10;
      int c = b * 3;
      if (c > 50) {
        c = c - 20;
      }
      return c;
    }
    public static void main(String[] args) {
      System.out.println("CFF_VAL:" + run(8));
    }
  }`;
  const result = await obfuscateJava(source, {
    javaCff: true,
    javaOptions: { release: 17 }
  });
  assert.match(result.code, /switch\s*\(/);
  assert.match(result.code, /case 0x[0-9a-f]+:/);
  assert.equal(await execute(result.code, "CffBusinessTest"), "CFF_VAL:58\n");
});

test("Java RC VM virtualizes method into register-context bytecode and executes correctly", async () => {
  const source = `public class RcVmTest {
    public static int compute(int x, int y) {
      int z = (x * 4) + (y ^ 15);
      int sum = 0;
      int i = 1;
      while (i <= 4) {
        if (i % 2 == 0) {
          sum = sum + i * 2;
        } else {
          sum = sum + i;
        }
        i = i + 1;
      }
      return z + sum;
    }
    public static void main(String[] args) {
      System.out.println("VM_RES:" + compute(5, 7));
    }
  }`;
  const result = await obfuscateJava(source, {
    javaVm: true,
    javaOptions: { release: 17 }
  });
  assert.match(result.code, /new int\[\]\{/);
  // (5 * 4) + (7 ^ 15) = 20 + 8 = 28; sum = 1 + 4 + 3 + 8 = 16; 28 + 16 = 44
  assert.equal(await execute(result.code, "RcVmTest"), "VM_RES:44\n");
});

test("CLI flag --java-vm wires Java RC VM virtualization and executes correctly", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "obv-cli-java-vm-"));
  const input = path.join(dir, "CliVmApp.java");
  const output = path.join(dir, "CliVmApp.obf.java");
  const source = `public class CliVmApp {
    public static int calc(int a, int b) {
      return (a + 10) * (b - 2);
    }
    public static void main(String[] args) {
      System.out.println("CLI_VM:" + calc(5, 6));
    }
  }`;
  await fs.writeFile(input, source, "utf8");
  const bin = path.resolve(__dirname, "../bin/js-obf");
  await run(process.execPath, [bin, input, "-o", output, "--java-vm"], { timeout: 30000 });
  const outCode = await fs.readFile(output, "utf8");
  assert.match(outCode, /new int\[\]\{/);
  assert.equal(await execute(outCode, "CliVmApp"), "CLI_VM:60\n");
  await fs.rm(dir, { recursive: true, force: true });
});

test("Java class name obfuscation renames inner classes, nested interfaces, enums and constructors", async () => {
  const source = `public class ClassRenamingTest {
    interface Worker {
      int compute(int x);
    }
    enum Status { ACTIVE, PAUSED }
    static class TaskRunner implements Worker {
      private int multiplier;
      public TaskRunner(int m) {
        this.multiplier = m;
      }
      public int compute(int x) {
        return x * multiplier;
      }
    }
    public static void main(String[] args) {
      Worker runner = new TaskRunner(7);
      Status st = Status.ACTIVE;
      System.out.println("CLASS_RES:" + runner.compute(6) + ":" + st);
    }
  }`;

  const result = await obfuscateJava(source, {
    renameClasses: true,
    renameMembers: true,
    rename: true,
  });

  // Verify TaskRunner and Worker are renamed in the output
  assert.doesNotMatch(result.code, /class TaskRunner\b/);
  assert.doesNotMatch(result.code, /interface Worker\b/);
  assert.doesNotMatch(result.code, /new TaskRunner\(/);

  // Verify the obfuscated code compiles and executes with exact result
  assert.equal(await execute(result.code, "ClassRenamingTest"), "CLASS_RES:42:ACTIVE\n");
});

test("Java type obfuscation swaps local primitive types to boxed reference types and preserves execution", async () => {
  const source = `public class TypeObfTest {
    public static void main(String[] args) {
      int a = 20;
      boolean flag = true;
      long counter = 1000L;
      int sum = 0;
      for (int i = 0; i < 5; i++) {
        sum += i;
      }
      System.out.println("TYPE_RES:" + (a + sum) + ":" + flag + ":" + counter);
    }
  }`;

  const result = await obfuscateJava(source, {
    typeObf: true,
    rename: false,
    strings: false,
  });

  // Verify primitive types are converted to boxed types in local variable declarations
  assert.match(result.code, /Integer\s+a\s*=/);
  assert.match(result.code, /Boolean\s+flag\s*=/);
  assert.match(result.code, /Long\s+counter\s*=/);

  // Verify execution correctness
  assert.equal(await execute(result.code, "TypeObfTest"), "TYPE_RES:30:true:1000\n");
});

test("CLI flags --java-classes and --java-types wire class and type obfuscation and execute correctly", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "obv-cli-class-type-"));
  const input = path.join(dir, "CliClassTypeApp.java");
  const output = path.join(dir, "CliClassTypeApp.obf.java");
  const source = `public class CliClassTypeApp {
    static class SecretHolder {
      int secret;
      SecretHolder(int s) { this.secret = s; }
      int get() { return secret; }
    }
    public static void main(String[] args) {
      int val = 88;
      SecretHolder h = new SecretHolder(val);
      System.out.println("CLI_CLASS_TYPE:" + h.get());
    }
  }`;
  await fs.writeFile(input, source, "utf8");
  const bin = path.resolve(__dirname, "../bin/js-obf");
  await run(process.execPath, [bin, input, "-o", output, "--java-classes", "--java-types"], { timeout: 30000 });
  const outCode = await fs.readFile(output, "utf8");

  assert.doesNotMatch(outCode, /class SecretHolder\b/);
  assert.match(outCode, /Integer\s+/);
  assert.equal(await execute(outCode, "CliClassTypeApp"), "CLI_CLASS_TYPE:88\n");
  await fs.rm(dir, { recursive: true, force: true });
});

test("Java RC VM handles long branches, loops and type-safe primitive returns", async () => {
  const source = `public class VmBranchTest {
    static int computeComplex(int x, int limit) {
      int sum = 0;
      int i = 0;
      while (i < limit) {
        if (i % 2 == 0) {
          int a = i * 2;
          int b = a + 1;
          int c = b * 3;
          sum = sum + c;
        } else {
          int d = i * 3;
          int e = d - 1;
          sum = sum + e;
        }
        i = i + 1;
      }
      return sum + x;
    }

    public static void main(String[] args) {
      int res = computeComplex(10, 20);
      System.out.println("VM_BRANCH_RES:" + res);
    }
  }`;

  const result = await obfuscateJava(source, {
    vm: true,
    rename: false,
    strings: false,
  });

  // Verify VM virtualization occurred
  assert.match(result.code, /new int\[\]\{/);
  // Verify execution correctness
  assert.equal(await execute(result.code, "VmBranchTest"), "VM_BRANCH_RES:870\n");
});

test("SymbolRenamingRegistry unifies symbol renaming across CFF, member renaming and class renaming", async () => {
  const source = `public class UnifiedTest {
    private static int counter = 10;
    private static int calc(int v) {
      return v * 3 + counter;
    }
    public static void runTest() {
      int step = 5;
      int r = calc(step);
      System.out.println("UNIFIED_OK:" + r);
    }
    public static void main(String[] args) {
      runTest();
    }
  }`;

  const result = await obfuscateJava(source, {
    rename: true,
    renameMembers: true,
    cff: true,
    javaOptions: { release: 17 }
  });

  // Verify CFF occurred
  assert.match(result.code, /while\(_0x[0-9a-fA-F]+/);
  // Verify member rename occurred
  assert.doesNotMatch(result.code, /\bcounter\b/);
  assert.doesNotMatch(result.code, /\bcalc\b/);
  // Verify execution correctness
  assert.equal(await execute(result.code, "UnifiedTest"), "UNIFIED_OK:25\n");
});




