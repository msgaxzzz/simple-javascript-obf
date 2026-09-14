const assert = require("assert");
const { obfuscateLuau } = require("../src/luau");
const { checkLuauWasm, executeLuauWasm } = require("../src/luau/wasm");

async function runRcVmTests() {
  console.log("=== Running Luau 3-Address RC VM Test Suite ===");

  // Test 1: Arithmetic and functions
  {
    const source = `
      local function calc(a, b)
        local sum = a + b
        local diff = a - b
        local prod = a * b
        local idiv = a // b
        local mod = a % b
        return sum + diff + prod + idiv + mod
      end
      print("TEST1:", calc(14, 4))
    `;
    // sum = 18, diff = 10, prod = 56, idiv = 3, mod = 2. total = 18+10+56+3+2 = 89
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 1 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 1 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("TEST1:\t89"), "Test 1 output: " + exec.output);
    console.log("  [PASS] Test 1: Full 3-address arithmetic & functions");
  }

  // Test 2: Recursive closures & lexical upvalues
  {
    const source = `
      local function fib(n)
        if n <= 1 then
          return n
        end
        return fib(n - 1) + fib(n - 2)
      end
      print("TEST2:", fib(8))
    `;
    // fib(8) = 21
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 2 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 2 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("TEST2:\t21"), "Test 2 output: " + exec.output);
    console.log("  [PASS] Test 2: Recursive closures & lexical scoping");
  }

  // Test 3: Loops & Tables
  {
    const source = `
      local total = 0
      for i = 1, 10 do
        total = total + i
      end

      local obj = { base = 100, delta = total }
      obj.final = obj.base + obj.delta

      print("TEST3:", obj.final)
    `;
    // total = 55, final = 155
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 3 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 3 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("TEST3:\t155"), "Test 3 output: " + exec.output);
    console.log("  [PASS] Test 3: Loops & table constructors");
  }

  // Test 4: Bitwise operations
  {
    const source = `
      local a = 0x0F
      local b = 0x33
      local andVal = bit32.band(a, b)
      local orVal = bit32.bor(a, b)
      local xorVal = bit32.bxor(a, b)
      print("TEST4:", andVal, orVal, xorVal)
    `;
    // a = 15 (0000 1111), b = 51 (0011 0011)
    // band = 3, bor = 63, bxor = 60
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 4 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 4 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("3\t63\t60"), "Test 4 output: " + exec.output);
    console.log("  [PASS] Test 4: Bitwise operations");
  }

  // Test 5: Nested multi-level closures & generic for loops with iterators
  {
    const source = `
      local function makeCounter(start)
        local val = start
        local function add(step)
          val = val + step
          return val
        end
        return add
      end

      local counter = makeCounter(100)
      local c1 = counter(10)
      local c2 = counter(25)

      local list = { 1, 2, 3, 4, 5 }
      local sum = 0
      for idx, item in ipairs(list) do
        sum = sum + item * idx
      end
      -- c1 = 110, c2 = 135.
      -- sum = 1*1 + 2*2 + 3*3 + 4*4 + 5*5 = 1 + 4 + 9 + 16 + 25 = 55.
      -- total = 110 + 135 + 55 = 300
      print("TEST5:", c1 + c2 + sum)
    `;
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true, opcodeShuffle: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 5 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 5 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("TEST5:\t300"), "Test 5 output: " + exec.output);
    console.log("  [PASS] Test 5: Nested closures & generic iterator loops");
  }

  console.log("\n>>> ALL RC VM TESTS PASSED WITH 100% PRECISION! <<<");
}

runRcVmTests().catch((err) => {
  console.error("RC VM Tests failed:", err);
  process.exit(1);
});
