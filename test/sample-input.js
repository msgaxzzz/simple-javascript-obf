function fib(n) {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

function greet(name) {
  return "hi " + name;
}

function main() {
  const value = fib(8);
  const msg = greet("js-obf");
  console.log(msg + " -> " + value);
  return { value, msg };
}

globalThis.__result = main();
