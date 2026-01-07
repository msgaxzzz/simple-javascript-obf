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

  const plugins = [];

  plugins.push((ast) => entryPlugin(ast, ctx));
  if (options.vm.enabled) {
    plugins.push((ast) => vmPlugin(ast, ctx));
  }
  if (options.cff) {
    plugins.push((ast) => cffPlugin(ast, ctx));
  }
  if (options.strings) {
    plugins.push((ast) => memberEncodePlugin(ast, ctx));
    plugins.push((ast) => stringPlugin(ast, ctx));
  }
  if (options.dead) {
    plugins.push((ast) => deadPlugin(ast, ctx));
  }
  if (options.antiHook && options.antiHook.enabled) {
    plugins.push((ast) => antiHookPlugin(ast, ctx));
  }
  if (options.rename) {
    plugins.push((ast) => renamePlugin(ast, ctx));
  }

  return plugins;
}

module.exports = {
  buildPipeline,
};
