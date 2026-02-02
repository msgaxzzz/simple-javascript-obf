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

module.exports = {
  BASE64_ALPHABET,
  buildHiddenPools,
  buildPoolGroups,
  shiftBase64,
};
