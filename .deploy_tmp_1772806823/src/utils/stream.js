// ChaCha20 Stream Cipher
// Standards-compliant implementation for encryption

const { getRandomBytes } = require("./rng");

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
  const working = new Uint32Array(state);

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

  const output = new Uint8Array(64);
  for (let i = 0; i < 16; i++) {
    const word = (working[i] + state[i]) >>> 0;
    output[i * 4] = word & 0xff;
    output[i * 4 + 1] = (word >>> 8) & 0xff;
    output[i * 4 + 2] = (word >>> 16) & 0xff;
    output[i * 4 + 3] = (word >>> 24) & 0xff;
  }
  return output;
}

// Initialize ChaCha20 state from key and nonce
function initState(key, nonce, counter = 0) {
  const state = new Uint32Array(16);

  // Constants
  state[0] = SIGMA[0];
  state[1] = SIGMA[1];
  state[2] = SIGMA[2];
  state[3] = SIGMA[3];

  // Key (256 bits = 8 x 32-bit words)
  for (let i = 0; i < 8; i++) {
    state[4 + i] =
      (key[i * 4] |
        (key[i * 4 + 1] << 8) |
        (key[i * 4 + 2] << 16) |
        (key[i * 4 + 3] << 24)) >>>
      0;
  }

  // Counter (32-bit)
  state[12] = counter >>> 0;

  // Nonce (96 bits = 3 x 32-bit words)
  for (let i = 0; i < 3; i++) {
    state[13 + i] =
      (nonce[i * 4] |
        (nonce[i * 4 + 1] << 8) |
        (nonce[i * 4 + 2] << 16) |
        (nonce[i * 4 + 3] << 24)) >>>
      0;
  }

  return state;
}

// Pad or hash key to 32 bytes
function normalizeKey(keyBytes) {
  const key = new Uint8Array(32);

  if (keyBytes.length >= 32) {
    // Take first 32 bytes
    key.set(keyBytes.slice(0, 32));
  } else {
    // Pad with derived bytes
    key.set(keyBytes);
    // Fill remaining with hash-derived values
    let h = 0x811c9dc5;
    for (let i = 0; i < keyBytes.length; i++) {
      h ^= keyBytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    for (let i = keyBytes.length; i < 32; i++) {
      h ^= i;
      h = Math.imul(h, 0x01000193) >>> 0;
      key[i] = h & 0xff;
    }
  }

  return key;
}

// Derive nonce from key (for deterministic encryption)
function deriveNonce(keyBytes) {
  const nonce = new Uint8Array(12);
  let h = 0x6a09e667;

  for (let i = 0; i < keyBytes.length; i++) {
    h ^= keyBytes[i];
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h = rotl(h, 13);
  }

  for (let i = 0; i < 12; i++) {
    h ^= i * 0x9e3779b9;
    h = Math.imul(h, 0xcc9e2d51) >>> 0;
    nonce[i] = h & 0xff;
    h = rotl(h, 15);
  }

  return nonce;
}

// Generate random nonce
function generateNonce() {
  const bytes = getRandomBytes(12);
  if (bytes) {
    return Uint8Array.from(bytes);
  }
  // Fallback
  const nonce = new Uint8Array(12);
  for (let i = 0; i < 12; i++) {
    nonce[i] = (Math.random() * 256) >>> 0;
  }
  return nonce;
}

// Generate random key
function generateKey() {
  const bytes = getRandomBytes(32);
  if (bytes) {
    return Uint8Array.from(bytes);
  }
  // Fallback
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = (Math.random() * 256) >>> 0;
  }
  return key;
}

// Create ChaCha20 stream cipher
function createChaCha20Stream(key, nonce, initialCounter = 0) {
  const state = initState(key, nonce, initialCounter);
  let block = null;
  let blockIdx = 64;
  let counter = initialCounter;

  return function next(byte) {
    if (blockIdx >= 64) {
      state[12] = counter >>> 0;
      block = chacha20Block(state);
      blockIdx = 0;
      counter++;
    }
    return byte ^ block[blockIdx++];
  };
}

// Encrypt/decrypt bytes with ChaCha20
function chacha20Crypt(bytes, key, nonce, initialCounter = 0) {
  const normalKey = normalizeKey(Uint8Array.from(key));
  const normalNonce = nonce
    ? Uint8Array.from(nonce)
    : deriveNonce(Uint8Array.from(key));

  const stream = createChaCha20Stream(normalKey, normalNonce, initialCounter);
  const output = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    output[i] = stream(bytes[i]);
  }

  return output;
}

// High-level encrypt with prepended nonce
function encrypt(plaintext, key) {
  const normalKey = normalizeKey(Uint8Array.from(key));
  const nonce = generateNonce();
  const stream = createChaCha20Stream(normalKey, nonce, 0);

  const ciphertext = new Uint8Array(12 + plaintext.length);
  // Prepend nonce
  ciphertext.set(nonce);
  // Encrypt
  for (let i = 0; i < plaintext.length; i++) {
    ciphertext[12 + i] = stream(plaintext[i]);
  }

  return ciphertext;
}

// High-level decrypt with nonce extraction
function decrypt(ciphertext, key) {
  if (ciphertext.length < 12) {
    throw new Error("Ciphertext too short");
  }

  const normalKey = normalizeKey(Uint8Array.from(key));
  const nonce = ciphertext.slice(0, 12);
  const encrypted = ciphertext.slice(12);

  const stream = createChaCha20Stream(normalKey, nonce, 0);
  const plaintext = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    plaintext[i] = stream(encrypted[i]);
  }

  return plaintext;
}

// ============================================
// Legacy API for backward compatibility
// ============================================

// Legacy: derive parameters from key (simplified)
function deriveParams(keyBytes) {
  const key = Uint8Array.from(keyBytes);
  const len = key.length || 1;
  const pick = (idx) => key[idx % len] & 255;
  const variant = pick(0) & 1;
  const r0 = (pick(1) % 7) + 3;
  const r1 = (pick(2) % 7) + 5;
  const r2 = (pick(3) % 7) + 3;
  const r3 = (pick(4) % 7) + 5;
  let s0 =
    ((pick(5) << 24) | (pick(6) << 16) | (pick(7) << 8) | pick(8)) >>> 0;
  let s1 =
    ((pick(9) << 24) | (pick(10) << 16) | (pick(11) << 8) | pick(12)) >>> 0;
  s0 ^= (len << 24) >>> 0;
  s1 ^= (len << 16) >>> 0;
  for (let i = 0; i < len; i += 1) {
    const v = (pick(i) + i * 17) & 255;
    const fold = ((v << (i & 7)) | (v >>> (8 - (i & 7)))) & 255;
    s0 = (s0 + fold) >>> 0;
    s0 = rotl(s0, r0);
    s1 = (s1 + (s0 ^ (v << r2))) >>> 0;
    s1 = ((s1 >>> r1) | (s1 << (32 - r1))) >>> 0;
  }
  return {
    key,
    variant,
    r0,
    r1,
    r2,
    r3,
    s0,
    s1,
  };
}

// Legacy stream creator - now uses ChaCha20 internally
function createStream(keyBytes) {
  const normalKey = normalizeKey(Uint8Array.from(keyBytes));
  const nonce = deriveNonce(Uint8Array.from(keyBytes));
  return createChaCha20Stream(normalKey, nonce, 0);
}

// Legacy streamXor - now uses ChaCha20
function streamXor(bytes, keyBytes) {
  return chacha20Crypt(bytes, keyBytes);
}

// Concatenate key parts
function concatKeys(...parts) {
  const total = parts.reduce((sum, part) => sum + (part ? part.length : 0), 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    if (!part || !part.length) continue;
    out.set(Uint8Array.from(part), offset);
    offset += part.length;
  }
  return out;
}

// ChaCha20 high-level API
const ChaCha20 = {
  createStream: createChaCha20Stream,
  encrypt: chacha20Crypt,
  decrypt: chacha20Crypt, // Same operation for stream cipher
  encryptWithNonce: encrypt,
  decryptWithNonce: decrypt,
  generateKey,
  generateNonce,
  normalizeKey,
  deriveNonce,
};

module.exports = {
  // New ChaCha20 API
  ChaCha20,
  chacha20Crypt,

  // Legacy API (uses ChaCha20 internally now)
  createStream,
  streamXor,
  concatKeys,
};
