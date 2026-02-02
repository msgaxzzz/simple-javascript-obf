const { RNG } = require("../utils/rng");
const { extractDirectives, generateLuau, parseLuau } = require("./ast");
const {
  parseLuau: parseLuauCustom,
  generateLuau: generateLuauCustom,
} = require("./custom");
const { stringEncode: stringEncodeCustom } = require("./custom/strings");
const { stringEncode } = require("./strings");
const { controlFlowFlatten } = require("./cff");
const { renameLuau } = require("./rename");
const { virtualizeLuau } = require("./vm");
const { antiHookLuau } = require("./antiHook");
const { encodeMembers } = require("./encodeMembers");
const { injectDeadCode } = require("./dead");
const { entryLuau } = require("./entry");

async function obfuscateLuau(source, options) {
  const rng = new RNG(options.seed);
  const directives = extractDirectives(source);
  const useCustom = options.luauParser === "custom";
  const vmEnabled = options.vm === true || (options.vm && options.vm.enabled);
  const cffMode = options.cffOptions && options.cffOptions.mode
    ? options.cffOptions.mode
    : "vm";
  const useVmCff = Boolean(options.cff && cffMode === "vm");
  const parseOptions = useCustom ? null : { ...options, luaVersion: options.luaVersion || "5.3" };
  const vmParseOptions = useCustom ? null : { ...parseOptions, luaVersion: "5.3" };
  const ast = useCustom ? parseLuauCustom(source) : parseLuau(source, parseOptions);

  const ctx = {
    options,
    rng,
    parseCustom: parseLuauCustom,
    parseLuaparse: (source) => parseLuau(
      source,
      vmEnabled && vmParseOptions ? vmParseOptions : (parseOptions || options)
    ),
  };

  try {
    entryLuau(ast, ctx);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    const wrapped = new Error(`[js-obf] plugin luau-entry failed: ${message}`);
    if (err && err.stack) {
      wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
    }
    wrapped.cause = err;
    throw wrapped;
  }

  if (vmEnabled && !useVmCff) {
    try {
      virtualizeLuau(ast, ctx);
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin luau-vm failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    }
  }

  if (options.cff) {
    if (useVmCff) {
      const vmOptions = { ...options.vm, enabled: true };
      if (!vmOptions.layers) {
        vmOptions.layers = 1;
      }
      const vmCtx = { ...ctx, options: { ...options, vm: vmOptions } };
      try {
        virtualizeLuau(ast, vmCtx);
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        const wrapped = new Error(`[js-obf] plugin luau-vm-cff failed: ${message}`);
        if (err && err.stack) {
          wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
        }
        wrapped.cause = err;
        throw wrapped;
      }
    } else {
      try {
        controlFlowFlatten(ast, ctx);
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        const wrapped = new Error(`[js-obf] plugin luau-cff failed: ${message}`);
        if (err && err.stack) {
          wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
        }
        wrapped.cause = err;
        throw wrapped;
      }
    }
  }

  if (options.strings) {
    try {
      encodeMembers(ast, ctx);
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin luau-encodeMembers failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    }
  }

  if (options.strings) {
    try {
      if (useCustom) {
        stringEncodeCustom(ast, options, rng);
      } else {
        stringEncode(ast, ctx);
      }
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin luau-strings failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    }
  }

  if (options.dead) {
    try {
      injectDeadCode(ast, ctx);
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin luau-dead failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    }
  }

  if (options.antiHook && options.antiHook.enabled) {
    try {
      antiHookLuau(ast, ctx);
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin luau-antiHook failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    }
  }

  if (options.rename) {
    try {
      renameLuau(ast, { ...ctx, options });
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin luau-rename failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    }
  }

  let code = useCustom ? generateLuauCustom(ast) : generateLuau(ast);
  if (directives) {
    code = `${directives}\n${code}`;
  }

  return {
    code,
    map: null,
  };
}

module.exports = {
  obfuscateLuau,
};
