const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const vm = require("vm");
const { obfuscate, parseSource } = require("../src");
const { base85Decode, base85Encode } = require("../src/plugins/vm/encoding");
const { RNG } = require("../src/utils/rng");
const t = require("@babel/types");

const baseOptions = {
  strings: false,
  dead: false,
  cff: false,
  rename: false,
  minify: false,
  filename: "input.js",
};

function normalize(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function runCode(code, timeoutMs = 10000) {
  const logs = [];
  const context = {
    console: {
      log: (...args) => logs.push(args.join(" ")),
    },
    Buffer,
    TextDecoder,
    TextEncoder,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    ArrayBuffer,
    DataView,
    Promise,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    ReferenceError,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Symbol,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Proxy,
    Reflect,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    decodeURIComponent,
    encodeURIComponent,
    escape,
    unescape,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  };
  context.globalThis = context;
  vm.createContext(context);
  const value = vm.runInContext(code, context, { timeout: timeoutMs });
  const finish = () => ({ result: normalize(context.__result), logs });
  if (value && typeof value.then === "function") {
    return value.then(finish);
  }
  return Promise.resolve(finish());
}

async function assertSameBehaviour(source, options, timeoutMs) {
  const expected = await runCode(source, timeoutMs);
  const output = await obfuscate(source, { ...baseOptions, ...options });
  const actual = await runCode(output.code, timeoutMs);
  assert.deepStrictEqual(actual.result, expected.result);
  assert.deepStrictEqual(actual.logs, expected.logs);
  return output.code;
}

async function testStringEncodingPositions() {
  const classSource = `
    class A {
      "hello world"() { return 1; }
      "other key" = 2;
    }
    var o = { "obj method"() { return 3; } };
    globalThis.__result =
      new A()["hello world"]() + new A()["other key"] + o["obj method"]();
  `;
  await assertSameBehaviour(classSource, {
    strings: true,
    encodeObjectKeys: true,
  });

  const importSource =
    'import data from "./x.json" with { type: "json" };\ndata;\n';
  const importOutput = await obfuscate(importSource, {
    ...baseOptions,
    strings: true,
    filename: "input.mjs",
  });
  assert.ok(importOutput.code.includes('with { type: "json" }'));
  assert.ok(!importOutput.code.includes("TextDecoder"));

  const tsSource = 'type T = "hello world";\nvar x = 1;\n';
  const tsOutput = await obfuscate(tsSource, {
    ...baseOptions,
    strings: true,
    filename: "input.ts",
  });
  assert.ok(tsOutput.code.includes('"hello world"'));
  assert.ok(!tsOutput.code.includes("TextDecoder"));
}

async function testTemplateLiteralSemantics() {
  const source = `
    var o = {
      valueOf: function () { return 1; },
      toString: function () { return "x"; }
    };
    globalThis.__result = \`prefix-\${o}-suffix-\${o}\`;
  `;
  const code = await assertSameBehaviour(source, { strings: true });
  assert.ok(code.includes("prefix-") || code.includes("TextDecoder"));

  const symbolSource = `
    try {
      \`value-\${Symbol("x")}\`;
      globalThis.__result = "no-error";
    } catch (err) {
      globalThis.__result = err instanceof TypeError ? "type-error" : "other";
    }
  `;
  await assertSameBehaviour(symbolSource, { strings: true });
}

async function testDestructuredExportsKeepPublicNames() {
  const source =
    "export const { alpha, beta } = obj;\nexport const [gamma] = arr;\n";
  const output = await obfuscate(source, {
    ...baseOptions,
    rename: true,
    renameOptions: { renameGlobals: true },
    filename: "input.mjs",
  });
  const ast = parseSource(output.code, "input.mjs");
  const names = new Set();
  for (const node of ast.program.body) {
    if (node.type !== "ExportNamedDeclaration" || !node.declaration) {
      continue;
    }
    for (const name of Object.keys(t.getBindingIdentifiers(node.declaration))) {
      names.add(name);
    }
  }
  assert.ok(names.has("alpha"));
  assert.ok(names.has("beta"));
  assert.ok(names.has("gamma"));
}

async function testVmRuntimeIsEmittedOnce() {
  const one = `
    function one(a) { var b = a + 1; return b * 2; }
    globalThis.__result = one(1);
  `;
  const two = `
    function one(a) { var b = a + 1; return b * 2; }
    function two(a) { var b = a + 3; return b - 1; }
    globalThis.__result = one(1) + two(2);
  `;
  const vmOptions = {
    enabled: true,
    all: true,
    topLevel: false,
    mode: "compact",
  };
  const oneOut = await obfuscate(one, {
    ...baseOptions,
    vm: vmOptions,
  });
  const twoOut = await obfuscate(two, {
    ...baseOptions,
    vm: vmOptions,
  });
  assert.strictEqual(
    (twoOut.code.match(/__vm_rt_/g) || []).length,
    1,
    "VM runtime should be emitted once for the whole program"
  );
  assert.ok(
    Buffer.byteLength(twoOut.code) < Buffer.byteLength(oneOut.code) * 1.5,
    "two virtualized functions must not duplicate the runtime"
  );
  await assertSameBehaviour(two, { vm: vmOptions }, 30000);
}

async function testDeadCodeSkipsGeneratedRuntimes() {
  const source = 'var s = "hello world";\nglobalThis.__result = s;\n';
  const output = await obfuscate(source, {
    ...baseOptions,
    strings: true,
    dead: true,
  });
  assert.strictEqual(
    (output.code.match(/Date\.now/g) || []).length,
    0,
    "dead code must not be injected into the generated string decoder"
  );
  const run = await runCode(output.code);
  assert.strictEqual(run.result, "hello world");

  const functions = [];
  for (let i = 0; i < 20; i += 1) {
    functions.push(`function f${i}() { var x = ${i}; return x; }`);
  }
  functions.push("globalThis.__result = 0;");
  const original = await obfuscate(functions.join("\n"), {
    ...baseOptions,
    dead: true,
    seed: "dead-code-test",
  });
  assert.ok(
    (original.code.match(/Date\.now/g) || []).length > 0,
    "dead code injection should still apply to original blocks"
  );
}

async function testStringBaitIsNotInjectedWithoutStrings() {
  const output = await obfuscate("var x = 1;\n", {
    ...baseOptions,
    strings: true,
  });
  assert.ok(!output.code.includes("TextDecoder"));
  assert.ok(Buffer.byteLength(output.code) < 500);
}

async function testCffModernConstructs() {
  const cases = [
    [
      "generator",
      `function* gen() {
        var a = 1;
        a += 2;
        yield a;
        a += 3;
        yield a;
        return a + 1;
      }
      var it = gen();
      globalThis.__result = [it.next().value, it.next().value, it.next().value];
      `,
    ],
    [
      "async await",
      `async function f() {
        var a = 1;
        a += 2;
        await Promise.resolve();
        a += 3;
        return a;
      }
      (async () => { globalThis.__result = await f(); })();
      `,
    ],
    [
      "try catch finally",
      `function f(x) {
        var a = 1;
        try {
          if (x) { throw new Error("boom"); }
          a += 2;
        } catch (err) {
          a += err.message.length;
        } finally {
          a += 3;
        }
        return a;
      }
      globalThis.__result = [f(false), f(true)];
      `,
    ],
    [
      "with",
      `function f(o) {
        var a = 1;
        with (o) { a += x; }
        a *= 2;
        return a;
      }
      globalThis.__result = f({ x: 4 });
      `,
    ],
    [
      "labeled loop",
      `function f() {
        var a = 0;
        outer: for (var i = 0; i < 4; i += 1) {
          if (i === 1) { continue outer; }
          if (i === 3) { break outer; }
          a += i;
        }
        a += 10;
        return a;
      }
      globalThis.__result = f();
      `,
    ],
    [
      "program top-level",
      `var a = 1;
      a += 2;
      a *= 3;
      globalThis.__result = a;
      `,
    ],
    [
      "let class barriers",
      `var a = 1;
      a += 2;
      a += 3;
      let b = 5;
      a += b;
      a += 4;
      a += 5;
      class C { m() { return 7; } }
      a += new C().m();
      a += 6;
      a += 8;
      globalThis.__result = a;
      `,
    ],
    [
      "static block",
      `class A {
        static {
          var a = 1;
          a += 2;
          this.x = a;
        }
      }
      globalThis.__result = A.x;
      `,
    ],
    [
      "derived constructor",
      `class Base {
        constructor(x) { this.x = x; }
      }
      class Derived extends Base {
        constructor(x) {
          super(x + 1);
          this.y = this.x * 2;
          this.z = this.y + 3;
          this.w = this.z * 4;
        }
      }
      globalThis.__result = new Derived(1).w;
      `,
    ],
    [
      "async generator",
      `async function* ag() {
        var a = 1;
        a += 2;
        yield a;
        await Promise.resolve();
        a += 3;
        yield a;
      }
      (async () => {
        var out = [];
        for await (const value of ag()) { out.push(value); }
        globalThis.__result = out;
      })();
      `,
    ],
    [
      "for await of",
      `async function f() {
        var total = 0;
        for await (const value of [1, 2, 3]) {
          total += value;
        }
        total += 4;
        return total;
      }
      (async () => { globalThis.__result = await f(); })();
      `,
    ],
    [
      "try finally return",
      `function f() {
        var a = 1;
        a += 1;
        try {
          a += 2;
          return a;
        } finally {
          globalThis.__finally = a + 10;
        }
      }
      var r = f();
      globalThis.__result = [r, globalThis.__finally];
      `,
    ],
  ];

  for (const [name, source] of cases) {
    try {
      const code = await assertSameBehaviour(source, {
        cff: true,
        rename: true,
        seed: "cff-modern",
        cffOptions: { dispatcher: "switch" },
      }, 20000);
      assert.ok(
        code.includes("switch ("),
        `${name} should be control-flow flattened`
      );
    } catch (err) {
      err.message = `[CFF ${name}] ${err.message}`;
      throw err;
    }
  }

  const barrierOutput = await obfuscate(cases[6][1], {
    ...baseOptions,
    cff: true,
    rename: false,
    seed: "cff-modern",
    cffOptions: { dispatcher: "switch" },
  });
  const ast = parseSource(barrierOutput.code, "input.js");
  assert.ok(
    ast.program.body.some((node) => node.type === "ClassDeclaration"),
    "class declarations should remain barriers"
  );
  assert.ok(
    ast.program.body.some(
      (node) =>
        node.type === "VariableDeclaration" && node.kind === "let"
    ),
    "top-level let declarations should remain barriers"
  );
}

async function testCffOptions() {
  const source = `
    function f() {
      var a = 1;
      a += 2;
      return a;
    }
    globalThis.__result = f();
  `;

  const noFlatten = await obfuscate(source, {
    ...baseOptions,
    cff: true,
    seed: "cff-options",
    cffOptions: { minStatements: 5, dispatcher: "switch" },
  });
  assert.ok(!noFlatten.code.includes("switch ("));

  const flatten = await assertSameBehaviour(source, {
    cff: true,
    seed: "cff-options",
    cffOptions: {
      minStatements: 2,
      opaque: false,
      dispatcher: "switch",
    },
  });
  assert.ok(flatten.includes("switch ("));
  assert.ok(!flatten.includes("if ("), "opaque:false should not emit predicates");

  const programSource = `
    var a = 1;
    a += 2;
    a *= 3;
    globalThis.__result = a;
  `;
  const noProgram = await obfuscate(programSource, {
    ...baseOptions,
    cff: true,
    seed: "cff-options",
    cffOptions: { program: false, dispatcher: "switch" },
  });
  assert.ok(!noProgram.code.includes("switch ("));
  const withProgram = await assertSameBehaviour(programSource, {
    cff: true,
    seed: "cff-options",
    cffOptions: { dispatcher: "switch" },
  });
  assert.ok(withProgram.includes("switch ("));
}

async function testWithRenameSemantics() {
  const source = `
    function f(o) {
      var a = 1;
      with (o) { a += x; }
      return a;
    }
    var obj = { a: 100, x: 1 };
    globalThis.__result = [f(obj), obj.a];
  `;
  await assertSameBehaviour(source, { rename: true });
  await assertSameBehaviour(source, {
    rename: true,
    cff: true,
    seed: "with-rename",
    cffOptions: { dispatcher: "switch" },
  });
}

async function testVmWithCff() {
  const source = `
    function f(a) {
      var b = a + 1;
      b = b * 2;
      return b;
    }
    globalThis.__result = f(3);
  `;
  const code = await assertSameBehaviour(source, {
    rename: true,
    cff: true,
    seed: "vm-cff",
    cffOptions: { dispatcher: "switch", downlevel: true },
    vm: { enabled: true, all: true, topLevel: false, mode: "compact" },
  }, 30000);
  assert.ok(code.includes("switch ("), "CFF should flatten the VM wrapper");
}

function testVmBase85Layer() {
  const rng = new RNG("base85-test");
  const cases = [
    "",
    "a",
    "abcd",
    "hello world",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    "x".repeat(1000),
  ];
  for (const input of cases) {
    const info = base85Encode(input, rng);
    assert.strictEqual(info.alphabet.length, 85);
    assert.strictEqual(
      info.encoded.length,
      Math.ceil(info.length / 4) * 5
    );
    assert.strictEqual(
      base85Decode(
        info.encoded,
        info.alphabet,
        info.key,
        info.step,
        info.order,
        info.length
      ),
      input
    );
  }
}

async function testVmCapturedBindingsAndCatch() {
  const classSource = `
    class A {
      constructor(x) { this.x = x; }
      get() { return this.x; }
    }
    function main() {
      var a = new A(3);
      try {
        if (a.get() !== 3) { throw new Error("bad"); }
      } catch (err) {
        return err.message;
      }
      return a.get();
    }
    globalThis.__result = main();
  `;
  const vmBase = {
    enabled: true,
    topLevel: false,
    mode: "compact",
    downlevel: true,
  };
  await assertSameBehaviour(classSource, {
    seed: "vm-captured",
    vm: { ...vmBase, all: true },
  });
  await assertSameBehaviour(classSource, {
    seed: "vm-captured",
    vm: { ...vmBase, include: ["main"] },
  });

  const catchSource = `
    function main() {
      try {
        throw new Error("boom");
      } catch (err) {
        return err.message;
      }
    }
    globalThis.__result = main();
  `;
  await assertSameBehaviour(catchSource, {
    seed: "vm-catch",
    vm: { ...vmBase, include: ["main"] },
  });

  const writeSource = `
    let counter = 0;
    function main() {
      counter += 1;
      return counter;
    }
    globalThis.__result = [main(), main(), counter];
  `;
  await assertSameBehaviour(writeSource, {
    seed: "vm-write",
    vm: { ...vmBase, include: ["main"] },
  });

  const repeatSource = `
    function f(a) {
      var b = a + 1;
      b = b * 2;
      return b;
    }
    globalThis.__result = [f(1), f(2), f(3), f(1)];
  `;
  await assertSameBehaviour(repeatSource, {
    seed: "vm-cache",
    vm: { ...vmBase, all: true },
  });
}

async function runObfuscatedCommonJs(source, expected) {
  const output = await obfuscate(source, {
    ...baseOptions,
    rename: true,
    seed: "vm-commonjs",
    vm: {
      enabled: true,
      all: true,
      topLevel: false,
      mode: "compact",
      downlevel: true,
    },
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "obveil-vm-cjs-"));
  const file = path.join(dir, "output.js");
  fs.writeFileSync(file, output.code);
  try {
    const stdout = execFileSync(process.execPath, [file], {
      encoding: "utf8",
      timeout: 30000,
    }).trim();
    assert.strictEqual(stdout, expected);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function testVmCommonJsClosures() {
  await runObfuscatedCommonJs(
    `function main() {
      var p = require("path");
      return p.basename("/a/b/c.txt");
    }
    console.log(main());
    `,
    "c.txt"
  );

  await runObfuscatedCommonJs(
    `const chalk = { cyan: function (s) { return "C:" + s; } };
    function main() {
      var f = () => chalk.cyan("hello");
      return f();
    }
    console.log(main());
    `,
    "C:hello"
  );

  await runObfuscatedCommonJs(
    `function main(a, b) {
      var f = () => arguments.length + a + b;
      return f();
    }
    console.log(main(1, 2));
    `,
    "5"
  );

  await runObfuscatedCommonJs(
    `function main() {
      var f = () => this.value;
      return f();
    }
    console.log(main.call({ value: 7 }));
    `,
    "7"
  );
}

async function testCffSecurityFeatures() {
  const source = `
    function f(x) {
      var a = x + 1;
      a = a * 2;
      a = a + 3;
      a = a * 4;
      return a;
    }
    globalThis.__result = f(1);
  `;
  const options = {
    ...baseOptions,
    cff: true,
    seed: "0",
    cffOptions: {
      dispatcher: "switch",
      dynamicDispatch: true,
      dualState: true,
    },
  };
  const plain = await obfuscate(source, options);
  assert.ok(plain.code.includes("Date.now"));
  assert.ok(plain.code.includes("Math.random"));
  assert.ok(/if\s*\(/.test(plain.code), "opaque predicate should be emitted");

  const minified = await obfuscate(source, { ...options, minify: true });
  assert.ok(minified.code.includes("Date.now"));
  assert.ok(minified.code.includes("Math.random"));
  assert.ok(
    /if\s*\(/.test(minified.code),
    "opaque predicate should survive Terser"
  );

  const noOpaque = await obfuscate(source, {
    ...options,
    cffOptions: { ...options.cffOptions, opaque: false },
  });
  assert.ok(!/if\s*\(/.test(noOpaque.code), "opaque:false should disable predicates");
  assert.ok(noOpaque.code.includes("Date.now"), "dynamic dispatch key should remain");
}

async function testNewSyntaxParsing() {
  const cases = [
    [
      "using declaration",
      "async function f() { using x = foo(); return x; }\nf;",
      "input.js",
      "using x",
    ],
    [
      "auto accessor",
      "class A { accessor x = 1; }\nnew A();",
      "input.js",
      "accessor x",
    ],
    [
      "import attributes",
      'import data from "./x.json" with { type: "json" };\ndata;',
      "input.mjs",
      "with { type:",
    ],
    [
      "optional chaining assignment",
      "a?.b = 1;",
      "input.js",
      "?.",
    ],
    [
      "source phase import",
      'import source wasm from "./x.wasm";\nwasm;',
      "input.mjs",
      "import source",
    ],
    [
      "deferred import",
      'import defer * as ns from "./x.js";\nns;',
      "input.mjs",
      "import defer",
    ],
  ];

  for (const [name, source, filename, marker] of cases) {
    try {
      const output = await obfuscate(source, {
        ...baseOptions,
        filename,
      });
      assert.ok(
        output.code.includes(marker),
        `${name} should round-trip through the generator`
      );
    } catch (err) {
      err.message = `[syntax ${name}] ${err.message}`;
      throw err;
    }
  }
}

async function main() {
  await testStringEncodingPositions();
  await testTemplateLiteralSemantics();
  await testDestructuredExportsKeepPublicNames();
  await testVmRuntimeIsEmittedOnce();
  await testDeadCodeSkipsGeneratedRuntimes();
  await testStringBaitIsNotInjectedWithoutStrings();
  await testCffModernConstructs();
  await testCffOptions();
  await testWithRenameSemantics();
  await testVmBase85Layer();
  await testVmWithCff();
  await testVmCapturedBindingsAndCatch();
  await testVmCommonJsClosures();
  await testCffSecurityFeatures();
  await testNewSyntaxParsing();
  console.log("js obfuscation regression tests passed");
}

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
