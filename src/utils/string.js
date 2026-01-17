const { TextEncoder } = require("util");
const { streamXor, ChaCha20 } = require("./stream");

// Legacy string encoding (uses ChaCha20 internally via streamXor)
function encodeString(value, keyBytes) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const encrypted = streamXor(bytes, keyBytes);
  return Buffer.from(encrypted).toString("base64");
}

// Enhanced string encoding with explicit nonce
function encodeStringSecure(value, keyBytes, nonceBytes) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const key = ChaCha20.normalizeKey(Uint8Array.from(keyBytes));
  const nonce = nonceBytes
    ? Uint8Array.from(nonceBytes)
    : ChaCha20.deriveNonce(Uint8Array.from(keyBytes));
  const encrypted = ChaCha20.encrypt(bytes, key, nonce);
  return Buffer.from(encrypted).toString("base64");
}

// Encode string with prepended nonce (self-contained)
function encodeStringWithNonce(value, keyBytes) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  const key = ChaCha20.normalizeKey(Uint8Array.from(keyBytes));
  const encrypted = ChaCha20.encryptWithNonce(bytes, key);
  return Buffer.from(encrypted).toString("base64");
}

module.exports = {
  encodeString,
  encodeStringSecure,
  encodeStringWithNonce,
};
