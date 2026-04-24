const { DEFAULT_RESERVED } = require("./reserved");

const FIRST_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
const REST_CHARS = `${FIRST_CHARS}0123456789`;

function shuffleChars(chars, rng) {
  const list = chars.split("");
  if (rng) {
    rng.shuffle(list);
  }
  return list.join("");
}

function hash32(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

function encodeBase(value, alphabet, minLen) {
  const base = alphabet.length;
  let v = value >>> 0;
  let out = "";
  do {
    out = alphabet[v % base] + out;
    v = Math.floor(v / base);
  } while (v > 0);
  if (minLen && out.length < minLen) {
    let pad = value >>> 0;
    while (out.length < minLen) {
      pad = Math.imul(pad ^ 0x5bd1e995, 0x27d4eb2d) >>> 0;
      out = alphabet[pad % base] + out;
    }
  }
  return out;
}

class NameGenerator {
  constructor({ reserved = DEFAULT_RESERVED, rng } = {}) {
    this.reserved = new Set(reserved);
    this.rng = rng;
    this.index = 0;
    this.used = new Set();
    this.firstAlphabet = shuffleChars(FIRST_CHARS, rng);
    this.restAlphabet = shuffleChars(REST_CHARS, rng);
    this.salt = rng ? rng.int(0, 0x7fffffff) : 0x9e3779b9;
  }

  next() {
    while (true) {
      const currentIndex = this.index;
      this.index += 1;
      const mixed = hash32(currentIndex + this.salt);
      const first = this.firstAlphabet[mixed % this.firstAlphabet.length];
      const minLen = 2 + (mixed % 3);
      const body = encodeBase(hash32(mixed ^ 0x9e3779b9), this.restAlphabet, minLen);
      const name = `${first}${body}`;
      if (!this.reserved.has(name) && !this.used.has(name)) {
        this.used.add(name);
        return name;
      }
    }
  }

  reserve(name) {
    this.reserved.add(name);
  }
}

module.exports = {
  NameGenerator,
};
