const { RNG } = require("../utils/rng");
const { extractDirectives } = require("./ast");
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
const { renameLuau } = require("./rename");
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
const { version: PACKAGE_VERSION } = require("../../package.json");

const WATERMARK_URL = "https://github.com/msgaxzzz/simple-javascript-obf";
const LUAU_WATERMARK = `-- This file was protected using simple-javascript-obfuscator v${PACKAGE_VERSION} [${WATERMARK_URL}]`;
const MAX_LUAU_OUTPUT_BYTES = 1000000;

function makeStyleName(rng, prefix = "_") {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = rng.int(7, 12);
  let value = prefix;
  for (let i = 0; i < length; i += 1) {
    value += alphabet[rng.int(0, alphabet.length - 1)];
  }
  return value;
}

function isWordChar(ch) {
  return !!ch && /[A-Za-z0-9_]/.test(ch);
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

    if (ch === "'" || ch === "\"") {
      const quote = ch;
      output += ch;
      index += 1;
      while (index < source.length) {
        const current = source[index];
        output += current;
        if (current === "\\") {
          if (index + 1 < source.length) {
            output += source[index + 1];
            index += 2;
            continue;
          }
        } else if (current === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
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

    if (ch === "'" || ch === "\"") {
      const quote = ch;
      output += ch;
      index += 1;
      while (index < source.length) {
        const current = source[index];
        output += current;
        if (current === "\\") {
          if (index + 1 < source.length) {
            output += source[index + 1];
            index += 2;
            continue;
          }
        } else if (current === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
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

const V3_STREAM_TOKENS = [
  "Df#", "sZ&", "(bM", "s)W",
  "Dl#", "P:^", "i2-", "_s2",
  "^sf", "O&&", ":K-", "3s5",
  "2^#", "-_k", "^2(", "2f_",
];

const V3_STREAM_SEPARATORS = ["", "", "", "", ":", "-", "^", "&", "(", ")", "_"];

function buildV3NoiseAlphabet(tokens, separators) {
  const merged = `${tokens.join("")}${separators.join("")}abcxyzABCXYZ0123456789`;
  return Array.from(new Set(merged.split(""))).join("");
}

function encodeV3PackedPayload(code, rng, tokens, separators) {
  const bytes = Buffer.from(code, "utf8");
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    const value = bytes[i];
    out += tokens[(value >> 4) & 0xf];
    out += tokens[value & 0xf];
    if (rng.int(0, 99) < 35) {
      out += separators[rng.int(0, separators.length - 1)];
    }
  }
  return out;
}

function splitV3PackedPayload(payload, rng) {
  const chunks = [];
  let cursor = 0;
  while (cursor < payload.length) {
    const remain = payload.length - cursor;
    const minSize = Math.min(remain, 48);
    const maxSize = Math.min(remain, 180);
    const size = maxSize > minSize ? rng.int(minSize, maxSize) : minSize;
    chunks.push(payload.slice(cursor, cursor + size));
    cursor += size;
  }
  return chunks;
}

function makeV3PackedNoise(rng, noiseAlphabet, minLen, maxLen) {
  const size = rng.int(minLen, maxLen);
  let text = "";
  for (let i = 0; i < size; i += 1) {
    text += noiseAlphabet[rng.int(0, noiseAlphabet.length - 1)];
  }
  return text;
}

function buildV3PackedFragments(payload, rng, noiseAlphabet) {
  const chunks = splitV3PackedPayload(payload, rng);
  const decoys = Math.max(5, Math.floor(chunks.length * 0.45) + rng.int(2, 7));
  const total = chunks.length + decoys;
  const slots = new Array(total).fill("");
  const free = Array.from({ length: total }, (_, idx) => idx + 1);
  const takeSlot = () => {
    const pick = rng.int(0, free.length - 1);
    return free.splice(pick, 1)[0];
  };
  const order = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const slot = takeSlot();
    slots[slot - 1] = chunks[i];
    order.push(slot);
  }
  const avg = Math.max(14, Math.floor(payload.length / Math.max(1, chunks.length)));
  while (free.length > 0) {
    const slot = takeSlot();
    const minLen = Math.max(8, Math.floor(avg * 0.4));
    const maxLen = Math.max(minLen + 1, Math.floor(avg * 1.6));
    slots[slot - 1] = makeV3PackedNoise(rng, noiseAlphabet, minLen, maxLen);
  }
  return { slots, order };
}

function wrapLuauV3PackedStyle(code, rng, compact) {
  const tokenTable = V3_STREAM_TOKENS;
  const separators = V3_STREAM_SEPARATORS;
  const noiseAlphabet = buildV3NoiseAlphabet(tokenTable, separators);
  const payload = encodeV3PackedPayload(code, rng, tokenTable, separators);
  const { slots, order } = buildV3PackedFragments(payload, rng, noiseAlphabet);
  const orderSalt = rng.int(21, 255);
  const orderAdd = rng.int(3, 29);
  const baitSize = Math.max(4, Math.min(12, Math.floor(slots.length * 0.18)));
  const bait = Array.from({ length: baitSize }, () => rng.int(37, 251));
  const encodedOrder = order.map((value, idx) => value + ((idx + 1) * orderAdd) + orderSalt);
  const slotsLiteral = slots.map((value) => `"${value}"`).join(",");
  const orderLiteral = encodedOrder.join(",");
  const baitLiteral = bait.join(",");
  const tokenLiteral = tokenTable.map((value) => `"${value}"`).join(",");
  const seed = rng.int(10000, 99999);
  const mul = rng.int(19, 87) | 1;
  const add = rng.int(101, 999);
  const mod = rng.int(20011, 50021);
  const s0 = rng.int(1200, 9999);
  const s1 = rng.int(1200, 9999);
  const s2 = rng.int(1200, 9999);
  const s3 = rng.int(1200, 9999);
  const slotsName = makeStyleName(rng, "_");
  const orderName = makeStyleName(rng, "_");
  const baitName = makeStyleName(rng, "_");
  const tokenName = makeStyleName(rng, "_");
  const payloadName = makeStyleName(rng, "_");
  const outName = makeStyleName(rng, "_");
  const stateName = makeStyleName(rng, "_");
  const seedName = makeStyleName(rng, "_");
  const orderLimitName = makeStyleName(rng, "_");
  const revName = makeStyleName(rng, "_");
  const nibName = makeStyleName(rng, "_");
  const nibListName = makeStyleName(rng, "_");
  const bytesName = makeStyleName(rng, "_");
  const idxName = makeStyleName(rng, "_");
  const slotName = makeStyleName(rng, "_");
  const chunkName = makeStyleName(rng, "_");
  const loaderName = makeStyleName(rng, "_");
  const fnName = makeStyleName(rng, "_");

  if (compact) {
    return `(function(...)local ${slotsName}={${slotsLiteral}};local ${orderName}={${orderLiteral}};local ${baitName}={${baitLiteral}};local ${tokenName}={${tokenLiteral}};local ${outName}={};local ${idxName}=1;local ${stateName}=${s0};local ${seedName}=${seed};local ${orderLimitName}=#${orderName};while true do if ${stateName}==${s0} then local ${slotName}=${orderName}[${idxName}]-(${idxName}*${orderAdd})-${orderSalt};${outName}[#${outName}+1]=${slotsName}[${slotName}];${seedName}=(${seedName}*${mul}+${add})%${mod};${idxName}=${idxName}+1;if ${idxName}>${orderLimitName} then ${stateName}=${s3};else if ((${seedName}+${baitName}[(((${idxName}-1)%#${baitName})+1)])%2)==0 then ${stateName}=${s1};else ${stateName}=${s2};end;end;elseif ${stateName}==${s1} then ${seedName}=(${seedName}+${baitName}[(((${idxName})%#${baitName})+1)])%${mod};${stateName}=${s0};elseif ${stateName}==${s2} then ${seedName}=(${seedName}*${mul + 2}+${baitName}[(((${idxName}+1)%#${baitName})+1)]+${add})%${mod};${stateName}=${s0};elseif ${stateName}==${s3} then break;else ${stateName}=${s0};end;end;local ${payloadName}=table.concat(${outName});local ${revName}={};for ${idxName}=1,#${tokenName} do ${revName}[${tokenName}[${idxName}]]=${idxName}-1;end;local ${nibListName}={};${idxName}=1;while ${idxName}<=#${payloadName} do local ${nibName}=string.sub(${payloadName},${idxName},${idxName}+2);local ${slotName}=${revName}[${nibName}];if ${slotName}~=nil then ${nibListName}[#${nibListName}+1]=${slotName};${idxName}=${idxName}+3;else ${idxName}=${idxName}+1;end;end;local ${bytesName}={};for ${idxName}=1,#${nibListName},2 do local ${slotName}=${nibListName}[${idxName}] or 0;local ${stateName}=${nibListName}[${idxName}+1] or 0;${bytesName}[#${bytesName}+1]=string.char(${slotName}*16+${stateName});end;local ${chunkName}=table.concat(${bytesName});local ${loaderName}=loadstring or load;local ${fnName}=nil;if type(${loaderName})=="function" then ${fnName}=${loaderName}(${chunkName});end;if type(${fnName})~="function" then return;end;return ${fnName}(...);end)(...)`;
  }

  return `(function(...)
  local ${slotsName} = {${slotsLiteral}}
  local ${orderName} = {${orderLiteral}}
  local ${baitName} = {${baitLiteral}}
  local ${tokenName} = {${tokenLiteral}}
  local ${outName} = {}
  local ${idxName} = 1
  local ${stateName} = ${s0}
  local ${seedName} = ${seed}
  local ${orderLimitName} = #${orderName}
  while true do
    if ${stateName} == ${s0} then
      local ${slotName} = ${orderName}[${idxName}] - (${idxName} * ${orderAdd}) - ${orderSalt}
      ${outName}[#${outName} + 1] = ${slotsName}[${slotName}]
      ${seedName} = (${seedName} * ${mul} + ${add}) % ${mod}
      ${idxName} = ${idxName} + 1
      if ${idxName} > ${orderLimitName} then
        ${stateName} = ${s3}
      else
        if ((${seedName} + ${baitName}[(((${idxName} - 1) % #${baitName}) + 1)]) % 2) == 0 then
          ${stateName} = ${s1}
        else
          ${stateName} = ${s2}
        end
      end
    elseif ${stateName} == ${s1} then
      ${seedName} = (${seedName} + ${baitName}[(((${idxName}) % #${baitName}) + 1)]) % ${mod}
      ${stateName} = ${s0}
    elseif ${stateName} == ${s2} then
      ${seedName} = (${seedName} * ${mul + 2} + ${baitName}[(((${idxName} + 1) % #${baitName}) + 1)] + ${add}) % ${mod}
      ${stateName} = ${s0}
    elseif ${stateName} == ${s3} then
      break
    else
      ${stateName} = ${s0}
    end
  end
  local ${payloadName} = table.concat(${outName})
  local ${revName} = {}
  for ${idxName} = 1, #${tokenName} do
    ${revName}[${tokenName}[${idxName}]] = ${idxName} - 1
  end
  local ${nibListName} = {}
  ${idxName} = 1
  while ${idxName} <= #${payloadName} do
    local ${nibName} = string.sub(${payloadName}, ${idxName}, ${idxName} + 2)
    local ${slotName} = ${revName}[${nibName}]
    if ${slotName} ~= nil then
      ${nibListName}[#${nibListName} + 1] = ${slotName}
      ${idxName} = ${idxName} + 3
    else
      ${idxName} = ${idxName} + 1
    end
  end
  local ${bytesName} = {}
  for ${idxName} = 1, #${nibListName}, 2 do
    local ${slotName} = ${nibListName}[${idxName}] or 0
    local ${stateName} = ${nibListName}[${idxName} + 1] or 0
    ${bytesName}[#${bytesName} + 1] = string.char(${slotName} * 16 + ${stateName})
  end
  local ${chunkName} = table.concat(${bytesName})
  local ${loaderName} = loadstring or load
  local ${fnName} = nil
  if type(${loaderName}) == "function" then
    ${fnName} = ${loaderName}(${chunkName})
  end
  if type(${fnName}) ~= "function" then
    return
  end
  return ${fnName}(...)
end)(...)`;
}

function wrapLuauV3Style(code, rng, compact) {
  const stateName = makeStyleName(rng, "_");
  const seedName = makeStyleName(rng, "_");
  const guardName = makeStyleName(rng, "_");
  const entryName = makeStyleName(rng, "_");
  const s0 = rng.int(1200, 9999);
  const s1 = rng.int(1200, 9999);
  const s2 = rng.int(1200, 9999);
  const mul = rng.int(17, 89) | 1;
  const add = rng.int(100, 999);
  const mod = rng.int(20000, 50000);
  const maskA = rng.int(1, 255);
  const maskB = rng.int(1, 255);

  if (compact) {
    const body = code
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(";");
    return `return(function(${entryName},...)local ${stateName}=${s0};local ${seedName}=${rng.int(10000, 99999)};local ${guardName}={${maskA},${maskB}};while true do if ${stateName}==${s0} then ${seedName}=(${seedName}*${mul}+${add})%${mod};${stateName}=${s1};elseif ${stateName}==${s1} then if ((${seedName}+${guardName}[1])%2)==0 then ${seedName}=(${seedName}+${guardName}[2])%${mod};else ${seedName}=(${seedName}*${mul + 2}+${guardName}[2])%${mod};end;${stateName}=${s2};elseif ${stateName}==${s2} then return ${entryName}(...);else ${stateName}=${s0};end;end;end)(function(...)${body};end,...)`;
  }

  const body = code
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");
  return `return(function(${entryName}, ...)
  local ${stateName} = ${s0}
  local ${seedName} = ${rng.int(10000, 99999)}
  local ${guardName} = {${maskA}, ${maskB}}
  while true do
    if ${stateName} == ${s0} then
      ${seedName} = (${seedName} * ${mul} + ${add}) % ${mod}
      ${stateName} = ${s1}
    elseif ${stateName} == ${s1} then
      if ((${seedName} + ${guardName}[1]) % 2) == 0 then
        ${seedName} = (${seedName} + ${guardName}[2]) % ${mod}
      else
        ${seedName} = (${seedName} * ${mul + 2} + ${guardName}[2]) % ${mod}
      end
      ${stateName} = ${s2}
    elseif ${stateName} == ${s2} then
      return ${entryName}(...)
    else
      ${stateName} = ${s0}
    end
  end
end)(function(...)
${body}
end, ...)`;
}

async function obfuscateLuau(source, options) {
  const rng = new RNG(options.seed);
  const directives = extractDirectives(source);
  const useCustom = true;
  const vmEnabled = options.vm === true || (options.vm && options.vm.enabled);
  const cffMode = options.cffOptions && options.cffOptions.mode
    ? options.cffOptions.mode
    : "vm";
  const useVmCff = Boolean(options.cff && cffMode === "vm");
  const ast = parseLuauCustom(source);
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

  const timingEnabled = options.timing !== false;
  const logTiming = timingEnabled
    ? (name, durationMs) => {
        const seconds = (durationMs / 1000).toFixed(3);
        process.stderr.write(`[js-obf] ${name} ${seconds}s\n`);
      }
    : null;

  const runLuauPlugin = (name, fn) => {
    const start = timingEnabled ? process.hrtime.bigint() : null;
    try {
      const result = fn();
      if (validateAst) {
        validateLuau(ast, { throw: true });
      }
      invalidateAnalysis();
      return result;
    } catch (err) {
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

  runLuauPlugin("luau-entry", () => entryLuau(ast, ctx));

  if (options.wrap) {
    runLuauPlugin("luau-wrap", () => wrapInFunction(ast, ctx));
  }

  if (options.constArray) {
    runLuauPlugin("luau-const-array", () => constantArrayLuau(ast, ctx));
  }

  if (options.stringsOptions && options.stringsOptions.split && !options.strings) {
    runLuauPlugin("luau-split-strings", () => splitStringsLuau(ast, ctx));
  }

  if (options.numbers) {
    runLuauPlugin("luau-numbers", () => numbersToExpressions(ast, ctx));
  }

  if (vmEnabled && !useVmCff) {
    runLuauPlugin("luau-vm", () => virtualizeLuau(ast, ctx));
  }

  if (options.cff) {
    if (useVmCff) {
      const vmOptions = { ...options.vm, enabled: true };
      if (!vmOptions.layers) {
        vmOptions.layers = 1;
      }
      const vmCtx = { ...ctx, options: { ...options, vm: vmOptions } };
      runLuauPlugin("luau-vm-cff", () => virtualizeLuau(ast, vmCtx));
    } else {
      runLuauPlugin("luau-cff", () => controlFlowFlatten(ast, ctx));
    }
  }

  if (options.strings) {
    runLuauPlugin("luau-encodeMembers", () => encodeMembers(ast, ctx));
  }

  if (options.proxifyLocals) {
    runLuauPlugin("luau-proxifyLocals", () => proxifyLocals(ast, ctx));
  }

  runLuauPlugin("luau-maskGlobals", () => maskGlobalsLuau(ast, ctx));

  if (options.strings) {
    runLuauPlugin("luau-strings", () => {
      if (useCustom) {
        stringEncodeCustom(ast, options, rng);
      } else {
        stringEncode(ast, ctx);
      }
    });
  }

  if (options.dead) {
    runLuauPlugin("luau-dead", () => injectDeadCode(ast, ctx));
  }

  if (options.antiHook && options.antiHook.enabled) {
    runLuauPlugin("luau-antiHook", () => antiHookLuau(ast, ctx));
  }

  if (options.rename) {
    runLuauPlugin("luau-rename", () => renameLuau(ast, { ...ctx, options }));
  }

  if (options.padFooter) {
    runLuauPlugin("luau-pad-footer", () => padFooterLuau(ast, ctx));
  }

  runLuauPlugin("luau-literal-style", () => stylizeNumericLiteralsLuau(ast, ctx));

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
  const baseCode = generateLuauCustom(ast, { compact: options.compact });
  let code = baseCode;
  if (options.luauStyle === "v3") {
    code = wrapLuauV3Style(code, rng, options.compact);
    code = wrapLuauV3PackedStyle(code, rng, options.compact);
  }
  code = compactLuauWhitespace(code);
  code = neutralizeDoubleDashInCode(code);
  if (directives) {
    code = `${directives}\n${code}`;
  }
  code = `${LUAU_WATERMARK}\n${code}`;

  const outputSize = Buffer.byteLength(code, "utf8");
  if (outputSize > MAX_LUAU_OUTPUT_BYTES) {
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
    map: null,
    cfg,
    ssa,
    ir,
    irSSA,
  };
}

module.exports = {
  obfuscateLuau,
};
