const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const pkg = require(path.join(repoRoot, "package.json"));
const buildRoot = path.join(repoRoot, "build", "src", "luau", "custom");
const parserDecl = path.join(buildRoot, "parser.d.ts");
const tokenizerDecl = path.join(buildRoot, "tokenizer.d.ts");
const tscPath = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

assert.ok(pkg.types, "package.json should advertise a root types entry");

const buildResult = spawnSync("npm", ["run", "build:ts"], {
  cwd: repoRoot,
  encoding: "utf8",
});

if (buildResult.status !== 0) {
  throw new Error(buildResult.stderr || buildResult.stdout || `build:ts exited with code ${buildResult.status}`);
}

assert.ok(fs.existsSync(parserDecl), "expected build/src/luau/custom/parser.d.ts");
assert.ok(fs.existsSync(tokenizerDecl), "expected build/src/luau/custom/tokenizer.d.ts");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "luau-custom-dts-"));

function toImportSpecifier(targetPath) {
  let relative = path.relative(tmpDir, targetPath).replace(/\\/g, "/");
  if (!relative.startsWith(".")) {
    relative = `./${relative}`;
  }
  return relative;
}

try {
  const probePath = path.join(tmpDir, "probe.ts");
  const configPath = path.join(tmpDir, "tsconfig.json");
  const parserImport = toImportSpecifier(path.join(buildRoot, "parser"));
  const tokenizerImport = toImportSpecifier(path.join(buildRoot, "tokenizer"));

  fs.writeFileSync(
    probePath,
    [
      `import { parse, Parser } from "${parserImport}";`,
      `import { Tokenizer } from "${tokenizerImport}";`,
      "",
      "type IsAny<T> = 0 extends (1 & T) ? true : false;",
      "type ExpectFalse<T extends false> = T;",
      "",
      'const tokenizer = new Tokenizer("local value = 1");',
      "const token = tokenizer.next();",
      'const parser = new Parser("local function f<T>(x: T): T return x end");',
      'const ast = parse("local function f<T>(x: T): T return x end");',
      "type _tokenNotAny = ExpectFalse<IsAny<typeof token>>;",
      "type _parserNotAny = ExpectFalse<IsAny<typeof parser>>;",
      "type _astNotAny = ExpectFalse<IsAny<typeof ast>>;",
      "type _parseReturnNotAny = ExpectFalse<IsAny<ReturnType<typeof parse>>>;",
      "type _tokenizerInstanceNotAny = ExpectFalse<IsAny<InstanceType<typeof Tokenizer>>>;",
      "const tokenType: string = token.type;",
      'const chunkType: "Chunk" = ast.type;',
      "const tokenRange: [number, number] = token.range;",
      "const parseCurrent = parser.current;",
      "const parseLast: { type: string; value: string } | null = parser.last;",
      'const parseResult: { type: "Chunk" } = parser.parse();',
      "parser.parse();",
      "void tokenType;",
      "void chunkType;",
      "void tokenRange;",
      "void parseCurrent;",
      "void parseLast;",
      "void parseResult;",
      "",
      "// @ts-expect-error Parser source must be a string",
      "new Parser(123);",
      "// @ts-expect-error Tokenizer source must be a string",
      "new Tokenizer(false);",
      "// @ts-expect-error parse source must be a string",
      "parse({ bad: true });",
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        compilerOptions: {
          noEmit: true,
          strict: true,
          module: "CommonJS",
          target: "ES2020",
          moduleResolution: "Node",
        },
        include: [probePath],
      },
      null,
      2,
    ),
    "utf8",
  );

  const result = spawnSync(process.execPath, [tscPath, "-p", configPath, "--pretty", "false"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `tsc exited with code ${result.status}`);
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("luau-custom-declarations: ok");
