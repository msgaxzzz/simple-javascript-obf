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

  // Test 6: Deep tail-recursion optimization (TAILCALL)
  {
    const source = `
      local function count(n, acc)
        if n <= 0 then
          return acc
        end
        return count(n - 1, acc + 1)
      end
      print("TEST6:", count(3000, 10))
    `;
    // count(3000, 10) = 3010 without stack overflow
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 6 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 6 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("TEST6:\t3010"), "Test 6 output: " + exec.output);
    console.log("  [PASS] Test 6: Deep tail-recursion optimization (TAILCALL)");
  }

  // Test 7: Multi-returns and unpacked dynamic arguments alignment
  {
    const source = `
      local function getPair(x, y)
        return x * 2, y * 3
      end

      local u = table.unpack or unpack
      local tbl = { 5, 7 }
      local a, b = getPair(u(tbl))

      local function multiThree()
        return 100, 200, 300
      end

      local first, second, third = 50, multiThree()
      print("TEST7:", a, b, first, second, third)
    `;
    // a = 10, b = 21, first = 50, second = 100, third = 200
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 7 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 7 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("10\t21\t50\t100\t200"), "Test 7 output: " + exec.output);
    console.log("  [PASS] Test 7: Multi-returns and dynamic unpacked argument alignment");
  }

  // Test 8: Enhanced TFORLOOP iterator pipeline and pcall error handling
  {
    const source = `
      local dict = { alpha = 10, beta = 20, gamma = 30 }
      local sum = 0
      for k, v in pairs(dict) do
        sum = sum + v
      end

      -- Iterator error handling with pcall
      local function faultyIterator(s, var)
        if var == nil then
          return 1, "first"
        elseif var == 1 then
          error("custom_iterator_fault")
        end
        return nil
      end

      local ok, err = pcall(function()
        for id, label in faultyIterator do
          -- should execute once, then error on next
        end
      end)

      print("TEST8:", sum, ok, tostring(err):find("custom_iterator_fault") ~= nil)
    `;
    // sum = 60, ok = false, error captured = true
    const res = await obfuscateLuau(source, {
      vm: { enabled: true, kind: "rc", packed: true },
    });
    const check = await checkLuauWasm(res.code);
    assert.ok(check.ok, "Test 8 syntax check: " + (check.error || "ok"));

    const exec = await executeLuauWasm(res.code);
    assert.ok(exec.ok, "Test 8 execution: " + (exec.error || "ok"));
    assert.ok(exec.output && exec.output.includes("TEST8:\t60\tfalse\ttrue"), "Test 8 output: " + exec.output);
    console.log("  [PASS] Test 8: Enhanced TFORLOOP pipeline and pcall error handling");
  }

  console.log("\n>>> ALL RC VM TESTS PASSED WITH 100% PRECISION! <<<");
}

runRcVmTests().catch((err) => {
  console.error("RC VM Tests failed:", err);
  process.exit(1);
});
