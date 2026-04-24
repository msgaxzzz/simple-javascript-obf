const { normalizeOptions } = require("../options");
const { RNG } = require("../utils/rng");
const { extractDirectives, walk: walkLuauAst } = require("./ast");
const {
  parseLuau: parseLuauCustom,
  generateLuau: generateLuauCustom,
  validate: validateLuau,
  buildCFG: buildLuauCFG,
  buildSSA: buildLuauSSA,
  buildIR: buildLuauIR,
  buildIRSSA: buildLuauIRSSA,
  traverse: traverseLuau,
  buildScope: buildLuauScope,
  factory: luauFactory,
  diagnostics: luauDiagnostics,
} = require("./custom");
const { stringEncode: stringEncodeCustom } = require("./custom/strings");
const { stringEncode } = require("./strings");
const { splitStringsLuau } = require("./splitStrings");
const { controlFlowFlatten } = require("./cff");
const { numbersToExpressions } = require("./numbersToExpressions");
const { constantArrayLuau } = require("./constArray");
const {
  collectConstructorMemberHints,
  collectDynamicIndexBaseNames,
  collectDynamicIndexMemberNames,
  collectSafeFunctionParameterHints,
  renameLuau,
} = require("./rename");
const { maskGlobalsLuau } = require("./maskGlobals");
const { virtualizeLuau } = require("./vm");
const { antiHookLuau } = require("./antiHook");
const { encodeMembers } = require("./encodeMembers");
const { injectDeadCode } = require("./dead");
const { entryLuau } = require("./entry");
const { wrapInFunction } = require("./wrap");
const { proxifyLocals } = require("./proxifyLocals");
const { padFooterLuau } = require("./padFooter");
const { stylizeNumericLiteralsLuau } = require("./literalStyle");
const { buildSourceMap, shiftMappings } = require("./sourceMap");
const { createLuauDebugRecorder } = require("./debug");
const { version: PACKAGE_VERSION } = require("../../package.json");

const WATERMARK_URL = "https://github.com/msgaxzzz/simple-javascript-obf";
const LUAU_WATERMARK = `-- This file was protected using simple-javascript-obfuscator v${PACKAGE_VERSION} [${WATERMARK_URL}]`;
const MAX_LUAU_OUTPUT_BYTES = 5 * 1024 * 1024;
const PACKED_PAYLOAD_RADIX = 85;
const PACKED_PAYLOAD_ASCII_OFFSET = 33;

function isWordChar(ch) {
  return !!ch && /[A-Za-z0-9_]/.test(ch);
}

function mergeOptionGroup(defaults, provided) {
  if (!provided || typeof provided !== "object" || Array.isArray(provided)) {
    return { ...defaults };
  }
  return { ...defaults, ...provided };
}

function normalizeLuauOptions(options) {
  const rawOptions = options && typeof options === "object" ? { ...options } : {};
  const defaultOptions = normalizeOptions({
    ...rawOptions,
    lang: "luau",
    luauParser: "custom",
  });
  const normalizedOptions = {
    ...defaultOptions,
    ...rawOptions,
    lang: "luau",
    luauParser: "custom",
  };
  const rawVm = typeof rawOptions.vm === "boolean"
    ? { enabled: rawOptions.vm }
    : rawOptions.vm;

  normalizedOptions.vm = mergeOptionGroup(defaultOptions.vm, rawVm);
  normalizedOptions.wrapOptions = mergeOptionGroup(defaultOptions.wrapOptions, rawOptions.wrapOptions);
  normalizedOptions.numbersOptions = mergeOptionGroup(defaultOptions.numbersOptions, rawOptions.numbersOptions);
  normalizedOptions.constArrayOptions = mergeOptionGroup(defaultOptions.constArrayOptions, rawOptions.constArrayOptions);
  normalizedOptions.padFooterOptions = mergeOptionGroup(defaultOptions.padFooterOptions, rawOptions.padFooterOptions);
  normalizedOptions.stringsOptions = mergeOptionGroup(defaultOptions.stringsOptions, rawOptions.stringsOptions);
  normalizedOptions.renameOptions = mergeOptionGroup(defaultOptions.renameOptions, rawOptions.renameOptions);
  normalizedOptions.deadCodeOptions = mergeOptionGroup(defaultOptions.deadCodeOptions, rawOptions.deadCodeOptions);
  normalizedOptions.cffOptions = mergeOptionGroup(defaultOptions.cffOptions, rawOptions.cffOptions);
  if (typeof rawOptions.antiHook === "boolean") {
    normalizedOptions.antiHook = {
      ...defaultOptions.antiHook,
      enabled: rawOptions.antiHook,
    };
  } else {
    normalizedOptions.antiHook = mergeOptionGroup(defaultOptions.antiHook, rawOptions.antiHook);
  }

  return normalizedOptions;
}

function getLuauFunctionName(node) {
  if (!node) {
    return null;
  }
  if (node.name && node.name.type === "FunctionName") {
    const parts = [node.name.base.name, ...(node.name.members || []).map((member) => member.name)];
    if (node.name.method) {
      parts.push(node.name.method.name);
    }
    return parts.join(".");
  }
  if (node.identifier && node.identifier.type === "Identifier") {
    return node.identifier.name;
  }
  return null;
}

function annotateOriginalFunctionNames(ast) {
  walkLuauAst(ast, (node) => {
    if (!node || node.type !== "FunctionDeclaration") {
      return;
    }
    const name = getLuauFunctionName(node);
    if (name) {
      node.__obf_original_name = name;
    }
  });
}

function readLongBracketOpen(source, index) {
  if (source[index] !== "[") {
    return null;
  }
  let cursor = index + 1;
  while (source[cursor] === "=") {
    cursor += 1;
  }
  if (source[cursor] !== "[") {
    return null;
  }
  return {
    openLength: cursor - index + 1,
    close: `]${"=".repeat(cursor - index - 1)}]`,
  };
}

function readQuotedStringEnd(source, index) {
  const quote = source[index];
  if (quote !== "'" && quote !== "\"" && quote !== "`") {
    return null;
  }
  let cursor = index + 1;
  while (cursor < source.length) {
    const current = source[cursor];
    if (current === "\\") {
      cursor = Math.min(source.length, cursor + 2);
      continue;
    }
    cursor += 1;
    if (current === quote) {
      break;
    }
  }
  return cursor;
}

function shouldKeepSpace(prevChar, nextChar, output) {
  if (!prevChar || !nextChar) {
    return false;
  }
  if (isWordChar(prevChar) && isWordChar(nextChar)) {
    return true;
  }
  if (prevChar === "-" && nextChar === "-") {
    return true;
  }
  if (/\d/.test(prevChar) && nextChar === ".") {
    return true;
  }
  if (prevChar === "." && /\d/.test(nextChar)) {
    return true;
  }
  const lastTwo = output.slice(-2);
  if (lastTwo === ".." && nextChar === ".") {
    return true;
  }
  return false;
}

function compactLuauWhitespace(source) {
  let output = "";
  let index = 0;
  while (index < source.length) {
    const ch = source[index];
    const next = source[index + 1];

    const quotedEnd = readQuotedStringEnd(source, index);
    if (quotedEnd !== null) {
      output += source.slice(index, quotedEnd);
      index = quotedEnd;
      continue;
    }

    if (ch === "[") {
      const open = readLongBracketOpen(source, index);
      if (open) {
        output += source.slice(index, index + open.openLength);
        index += open.openLength;
        const closeIdx = source.indexOf(open.close, index);
        if (closeIdx === -1) {
          output += source.slice(index);
          break;
        }
        output += source.slice(index, closeIdx + open.close.length);
        index = closeIdx + open.close.length;
        continue;
      }
    }

    if (ch === "-" && next === "-") {
      output += "--";
      index += 2;
      const longOpen = readLongBracketOpen(source, index);
      if (longOpen) {
        output += source.slice(index, index + longOpen.openLength);
        index += longOpen.openLength;
        const closeIdx = source.indexOf(longOpen.close, index);
        if (closeIdx === -1) {
          output += source.slice(index);
          break;
        }
        output += source.slice(index, closeIdx + longOpen.close.length);
        index = closeIdx + longOpen.close.length;
      } else {
        while (index < source.length && source[index] !== "\n") {
          output += source[index];
          index += 1;
        }
        if (index < source.length && source[index] === "\n") {
          output += "\n";
          index += 1;
        }
      }
      continue;
    }

    if (/\s/.test(ch)) {
      let cursor = index + 1;
      while (cursor < source.length && /\s/.test(source[cursor])) {
        cursor += 1;
      }
      const prevChar = output[output.length - 1];
      const nextChar = source[cursor];
      if (shouldKeepSpace(prevChar, nextChar, output)) {
        output += " ";
      }
      index = cursor;
      continue;
    }

    output += ch;
    index += 1;
  }
  return output;
}

function neutralizeDoubleDashInCode(source) {
  let output = "";
  let index = 0;
  while (index < source.length) {
    const ch = source[index];
    const next = source[index + 1];

    const quotedEnd = readQuotedStringEnd(source, index);
    if (quotedEnd !== null) {
      output += source.slice(index, quotedEnd);
      index = quotedEnd;
      continue;
    }

    if (ch === "[") {
      const open = readLongBracketOpen(source, index);
      if (open) {
        output += source.slice(index, index + open.openLength);
        index += open.openLength;
        const closeIdx = source.indexOf(open.close, index);
        if (closeIdx === -1) {
          output += source.slice(index);
          break;
        }
        output += source.slice(index, closeIdx + open.close.length);
        index = closeIdx + open.close.length;
        continue;
      }
    }

    if (ch === "-" && next === "-") {
      output += "- -";
      index += 2;
      continue;
    }

    output += ch;
    index += 1;
  }
  return output;
}

function makePackedIdentifier(rng) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alnum = `${letters}0123456789`;
  const length = rng && typeof rng.int === "function" ? rng.int(7, 13) : 9;
  let out = letters[(rng && typeof rng.int === "function" ? rng.int(0, letters.length - 1) : Math.floor(Math.random() * letters.length))];
  while (out.length < length) {
    const source = rng && typeof rng.int === "function"
      ? rng.int(0, alnum.length - 1)
      : Math.floor(Math.random() * alnum.length);
    out += alnum[source];
  }
  return out;
}

function makeLongBracketLiteral(source) {
  const value = String(source);
  let equalsCount = 0;
  while (
    value.includes(`]${"=".repeat(equalsCount)}]`)
    || value.endsWith(`]${"=".repeat(equalsCount)}`)
  ) {
    equalsCount += 1;
  }
  const equals = "=".repeat(equalsCount);
  return `[${equals}[${value}]${equals}]`;
}

function buildPackedPayloadEncoding(source) {
  const bytes = Buffer.from(String(source), "utf8");
  let payload = "";
  for (let index = 0; index < bytes.length; index += 4) {
    const a = bytes[index] || 0;
    const b = bytes[index + 1] || 0;
    const c = bytes[index + 2] || 0;
    const d = bytes[index + 3] || 0;
    let value = (((a * 256) + b) * 256 + c) * 256 + d;
    const block = new Array(5);
    for (let cursor = 4; cursor >= 0; cursor -= 1) {
      block[cursor] = String.fromCharCode((value % PACKED_PAYLOAD_RADIX) + PACKED_PAYLOAD_ASCII_OFFSET);
      value = Math.floor(value / PACKED_PAYLOAD_RADIX);
    }
    payload += block.join("");
  }

  return {
    payload,
    size: bytes.length,
  };
}

function buildPackedPayloadFragments(payload) {
  const value = String(payload);
  const blockCount = Math.max(1, Math.floor(value.length / 5));
  let fragmentCount = 3;
  if (blockCount >= 24) {
    fragmentCount = 4;
  }
  if (blockCount >= 80) {
    fragmentCount = 5;
  }
  fragmentCount = Math.min(fragmentCount, blockCount);

  const fragments = [];
  let blockOffset = 0;
  for (let index = 0; index < fragmentCount; index += 1) {
    const remainingBlocks = blockCount - blockOffset;
    const remainingFragments = fragmentCount - index;
    const blockSize = index === fragmentCount - 1
      ? remainingBlocks
      : Math.floor(remainingBlocks / remainingFragments);
    fragments.push(value.slice(blockOffset * 5, (blockOffset + blockSize) * 5));
    blockOffset += blockSize;
  }

  return fragments.filter(Boolean);
}

function buildPackedLuauShell(code, rng) {
  const encoding = buildPackedPayloadEncoding(code);
  const fragments = buildPackedPayloadFragments(encoding.payload);
  const partsVar = makePackedIdentifier(rng);
  const pushVar = makePackedIdentifier(rng);
  const loaderVar = makePackedIdentifier(rng);
  const indexVar = makePackedIdentifier(rng);
  const blockVar = makePackedIdentifier(rng);
  const valueVar = makePackedIdentifier(rng);
  const decodedVar = makePackedIdentifier(rng);
  const packedVar = makePackedIdentifier(rng);
  const sizeVar = makePackedIdentifier(rng);
  const byte0Var = makePackedIdentifier(rng);
  const byte1Var = makePackedIdentifier(rng);
  const byte2Var = makePackedIdentifier(rng);
  const byte3Var = makePackedIdentifier(rng);
  const decodeVar = makePackedIdentifier(rng);
  const envVar = makePackedIdentifier(rng);
  const stateVar = makePackedIdentifier(rng);
  const joinVar = makePackedIdentifier(rng);
  const concatKeyVar = makePackedIdentifier(rng);
  const loadAKeyVar = makePackedIdentifier(rng);
  const loadBKeyVar = makePackedIdentifier(rng);
  const loadAHeadVar = makePackedIdentifier(rng);
  const loadATailVar = makePackedIdentifier(rng);
  const loadBHeadVar = makePackedIdentifier(rng);
  const loadBTailVar = makePackedIdentifier(rng);
  const execVar = makePackedIdentifier(rng);
  const dispatchVar = makePackedIdentifier(rng);
  const payloadArgVar = makePackedIdentifier(rng);
  const sizeArgVar = makePackedIdentifier(rng);
  const outVar = makePackedIdentifier(rng);

  const lines = [
    "return(function(...)",
    `local ${partsVar}={${makeLongBracketLiteral(fragments[0])}};`,
  ];

  for (let index = 1; index < fragments.length; index += 1) {
    if (index === 1) {
      lines.push(`local function ${pushVar}(${blockVar})${partsVar}[#${partsVar}+1]=${blockVar};end;`);
    }
    if (index === 2) {
      lines.push(`local function ${decodeVar}(${blockVar})`);
      lines.push(`local ${valueVar}=((((string.byte(${blockVar},1)-${PACKED_PAYLOAD_ASCII_OFFSET})*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},2)-${PACKED_PAYLOAD_ASCII_OFFSET}))*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},3)-${PACKED_PAYLOAD_ASCII_OFFSET}))*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},4)-${PACKED_PAYLOAD_ASCII_OFFSET}))*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},5)-${PACKED_PAYLOAD_ASCII_OFFSET});`);
      lines.push(`local ${byte0Var}=math.floor(${valueVar}/16777216)%256;`);
      lines.push(`local ${byte1Var}=math.floor(${valueVar}/65536)%256;`);
      lines.push(`local ${byte2Var}=math.floor(${valueVar}/256)%256;`);
      lines.push(`local ${byte3Var}=${valueVar}%256;`);
      lines.push(`return string.char(${byte0Var},${byte1Var},${byte2Var},${byte3Var});`);
      lines.push("end;");
    }
    if (index === 3) {
      lines.push(`local function ${dispatchVar}(${decodedVar},...)`);
      lines.push(`local ${loadAHeadVar}="loa";`);
      lines.push(`local ${loadATailVar}="dstr".."ing";`);
      lines.push(`local ${loadBHeadVar}="lo";`);
      lines.push(`local ${loadBTailVar}="ad";`);
      lines.push(`local ${loadAKeyVar}=${loadAHeadVar}..${loadATailVar};`);
      lines.push(`local ${loadBKeyVar}=${loadBHeadVar}..${loadBTailVar};`);
      lines.push(`local ${envVar}=(getfenv and getfenv(0)) or _ENV or _G;`);
      lines.push(`local ${loaderVar}=(${envVar} and (${envVar}[${loadAKeyVar}] or ${envVar}[${loadBKeyVar}])) or _G[${loadAKeyVar}] or _G[${loadBKeyVar}];`);
      lines.push(`return ${loaderVar}(${decodedVar})(...);`);
      lines.push("end;");
    }
    lines.push(`${pushVar}(${makeLongBracketLiteral(fragments[index])});`);
  }

  if (fragments.length < 3) {
    lines.push(`local function ${decodeVar}(${blockVar})`);
    lines.push(`local ${valueVar}=((((string.byte(${blockVar},1)-${PACKED_PAYLOAD_ASCII_OFFSET})*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},2)-${PACKED_PAYLOAD_ASCII_OFFSET}))*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},3)-${PACKED_PAYLOAD_ASCII_OFFSET}))*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},4)-${PACKED_PAYLOAD_ASCII_OFFSET}))*${PACKED_PAYLOAD_RADIX}+(string.byte(${blockVar},5)-${PACKED_PAYLOAD_ASCII_OFFSET});`);
    lines.push(`local ${byte0Var}=math.floor(${valueVar}/16777216)%256;`);
    lines.push(`local ${byte1Var}=math.floor(${valueVar}/65536)%256;`);
    lines.push(`local ${byte2Var}=math.floor(${valueVar}/256)%256;`);
    lines.push(`local ${byte3Var}=${valueVar}%256;`);
    lines.push(`return string.char(${byte0Var},${byte1Var},${byte2Var},${byte3Var});`);
    lines.push("end;");
  }

  if (fragments.length < 4) {
    lines.push(`local function ${dispatchVar}(${decodedVar},...)`);
    lines.push(`local ${loadAHeadVar}="loa";`);
    lines.push(`local ${loadATailVar}="dstr".."ing";`);
    lines.push(`local ${loadBHeadVar}="lo";`);
    lines.push(`local ${loadBTailVar}="ad";`);
    lines.push(`local ${loadAKeyVar}=${loadAHeadVar}..${loadATailVar};`);
    lines.push(`local ${loadBKeyVar}=${loadBHeadVar}..${loadBTailVar};`);
    lines.push(`local ${envVar}=(getfenv and getfenv(0)) or _ENV or _G;`);
    lines.push(`local ${loaderVar}=(${envVar} and (${envVar}[${loadAKeyVar}] or ${envVar}[${loadBKeyVar}])) or _G[${loadAKeyVar}] or _G[${loadBKeyVar}];`);
    lines.push(`return ${loaderVar}(${decodedVar})(...);`);
    lines.push("end;");
  }

  lines.push(`local function ${execVar}(${payloadArgVar},${sizeArgVar},...)`);
  lines.push(`local ${concatKeyVar}="concat";`);
  lines.push(`local ${packedVar}=table[${concatKeyVar}](${payloadArgVar});`);
  lines.push(`local ${outVar}={};`);
  lines.push(`local ${joinVar}=table[${concatKeyVar}];`);
  lines.push(`local ${indexVar}=1;`);
  lines.push(`local ${stateVar}=1;`);
  lines.push("while true do ");
  lines.push(`if ${stateVar}==1 then `);
  lines.push(`if ${indexVar}>#${packedVar} then ${stateVar}=3 else ${stateVar}=2 end;`);
  lines.push(`elseif ${stateVar}==2 then `);
  lines.push(`${outVar}[#${outVar}+1]=${decodeVar}(${packedVar}:sub(${indexVar},${indexVar}+4));`);
  lines.push(`${indexVar}=${indexVar}+5;`);
  lines.push(`${stateVar}=1;`);
  lines.push("else break end;");
  lines.push("end;");
  lines.push(`local ${decodedVar}=${joinVar}(${outVar});`);
  lines.push(`${decodedVar}=${decodedVar}:sub(1,${sizeArgVar});`);
  lines.push(`return ${dispatchVar}(${decodedVar},...);`);
  lines.push("end;");
  lines.push(`local ${sizeVar}=${encoding.size};`);
  lines.push(`return ${execVar}(${partsVar},${sizeVar},...);`);
  lines.push("end)(...)");

  return lines.join("");
}

async function obfuscateLuau(source, options) {
  options = normalizeLuauOptions(options);
  const debugRecorder = createLuauDebugRecorder({
    ...(options.debugLuauTransforms || {}),
    filename: options.filename,
    seed: options.seed,
  });
  const rng = new RNG(options.seed);
  const directives = extractDirectives(source);
  const useCustom = true;
  const vmEnabled = options.vm === true || (options.vm && options.vm.enabled);
  const cffMode = options.cffOptions && options.cffOptions.mode
    ? options.cffOptions.mode
    : "classic";
  const useVmCff = Boolean(options.cff && cffMode === "vm");
  const ast = parseLuauCustom(source);
  annotateOriginalFunctionNames(ast);
  const constructorMemberHints = collectConstructorMemberHints(ast);
  const dynamicIndexBaseNames = collectDynamicIndexBaseNames(ast);
  const dynamicIndexMemberNames = collectDynamicIndexMemberNames(ast);
  const safeFunctionParameterHints = collectSafeFunctionParameterHints(ast);
  const validateAst = options.validateAst === true;
  if (validateAst) {
    validateLuau(ast, { throw: true });
  }

  const analysis = {
    scope: null,
    cfg: null,
    ssa: null,
    ir: null,
    irSSA: null,
  };
  const getScope = () => {
    if (!analysis.scope) {
      analysis.scope = buildLuauScope(ast, { includeTypes: true });
    }
    return analysis.scope;
  };
  const getCFG = () => {
    if (!analysis.cfg) {
      analysis.cfg = buildLuauCFG(ast);
    }
    return analysis.cfg;
  };
  const getSSA = () => {
    if (!analysis.ssa) {
      analysis.ssa = buildLuauSSA(getCFG());
    }
    return analysis.ssa;
  };
  const getIR = () => {
    if (!analysis.ir) {
      analysis.ir = buildLuauIR(ast);
    }
    return analysis.ir;
  };
  const getIRSSA = () => {
    if (!analysis.irSSA) {
      analysis.irSSA = buildLuauIRSSA(getIR());
    }
    return analysis.irSSA;
  };
  const invalidateAnalysis = () => {
    analysis.scope = null;
    analysis.cfg = null;
    analysis.ssa = null;
    analysis.ir = null;
    analysis.irSSA = null;
  };

  const ctx = {
    options,
    rng,
    parseCustom: parseLuauCustom,
    parseLuaparse: parseLuauCustom,
    traverse: traverseLuau,
    buildScope: buildLuauScope,
    buildCFG: buildLuauCFG,
    buildSSA: buildLuauSSA,
    buildIR: buildLuauIR,
    buildIRSSA: buildLuauIRSSA,
    factory: luauFactory,
    diagnostics: luauDiagnostics,
    constructorMemberHints,
    dynamicIndexBaseNames,
    dynamicIndexMemberNames,
    safeFunctionParameterHints,
    validate: validateLuau,
    getScope,
    getCFG,
    getSSA,
    getIR,
    getIRSSA,
    invalidateAnalysis,
    raise: (message, node, expected) =>
      luauDiagnostics.makeDiagnosticErrorFromNode
        ? luauDiagnostics.makeDiagnosticErrorFromNode(message, node, expected)
        : luauDiagnostics.makeDiagnosticError(message, node, expected),
  };

  const timingEnabled = options.timing === true;
  const logTiming = timingEnabled
    ? (name, durationMs) => {
        const seconds = (durationMs / 1000).toFixed(3);
        process.stderr.write(`[js-obf] ${name} ${seconds}s\n`);
      }
    : null;
  let passIndex = 0;

  const safeDebugCall = (callback, label) => {
    if (typeof callback !== "function") {
      return null;
    }

    try {
      return callback();
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      process.stderr.write(`[js-obf] ${label} failed: ${message}\n`);
      return null;
    }
  };

  const runLuauPlugin = (name, fn) => {
    const start = timingEnabled ? process.hrtime.bigint() : null;
    passIndex += 1;
    const debugPass = safeDebugCall(
      () => (debugRecorder ? debugRecorder.beginPass(name, passIndex, ast) : null),
      `debug recorder beginPass for ${name}`
    );
    try {
      const result = fn(debugPass);
      if (validateAst) {
        validateLuau(ast, { throw: true });
      }
      invalidateAnalysis();
      safeDebugCall(
        () => (debugPass ? debugPass.complete(ast) : null),
        `debug recorder complete for ${name}`
      );
      return result;
    } catch (err) {
      safeDebugCall(
        () => (debugPass ? debugPass.fail(ast, err) : null),
        `debug recorder fail for ${name}`
      );
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin ${name} failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      if (err && err.diagnostic) {
        wrapped.diagnostic = err.diagnostic;
      }
      throw wrapped;
    } finally {
      if (timingEnabled) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        logTiming(`plugin ${name}`, durationMs);
      }
    }
  };

  const queuedLuauPasses = [];
  const enqueueLuauPass = (name, fn) => {
    queuedLuauPasses.push({ name, fn });
  };

  const makePassPluginCtx = (name, passHandle) => {
    const traceablePasses = new Set([
      "luau-rename",
      "luau-maskGlobals",
      "luau-strings",
      "luau-vm",
      "luau-vm-cff",
    ]);

    if (!traceablePasses.has(name) || !passHandle || typeof passHandle.recordTrace !== "function") {
      return ctx;
    }

    return {
      ...ctx,
      debugTrace: passHandle.recordTrace,
    };
  };

  enqueueLuauPass("luau-entry", () => entryLuau(ast, ctx));

  if (options.wrap) {
    enqueueLuauPass("luau-wrap", () => wrapInFunction(ast, ctx));
  }

  if (options.constArray) {
    enqueueLuauPass("luau-const-array", () => constantArrayLuau(ast, ctx));
  }

  if (options.stringsOptions && options.stringsOptions.split && !options.strings) {
    enqueueLuauPass("luau-split-strings", () => splitStringsLuau(ast, ctx));
  }

  if (options.numbers) {
    enqueueLuauPass("luau-numbers", () => numbersToExpressions(ast, ctx));
  }

  const runClassicCffBeforeVm = Boolean(options.cff && !useVmCff && vmEnabled);
  if (runClassicCffBeforeVm) {
    enqueueLuauPass("luau-cff", () => controlFlowFlatten(ast, ctx));
  }

  const renameBeforeVm = Boolean(options.rename && vmEnabled && !useVmCff);
  if (renameBeforeVm) {
    enqueueLuauPass("luau-rename", (passHandle) => renameLuau(ast, {
      ...makePassPluginCtx("luau-rename", passHandle),
      options,
    }));
  }

  if (vmEnabled && !useVmCff) {
    enqueueLuauPass("luau-vm", (passHandle) => virtualizeLuau(ast, makePassPluginCtx("luau-vm", passHandle)));
  }

  if (options.cff) {
    if (useVmCff) {
      const vmOptions = { ...options.vm, enabled: true };
      if (!vmOptions.layers) {
        vmOptions.layers = 1;
      }
      enqueueLuauPass("luau-vm-cff", (passHandle) => virtualizeLuau(ast, {
        ...makePassPluginCtx("luau-vm-cff", passHandle),
        options: { ...options, vm: vmOptions },
      }));
    } else if (!runClassicCffBeforeVm) {
      enqueueLuauPass("luau-cff", () => controlFlowFlatten(ast, ctx));
    }
  }

  if (options.rename && !renameBeforeVm) {
    enqueueLuauPass("luau-rename", (passHandle) => renameLuau(ast, {
      ...makePassPluginCtx("luau-rename", passHandle),
      options,
    }));
  }

  if (options.strings) {
    enqueueLuauPass("luau-encodeMembers", () => encodeMembers(ast, ctx));
  }

  if (options.proxifyLocals) {
    enqueueLuauPass("luau-proxifyLocals", () => proxifyLocals(ast, ctx));
  }

  if (options.strings) {
    enqueueLuauPass("luau-strings", (passHandle) => {
      if (useCustom) {
        stringEncodeCustom(ast, options, rng, makePassPluginCtx("luau-strings", passHandle));
      } else {
        stringEncode(ast, makePassPluginCtx("luau-strings", passHandle));
      }
    });
  }

  if (options.dead) {
    enqueueLuauPass("luau-dead", () => injectDeadCode(ast, ctx));
  }

  if (options.antiHook && options.antiHook.enabled) {
    enqueueLuauPass("luau-antiHook", () => antiHookLuau(ast, ctx));
  }

  enqueueLuauPass("luau-maskGlobals", (passHandle) => maskGlobalsLuau(ast, makePassPluginCtx("luau-maskGlobals", passHandle)));

  if (options.padFooter) {
    enqueueLuauPass("luau-pad-footer", () => padFooterLuau(ast, ctx));
  }

  enqueueLuauPass("luau-literal-style", () => stylizeNumericLiteralsLuau(ast, ctx));

  for (let queueIndex = 0; queueIndex < queuedLuauPasses.length; queueIndex += 1) {
    const queued = queuedLuauPasses[queueIndex];
    try {
      runLuauPlugin(queued.name, queued.fn);
    } catch (err) {
      if (debugRecorder && typeof debugRecorder.markPassSkipped === "function") {
        for (let skipIndex = queueIndex + 1; skipIndex < queuedLuauPasses.length; skipIndex += 1) {
          const skipped = queuedLuauPasses[skipIndex];
          safeDebugCall(
            () => debugRecorder.markPassSkipped(skipped.name, skipIndex + 1),
            `debug recorder markPassSkipped for ${skipped.name}`
          );
        }
      }
      throw err;
    }
  }

  let cfg = null;
  if (options.cfg === true) {
    cfg = getCFG();
  }
  let ssa = null;
  if (options.ssa === true) {
    ssa = getSSA();
  }
  let ir = null;
  if (options.ir === true) {
    ir = getIR();
  }
  let irSSA = null;
  if (options.irSSA === true) {
    irSSA = getIRSSA();
  }
  const usePackedShell = options.lang === "luau" && vmEnabled && options.vm && options.vm.shellStyle === "packed";
  const shouldGenerateSourceMap = Boolean(options.sourceMap && !usePackedShell);
  const generated = generateLuauCustom(ast, {
    compact: shouldGenerateSourceMap ? false : options.compact,
    sourceMap: shouldGenerateSourceMap,
  });
  const baseCode = shouldGenerateSourceMap ? generated.code : generated;
  let code = baseCode;
  let map = null;
  if (!shouldGenerateSourceMap) {
    if (options.compact) {
      code = compactLuauWhitespace(code);
    }
    code = neutralizeDoubleDashInCode(code);
  }
  if (directives) {
    code = `${directives}\n${code}`;
  }
  code = `${LUAU_WATERMARK}\n${code}`;
  if (usePackedShell) {
    const packedBody = buildPackedLuauShell(code, rng);
    code = `${LUAU_WATERMARK}\n${packedBody}`;
  }
  if (shouldGenerateSourceMap) {
    const prefixLines = 1 + (directives ? directives.split("\n").length : 0);
    map = buildSourceMap(
      shiftMappings(generated.mappings || [], prefixLines),
      {
        file: options.filename || "output.lua",
        source: options.filename || "input.lua",
        sourceContent: source,
      }
    );
  }

  const outputSize = Buffer.byteLength(code, "utf8");
  if (outputSize > MAX_LUAU_OUTPUT_BYTES) {
    if (usePackedShell) {
      throw new Error(
        `Luau packed output too large: ${outputSize} bytes (max ${MAX_LUAU_OUTPUT_BYTES}).`
      );
    }
    let fallbackCode = compactLuauWhitespace(baseCode);
    if (directives) {
      fallbackCode = `${directives}\n${fallbackCode}`;
    }
    fallbackCode = `${LUAU_WATERMARK}\n${fallbackCode}`;
    const fallbackSize = Buffer.byteLength(fallbackCode, "utf8");
    if (fallbackSize <= MAX_LUAU_OUTPUT_BYTES) {
      code = fallbackCode;
    } else {
      throw new Error(
        `Luau output too large: ${fallbackSize} bytes (max ${MAX_LUAU_OUTPUT_BYTES}).`
      );
    }
  }

  return {
    code,
    map,
    cfg,
    ssa,
    ir,
    irSSA,
  };
}

module.exports = {
  obfuscateLuau,
  MAX_LUAU_OUTPUT_BYTES,
};
