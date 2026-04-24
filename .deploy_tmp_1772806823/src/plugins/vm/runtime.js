const parser = require("@babel/parser");

const { BIN_OPS, UNARY_OPS, OPCODES } = require("./constants");

function buildVmRuntimeSource(
  names,
  opcodeInfo,
  opcodeMask,
  miniVmInfo,
  miniVmPrograms
) {
  const {
    execName,
    execAsyncName,
    opsName,
    opsLookupName,
    globalsName,
    makeFuncName,
    maskName,
    opcodeB64Name,
    opcodeStreamName,
    miniVmName,
    bytecodeDecodeName,
    bytecodeCacheName,
    bytecodeB64Name,
    bytecodeRc4Name,
    constDecodeName,
    constCacheName,
    constB64Name,
    constRc4Name,
    constUtf8Name,
  } = names;
  const miniVmOps = JSON.stringify(miniVmInfo.ops);
  const miniVmMask = JSON.stringify(miniVmInfo.mask);
  const miniVmProgramOpcode = JSON.stringify(miniVmPrograms.opcode);
  const miniVmProgramBytecode = JSON.stringify(miniVmPrograms.bytecode);
  const miniVmProgramConsts = JSON.stringify(miniVmPrograms.consts);
  const opcodeHelpers = `
let ${opcodeStreamName};
const ${opcodeB64Name} = (() => {
  const __vmOps = ${miniVmOps};
  const __vmMask = ${miniVmMask};
  let __alpha = "";
  let __xor = 0;
  let __rot = 0;
  let __cipherLen = 0;
  let __opsLen = 0;
  let __key = null;
  let __p0 = null;
  let __p1 = null;
  let __map = null;
  const rotl = (v, s) => ((v << s) | (v >>> (32 - s))) >>> 0;
  const rotr = (v, s) => ((v >>> s) | (v << (32 - s))) >>> 0;
  const joinKey = (a, b, c) => {
    const total = (a ? a.length : 0) + (b ? b.length : 0) + (c ? c.length : 0);
    const out = new Uint8Array(total);
    let offset = 0;
    if (a && a.length) {
      out.set(a, offset);
      offset += a.length;
    }
    if (b && b.length) {
      out.set(b, offset);
      offset += b.length;
    }
    if (c && c.length) {
      out.set(c, offset);
    }
    return out;
  };
  const makeStream = (keyBytes) => {
    // ChaCha20 stream cipher implementation
    const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];
    const kb = Uint8Array.from(keyBytes || []);
    // Normalize key to 32 bytes
    const key = new Uint8Array(32);
    if (kb.length >= 32) {
      key.set(kb.slice(0, 32));
    } else {
      key.set(kb);
      let h = 0x811c9dc5;
      for (let i = 0; i < kb.length; i++) { h ^= kb[i]; h = Math.imul(h, 0x01000193) >>> 0; }
      for (let i = kb.length; i < 32; i++) { h ^= i; h = Math.imul(h, 0x01000193) >>> 0; key[i] = h & 0xff; }
    }
    // Derive nonce from key
    const nonce = new Uint8Array(12);
    let nh = 0x6a09e667;
    for (let i = 0; i < kb.length; i++) { nh ^= kb[i]; nh = Math.imul(nh, 0x85ebca6b) >>> 0; nh = rotl(nh, 13); }
    for (let i = 0; i < 12; i++) { nh ^= i * 0x9e3779b9; nh = Math.imul(nh, 0xcc9e2d51) >>> 0; nonce[i] = nh & 0xff; nh = rotl(nh, 15); }
    // Initialize state
    const state = new Uint32Array(16);
    state[0] = SIGMA[0]; state[1] = SIGMA[1]; state[2] = SIGMA[2]; state[3] = SIGMA[3];
    for (let i = 0; i < 8; i++) {
      state[4 + i] = (key[i*4] | (key[i*4+1] << 8) | (key[i*4+2] << 16) | (key[i*4+3] << 24)) >>> 0;
    }
    state[12] = 0;
    for (let i = 0; i < 3; i++) {
      state[13 + i] = (nonce[i*4] | (nonce[i*4+1] << 8) | (nonce[i*4+2] << 16) | (nonce[i*4+3] << 24)) >>> 0;
    }
    // Quarter round function
    const qr = (s, a, b, c, d) => {
      s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 16);
      s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 12);
      s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 8);
      s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 7);
    };
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
  const stream = (data, order, onByte) => {
    const parts = new Array(order.length);
    for (let i = 0; i < order.length; i += 1) {
      parts[order[i]] = data[i];
    }
    let total = 0;
    let acc = 0;
    let accLen = 0;
    for (let p = 0; p < parts.length; p += 1) {
      const segment = parts[p];
      if (!segment) continue;
      for (let i = 0; i < segment.length; i += 1) {
        const mapped = __map[segment.charCodeAt(i)];
        if (mapped === 65535) continue;
        const val = ((mapped ^ __xor) - __rot) & 63;
        acc = (acc << 6) | val;
        accLen += 6;
        if (accLen >= 24) {
          accLen -= 24;
          const triple = acc >>> accLen;
          acc &= (1 << accLen) - 1;
          const b0 = (triple >>> 16) & 255;
          const b1 = (triple >>> 8) & 255;
          const b2 = triple & 255;
          if (total < __cipherLen) {
            onByte(b0);
            total += 1;
          }
          if (total < __cipherLen) {
            onByte(b1);
            total += 1;
          }
          if (total < __cipherLen) {
            onByte(b2);
            total += 1;
          }
          if (total >= __cipherLen) {
            return;
          }
        }
      }
    }
  };
  const open = (data, order) => {
    const key = joinKey(__key, __p0, __p1);
    const next = makeStream(key);
    const out = new Array(__opsLen);
    let outIdx = 0;
    stream(data, order, (byte) => {
      if (outIdx >= __opsLen) return;
      out[outIdx++] = next(byte);
    });
    return out;
  };
  const rebuild = (masked, mask, orderEnc, orderMask) => {
    const len = masked.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      const pos = orderEnc[i] ^ orderMask;
      out[pos] = masked[i] ^ mask[i];
    }
    return out;
  };
  const ${miniVmName} = (program, pool) => {
    const opPush = __vmOps[0] ^ __vmMask;
    const opRebuild = __vmOps[1] ^ __vmMask;
    const opToStr = __vmOps[2] ^ __vmMask;
    const opStore = __vmOps[3] ^ __vmMask;
    const stack = [];
    const store = Object.create(null);
    let ip = 0;
    while (ip < program.length) {
      const op = program[ip++] ^ __vmMask;
      if (op === opPush) {
        stack.push(pool[program[ip++]]);
      } else if (op === opRebuild) {
        const orderMask = stack.pop();
        const orderEnc = stack.pop();
        const mask = stack.pop();
        const masked = stack.pop();
        stack.push(rebuild(masked, mask, orderEnc, orderMask));
      } else if (op === opToStr) {
        const arr = stack.pop();
        let text = "";
        for (let i = 0; i < arr.length; i += 1) {
          text += String.fromCharCode(arr[i]);
        }
        stack.push(text);
      } else if (op === opStore) {
        store[program[ip++]] = stack.pop();
      }
    }
    return store;
  };
  const seed = (out) => {
    const params = out[1];
    __alpha = out[0];
    __xor = params[0];
    __rot = params[1];
    __cipherLen =
      (params[2] |
        (params[3] << 8) |
        (params[4] << 16) |
        (params[5] << 24)) >>> 0;
    __opsLen = params.length >= 8 ? params[6] | (params[7] << 8) : 0;
    __key = out[2];
    __p0 = out[3];
    __p1 = out[4];
    const map = new Uint16Array(256);
    for (let i = 0; i < map.length; i += 1) {
      map[i] = 65535;
    }
    for (let i = 0; i < __alpha.length; i += 1) {
      map[__alpha.charCodeAt(i)] = i;
    }
    __map = map;
  };
  const len = () => __cipherLen;
  ${opcodeStreamName} = stream;
  return {
    open,
    rebuild,
    ${miniVmName},
    seed,
    len,
    makeStream,
    joinKey,
  };
})();
`;
  const bytecodeHelpers = bytecodeDecodeName
    ? `
const ${bytecodeRc4Name} = (key) => ${opcodeB64Name}.makeStream(key);
function ${bytecodeDecodeName}(parts, order, pool) {
  const program = ${miniVmProgramBytecode};
  const out = ${opcodeB64Name}.${miniVmName}(program, pool);
  ${opcodeB64Name}.seed(out);
  const key = out[2];
  const next = ${bytecodeRc4Name}(key);
  const total = ${opcodeB64Name}.len();
  const words = new Int32Array(total >>> 2);
  let acc = 0;
  let accLen = 0;
  let wordIdx = 0;
  ${opcodeStreamName}(parts, order, (byte) => {
    const plain = next(byte);
    acc |= plain << (accLen * 8);
    accLen += 1;
    if (accLen === 4) {
      words[wordIdx++] = acc | 0;
      acc = 0;
      accLen = 0;
    }
  });
  return words;
}
`
    : "";
  const constHelpers = constDecodeName
    ? `
const ${constRc4Name} = (key) => ${opcodeB64Name}.makeStream(key);
const ${constUtf8Name} = (bytes) => {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder("utf-8").decode(bytes);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("utf8");
  }
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += String.fromCharCode(bytes[i]);
  }
  try {
    return decodeURIComponent(escape(out));
  } catch (err) {
    return out;
  }
};
function ${constDecodeName}(parts, order, pool) {
  const program = ${miniVmProgramConsts};
  const out = ${opcodeB64Name}.${miniVmName}(program, pool);
  ${opcodeB64Name}.seed(out);
  const key = out[2];
  const mask = out[3];
  const next = ${constRc4Name}(key);
  const total = ${opcodeB64Name}.len();
  const bytes = new Uint8Array(total);
  let idx = 0;
  let maskIdx = 0;
  ${opcodeStreamName}(parts, order, (byte) => {
    const masked = byte ^ mask[maskIdx++ % mask.length];
    bytes[idx++] = next(masked);
  });
  const text = ${constUtf8Name}(bytes);
  const entries = JSON.parse(text);
  const cache = [];
  const hasOwn = Object.prototype.hasOwnProperty;
  const decode = (idx) => {
    if (hasOwn.call(cache, idx)) {
      return cache[idx];
    }
    const entry = entries[idx];
    if (!entry) {
      return undefined;
    }
    const tag = entry[0];
    const value = entry[1];
    let out;
    if (tag === "u") out = undefined;
    else if (tag === "l") out = null;
    else if (tag === "b") out = Boolean(value);
    else if (tag === "n") out = Number(value);
    else if (tag === "s") out = value;
    else out = value;
    cache[idx] = out;
    return out;
  };
  return decode;
}
`
    : "";
  const opcodeParts = JSON.stringify(opcodeInfo.parts);
  const opcodeOrder = JSON.stringify(opcodeInfo.order);
  const opcodeAlphabetMasked = JSON.stringify(opcodeInfo.alphabetMasked);
  const opcodeAlphabetMask = JSON.stringify(opcodeInfo.alphabetMask);
  const opcodeAlphabetOrder = JSON.stringify(opcodeInfo.alphabetOrder);
  const opcodeAlphabetOrderMask = JSON.stringify(opcodeInfo.alphabetOrderMask);
  const opcodeParamMasked = JSON.stringify(opcodeInfo.paramMasked);
  const opcodeParamMask = JSON.stringify(opcodeInfo.paramMask);
  const opcodeParamOrder = JSON.stringify(opcodeInfo.paramOrder);
  const opcodeParamOrderMask = JSON.stringify(opcodeInfo.paramOrderMask);
  const opcodeKeyMasked = JSON.stringify(opcodeInfo.keyMasked);
  const opcodeKeyMask = JSON.stringify(opcodeInfo.keyMask);
  const opcodeKeyOrder = JSON.stringify(opcodeInfo.keyOrder);
  const opcodeKeyOrderMask = JSON.stringify(opcodeInfo.keyOrderMask);
  const opcodeIvMasked = JSON.stringify(opcodeInfo.ivMasked);
  const opcodeIvMask = JSON.stringify(opcodeInfo.ivMask);
  const opcodeIvOrder = JSON.stringify(opcodeInfo.ivOrder);
  const opcodeIvOrderMask = JSON.stringify(opcodeInfo.ivOrderMask);
  const opcodeTagMasked = JSON.stringify(opcodeInfo.tagMasked);
  const opcodeTagMask = JSON.stringify(opcodeInfo.tagMask);
  const opcodeTagOrder = JSON.stringify(opcodeInfo.tagOrder);
  const opcodeTagOrderMask = JSON.stringify(opcodeInfo.tagOrderMask);
  const code = `
${opcodeHelpers}
${bytecodeHelpers}
${constHelpers}
const ${constCacheName} = (consts, idx) =>
  typeof consts === "function" ? consts(idx) : consts[idx];
const ${opsName} = (() => {
  const data = ${opcodeParts};
  const order = ${opcodeOrder};
  const pool = [
    ${opcodeAlphabetMasked},
    ${opcodeAlphabetMask},
    ${opcodeAlphabetOrder},
    ${opcodeAlphabetOrderMask},
    ${opcodeParamMasked},
    ${opcodeParamMask},
    ${opcodeParamOrder},
    ${opcodeParamOrderMask},
    ${opcodeKeyMasked},
    ${opcodeKeyMask},
    ${opcodeKeyOrder},
    ${opcodeKeyOrderMask},
    ${opcodeIvMasked},
    ${opcodeIvMask},
    ${opcodeIvOrder},
    ${opcodeIvOrderMask},
    ${opcodeTagMasked},
    ${opcodeTagMask},
    ${opcodeTagOrder},
    ${opcodeTagOrderMask},
  ];
  const program = ${miniVmProgramOpcode};
  const out = ${opcodeB64Name}.${miniVmName}(program, pool);
  ${opcodeB64Name}.seed(out);
  const raw = ${opcodeB64Name}.open(data, order);
  const a0 = [];
  const a1 = [];
  const a2 = [];
  const a3 = [];
  for (let i = 0; i < raw.length; i += 1) {
    const bucket = i & 3;
    if (bucket === 0) {
      a0.push(raw[i]);
    } else if (bucket === 1) {
      a1.push(raw[i]);
    } else if (bucket === 2) {
      a2.push(raw[i]);
    } else {
      a3.push(raw[i]);
    }
  }
  return [a0, a1, a2, a3];
})();
const ${opsLookupName} = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    const bucket = i & 3;
    const slot = (i ^ bucket) >>> 2;
    table[i] = ${opsName}[bucket][slot];
  }
  return table;
})();
const ${maskName} = ${opcodeMask};
function ${makeFuncName}(src, env) {
  return Function("env", "with (env) { return (" + src + ") }")(env);
}
function ${execName}(code, consts, env, thisArg) {
  const stack = [];
  const tryStack = [];
  let sp = 0;
  const opTable = ${opsLookupName};
  const mask = ${maskName};
  const ${globalsName} = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {};
  let ip = 0;
  let currentError = null;
  let pendingThrow = null;
  let fakeAcc = 0;
  let returnValue;
  let done = false;

  function handleError(err) {
    while (tryStack.length) {
      const handler = tryStack[tryStack.length - 1];
      if (handler.inFinally) {
        tryStack.pop();
        continue;
      }
      if (handler.inCatch) {
        if (handler.finallyIp !== null) {
          handler.inCatch = false;
          pendingThrow = err;
          currentError = null;
          sp = handler.stackSize;
          stack.length = sp;
          ip = handler.finallyIp;
          return true;
        }
        tryStack.pop();
        continue;
      }
      if (handler.catchIp !== null) {
        currentError = err;
        pendingThrow = null;
        sp = handler.stackSize;
        stack.length = sp;
        ip = handler.catchIp;
        return true;
      }
      if (handler.finallyIp !== null) {
        pendingThrow = err;
        sp = handler.stackSize;
        stack.length = sp;
        ip = handler.finallyIp;
        return true;
      }
      tryStack.pop();
    }
    return false;
  }

  while (ip < code.length) {
    const op = opTable[(code[ip++] ^ mask) & 255];
    try {
      switch (op) {
        case ${OPCODES.PUSH_CONST}:
          stack[sp++] = ${constCacheName}(consts, code[ip++]);
          break;
        case ${OPCODES.GET_VAR}:
          stack[sp++] = env[${constCacheName}(consts, code[ip++])];
          break;
        case ${OPCODES.SET_VAR}: {
          const name = ${constCacheName}(consts, code[ip++]);
          const value = stack[--sp];
          env[name] = value;
          stack[sp++] = value;
          break;
        }
        case ${OPCODES.GET_GLOBAL}:
          stack[sp++] = ${globalsName}[${constCacheName}(consts, code[ip++])];
          break;
        case ${OPCODES.SET_GLOBAL}: {
          const name = ${constCacheName}(consts, code[ip++]);
          const value = stack[--sp];
          ${globalsName}[name] = value;
          stack[sp++] = value;
          break;
        }
        case ${OPCODES.BIN_OP}: {
          const opId = code[ip++];
          const b = stack[--sp];
          const a = stack[--sp];
          switch (opId) {
            ${BIN_OPS.map(
              (opItem, idx) => `case ${idx}: stack[sp++] = a ${opItem} b; break;`
            ).join("\n            ")}
            default:
              throw new Error("Unknown BIN op");
          }
          break;
        }
        case ${OPCODES.UNARY_OP}: {
          const opId = code[ip++];
          const a = stack[--sp];
          switch (opId) {
            ${UNARY_OPS.map((opItem, idx) => {
              if (opItem === "typeof") {
                return `case ${idx}: stack[sp++] = typeof a; break;`;
              }
              if (opItem === "void") {
                return `case ${idx}: stack[sp++] = void a; break;`;
              }
              return `case ${idx}: stack[sp++] = ${opItem}a; break;`;
            }).join("\n            ")}
            default:
              throw new Error("Unknown UNARY op");
          }
          break;
        }
        case ${OPCODES.CALL}: {
          const argc = code[ip++];
          if (argc === 0) {
            const fn = stack[--sp];
            stack[sp++] = fn.call(null);
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            stack[sp++] = fn.call(null, arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            stack[sp++] = fn.call(null, arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            stack[sp++] = fn.call(null, arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const fn = stack[--sp];
          stack[sp++] = fn.apply(null, args);
          break;
        }
        case ${OPCODES.CALL_METHOD}: {
          const argc = code[ip++];
          if (argc === 0) {
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj);
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj, arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj, arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj, arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const prop = stack[--sp];
          const obj = stack[--sp];
          const fn = obj[prop];
          stack[sp++] = fn.apply(obj, args);
          break;
        }
        case ${OPCODES.CALL_THIS}: {
          const argc = code[ip++];
          if (argc === 0) {
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg);
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg, arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg, arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg, arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const fn = stack[--sp];
          const thisArg = stack[--sp];
          stack[sp++] = fn.apply(thisArg, args);
          break;
        }
        case ${OPCODES.NEW}: {
          const argc = code[ip++];
          if (argc === 0) {
            const ctor = stack[--sp];
            stack[sp++] = new ctor();
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const ctor = stack[--sp];
            stack[sp++] = new ctor(arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const ctor = stack[--sp];
            stack[sp++] = new ctor(arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const ctor = stack[--sp];
            stack[sp++] = new ctor(arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const ctor = stack[--sp];
          stack[sp++] = Reflect.construct(ctor, args);
          break;
        }
        case ${OPCODES.GET_PROP}: {
          const prop = stack[--sp];
          const obj = stack[--sp];
          stack[sp++] = obj[prop];
          break;
        }
        case ${OPCODES.SET_PROP}: {
          const value = stack[--sp];
          const prop = stack[--sp];
          const obj = stack[--sp];
          obj[prop] = value;
          stack[sp++] = value;
          break;
        }
        case ${OPCODES.PUSH_THIS}:
          stack[sp++] = thisArg;
          break;
        case ${OPCODES.POP}:
          sp -= 1;
          break;
        case ${OPCODES.DUP}:
          stack[sp] = stack[sp - 1];
          sp += 1;
          break;
        case ${OPCODES.JMP}:
          ip = code[ip];
          break;
        case ${OPCODES.JMP_IF_FALSE}:
        case ${OPCODES.JMP_IF_TRUE}: {
          const target = code[ip++];
          const value = stack[--sp];
          const isTrue = op === ${OPCODES.JMP_IF_TRUE};
          if (isTrue ? value : !value) {
            ip = target;
          }
          break;
        }
        case ${OPCODES.TRY}: {
          const catchIp = code[ip++];
          const finallyIp = code[ip++];
          const endIp = code[ip++];
          tryStack.push({
            catchIp: catchIp >= 0 ? catchIp : null,
            finallyIp: finallyIp >= 0 ? finallyIp : null,
            endIp,
            stackSize: sp,
            inCatch: false,
            inFinally: false,
          });
          break;
        }
        case ${OPCODES.END_TRY}:
          tryStack.pop();
          pendingThrow = null;
          currentError = null;
          break;
        case ${OPCODES.ENTER_CATCH}: {
          const handler = tryStack[tryStack.length - 1];
          if (handler) {
            handler.inCatch = true;
          }
          break;
        }
        case ${OPCODES.ENTER_FINALLY}: {
          const handler = tryStack[tryStack.length - 1];
          if (handler) {
            handler.inFinally = true;
          }
          break;
        }
        case ${OPCODES.PUSH_ERROR}:
          stack[sp++] = currentError;
          break;
        case ${OPCODES.MAKE_ARR}:
          stack[sp++] = [];
          break;
        case ${OPCODES.MAKE_OBJ}:
          stack[sp++] = {};
          break;
        case ${OPCODES.MAKE_FUNC}: {
          const src = ${constCacheName}(consts, code[ip++]);
          stack[sp++] = ${makeFuncName}(src, env);
          break;
        }
        case ${OPCODES.AWAIT}:
          throw new Error("Await in sync VM");
        case ${OPCODES.RETURN}:
          returnValue = stack[--sp];
          done = true;
          break;
        case ${OPCODES.THROW}:
          throw stack[--sp];
        case ${OPCODES.RETHROW}:
          if (pendingThrow !== null) {
            const err = pendingThrow;
            pendingThrow = null;
            throw err;
          }
          break;
        case ${OPCODES.FAKE_ADD}:
          fakeAcc = (fakeAcc + sp + ip) | 0;
          break;
        case ${OPCODES.FAKE_POP_PUSH}:
          if (sp) {
            const idx = sp - 1;
            stack[idx] = stack[idx];
          }
          break;
        case ${OPCODES.FAKE_JMP}: {
          const target = code[ip++];
          if (false) {
            ip = target;
          }
          break;
        }
        default:
          throw new Error("Unknown opcode");
      }
      if (done) {
        return returnValue;
      }
    } catch (err) {
      if (!handleError(err)) {
        throw err;
      }
    }
  }
  return undefined;
}
`;
  const asyncCode = `
async function ${execAsyncName}(code, consts, env, thisArg) {
  const stack = [];
  const tryStack = [];
  let sp = 0;
  const opTable = ${opsLookupName};
  const mask = ${maskName};
  const ${globalsName} = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : {};
  let ip = 0;
  let currentError = null;
  let pendingThrow = null;
  let fakeAcc = 0;
  let returnValue;
  let done = false;

  function handleError(err) {
    while (tryStack.length) {
      const handler = tryStack[tryStack.length - 1];
      if (handler.inFinally) {
        tryStack.pop();
        continue;
      }
      if (handler.inCatch) {
        if (handler.finallyIp !== null) {
          handler.inCatch = false;
          pendingThrow = err;
          currentError = null;
          sp = handler.stackSize;
          stack.length = sp;
          ip = handler.finallyIp;
          return true;
        }
        tryStack.pop();
        continue;
      }
      if (handler.catchIp !== null) {
        currentError = err;
        pendingThrow = null;
        sp = handler.stackSize;
        stack.length = sp;
        ip = handler.catchIp;
        return true;
      }
      if (handler.finallyIp !== null) {
        pendingThrow = err;
        sp = handler.stackSize;
        stack.length = sp;
        ip = handler.finallyIp;
        return true;
      }
      tryStack.pop();
    }
    return false;
  }

  while (ip < code.length) {
    const op = opTable[(code[ip++] ^ mask) & 255];
    try {
      switch (op) {
        case ${OPCODES.PUSH_CONST}:
          stack[sp++] = ${constCacheName}(consts, code[ip++]);
          break;
        case ${OPCODES.GET_VAR}:
          stack[sp++] = env[${constCacheName}(consts, code[ip++])];
          break;
        case ${OPCODES.SET_VAR}: {
          const name = ${constCacheName}(consts, code[ip++]);
          const value = stack[--sp];
          env[name] = value;
          stack[sp++] = value;
          break;
        }
        case ${OPCODES.GET_GLOBAL}:
          stack[sp++] = ${globalsName}[${constCacheName}(consts, code[ip++])];
          break;
        case ${OPCODES.SET_GLOBAL}: {
          const name = ${constCacheName}(consts, code[ip++]);
          const value = stack[--sp];
          ${globalsName}[name] = value;
          stack[sp++] = value;
          break;
        }
        case ${OPCODES.BIN_OP}: {
          const opId = code[ip++];
          const b = stack[--sp];
          const a = stack[--sp];
          switch (opId) {
            ${BIN_OPS.map(
              (opItem, idx) => `case ${idx}: stack[sp++] = a ${opItem} b; break;`
            ).join("\n            ")}
            default:
              throw new Error("Unknown BIN op");
          }
          break;
        }
        case ${OPCODES.UNARY_OP}: {
          const opId = code[ip++];
          const a = stack[--sp];
          switch (opId) {
            ${UNARY_OPS.map((opItem, idx) => {
              if (opItem === "typeof") {
                return `case ${idx}: stack[sp++] = typeof a; break;`;
              }
              if (opItem === "void") {
                return `case ${idx}: stack[sp++] = void a; break;`;
              }
              return `case ${idx}: stack[sp++] = ${opItem}a; break;`;
            }).join("\n            ")}
            default:
              throw new Error("Unknown UNARY op");
          }
          break;
        }
        case ${OPCODES.CALL}: {
          const argc = code[ip++];
          if (argc === 0) {
            const fn = stack[--sp];
            stack[sp++] = fn.call(null);
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            stack[sp++] = fn.call(null, arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            stack[sp++] = fn.call(null, arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            stack[sp++] = fn.call(null, arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const fn = stack[--sp];
          stack[sp++] = fn.apply(null, args);
          break;
        }
        case ${OPCODES.CALL_METHOD}: {
          const argc = code[ip++];
          if (argc === 0) {
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj);
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj, arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj, arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const prop = stack[--sp];
            const obj = stack[--sp];
            const fn = obj[prop];
            stack[sp++] = fn.call(obj, arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const prop = stack[--sp];
          const obj = stack[--sp];
          const fn = obj[prop];
          stack[sp++] = fn.apply(obj, args);
          break;
        }
        case ${OPCODES.CALL_THIS}: {
          const argc = code[ip++];
          if (argc === 0) {
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg);
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg, arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg, arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const fn = stack[--sp];
            const thisArg = stack[--sp];
            stack[sp++] = fn.call(thisArg, arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const fn = stack[--sp];
          const thisArg = stack[--sp];
          stack[sp++] = fn.apply(thisArg, args);
          break;
        }
        case ${OPCODES.NEW}: {
          const argc = code[ip++];
          if (argc === 0) {
            const ctor = stack[--sp];
            stack[sp++] = new ctor();
            break;
          }
          if (argc === 1) {
            const arg0 = stack[--sp];
            const ctor = stack[--sp];
            stack[sp++] = new ctor(arg0);
            break;
          }
          if (argc === 2) {
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const ctor = stack[--sp];
            stack[sp++] = new ctor(arg0, arg1);
            break;
          }
          if (argc === 3) {
            const arg2 = stack[--sp];
            const arg1 = stack[--sp];
            const arg0 = stack[--sp];
            const ctor = stack[--sp];
            stack[sp++] = new ctor(arg0, arg1, arg2);
            break;
          }
          const args = new Array(argc);
          for (let i = argc - 1; i >= 0; i -= 1) {
            args[i] = stack[--sp];
          }
          const ctor = stack[--sp];
          stack[sp++] = Reflect.construct(ctor, args);
          break;
        }
        case ${OPCODES.GET_PROP}: {
          const prop = stack[--sp];
          const obj = stack[--sp];
          stack[sp++] = obj[prop];
          break;
        }
        case ${OPCODES.SET_PROP}: {
          const value = stack[--sp];
          const prop = stack[--sp];
          const obj = stack[--sp];
          obj[prop] = value;
          stack[sp++] = value;
          break;
        }
        case ${OPCODES.PUSH_THIS}:
          stack[sp++] = thisArg;
          break;
        case ${OPCODES.POP}:
          sp -= 1;
          break;
        case ${OPCODES.DUP}:
          stack[sp] = stack[sp - 1];
          sp += 1;
          break;
        case ${OPCODES.JMP}:
          ip = code[ip];
          break;
        case ${OPCODES.JMP_IF_FALSE}:
        case ${OPCODES.JMP_IF_TRUE}: {
          const target = code[ip++];
          const value = stack[--sp];
          const isTrue = op === ${OPCODES.JMP_IF_TRUE};
          if (isTrue ? value : !value) {
            ip = target;
          }
          break;
        }
        case ${OPCODES.TRY}: {
          const catchIp = code[ip++];
          const finallyIp = code[ip++];
          const endIp = code[ip++];
          tryStack.push({
            catchIp: catchIp >= 0 ? catchIp : null,
            finallyIp: finallyIp >= 0 ? finallyIp : null,
            endIp,
            stackSize: sp,
            inCatch: false,
            inFinally: false,
          });
          break;
        }
        case ${OPCODES.END_TRY}:
          tryStack.pop();
          pendingThrow = null;
          currentError = null;
          break;
        case ${OPCODES.ENTER_CATCH}: {
          const handler = tryStack[tryStack.length - 1];
          if (handler) {
            handler.inCatch = true;
          }
          break;
        }
        case ${OPCODES.ENTER_FINALLY}: {
          const handler = tryStack[tryStack.length - 1];
          if (handler) {
            handler.inFinally = true;
          }
          break;
        }
        case ${OPCODES.PUSH_ERROR}:
          stack[sp++] = currentError;
          break;
        case ${OPCODES.MAKE_ARR}:
          stack[sp++] = [];
          break;
        case ${OPCODES.MAKE_OBJ}:
          stack[sp++] = {};
          break;
        case ${OPCODES.MAKE_FUNC}: {
          const src = ${constCacheName}(consts, code[ip++]);
          stack[sp++] = ${makeFuncName}(src, env);
          break;
        }
        case ${OPCODES.AWAIT}: {
          const awaited = stack[--sp];
          stack[sp++] = await awaited;
          break;
        }
        case ${OPCODES.RETURN}:
          returnValue = stack[--sp];
          done = true;
          break;
        case ${OPCODES.THROW}:
          throw stack[--sp];
        case ${OPCODES.RETHROW}:
          if (pendingThrow !== null) {
            const err = pendingThrow;
            pendingThrow = null;
            throw err;
          }
          break;
        case ${OPCODES.FAKE_ADD}:
          fakeAcc = (fakeAcc + sp + ip) | 0;
          break;
        case ${OPCODES.FAKE_POP_PUSH}:
          if (sp) {
            const idx = sp - 1;
            stack[idx] = stack[idx];
          }
          break;
        case ${OPCODES.FAKE_JMP}: {
          const target = code[ip++];
          if (false) {
            ip = target;
          }
          break;
        }
        default:
          throw new Error("Unknown opcode");
      }
      if (done) {
        return returnValue;
      }
    } catch (err) {
      if (!handleError(err)) {
        throw err;
      }
    }
  }
  return undefined;
}
`;
  return `${code}\n${asyncCode}`;
}

function buildVmRuntime(
  names,
  opcodeInfo,
  opcodeMask,
  miniVmInfo,
  miniVmPrograms
) {
  const source = buildVmRuntimeSource(
    names,
    opcodeInfo,
    opcodeMask,
    miniVmInfo,
    miniVmPrograms
  );
  return parser.parse(source, { sourceType: "script" }).program.body;
}

module.exports = { buildVmRuntime, buildVmRuntimeSource };
