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
  const presetName = userOptions.preset || "high";
  const preset = PRESETS[presetName] || PRESETS.high;
  const stringsUserOptions = userOptions.stringsOptions || {};
  const antiHookUserOptions = userOptions.antiHook;
  const ecma = normalizeEcma(userOptions.ecma);

  const options = {
    preset: presetName,
    rename: userOptions.rename ?? preset.rename,
    strings: userOptions.strings ?? preset.strings,
    cff: userOptions.cff ?? preset.cff,
    dead: userOptions.dead ?? preset.dead,
    vm: userOptions.vm || { enabled: preset.vm },
    seed: userOptions.seed || "js-obf",
    filename: userOptions.filename || "input.js",
    sourceMap: Boolean(userOptions.sourceMap),
    compact: Boolean(userOptions.compact),
    ecma,
    stringsOptions: {
      minLength: stringsUserOptions.minLength ?? 3,
      maxCount: stringsUserOptions.maxCount ?? 5000,
      encodeConsole: stringsUserOptions.encodeConsole !== false,
    },
    renameOptions: {
      reserved: userOptions.reserved || DEFAULT_RESERVED,
      renameGlobals: userOptions.renameGlobals ?? false,
    },
    deadCodeOptions: {
      probability: 0.15,
    },
    cffOptions: {
      minStatements: 3,
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
    opcodeShuffle: vmOptions.opcodeShuffle !== false,
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
