const { DEFAULT_RESERVED } = require("./reserved");

const LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz";
const UPPER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MIX_CHARS = `${LOWER_CHARS}${UPPER_CHARS}`;

function pickChar(chars, rng, fallbackSeed) {
  if (rng) {
    return chars[rng.int(0, chars.length - 1)];
  }
  return chars[fallbackSeed % chars.length];
}

function buildSuffix(rng, seed) {
  const chars = [
    pickChar(LOWER_CHARS, rng, seed + 1),
    pickChar(UPPER_CHARS, rng, seed + 2),
    pickChar(MIX_CHARS, rng, seed + 3),
  ];
  if (rng) {
    rng.shuffle(chars);
  } else if (seed % 2 === 0) {
    [chars[0], chars[1]] = [chars[1], chars[0]];
  }
  return chars.join("");
}

class NameGenerator {
  constructor({ reserved = DEFAULT_RESERVED, rng } = {}) {
    this.reserved = new Set(reserved);
    this.rng = rng;
    this.index = 0;
  }

  next() {
    while (true) {
      const currentIndex = this.index;
      const hexPart = currentIndex.toString(16);
      const suffix = buildSuffix(this.rng, currentIndex * 31);
      const name = `_0x${hexPart}${suffix}`;
      this.index += 1;
      if (!this.reserved.has(name)) {
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
