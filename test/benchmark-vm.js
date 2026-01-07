const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { obfuscate } = require("../src");

const DEFAULT_ITERATIONS = 20000;
const DEFAULT_PRESET = "high";
const DEFAULT_SEED = "bench-seed";

function parseArgs(argv) {
  const options = {
    iterations: DEFAULT_ITERATIONS,
    preset: DEFAULT_PRESET,
    seed: DEFAULT_SEED,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--iterations" || arg === "-n") {
      options.iterations = Number(argv[i + 1]);
      i++;
      continue;
    }
    if (arg === "--preset") {
      options.preset = argv[i + 1] || DEFAULT_PRESET;
      i++;
      continue;
    }
    if (arg === "--seed") {
      options.seed = argv[i + 1] || DEFAULT_SEED;
      i++;
      continue;
    }
  }

  if (!Number.isFinite(options.iterations) || options.iterations <= 0) {
    options.iterations = DEFAULT_ITERATIONS;
  }

  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function runBenchmark(label, runnerPath, codePath, iterations) {
  const result = spawnSync(
    process.execPath,
    ["--expose-gc", runnerPath, codePath, String(iterations)],
    { encoding: "utf8" }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const message = result.stderr || result.stdout || "benchmark failed";
    throw new Error(`[${label}] ${message.trim()}`);
  }

  const stdout = result.stdout.trim();
  return JSON.parse(stdout);
}

function ratio(value, base) {
  if (!base) {
    return "n/a";
  }
  return `${(value / base).toFixed(2)}x`;
}

function formatNum(value, digits = 3) {
  return Number(value).toFixed(digits);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const benchSourcePath = path.join(__dirname, "benchmark-source.js");
  const outDir = path.join(__dirname, "dist");
  const runnerPath = path.join(__dirname, "bench-runner.js");

  ensureDir(outDir);

  const source = fs.readFileSync(benchSourcePath, "utf8");
  const originalPath = path.join(outDir, "bench.original.js");
  writeFile(originalPath, source);

  const obf = await obfuscate(source, {
    preset: options.preset,
    seed: options.seed,
    filename: "benchmark-source.js",
  });
  const obfPath = path.join(outDir, "bench.obf.js");
  writeFile(obfPath, obf.code);

  const obfVm = await obfuscate(source, {
    preset: options.preset,
    seed: options.seed,
    filename: "benchmark-source.js",
    vm: { enabled: true, include: ["work", "bench"] },
  });
  const vmPath = path.join(outDir, "bench.vm.js");
  writeFile(vmPath, obfVm.code);

  const baseline = runBenchmark(
    "original",
    runnerPath,
    originalPath,
    options.iterations
  );
  const noVm = runBenchmark("obf-no-vm", runnerPath, obfPath, options.iterations);
  const withVm = runBenchmark("obf-vm", runnerPath, vmPath, options.iterations);

  const rows = [
    {
      variant: "original",
      wallSec: formatNum(baseline.wallSec),
      cpuSec: formatNum(baseline.cpuSec),
      rssMb: formatNum(baseline.rssMb, 1),
      heapUsedMb: formatNum(baseline.heapUsedMb, 1),
      wallRatio: "1.00x",
      cpuRatio: "1.00x",
      rssRatio: "1.00x",
    },
    {
      variant: "obf-no-vm",
      wallSec: formatNum(noVm.wallSec),
      cpuSec: formatNum(noVm.cpuSec),
      rssMb: formatNum(noVm.rssMb, 1),
      heapUsedMb: formatNum(noVm.heapUsedMb, 1),
      wallRatio: ratio(noVm.wallSec, baseline.wallSec),
      cpuRatio: ratio(noVm.cpuSec, baseline.cpuSec),
      rssRatio: ratio(noVm.rssMb, baseline.rssMb),
    },
    {
      variant: "obf-vm",
      wallSec: formatNum(withVm.wallSec),
      cpuSec: formatNum(withVm.cpuSec),
      rssMb: formatNum(withVm.rssMb, 1),
      heapUsedMb: formatNum(withVm.heapUsedMb, 1),
      wallRatio: ratio(withVm.wallSec, baseline.wallSec),
      cpuRatio: ratio(withVm.cpuSec, baseline.cpuSec),
      rssRatio: ratio(withVm.rssMb, baseline.rssMb),
    },
  ];

  console.log(`preset: ${options.preset}, iterations: ${options.iterations}`);
  console.table(rows);
  console.log("note: rss/heap are end-of-run samples, not peak.");
}

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
