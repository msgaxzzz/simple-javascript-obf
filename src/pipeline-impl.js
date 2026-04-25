const { RNG } = require("./utils/rng");
const { NameGenerator } = require("./utils/names");
const entryPlugin = require("./plugins/entry");
const renamePlugin = require("./plugins/rename");
const stringPlugin = require("./plugins/stringEncode");
const memberEncodePlugin = require("./plugins/encodeMembers");
const cffPlugin = require("./plugins/controlFlowFlatten");
const deadPlugin = require("./plugins/deadCode");
const antiHookPlugin = require("./plugins/antiHook");
const vmPlugin = require("./plugins/vm");

function buildPipeline({ t, traverse, options }) {
  const rng = new RNG(options.seed);
  const nameGen = new NameGenerator({
    reserved: options.renameOptions.reserved,
    rng,
  });

  const ctx = {
    t,
    traverse,
    options,
    rng,
    nameGen,
    state: {},
  };

  const timingEnabled = Boolean(options.timing);
  const logTiming = timingEnabled
    ? (name, durationMs) => {
        const seconds = (durationMs / 1000).toFixed(3);
        process.stderr.write(`[js-obf] ${name} ${seconds}s\n`);
      }
    : null;

  const wrapPlugin = (name, plugin) => (ast) => {
    const start = timingEnabled ? process.hrtime.bigint() : null;
    try {
      plugin(ast, ctx);
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const wrapped = new Error(`[js-obf] plugin ${name} failed: ${message}`);
      if (err && err.stack) {
        wrapped.stack = `${wrapped.message}\nCaused by: ${err.stack}`;
      }
      wrapped.cause = err;
      throw wrapped;
    } finally {
      if (timingEnabled) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        logTiming(`plugin ${name}`, durationMs);
      }
    }
  };

  const plugins = [];

  plugins.push(wrapPlugin("entry", entryPlugin));
  if (options.vm.enabled) {
    plugins.push(wrapPlugin("vm", vmPlugin));
  }
  if (options.cff) {
    plugins.push(wrapPlugin("controlFlowFlatten", cffPlugin));
  }
  if (options.strings) {
    plugins.push(wrapPlugin("encodeMembers", memberEncodePlugin));
    plugins.push(wrapPlugin("stringEncode", stringPlugin));
  }
  if (options.dead) {
    plugins.push(wrapPlugin("deadCode", deadPlugin));
  }
  if (options.antiHook && options.antiHook.enabled) {
    plugins.push(wrapPlugin("antiHook", antiHookPlugin));
  }
  if (options.rename) {
    plugins.push(wrapPlugin("rename", renamePlugin));
  }

  return plugins;
}

module.exports = {
  buildPipeline,
};
