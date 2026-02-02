const { DEFAULT_RESERVED } = require("./utils/reserved");

const DEFAULT_ECMA = 2020;

function normalizeEcma(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_ECMA;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const text = String(value).trim().toLowerCase();
  if (!text) {
    return DEFAULT_ECMA;
  }
  const normalized = text.startsWith("es") ? text.slice(2) : text;
  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return DEFAULT_ECMA;
}

function normalizeProbability(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, numeric));
}

function normalizeCount(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const clamped = Math.max(min, Math.min(max, Math.floor(numeric)));
  return clamped;
}

const PRESETS = {
  high: {
    rename: true,
    strings: true,
    cff: true,
    dead: true,
    vm: false,
  },
  balanced: {
    rename: true,
    strings: true,
    cff: true,
    dead: false,
    vm: false,
  },
  low: {
    rename: true,
    strings: false,
    cff: false,
    dead: false,
    vm: false,
  },
};

function normalizeOptions(userOptions = {}) {
  const presetName = userOptions.preset ?? "high";
  const preset = PRESETS[presetName] || PRESETS.high;
  const stringsUserOptions = userOptions.stringsOptions || {};
  const cffUserOptions = userOptions.cffOptions || {};
  const renameUserOptions = userOptions.renameOptions || {};
  const cffMode = typeof cffUserOptions.mode === "string"
    ? cffUserOptions.mode.toLowerCase()
    : null;
  const antiHookUserOptions = userOptions.antiHook;
  const ecma = normalizeEcma(userOptions.ecma);
  const lang = String(userOptions.lang ?? "js").toLowerCase();
  const luauParser = String(userOptions.luauParser ?? "luaparse").toLowerCase();
  const maxCount = normalizeCount(stringsUserOptions.maxCount, 5000, { min: 0 });
  const segmentSize = normalizeCount(
    stringsUserOptions.segmentSize,
    maxCount,
    { min: 1, max: Math.max(1, maxCount) }
  );
  const splitMin = normalizeCount(stringsUserOptions.splitMin, 12, { min: 2 });
  const splitMaxParts = normalizeCount(stringsUserOptions.splitMaxParts, 3, { min: 2, max: 6 });

  const options = {
    preset: presetName,
    lang: lang === "luau" ? "luau" : "js",
    luauParser: luauParser === "custom" ? "custom" : "luaparse",
    rename: userOptions.rename ?? preset.rename,
    strings: userOptions.strings ?? preset.strings,
    cff: userOptions.cff ?? preset.cff,
    dead: userOptions.dead ?? preset.dead,
    vm: userOptions.vm ?? { enabled: preset.vm },
    seed: userOptions.seed ?? "js-obf",
    filename: userOptions.filename ?? "input.js",
    sourceMap: Boolean(userOptions.sourceMap),
    compact: Boolean(userOptions.compact),
    minify: userOptions.minify !== false,
    beautify: Boolean(userOptions.beautify),
    ecma,
    stringsOptions: {
      minLength: stringsUserOptions.minLength ?? 3,
      maxCount,
      segmentSize,
      sampleRate: normalizeProbability(stringsUserOptions.sampleRate, 1),
      split: Boolean(stringsUserOptions.split),
      splitMin,
      splitMaxParts,
      encodeConsole: stringsUserOptions.encodeConsole !== false,
      encodeObjectKeys: stringsUserOptions.encodeObjectKeys !== false,
      encodeJSXAttributes: stringsUserOptions.encodeJSXAttributes !== false,
      encodeTemplateChunks: stringsUserOptions.encodeTemplateChunks !== false,
    },
    renameOptions: {
      reserved: userOptions.reserved ?? DEFAULT_RESERVED,
      renameGlobals: renameUserOptions.renameGlobals ?? userOptions.renameGlobals ?? false,
      renameMembers: renameUserOptions.renameMembers ?? userOptions.renameMembers ?? false,
      homoglyphs: renameUserOptions.homoglyphs ?? userOptions.homoglyphs ?? false,
    },
    deadCodeOptions: {
      probability: 0.15,
    },
    cffOptions: {
      minStatements: 3,
      downlevel: cffUserOptions.downlevel ?? Boolean(userOptions.cffDownlevel),
      mode: cffMode,
      opaque: cffUserOptions.opaque !== false,
    },
    antiHook: {
      enabled: false,
      lock: false,
    },
  };

  if (typeof antiHookUserOptions === "boolean") {
    options.antiHook.enabled = antiHookUserOptions;
  } else if (antiHookUserOptions && typeof antiHookUserOptions === "object") {
    options.antiHook.enabled = antiHookUserOptions.enabled !== false;
    options.antiHook.lock = Boolean(antiHookUserOptions.lock);
  }

  if (typeof options.vm === "boolean") {
    options.vm = { enabled: options.vm };
  }
  const vmOptions = options.vm || {};
  const vmLayers = normalizeCount(vmOptions.layers, 1, { min: 1, max: 3 });
  const vmRuntimeKey = vmOptions.runtimeKey !== false;
  const vmRuntimeSplit = vmOptions.runtimeSplit !== false;
  let fakeOpcodes = vmOptions.fakeOpcodes;
  if (fakeOpcodes === undefined || fakeOpcodes === true) {
    fakeOpcodes = 0.15;
  } else if (fakeOpcodes === false) {
    fakeOpcodes = 0;
  } else {
    fakeOpcodes = Number(fakeOpcodes);
    if (Number.isNaN(fakeOpcodes)) {
      fakeOpcodes = 0.15;
    }
  }
  fakeOpcodes = Math.max(0, Math.min(1, fakeOpcodes));
  options.vm = {
    enabled: Boolean(vmOptions.enabled),
    include: vmOptions.include || [],
    all: Boolean(vmOptions.all),
    layers: vmLayers,
    opcodeShuffle: vmOptions.opcodeShuffle !== false,
    runtimeKey: vmRuntimeKey,
    runtimeSplit: vmRuntimeSplit,
    fakeOpcodes,
    bytecodeEncrypt: vmOptions.bytecodeEncrypt !== false,
    constsEncrypt: vmOptions.constsEncrypt !== false,
    downlevel: Boolean(vmOptions.downlevel),
  };

  return options;
}

module.exports = {
  normalizeOptions,
  PRESETS,
};
