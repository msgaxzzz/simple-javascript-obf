function rotl(value, shift) {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function rotr(value, shift) {
  return ((value >>> shift) | (value << (32 - shift))) >>> 0;
}

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
    s1 = rotr(s1, r1);
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

function createStream(keyBytes) {
  const params = deriveParams(keyBytes);
  const { key, variant, r0, r1, r2, r3 } = params;
  let x = params.s0 >>> 0;
  let y = params.s1 >>> 0;
  let idx = 0;
  const len = key.length || 1;
  return (byte) => {
    const k = key[idx % len];
    let out;
    if (variant === 0) {
      x = (x + (y ^ (k + idx + 1))) >>> 0;
      x = rotl(x, r0);
      y = (y + (k ^ (x & 255))) >>> 0;
      y = rotr(y, r1);
      out = (x ^ y ^ (x >>> 7)) & 255;
    } else {
      y = (y + k + (x & 255)) >>> 0;
      y = rotl(y, r2);
      x = (x + (y ^ (k << 8))) >>> 0;
      x = rotr(x, r3);
      out = (x + y + (x >>> 11)) & 255;
    }
    idx += 1;
    return byte ^ out;
  };
}

function streamXor(bytes, keyBytes) {
  const next = createStream(keyBytes);
  const out = Uint8Array.from(bytes);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = next(out[i]);
  }
  return out;
}

function concatKeys(...parts) {
  const total = parts.reduce((sum, part) => sum + (part ? part.length : 0), 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    if (!part || !part.length) continue;
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

module.exports = {
  createStream,
  streamXor,
  concatKeys,
};
