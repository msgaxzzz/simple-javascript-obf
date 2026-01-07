function hashSeed(seed) {
  if (typeof seed === "number") {
    return seed >>> 0;
  }
  const str = String(seed);
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class RNG {
  constructor(seed) {
    this.state = hashSeed(seed || Date.now());
  }

  next() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }

  int(min, max) {
    if (max === undefined) {
      return Math.floor(this.next() * min);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  bool(prob = 0.5) {
    return this.next() < prob;
  }

  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

module.exports = {
  RNG,
  hashSeed,
};
