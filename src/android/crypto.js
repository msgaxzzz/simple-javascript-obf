"use strict";

const crypto = require("node:crypto");

const MAGIC = Buffer.from([0x4F, 0x42, 0x56, 0x46]); // "OBVF"
const MAGIC_MASK = Buffer.from([0x5F, 0x2A, 0x4B, 0x7E, 0x33, 0x19, 0x8D, 0x6C]);

const B85_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#";

/**
 * Encodes a buffer into Base85 (Z85-style) with 4-byte original length prefix.
 */
function encodeBase85(buf) {
  const pad = (4 - ((4 + buf.length) % 4)) % 4;
  const full = Buffer.alloc(4 + buf.length + pad);
  full.writeUInt32BE(buf.length, 0);
  buf.copy(full, 4);

  const out = [];
  for (let i = 0; i < full.length; i += 4) {
    let val = full.readUInt32BE(i);
    const c4 = val % 85; val = Math.floor(val / 85);
    const c3 = val % 85; val = Math.floor(val / 85);
    const c2 = val % 85; val = Math.floor(val / 85);
    const c1 = val % 85; val = Math.floor(val / 85);
    const c0 = val % 85;
    out.push(B85_ALPHABET[c0], B85_ALPHABET[c1], B85_ALPHABET[c2], B85_ALPHABET[c3], B85_ALPHABET[c4]);
  }
  return Buffer.from(out.join(""), "utf8");
}

/**
 * Decodes a Base85 (Z85-style) buffer back into the original raw byte buffer.
 */
function decodeBase85(b85Buf) {
  const map = {};
  for (let i = 0; i < B85_ALPHABET.length; i++) {
    map[B85_ALPHABET.charCodeAt(i)] = i;
  }
  const str = b85Buf.toString("utf8");
  const blocks = Math.floor(str.length / 5);
  const out = Buffer.alloc(blocks * 4);
  for (let i = 0; i < blocks; i++) {
    let val = 0;
    for (let j = 0; j < 5; j++) {
      val = val * 85 + (map[str.charCodeAt(i * 5 + j)] || 0);
    }
    out.writeUInt32BE(val >>> 0, i * 4);
  }
  const origLen = out.readUInt32BE(0);
  return out.subarray(4, 4 + origLen);
}

/**
 * Packages multiple DEX file buffers into a multi-layered protected payload:
 * Pipeline: DEXes -> OBVF pack -> Base85 encode -> AES-256-CBC encrypt -> Base64 encode.
 */
function packAndEncryptDexes(dexBuffers, customKey = null, customIv = null) {
  if (!Array.isArray(dexBuffers) || dexBuffers.length === 0) {
    throw new Error("dexBuffers must be a non-empty array of Buffers");
  }

  // Calculate total plain size
  let totalDataSize = 4 + 4; // MAGIC + COUNT
  for (const buf of dexBuffers) {
    totalDataSize += 4 + buf.length; // LEN + DATA
  }

  const plain = Buffer.alloc(totalDataSize);
  let offset = 0;
  MAGIC.copy(plain, offset);
  offset += 4;
  plain.writeUInt32BE(dexBuffers.length, offset);
  offset += 4;

  for (const buf of dexBuffers) {
    plain.writeUInt32BE(buf.length, offset);
    offset += 4;
    buf.copy(plain, offset);
    // Mask first 8 bytes (DEX magic & version) to prevent static/memory DEX signature scans
    for (let m = 0; m < 8 && m < buf.length; m++) {
      plain[offset + m] ^= MAGIC_MASK[m];
    }
    offset += buf.length;
  }

  const key = customKey
    ? (Buffer.isBuffer(customKey) ? customKey : Buffer.from(customKey, "hex"))
    : crypto.randomBytes(32); // AES-256
  const iv = customIv
    ? (Buffer.isBuffer(customIv) ? customIv : Buffer.from(customIv, "hex"))
    : crypto.randomBytes(16);

  // Stage 1: Base85 encode the packed OBVF data
  const b85Plain = encodeBase85(plain);

  // Stage 2: AES-256-CBC encrypt the Base85 string
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  cipher.setAutoPadding(true);
  const encryptedBytes = Buffer.concat([cipher.update(b85Plain), cipher.final()]);

  // Stage 3: Base64 encode the ciphertext into ASCII text for storage
  const encrypted = Buffer.from(encryptedBytes.toString("base64"), "utf8");

  return {
    encrypted,
    key,
    iv,
    keyHex: key.toString("hex"),
    ivHex: iv.toString("hex"),
  };
}

/**
 * Decrypts and unpacks a multi-layered payload buffer:
 * Reverse Pipeline: Base64 decode -> AES-256-CBC decrypt -> Base85 decode -> OBVF unpack.
 */
function decryptAndUnpackDexes(encryptedBuffer, key, iv) {
  const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key, "hex");
  const ivBuf = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, "hex");

  // Reverse Stage 1: Base64 decode to get raw ciphertext
  const cipherBytes = Buffer.from(encryptedBuffer.toString("utf8"), "base64");

  // Reverse Stage 2: AES-256-CBC decrypt to get Base85 text
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuf, ivBuf);
  decipher.setAutoPadding(true);
  const b85Plain = Buffer.concat([decipher.update(cipherBytes), decipher.final()]);

  // Reverse Stage 3: Base85 decode to get raw OBVF payload
  const plain = decodeBase85(b85Plain);

  if (plain.subarray(0, 4).compare(MAGIC) !== 0) {
    throw new Error("Invalid payload magic bytes");
  }

  const count = plain.readUInt32BE(4);
  let offset = 8;
  const dexes = [];

  for (let i = 0; i < count; i++) {
    const len = plain.readUInt32BE(offset);
    offset += 4;
    const dex = Buffer.from(plain.subarray(offset, offset + len));
    // Dynamic fixup: unmask first 8 bytes to restore original DEX header
    for (let m = 0; m < 8 && m < dex.length; m++) {
      dex[m] ^= MAGIC_MASK[m];
    }
    offset += len;
    dexes.push(dex);
  }

  return dexes;
}

/**
 * Splits a payload buffer into multiple chunks/fragments without .bin extension.
 */
function splitPayload(buffer, options = {}) {
  const prefix = options.prefix || "data_seg_";
  const defaultCount = Math.min(8, Math.max(3, Math.ceil(buffer.length / (32 * 1024))));
  const chunkCount = Math.max(2, options.chunkCount || defaultCount);
  const chunkSize = Math.ceil(buffer.length / chunkCount);
  const fragments = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    if (start >= buffer.length) break;
    const end = Math.min(start + chunkSize, buffer.length);
    const name = `${prefix}${String(i).padStart(2, "0")}`; // e.g. data_seg_00 (strictly no .bin)
    fragments.push({
      name,
      data: buffer.subarray(start, end),
    });
  }

  return fragments;
}

/**
 * Reassembles payload fragments back into a contiguous buffer.
 */
function assemblePayload(fragments) {
  const bufs = fragments.map((f) => (Buffer.isBuffer(f) ? f : f.data));
  return Buffer.concat(bufs);
}

module.exports = {
  MAGIC,
  MAGIC_MASK,
  B85_ALPHABET,
  encodeBase85,
  decodeBase85,
  packAndEncryptDexes,
  decryptAndUnpackDexes,
  splitPayload,
  assemblePayload,
};
