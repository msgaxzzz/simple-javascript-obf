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

async function obfuscateLuau(source, options) {
  options = options && typeof options === "object" ? { ...options } : {};
  options.luauParser = "custom";
  const rng = new RNG(options.seed);
  const directives = extractDirectives(source);
  const useCustom = true;
  const vmEnabled = options.vm === true || (options.vm && options.vm.enabled);
  const cffMode = options.cffOptions && options.cffOptions.mode
    ? options.cffOptions.mode
    : "classic";
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

  const timingEnabled = options.timing === true;
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

  const runClassicCffBeforeVm = Boolean(options.cff && !useVmCff && vmEnabled);
  if (runClassicCffBeforeVm) {
    runLuauPlugin("luau-cff", () => controlFlowFlatten(ast, ctx));
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
    } else if (!runClassicCffBeforeVm) {
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
