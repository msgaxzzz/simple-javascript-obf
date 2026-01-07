function work(n) {
  var x = n % 97;
  for (var i = 0; i < 20; i++) {
    x = (x * 3 + i) % 97;
    if (x % 2 === 0) {
      x += i;
    } else {
      x -= i;
    }
    switch (x % 3) {
      case 0:
        x += 7;
        break;
      case 1:
        x += 11;
        break;
      default:
        x += 13;
    }
    if (x > 1000) {
      x = x % 97;
    }
  }
  return x;
}

function bench(iterations) {
  var total = 0;
  for (var i = 0; i < iterations; i++) {
    total += work(i);
  }
  return total;
}

globalThis.bench = bench;
