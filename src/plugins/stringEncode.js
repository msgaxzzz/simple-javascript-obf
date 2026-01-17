const parser = require("@babel/parser");
const { encodeString } = require("../utils/string");

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function splitArray(data, rng, count) {
  const total = data.length;
  if (total === 0) {
    return [[]];
  }
  const shards = [];
  let offset = 0;
  const shardCount = Math.max(1, Math.min(count, total));
  for (let i = 0; i < shardCount; i += 1) {
    const remaining = total - offset;
    const remainingShards = shardCount - i;
    const minSize = Math.max(1, remaining - (remainingShards - 1));
    const size = i === shardCount - 1 ? remaining : rng.int(1, minSize);
    shards.push(data.slice(offset, offset + size));
    offset += size;
  }
  return shards;
}

function buildHiddenPools(groups, rng) {
  return groups.map((group) => {
    const mask = rng.int(1, 255);
    const indexMask = rng.int(1, 255);
    const indexPairs = [];
    const data = [];
    let offset = 0;
    for (const value of group) {
      const codes = [];
      for (let i = 0; i < value.length; i += 1) {
        codes.push(value.charCodeAt(i) ^ mask);
      }
      indexPairs.push(offset ^ indexMask, codes.length ^ indexMask);
      data.push(...codes);
      offset += codes.length;
    }
    const shardCount = Math.min(Math.max(1, data.length), rng.int(2, 4));
    const shards = splitArray(data, rng, shardCount);
    const shardLens = shards.map((shard) => shard.length);
    return {
      shards,
      shardLens,
      indexPairs,
      mask,
      indexMask,
    };
  });
}

function shiftBase64(value, key, offset) {
  const size = BASE64_ALPHABET.length;
  let out = "";
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    const idx = BASE64_ALPHABET.indexOf(ch);
    if (idx < 0) {
      out += ch;
      continue;
    }
    const shift = key[(i + offset) % key.length];
    out += BASE64_ALPHABET[(idx + shift) % size];
  }
  return out;
}

function buildPoolGroups(pool, rng, groupCount) {
  const indices = Array.from({ length: pool.length }, (_, i) => i);
  rng.shuffle(indices);
  const groups = Array.from({ length: groupCount }, () => []);
  const groupMap = new Array(pool.length);
  const indexMap = new Array(pool.length);
  for (let i = 0; i < indices.length; i += 1) {
    const original = indices[i];
    const group = i % groupCount;
    const position = groups[group].length;
    groups[group].push(pool[original]);
    groupMap[original] = group;
    indexMap[original] = position;
  }
  return { groups, groupMap, indexMap };
}

function isDirectiveLiteral(path) {
  return (
    path.parentPath &&
    path.parentPath.isExpressionStatement() &&
    Boolean(path.parentPath.node.directive)
  );
}

function isModuleString(path) {
  return (
    path.parentPath &&
    (path.parentPath.isImportDeclaration() ||
      path.parentPath.isExportAllDeclaration() ||
      path.parentPath.isExportNamedDeclaration()) &&
    path.parentPath.node.source === path.node
  );
}

function insertAtTop(programPath, nodes) {
  const body = programPath.node.body;
  let index = 0;
  while (index < body.length) {
    const stmt = body[index];
    if (stmt.type === "ExpressionStatement" && stmt.directive) {
      index += 1;
      continue;
    }
    break;
  }
  body.splice(index, 0, ...nodes);
}

function buildRuntime({
  poolNames,
  poolMeta,
  orderName,
  groupName,
  indexName,
  keyName,
  cacheName,
  decodeName,
  getEncodedName,
  shiftName,
  rotKeyName,
  alphabetName,
  rotOffset,
  b64Name,
  chachaName,
  u8ToStrName,
  unshiftName,
  poolSelectName,
  order,
  groupMap,
  indexMap,
  key,
  shift,
  rotKey,
}) {
  const valueName = "__obf_val";
  const bytesName = "__obf_bytes";
  const poolDecls = poolNames
    .map((name, idx) => {
      const meta = poolMeta[idx];
      const shardDecls = meta.shards
        .map((shard, shardIdx) => `  const d${shardIdx} = ${JSON.stringify(shard)};`)
        .join("\n");
      const shardRefs = meta.shards.map((_, shardIdx) => `d${shardIdx}`).join(", ");
      const idxDecl = `  const i = ${JSON.stringify(meta.indexPairs)};`;
      const lensDecl = `  const l = ${JSON.stringify(meta.shardLens)};`;
      const maskDecl = `  const m = ${meta.mask};`;
      const indexMaskDecl = `  const im = ${meta.indexMask};`;
      return `const ${name} = (() => {\n${shardDecls}\n${idxDecl}\n${lensDecl}\n${maskDecl}\n${indexMaskDecl}\n  return [[${shardRefs}], l, i, m, im];\n})();`;
    })
    .join("\n");
  const poolSelectCases = poolNames
    .map((name, idx) => `    case ${idx}: return ${name};`)
    .join("\n");
  // ChaCha20 runtime implementation
  const code = `
${poolDecls}
const ${orderName} = ${JSON.stringify(order)};
const ${groupName} = ${JSON.stringify(groupMap)};
const ${indexName} = ${JSON.stringify(indexMap)};
const ${keyName} = ${JSON.stringify(key)};
const ${shiftName} = ${shift};
const ${cacheName} = [];
const ${rotKeyName} = ${JSON.stringify(rotKey)};
const ${alphabetName} = ${JSON.stringify(BASE64_ALPHABET)};
const ${poolSelectName} = (group) => {
  switch (group) {
${poolSelectCases}
    default:
      return ${poolNames[0]};
  }
};
const ${getEncodedName} = (pool, pos) => {
  const data = pool[0];
  const lens = pool[1];
  const idx = pool[2];
  const mask = pool[3];
  const idxMask = pool[4];
  let offset = idx[pos * 2] ^ idxMask;
  let length = idx[pos * 2 + 1] ^ idxMask;
  let shard = 0;
  let shardOffset = offset;
  while (shard < lens.length && shardOffset >= lens[shard]) {
    shardOffset -= lens[shard];
    shard += 1;
  }
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const piece = data[shard];
    const code = piece[shardOffset] ^ mask;
    out += String.fromCharCode(code);
    shardOffset += 1;
    if (shardOffset >= lens[shard]) {
      shard += 1;
      shardOffset = 0;
    }
  }
  return out;
};
const ${unshiftName} = (input) => {
  let out = "";
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const idx = ${alphabetName}.indexOf(ch);
    if (idx < 0) {
      out += ch;
      continue;
    }
    const shift = ${rotKeyName}[(i + ${rotOffset}) % ${rotKeyName}.length];
    const next = (idx - shift + ${alphabetName}.length) % ${alphabetName}.length;
    out += ${alphabetName}[next];
  }
  return out;
};
const ${b64Name} = (s) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(s, "base64");
  }
  if (typeof atob !== "undefined") {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  throw new Error("No base64 support");
};
const ${chachaName} = (keyBytes) => {
  const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];
  const rotl = (v, n) => ((v << n) | (v >>> (32 - n))) >>> 0;
  const qr = (s, a, b, c, d) => {
    s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 16);
    s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 12);
    s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 8);
    s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 7);
  };
  const key = new Uint8Array(32);
  const kb = Uint8Array.from(keyBytes);
  if (kb.length >= 32) {
    key.set(kb.slice(0, 32));
  } else {
    key.set(kb);
    let h = 0x811c9dc5;
    for (let i = 0; i < kb.length; i++) { h ^= kb[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    for (let i = kb.length; i < 32; i++) { h ^= i; h = Math.imul(h, 0x01000193) >>> 0; key[i] = h & 0xff; }
  }
  const nonce = new Uint8Array(12);
  let nh = 0x6a09e667;
  for (let i = 0; i < kb.length; i++) { nh ^= kb[i]; nh = Math.imul(nh, 0x85ebca6b) >>> 0; nh = rotl(nh, 13); }
  for (let i = 0; i < 12; i++) { nh ^= i * 0x9e3779b9; nh = Math.imul(nh, 0xcc9e2d51) >>> 0; nonce[i] = nh & 0xff; nh = rotl(nh, 15); }
  const state = new Uint32Array(16);
  state[0] = SIGMA[0]; state[1] = SIGMA[1]; state[2] = SIGMA[2]; state[3] = SIGMA[3];
  for (let i = 0; i < 8; i++) {
    state[4 + i] = (key[i*4] | (key[i*4+1] << 8) | (key[i*4+2] << 16) | (key[i*4+3] << 24)) >>> 0;
  }
  state[12] = 0;
  for (let i = 0; i < 3; i++) {
    state[13 + i] = (nonce[i*4] | (nonce[i*4+1] << 8) | (nonce[i*4+2] << 16) | (nonce[i*4+3] << 24)) >>> 0;
  }
  let block = null;
  let blockIdx = 64;
  let counter = 0;
  return (byte) => {
    if (blockIdx >= 64) {
      state[12] = counter >>> 0;
      const w = new Uint32Array(state);
      for (let r = 0; r < 10; r++) {
        qr(w, 0, 4, 8, 12); qr(w, 1, 5, 9, 13); qr(w, 2, 6, 10, 14); qr(w, 3, 7, 11, 15);
        qr(w, 0, 5, 10, 15); qr(w, 1, 6, 11, 12); qr(w, 2, 7, 8, 13); qr(w, 3, 4, 9, 14);
      }
      block = new Uint8Array(64);
      for (let i = 0; i < 16; i++) {
        const word = (w[i] + state[i]) >>> 0;
        block[i*4] = word & 0xff;
        block[i*4+1] = (word >>> 8) & 0xff;
        block[i*4+2] = (word >>> 16) & 0xff;
        block[i*4+3] = (word >>> 24) & 0xff;
      }
      blockIdx = 0;
      counter++;
    }
    return byte ^ block[blockIdx++];
  };
};
const ${u8ToStrName} = (u8) => {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(u8);
  }
  let s = "";
  for (let i = 0; i < u8.length; i += 1) {
    s += String.fromCharCode(u8[i]);
  }
  try {
    return decodeURIComponent(escape(s));
  } catch {
    return s;
  }
};
function ${decodeName}(i) {
  let state = 0;
  let mapped;
  let group;
  let pos;
  let pool;
  let ${valueName};
  let ${bytesName};
  while (true) {
    switch (state) {
      case 0:
        i = i - ${shiftName};
        ${valueName} = ${cacheName}[i];
        state = ${valueName} !== undefined ? 5 : 1;
        break;
      case 1:
        mapped = ${orderName}[i];
        group = ${groupName}[mapped];
        pos = ${indexName}[mapped];
        state = 2;
        break;
      case 2:
        pool = ${poolSelectName}(group);
        ${bytesName} = ${b64Name}(${unshiftName}(${getEncodedName}(pool, pos)));
        state = 3;
        break;
      case 3: {
        const next = ${chachaName}(${keyName});
        for (let n = 0; n < ${bytesName}.length; n += 1) {
          ${bytesName}[n] = next(${bytesName}[n]);
        }
        ${valueName} = ${u8ToStrName}(${bytesName});
        ${cacheName}[i] = ${valueName};
        state = 5;
        break;
      }
      case 5:
        return ${valueName};
      default:
        return ${valueName};
    }
  }
}
`;
  return parser.parse(code, { sourceType: "script" }).program.body;
}

function stringEncode(ast, ctx) {
  const { traverse, t, options, rng } = ctx;
  const pool = [];
  const indexMap = new Map();
  // Increased key length: 24-32 bytes (192-256 bits)
  const keyLength = rng.int(24, 32);
  const key = Array.from({ length: keyLength }, () => rng.int(0, 255));
  const indexShift = rng.int(40, 900);
  const minLength = options.stringsOptions.minLength;
  const maxCount = options.stringsOptions.maxCount;

  let decoderId = null;
  let keyId = null;
  let cacheId = null;
  let programPathRef = null;

  traverse(ast, {
    Program(path) {
      programPathRef = path;
    },
    StringLiteral(path) {
      if (!programPathRef) {
        return;
      }
      if (isDirectiveLiteral(path) || isModuleString(path)) {
        return;
      }
      if (path.parentPath && path.parentPath.isJSXAttribute()) {
        return;
      }
      if (path.parentPath && path.parentPath.isObjectProperty() && path.parentKey === "key") {
        return;
      }
      const value = path.node.value;
      if (typeof value !== "string" || value.length < minLength) {
        return;
      }
      if (pool.length >= maxCount) {
        return;
      }
      let index = indexMap.get(value);
      if (index === undefined) {
        index = pool.length;
        pool.push(encodeString(value, key));
        indexMap.set(value, index);
      }
      if (!decoderId) {
        decoderId = t.identifier(ctx.nameGen.next());
        keyId = t.identifier(ctx.nameGen.next());
        cacheId = t.identifier(ctx.nameGen.next());
      }
      path.replaceWith(
        t.callExpression(decoderId, [t.numericLiteral(index + indexShift)])
      );
    },
    TemplateLiteral(path) {
      if (path.node.expressions.length > 0) {
        return;
      }
      if (!programPathRef) {
        return;
      }
      if (pool.length >= maxCount) {
        return;
      }
      const value = path.node.quasis[0].value.cooked || "";
      if (value.length < minLength) {
        return;
      }
      let index = indexMap.get(value);
      if (index === undefined) {
        index = pool.length;
        pool.push(encodeString(value, key));
        indexMap.set(value, index);
      }
      if (!decoderId) {
        decoderId = t.identifier(ctx.nameGen.next());
        keyId = t.identifier(ctx.nameGen.next());
        cacheId = t.identifier(ctx.nameGen.next());
      }
      path.replaceWith(
        t.callExpression(decoderId, [t.numericLiteral(index + indexShift)])
      );
    },
  });

  if (pool.length && programPathRef && decoderId && keyId && cacheId) {
    const shiftId = t.identifier(ctx.nameGen.next());
    const orderId = t.identifier(ctx.nameGen.next());
    const groupId = t.identifier(ctx.nameGen.next());
    const indexId = t.identifier(ctx.nameGen.next());
    const rotKeyId = t.identifier(ctx.nameGen.next());
    const alphabetId = t.identifier(ctx.nameGen.next());
    const b64Id = t.identifier(ctx.nameGen.next());
    const chachaId = t.identifier(ctx.nameGen.next());
    const u8ToStrId = t.identifier(ctx.nameGen.next());
    const unshiftId = t.identifier(ctx.nameGen.next());
    const poolSelectId = t.identifier(ctx.nameGen.next());
    const getEncodedId = t.identifier(ctx.nameGen.next());
    const rotKeyLength = rng.int(3, 8);
    const rotKey = Array.from(
      { length: rotKeyLength },
      () => rng.int(1, BASE64_ALPHABET.length - 1)
    );
    const rotOffset = rng.int(0, 1000);
    const shiftedPool = pool.map((value) => shiftBase64(value, rotKey, rotOffset));
    const order = Array.from({ length: pool.length }, (_, i) => i);
    rng.shuffle(order);
    const orderMap = new Array(pool.length);
    for (let i = 0; i < order.length; i += 1) {
      orderMap[order[i]] = i;
    }
    const shuffledPool = order.map((idx) => shiftedPool[idx]);
    const groupCount = Math.min(Math.max(1, pool.length), rng.int(2, 6));
    const { groups, groupMap, indexMap } = buildPoolGroups(
      shuffledPool,
      rng,
      groupCount
    );
    const hiddenPools = buildHiddenPools(groups, rng);
    const poolNames = groups.map(() => t.identifier(ctx.nameGen.next()));
    const runtime = buildRuntime({
      poolNames: poolNames.map((id) => id.name),
      poolMeta: hiddenPools,
      orderName: orderId.name,
      groupName: groupId.name,
      indexName: indexId.name,
      keyName: keyId.name,
      cacheName: cacheId.name,
      decodeName: decoderId.name,
      getEncodedName: getEncodedId.name,
      shiftName: shiftId.name,
      rotKeyName: rotKeyId.name,
      alphabetName: alphabetId.name,
      rotOffset,
      b64Name: b64Id.name,
      chachaName: chachaId.name,
      u8ToStrName: u8ToStrId.name,
      unshiftName: unshiftId.name,
      poolSelectName: poolSelectId.name,
      order: orderMap,
      groupMap,
      indexMap,
      key,
      shift: indexShift,
      rotKey,
    });
    insertAtTop(programPathRef, runtime);
  }
}

module.exports = stringEncode;
