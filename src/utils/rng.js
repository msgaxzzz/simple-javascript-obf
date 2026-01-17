// ChaCha20-based CSPRNG
// Provides cryptographically strong random number generation

// ChaCha20 constants: "expand 32-byte k"
const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];

// Left rotate for 32-bit integers
function rotl(v, n) {
  return ((v << n) | (v >>> (32 - n))) >>> 0;
}

// ChaCha20 quarter round
function quarterRound(state, a, b, c, d) {
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotl(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotl(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotl(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotl(state[b] ^ state[c], 7);
}

// ChaCha20 block function (20 rounds)
function chacha20Block(state) {
  const working = state.slice();

  for (let i = 0; i < 10; i++) {
    // Column rounds
    quarterRound(working, 0, 4, 8, 12);
    quarterRound(working, 1, 5, 9, 13);
    quarterRound(working, 2, 6, 10, 14);
    quarterRound(working, 3, 7, 11, 15);
    // Diagonal rounds
    quarterRound(working, 0, 5, 10, 15);
    quarterRound(working, 1, 6, 11, 12);
    quarterRound(working, 2, 7, 8, 13);
    quarterRound(working, 3, 4, 9, 14);
  }

  const output = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    output[i] = (working[i] + state[i]) >>> 0;
  }
  return output;
}

// Derive 256-bit key from seed using iterative hashing
function deriveKey(seed) {
  const key = new Uint32Array(8);

  if (seed === undefined || seed === null) {
    // Use platform CSPRNG if available
    const bytes = getRandomBytes(32);
    if (bytes) {
      for (let i = 0; i < 8; i++) {
        key[i] =
          (bytes[i * 4] |
            (bytes[i * 4 + 1] << 8) |
            (bytes[i * 4 + 2] << 16) |
            (bytes[i * 4 + 3] << 24)) >>>
          0;
      }
      return key;
    }
    // Fallback: use high-resolution time + random
    seed = Date.now() + Math.random() * 0xffffffff;
  }

  // Convert seed to string for hashing
  const str = String(seed);

  // Initialize with FNV-1a-like values
  const init = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];

  for (let i = 0; i < 8; i++) {
    key[i] = init[i];
  }

  // Mix in seed bytes
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    const idx = i % 8;
    key[idx] ^= c;
    key[idx] = Math.imul(key[idx], 0x01000193) >>> 0;

    // Additional mixing with neighboring words
    const next = (idx + 1) % 8;
    key[next] = (key[next] + rotl(key[idx], 7)) >>> 0;
  }

  // Additional mixing rounds
  for (let round = 0; round < 8; round++) {
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      const k = (i + 3) % 8;
      key[i] = (key[i] + key[j]) >>> 0;
      key[i] = rotl(key[i], 11) ^ key[k];
      key[i] = Math.imul(key[i], 0x85ebca6b) >>> 0;
    }
  }

  return key;
}

// Get random bytes from platform CSPRNG
function getRandomBytes(n) {
  // Node.js
  if (typeof require !== "undefined") {
    try {
      const crypto = require("crypto");
      return crypto.randomBytes(n);
    } catch (e) {
      // Ignore
    }
  }

  // Browser
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  return null;
}

// Legacy hash function for backward compatibility
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
  constructor(seed, options = {}) {
    // Initialize ChaCha20 state
    // State layout: [SIGMA(4), KEY(8), COUNTER(2), NONCE(2)]
    this.state = new Uint32Array(16);

    // Set constants
    this.state[0] = SIGMA[0];
    this.state[1] = SIGMA[1];
    this.state[2] = SIGMA[2];
    this.state[3] = SIGMA[3];

    // Derive and set key
    const key = deriveKey(seed);
    for (let i = 0; i < 8; i++) {
      this.state[4 + i] = key[i];
    }

    // Counter (64-bit)
    this.state[12] = 0;
    this.state[13] = 0;

    // Nonce (64-bit) - derived from seed for reproducibility
    const seedHash = hashSeed(seed);
    this.state[14] = seedHash;
    this.state[15] = rotl(seedHash, 17) ^ 0xdeadbeef;

    // Output buffer
    this.buffer = null;
    this.bufferIdx = 64; // Force initial generation

    // Legacy state for compatibility (not used by ChaCha20)
    this.legacyState = seedHash;
  }

  // Generate next block of random bytes
  _generateBlock() {
    const block = chacha20Block(this.state);

    // Convert to bytes
    this.buffer = new Uint8Array(64);
    for (let i = 0; i < 16; i++) {
      const word = block[i];
      this.buffer[i * 4] = word & 0xff;
      this.buffer[i * 4 + 1] = (word >>> 8) & 0xff;
      this.buffer[i * 4 + 2] = (word >>> 16) & 0xff;
      this.buffer[i * 4 + 3] = (word >>> 24) & 0xff;
    }
    this.bufferIdx = 0;

    // Increment counter
    this.state[12] = (this.state[12] + 1) >>> 0;
    if (this.state[12] === 0) {
      this.state[13] = (this.state[13] + 1) >>> 0;
    }
  }

  // Get next random byte
  _nextByte() {
    if (this.bufferIdx >= 64) {
      this._generateBlock();
    }
    return this.buffer[this.bufferIdx++];
  }

  // Get next 32-bit random integer
  _nextU32() {
    const b0 = this._nextByte();
    const b1 = this._nextByte();
    const b2 = this._nextByte();
    const b3 = this._nextByte();
    return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
  }

  // Returns random float in [0, 1)
  next() {
    // Use 53 bits for full double precision
    const hi = this._nextU32() >>> 5; // 27 bits
    const lo = this._nextU32() >>> 6; // 26 bits
    return (hi * 0x4000000 + lo) / 0x20000000000000;
  }

  // Returns random integer
  int(min, max) {
    if (max === undefined) {
      return Math.floor(this.next() * min);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // Returns random boolean
  bool(prob = 0.5) {
    return this.next() < prob;
  }

  // Pick random element from array
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  // Shuffle array in place
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Generate n random bytes (new method)
  bytes(n) {
    const result = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = this._nextByte();
    }
    return result;
  }

  // Reseed the generator with additional entropy
  reseed(entropy) {
    const entropyKey = deriveKey(entropy);
    for (let i = 0; i < 8; i++) {
      this.state[4 + i] ^= entropyKey[i];
    }
    // Reset counter
    this.state[12] = 0;
    this.state[13] = 0;
    // Force new block generation
    this.bufferIdx = 64;
  }
}

module.exports = {
  RNG,
  hashSeed,
  deriveKey,
  getRandomBytes,
};
