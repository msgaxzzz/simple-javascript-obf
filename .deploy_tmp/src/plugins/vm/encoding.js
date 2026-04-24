const { getRandomBytes } = require("../../utils/rng");
const { concatKeys, streamXor, ChaCha20 } = require("../../utils/stream");

function xorBytes(bytes, maskBytes) {
  const mask = Uint8Array.from(maskBytes);
  const out = Uint8Array.from(bytes);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = out[i] ^ mask[i % mask.length];
  }
  return out;
}

function encodeBytecode(code, rng) {
  // Increased key length: 32 bytes (256 bits)
  const keyLength = 32;
  const keyBytes = rng.bytes ? rng.bytes(keyLength) : Array.from({ length: keyLength }, () => rng.int(0, 255));
  // Generate nonce for ChaCha20
  const nonceBytes = rng.bytes ? rng.bytes(12) : Array.from({ length: 12 }, () => rng.int(0, 255));

  const bytes = new Uint8Array(code.length * 4);
  for (let i = 0; i < code.length; i += 1) {
    const value = code[i] >>> 0;
    const offset = i * 4;
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
    bytes[offset + 2] = (value >>> 16) & 255;
    bytes[offset + 3] = (value >>> 24) & 255;
  }
  const encrypted = streamXor(bytes, keyBytes);
  const encoded = encodeBytes(encrypted, rng);
  const parts = splitPayload(encoded.encoded, rng);
  const order = Array.from({ length: parts.length }, (_, i) => i);
  rng.shuffle(order);
  const shuffled = order.map((idx) => parts[idx]);
  const alphabetInfo = splitSecret(Buffer.from(encoded.alphabet, "utf8"), rng);
  const byteLength = encoded.length >>> 0;
  const paramBytes = Uint8Array.from([
    encoded.xor & 255,
    encoded.rot & 255,
    byteLength & 255,
    (byteLength >>> 8) & 255,
    (byteLength >>> 16) & 255,
    (byteLength >>> 24) & 255,
    0,
    0,
  ]);
  const paramInfo = splitSecret(paramBytes, rng);
  const keyInfo = splitSecret(keyBytes, rng);
  const nonceInfo = splitSecret(nonceBytes, rng);
  return {
    parts: shuffled,
    order,
    alphabetMasked: alphabetInfo.masked,
    alphabetMask: alphabetInfo.mask,
    alphabetOrder: alphabetInfo.order,
    alphabetOrderMask: alphabetInfo.orderMask,
    paramMasked: paramInfo.masked,
    paramMask: paramInfo.mask,
    paramOrder: paramInfo.order,
    paramOrderMask: paramInfo.orderMask,
    keyMasked: keyInfo.masked,
    keyMask: keyInfo.mask,
    keyOrder: keyInfo.order,
    keyOrderMask: keyInfo.orderMask,
    nonceMasked: nonceInfo.masked,
    nonceMask: nonceInfo.mask,
    nonceOrder: nonceInfo.order,
    nonceOrderMask: nonceInfo.orderMask,
  };
}

function encodeConstPool(consts, rng) {
  // Increased key length: 32 bytes (256 bits)
  const keyLength = 32;
  const keyBytes = rng.bytes ? rng.bytes(keyLength) : Array.from({ length: keyLength }, () => rng.int(0, 255));
  // Increased mask length: 16-24 bytes
  const maskLength = rng.int(16, 24);
  const maskBytes = rng.bytes ? rng.bytes(maskLength) : Array.from({ length: maskLength }, () => rng.int(0, 255));
  // Generate nonce
  const nonceBytes = rng.bytes ? rng.bytes(12) : Array.from({ length: 12 }, () => rng.int(0, 255));

  const entries = consts.map((value) => {
    if (value === undefined) return ["u", 0];
    if (value === null) return ["l", 0];
    if (typeof value === "boolean") return ["b", value ? 1 : 0];
    if (typeof value === "number") {
      const num =
        Number.isNaN(value) ? "NaN" : Object.is(value, -0) ? "-0" : String(value);
      return ["n", num];
    }
    if (typeof value === "string") return ["s", value];
    return ["u", 0];
  });
  const json = JSON.stringify(entries);
  const bytes = Buffer.from(json, "utf8");
  const encrypted = streamXor(bytes, keyBytes);
  const masked = xorBytes(encrypted, maskBytes);
  const encoded = encodeBytes(masked, rng);
  const parts = splitPayload(encoded.encoded, rng);
  const order = Array.from({ length: parts.length }, (_, i) => i);
  rng.shuffle(order);
  const shuffled = order.map((idx) => parts[idx]);
  const alphabetInfo = splitSecret(Buffer.from(encoded.alphabet, "utf8"), rng);
  const byteLength = encoded.length >>> 0;
  const paramBytes = Uint8Array.from([
    encoded.xor & 255,
    encoded.rot & 255,
    byteLength & 255,
    (byteLength >>> 8) & 255,
    (byteLength >>> 16) & 255,
    (byteLength >>> 24) & 255,
    0,
    0,
  ]);
  const paramInfo = splitSecret(paramBytes, rng);
  const keyInfo = splitSecret(keyBytes, rng);
  const maskInfo = splitSecret(maskBytes, rng);
  const nonceInfo = splitSecret(nonceBytes, rng);
  return {
    parts: shuffled,
    order,
    alphabetMasked: alphabetInfo.masked,
    alphabetMask: alphabetInfo.mask,
    alphabetOrder: alphabetInfo.order,
    alphabetOrderMask: alphabetInfo.orderMask,
    paramMasked: paramInfo.masked,
    paramMask: paramInfo.mask,
    paramOrder: paramInfo.order,
    paramOrderMask: paramInfo.orderMask,
    keyMasked: keyInfo.masked,
    keyMask: keyInfo.mask,
    keyOrder: keyInfo.order,
    keyOrderMask: keyInfo.orderMask,
    maskMasked: maskInfo.masked,
    maskMask: maskInfo.mask,
    maskOrder: maskInfo.order,
    maskOrderMask: maskInfo.orderMask,
    nonceMasked: nonceInfo.masked,
    nonceMask: nonceInfo.mask,
    nonceOrder: nonceInfo.order,
    nonceOrderMask: nonceInfo.orderMask,
  };
}

function splitPayload(payload, rng) {
  const parts = [];
  let index = 0;
  while (index < payload.length) {
    const size = rng.int(12, 42);
    parts.push(payload.slice(index, index + size));
    index += size;
  }
  return parts.length ? parts : [payload];
}

function buildAlphabet(rng) {
  const pool =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
  const chars = pool.split("");
  rng.shuffle(chars);
  return chars.join("");
}

function encodeBytes(bytes, rng) {
  const alphabet = buildAlphabet(rng);
  const xor = rng.int(1, 63);
  const rot = rng.int(0, 63);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (b0 << 16) | (b1 << 8) | b2;
    for (let j = 0; j < 4; j += 1) {
      const sextet = (triple >> (18 - j * 6)) & 63;
      const mixed = ((sextet + rot) & 63) ^ xor;
      out += alphabet[mixed];
    }
  }
  return {
    alphabet,
    xor,
    rot,
    encoded: out,
    length: bytes.length,
  };
}

function splitSecret(bytes, rng) {
  const byteArray = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  const order = Array.from({ length: byteArray.length }, (_, i) => i);
  rng.shuffle(order);
  const masked = [];
  const mask = [];
  for (let i = 0; i < order.length; i += 1) {
    const value = byteArray[order[i]];
    const m = rng.int(0, 255);
    masked.push(value ^ m);
    mask.push(m);
  }
  const orderMask = rng.int(1, 255);
  const orderEnc = order.map((idx) => idx ^ orderMask);
  return {
    masked,
    mask,
    order: orderEnc,
    orderMask,
  };
}

function encodeOpcodeTable(opcodeDecode, rng) {
  const length = opcodeDecode.length;
  // Use RNG bytes method if available, otherwise use getRandomBytes
  const keyBytes = rng.bytes ? rng.bytes(32) : (getRandomBytes(32) || Array.from({ length: 32 }, () => rng.int(0, 255)));
  const nonceBytes = rng.bytes
    ? rng.bytes(12)
    : (getRandomBytes(12) || Array.from({ length: 12 }, () => rng.int(0, 255)));
  const nonceMid = nonceBytes.length >>> 1;
  const ivBytes = nonceBytes.slice(0, nonceMid);
  const tagBytes = nonceBytes.slice(nonceMid);

  const input = Buffer.from(Uint8Array.from(opcodeDecode));
  const streamKey = concatKeys(keyBytes, ivBytes, tagBytes);
  const ciphertext = streamXor(input, streamKey);
  const encoded = encodeBytes(ciphertext, rng);
  const parts = splitPayload(encoded.encoded, rng);
  const order = Array.from({ length: parts.length }, (_, i) => i);
  rng.shuffle(order);
  const shuffled = order.map((idx) => parts[idx]);
  const keyInfo = splitSecret(keyBytes, rng);
  const ivInfo = splitSecret(ivBytes, rng);
  const tagInfo = splitSecret(tagBytes, rng);
  const alphabetInfo = splitSecret(Buffer.from(encoded.alphabet, "utf8"), rng);
  const cipherLength = encoded.length >>> 0;
  const opsLength = length >>> 0;
  const paramBytes = Uint8Array.from([
    encoded.xor & 255,
    encoded.rot & 255,
    cipherLength & 255,
    (cipherLength >>> 8) & 255,
    (cipherLength >>> 16) & 255,
    (cipherLength >>> 24) & 255,
    opsLength & 255,
    (opsLength >>> 8) & 255,
  ]);
  const paramInfo = splitSecret(paramBytes, rng);
  return {
    parts: shuffled,
    order,
    alphabetMasked: alphabetInfo.masked,
    alphabetMask: alphabetInfo.mask,
    alphabetOrder: alphabetInfo.order,
    alphabetOrderMask: alphabetInfo.orderMask,
    paramMasked: paramInfo.masked,
    paramMask: paramInfo.mask,
    paramOrder: paramInfo.order,
    paramOrderMask: paramInfo.orderMask,
    keyMasked: keyInfo.masked,
    keyMask: keyInfo.mask,
    keyOrder: keyInfo.order,
    keyOrderMask: keyInfo.orderMask,
    ivMasked: ivInfo.masked,
    ivMask: ivInfo.mask,
    ivOrder: ivInfo.order,
    ivOrderMask: ivInfo.orderMask,
    tagMasked: tagInfo.masked,
    tagMask: tagInfo.mask,
    tagOrder: tagInfo.order,
    tagOrderMask: tagInfo.orderMask,
  };
}

module.exports = {
  encodeBytecode,
  encodeConstPool,
  encodeOpcodeTable,
  splitPayload,
};
