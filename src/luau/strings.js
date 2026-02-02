const { parseLuau, insertAtTop, walk } = require("./ast");

function buildNameFactory(rng) {
  const used = new Set();
  return (prefix) => {
    let name = "";
    do {
      const suffix = rng.int(0, 0x7fffffff).toString(36);
      name = `__obf_${prefix}_${suffix}`;
    } while (used.has(name));
    used.add(name);
    return name;
  };
}

function encodeBytes(text, key) {
  const bytes = Buffer.from(text, "utf8");
  const out = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = (bytes[i] + key[i % key.length]) & 0xff;
  }
  return out;
}

function decodeLuaString(content) {
  let out = "";
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    if (ch !== "\\\\") {
      out += ch;
      continue;
    }
    i += 1;
    if (i >= content.length) {
      out += "\\\\";
      break;
    }
    const next = content[i];
    switch (next) {
      case "a":
        out += "\u0007";
        break;
      case "b":
        out += "\b";
        break;
      case "f":
        out += "\f";
        break;
      case "n":
        out += "\n";
        break;
      case "r":
        out += "\r";
        break;
      case "t":
        out += "\t";
        break;
      case "v":
        out += "\u000b";
        break;
      case "\\\\":
        out += "\\\\";
        break;
      case "\"":
        out += "\"";
        break;
      case "'":
        out += "'";
        break;
      case "\n":
        break;
      case "\r":
        if (content[i + 1] === "\n") {
          i += 1;
        }
        break;
      case "z": {
        while (i + 1 < content.length && /\s/.test(content[i + 1])) {
          i += 1;
          if (content[i] === "\r" && content[i + 1] === "\n") {
            i += 1;
          }
        }
        break;
      }
      case "x": {
        const hex = content.slice(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 2;
        } else {
          out += "x";
        }
        break;
      }
      case "u": {
        if (content[i + 1] === "{") {
          let j = i + 2;
          let hex = "";
          while (j < content.length && content[j] !== "}") {
            hex += content[j];
            j += 1;
          }
          if (content[j] === "}" && /^[0-9a-fA-F]+$/.test(hex)) {
            const codepoint = parseInt(hex, 16);
            out += String.fromCodePoint(codepoint);
            i = j;
          } else {
            out += "u";
          }
        } else {
          out += "u";
        }
        break;
      }
      default:
        if (/[0-9]/.test(next)) {
          let digits = next;
          if (/[0-9]/.test(content[i + 1] || "")) {
            digits += content[i + 1];
            if (/[0-9]/.test(content[i + 2] || "")) {
              digits += content[i + 2];
            }
          }
          const value = parseInt(digits, 10) % 256;
          out += String.fromCharCode(value);
          i += digits.length - 1;
        } else {
          out += next;
        }
        break;
    }
  }
  return out;
}

function decodeRawString(raw) {
  if (!raw || raw.length < 2) {
    return null;
  }
  const first = raw[0];
  if (first === "\"" || first === "'") {
    return decodeLuaString(raw.slice(1, -1));
  }
  if (first === "[") {
    let eqCount = 0;
    let i = 1;
    while (raw[i] === "=") {
      eqCount += 1;
      i += 1;
    }
    if (raw[i] !== "[") {
      return null;
    }
    const openLen = 2 + eqCount;
    const closeLen = 2 + eqCount;
    return raw.slice(openLen, raw.length - closeLen);
  }
  return null;
}

function getStringValue(node) {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (typeof node.raw === "string") {
    return decodeRawString(node.raw);
  }
  return null;
}

function buildRuntime(segments) {
  const lines = [];
  for (const segment of segments) {
    if (!segment.pool.length) {
      continue;
    }
    lines.push(`local ${segment.poolName} = {`);
    for (const entry of segment.pool) {
      lines.push(`  { ${entry.join(", ")} },`);
    }
    lines.push("}");
    lines.push(`local ${segment.keyName} = { ${segment.key.join(", ")} }`);
    lines.push(`local ${segment.cacheName} = {}`);
    lines.push(`local function ${segment.decodeName}(i)`);
    lines.push(`  local cached = ${segment.cacheName}[i]`);
    lines.push("  if cached ~= nil then");
    lines.push("    return cached");
    lines.push("  end");
    lines.push(`  local data = ${segment.poolName}[i]`);
    lines.push("  local out = {}");
    lines.push(`  local keyLen = #${segment.keyName}`);
    lines.push("  for j = 1, #data do");
    lines.push("    local idx = j - 1");
    lines.push("    idx = idx % keyLen");
    lines.push("    idx = idx + 1");
    lines.push(`    local v = data[j] - ${segment.keyName}[idx]`);
    lines.push("    if v < 0 then v = v + 256 end");
    lines.push("    out[j] = string.char(v)");
    lines.push("  end");
    lines.push("  local s = table.concat(out)");
    lines.push(`  ${segment.cacheName}[i] = s`);
    lines.push("  return s");
    lines.push("end");
  }
  return lines.join("\n");
}

function makeDecodeCall(segment, index) {
  return {
    type: "CallExpression",
    base: {
      type: "Identifier",
      name: segment.decodeName,
    },
    arguments: [
      {
        type: "NumericLiteral",
        value: index,
        raw: String(index),
      },
    ],
  };
}

function buildConcat(parts) {
  if (!parts.length) {
    return {
      type: "StringLiteral",
      value: "",
      raw: "\"\"",
    };
  }
  let expr = parts[0];
  for (let i = 1; i < parts.length; i += 1) {
    expr = {
      type: "BinaryExpression",
      operator: "..",
      left: expr,
      right: parts[i],
    };
  }
  return expr;
}

function splitString(value, rng, maxParts) {
  const length = value.length;
  const maxCount = Math.max(2, Math.min(maxParts, length));
  const count = rng.int(2, maxCount);
  const parts = [];
  let offset = 0;
  let remaining = length;
  for (let i = 0; i < count - 1; i += 1) {
    const maxSize = remaining - (count - 1 - i);
    const size = rng.int(1, Math.max(1, maxSize));
    parts.push(value.slice(offset, offset + size));
    offset += size;
    remaining -= size;
  }
  parts.push(value.slice(offset));
  return parts;
}

function stringEncode(ast, ctx) {
  const { options, rng } = ctx;
  const minLength = options.stringsOptions.minLength;
  const maxCount = options.stringsOptions.maxCount;
  const segmentSize = options.stringsOptions.segmentSize ?? maxCount;
  const sampleRate = options.stringsOptions.sampleRate ?? 1;
  const splitEnabled = Boolean(options.stringsOptions.split);
  const splitMin = options.stringsOptions.splitMin ?? 12;
  const splitMaxParts = options.stringsOptions.splitMaxParts ?? 3;

  const nameFor = buildNameFactory(rng);
  const segments = [];
  const encodedMap = new Map();
  const partMap = new Map();
  const decisionMap = new Map();
  let totalCount = 0;

  function createSegment() {
    const keyLength = rng.int(6, 16);
    const key = Array.from({ length: keyLength }, () => rng.int(1, 255));
    const segment = {
      pool: [],
      key,
      poolName: nameFor("pool"),
      keyName: nameFor("key"),
      cacheName: nameFor("cache"),
      decodeName: nameFor("str"),
    };
    segments.push(segment);
    return segment;
  }

  let currentSegment = createSegment();

  function buildEncodedNode(entry) {
    if (entry.kind === "split") {
      const nodes = entry.parts.map((part) => makeDecodeCall(part.segment, part.index));
      return buildConcat(nodes);
    }
    return makeDecodeCall(entry.segment, entry.index);
  }

  function encodeSingle(value, map) {
    const existing = map.get(value);
    if (existing) {
      return buildEncodedNode(existing);
    }
    if (totalCount >= maxCount) {
      return null;
    }
    if (currentSegment.pool.length >= segmentSize) {
      if (totalCount >= maxCount) {
        return null;
      }
      currentSegment = createSegment();
    }
    const encoded = encodeBytes(value, currentSegment.key);
    const index = currentSegment.pool.length + 1;
    currentSegment.pool.push(encoded);
    totalCount += 1;
    const entry = { kind: "single", segment: currentSegment, index };
    map.set(value, entry);
    return buildEncodedNode(entry);
  }

  function encodeStringValue(value) {
    if (typeof value !== "string" || value.length < minLength) {
      return null;
    }
    const existing = encodedMap.get(value);
    if (existing) {
      return buildEncodedNode(existing);
    }
    if (totalCount >= maxCount) {
      return null;
    }
    const decision = decisionMap.get(value);
    if (decision === false) {
      return null;
    }
    if (decision === undefined && sampleRate < 1 && !rng.bool(sampleRate)) {
      decisionMap.set(value, false);
      return null;
    }
    decisionMap.set(value, true);

    if (splitEnabled && value.length >= splitMin) {
      const parts = splitString(value, rng, splitMaxParts);
      const entries = [];
      for (const part of parts) {
        const node = encodeSingle(part, partMap);
        if (!node) {
          return null;
        }
        const entry = partMap.get(part);
        entries.push(entry);
      }
      const combined = { kind: "split", parts: entries };
      encodedMap.set(value, combined);
      return buildEncodedNode(combined);
    }

    const node = encodeSingle(value, encodedMap);
    return node;
  }

  walk(ast, (node, parent, key, index) => {
    if (node.type !== "StringLiteral") {
      return;
    }
    const value = getStringValue(node);
    if (typeof value !== "string") {
      return;
    }
    const replacement = encodeStringValue(value);
    if (!replacement || !parent || key === null || key === undefined) {
      return;
    }
    if (index === null || index === undefined) {
      parent[key] = replacement;
    } else {
      parent[key][index] = replacement;
    }
  });

  if (!segments.some((segment) => segment.pool.length)) {
    return;
  }

  const runtime = buildRuntime(segments);
  const runtimeAst = parseLuau(runtime);
  insertAtTop(ast, runtimeAst.body);
}

module.exports = {
  decodeRawString,
  stringEncode,
};
