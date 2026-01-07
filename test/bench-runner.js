const fs = require("fs");
const vm = require("vm");

function readCode(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function formatError(err) {
  return err && err.stack ? err.stack : String(err);
}

function runBenchmark(code, iterations) {
  const context = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    Buffer,
    TextDecoder,
    Uint8Array,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context);

  if (typeof context.bench !== "function") {
    throw new Error("bench function not found in benchmark code");
  }

  const warmup = Math.max(1, Math.floor(iterations / 10));
  for (let i = 0; i < 2; i++) {
    context.bench(warmup);
  }

  if (global.gc) {
    global.gc();
  }

  const startMem = process.memoryUsage();
  const startCpu = process.cpuUsage();
  const startWall = process.hrtime.bigint();
  const result = context.bench(iterations);
  const endWall = process.hrtime.bigint();
  const cpu = process.cpuUsage(startCpu);
  const endMem = process.memoryUsage();

  const wallSec = Number(endWall - startWall) / 1e9;
  const cpuSec = (cpu.user + cpu.system) / 1e6;
  const rssMb = endMem.rss / 1024 / 1024;
  const heapUsedMb = endMem.heapUsed / 1024 / 1024;
  const heapDeltaMb = (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024;

  return {
    wallSec,
    cpuSec,
    rssMb,
    heapUsedMb,
    heapDeltaMb,
    result,
  };
}

function main() {
  const codePath = process.argv[2];
  const iterations = Number(process.argv[3] || 20000);

  if (!codePath) {
    throw new Error("missing benchmark code path");
  }

  const code = readCode(codePath);
  const metrics = runBenchmark(code, iterations);
  process.stdout.write(`${JSON.stringify(metrics)}\n`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`${formatError(err)}\n`);
  process.exit(1);
}
