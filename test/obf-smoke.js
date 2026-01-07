const assert = require("assert");
const vm = require("vm");
const { obfuscate } = require("../src");

function runCode(code, timeoutMs = 5000) {
  const logs = [];
  const context = {
    console: {
      log: (...args) => logs.push(args.join(" ")),
    },
    Buffer,
    TextDecoder,
    Uint8Array,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context, { timeout: timeoutMs });
  const result =
    context.__result === undefined
      ? undefined
      : JSON.parse(JSON.stringify(context.__result));
  return { result, logs };
}

const source = `
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

function vmTarget(x) {
  let y = x + 1;
  for (let i = 0; i < 3; i++) {
    y += i;
  }
  if (y % 2 === 0) {
    y += 5;
  } else {
    y -= 5;
  }
  switch (y % 3) {
    case 0:
      y += 7;
      break;
    case 1:
      y += 11;
      break;
    default:
      y += 13;
  }
  return y;
}

function superTarget() {
  const base = { value: 10, get() { return this.value; } };
  const obj = {
    get() {
      return super.get() + 1;
    },
  };
  Object.setPrototypeOf(obj, base);
  return obj.get();
}

function main(input) {
  const map = { a: 1, b: 2 };
  let label = "len:" + input.length;
  let res =
    sum(input) + map.a + map.b + vmTarget(input.length) + superTarget();
  if (res > 10) {
    res -= 3;
  } else {
    res += 3;
  }
  switch (res % 3) {
    case 0:
      res += 7;
      break;
    case 1:
      res += 11;
      break;
    default:
      res += 13;
  }
  try {
    if (input[0] === 99) {
      throw new Error("boom");
    }
  } catch (err) {
    res += err.message.length;
  }
  const out = { res, label };
  globalThis.__result = out;
  console.log(label);
  return out;
}

main([1, 2, 3, 4]);
`;

async function main() {
  const baseline = runCode(source);

  const obfHigh = await obfuscate(source, { preset: "high", seed: "test-seed" });
  const obfHighResult = runCode(obfHigh.code);

  assert.deepStrictEqual(obfHighResult.result, baseline.result);
  assert.deepStrictEqual(obfHighResult.logs, baseline.logs);

  const obfVm = await obfuscate(source, {
    preset: "low",
    seed: "test-seed",
    vm: { enabled: true, include: ["vmTarget", "superTarget"] },
  });
  const obfVmResult = runCode(obfVm.code, 20000);

  assert.deepStrictEqual(obfVmResult.result, baseline.result);
  assert.deepStrictEqual(obfVmResult.logs, baseline.logs);

  console.log("obfuscation smoke test passed");
}

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
  process.exit(1);
});
