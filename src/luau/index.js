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
  let code = generateLuauCustom(ast, { compact: options.compact });
  if (directives) {
    code = `${directives}\n${LUAU_WATERMARK}\n${code}`;
  } else {
    code = `${LUAU_WATERMARK}\n${code}`;
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
