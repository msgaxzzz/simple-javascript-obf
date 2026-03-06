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
  const requestedPreset = String(userOptions.preset ?? "high").toLowerCase();
  const presetName = PRESETS[requestedPreset] ? requestedPreset : "high";
  const preset = PRESETS[presetName] || PRESETS.high;
  const stringsUserOptions = userOptions.stringsOptions || {};
  const cffUserOptions = userOptions.cffOptions || {};
  const renameUserOptions = userOptions.renameOptions || {};
  const wrapUserOptions = userOptions.wrapOptions || {};
  const numbersUserOptions = userOptions.numbersOptions || {};
  const constArrayUserOptions = userOptions.constArrayOptions || {};
  const padFooterUserOptions = userOptions.padFooterOptions || {};
  const cffModeRaw = typeof cffUserOptions.mode === "string"
    ? cffUserOptions.mode.toLowerCase()
    : null;
  const antiHookUserOptions = userOptions.antiHook;
  const ecma = normalizeEcma(userOptions.ecma);
  const lang = String(userOptions.lang ?? "js").toLowerCase();
  const defaultCffMode = lang === "luau" ? "classic" : null;
  const cffMode = cffModeRaw === "vm" || cffModeRaw === "classic"
    ? cffModeRaw
    : null;
  const effectiveCffMode = cffMode || defaultCffMode;
  const luauStyle = "default";
  const luauParser = "custom";
  const maxCount = normalizeCount(stringsUserOptions.maxCount, 5000, { min: 0 });
  const segmentDefault = lang === "luau" ? Math.min(maxCount, 120) : maxCount;
  const segmentSize = normalizeCount(
    stringsUserOptions.segmentSize,
    segmentDefault,
    { min: 1, max: Math.max(1, maxCount) }
  );
  const stringsPoolEncoding = "table";
  const splitMin = normalizeCount(stringsUserOptions.splitMin, 12, { min: 2 });
  const splitMaxParts = normalizeCount(stringsUserOptions.splitMaxParts, 3, { min: 2, max: 6 });
  const wrapIterations = normalizeCount(
    wrapUserOptions.iterations ?? userOptions.wrapIterations,
    1,
    { min: 1, max: 6 }
  );
  const numbersMaxDepth = normalizeCount(numbersUserOptions.maxDepth, 6, { min: 1, max: 12 });
  const numbersRange = normalizeCount(numbersUserOptions.range, 2 ** 20, { min: 1, max: 2 ** 26 });
  const constArrayMinLength = normalizeCount(constArrayUserOptions.minLength, 1, { min: 1, max: 1024 });
  const constArrayShards = normalizeCount(constArrayUserOptions.shards, 3, { min: 1, max: 16 });
  const constArrayShardMin = normalizeCount(constArrayUserOptions.shardMinLength, 6, { min: 2, max: 2048 });
  const constArrayOpaque = constArrayUserOptions.opaque !== false;
  const constArrayEncoding = typeof constArrayUserOptions.encoding === "string"
    ? constArrayUserOptions.encoding.toLowerCase()
    : "base64";
  const padFooterBlocks = normalizeCount(
    padFooterUserOptions.blocks ?? userOptions.padFooterBlocks,
    2,
    { min: 1, max: 8 }
  );
  const userVmEnabled = typeof userOptions.vm === "boolean"
    ? userOptions.vm
    : Boolean(userOptions.vm && userOptions.vm.enabled);
  const cffEnabledByDefault = userOptions.cff ?? preset.cff;
  const vmLikeFlow = lang === "luau" && (userVmEnabled || (cffEnabledByDefault && effectiveCffMode === "vm"));
  const constArrayPerScopeDefault = !vmLikeFlow;

  const isLuauHighPreset = lang === "luau" && presetName === "high";
  const compactDefault = lang === "luau" ? true : Boolean(userOptions.compact);
  const defaultStringMinLength = lang === "luau" ? 1 : 3;
  const options = {
    preset: presetName,
    lang: lang === "luau" ? "luau" : "js",
    luauParser: "custom",
    rename: userOptions.rename ?? preset.rename,
    strings: userOptions.strings ?? preset.strings,
    cff: userOptions.cff ?? preset.cff,
    dead: userOptions.dead ?? preset.dead,
    vm: userOptions.vm ?? { enabled: preset.vm },
    wrap: userOptions.wrap ?? wrapUserOptions.enabled ?? false,
    wrapOptions: {
      iterations: wrapIterations,
    },
    proxifyLocals: userOptions.proxifyLocals ?? false,
    numbers: userOptions.numbers ?? isLuauHighPreset,
    numbersOptions: {
      probability: normalizeProbability(numbersUserOptions.probability, 1),
      innerProbability: normalizeProbability(numbersUserOptions.innerProbability, 0.2),
      maxDepth: numbersMaxDepth,
      range: numbersRange,
    },
    constArray: userOptions.constArray ?? false,
    constArrayOptions: {
      probability: normalizeProbability(constArrayUserOptions.probability, 1),
      stringsOnly: constArrayUserOptions.stringsOnly ?? false,
      shuffle: constArrayUserOptions.shuffle !== false,
      rotate: constArrayUserOptions.rotate !== false,
      minLength: constArrayMinLength,
      encoding: constArrayEncoding === "base64" ? "base64" : "none",
      wrapper: constArrayUserOptions.wrapper !== false,
      shards: constArrayShards,
      shardMinLength: constArrayShardMin,
      perScope: constArrayUserOptions.perScope ?? constArrayPerScopeDefault,
      wipe: constArrayUserOptions.wipe !== false,
      opaque: constArrayOpaque,
    },
    padFooter: userOptions.padFooter ?? false,
    padFooterOptions: {
      blocks: padFooterBlocks,
    },
    seed: userOptions.seed,
    filename: userOptions.filename ?? "input.js",
    sourceMap: Boolean(userOptions.sourceMap),
    compact: compactDefault,
    minify: userOptions.minify !== false,
    beautify: Boolean(userOptions.beautify),
    timing: userOptions.timing === true,
    ecma,
    luauStyle,
    stringsOptions: {
      minLength: stringsUserOptions.minLength ?? defaultStringMinLength,
      maxCount,
      segmentSize,
      sampleRate: normalizeProbability(stringsUserOptions.sampleRate, 1),
      split: Boolean(stringsUserOptions.split),
      splitMin,
      splitMaxParts,
      encodeValueFallback: stringsUserOptions.encodeValueFallback !== false,
      poolEncoding: stringsPoolEncoding,
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
      maskGlobals: renameUserOptions.maskGlobals ?? userOptions.maskGlobals ?? (lang === "luau"),
    },
    deadCodeOptions: {
      probability: 0.15,
    },
    cffOptions: {
      minStatements: 3,
      downlevel: cffUserOptions.downlevel ?? Boolean(userOptions.cffDownlevel),
      mode: effectiveCffMode,
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
  const cffEnabled = options.cff !== false;
  const vmCffEnabled = lang === "luau" && cffEnabled && options.cffOptions.mode === "vm";
  const vmLayers = normalizeCount(vmOptions.layers, 1, { min: 1, max: 3 });
  const vmRuntimeKey = vmOptions.runtimeKey !== false;
  const vmRuntimeSplit = vmOptions.runtimeSplit !== false;
  const vmConstsEncoding = typeof vmOptions.constsEncoding === "string"
    ? vmOptions.constsEncoding.toLowerCase()
    : "table";
  const vmConstsSplit = vmOptions.constsSplit !== false;
  const vmConstsSplitSize = normalizeCount(vmOptions.constsSplitSize, 24, { min: 4, max: 200 });
  const vmBlockDispatch = vmOptions.blockDispatch ?? (lang === "luau" && (Boolean(vmOptions.enabled) || vmCffEnabled));
  const vmDispatchGraph = typeof vmOptions.dispatchGraph === "string"
    ? vmOptions.dispatchGraph.toLowerCase()
    : null;
  const vmStackProtocol = typeof vmOptions.stackProtocol === "string"
    ? vmOptions.stackProtocol.toLowerCase()
    : null;
  const vmIsaPolymorph = vmOptions.isaPolymorph;
  const vmFakeEdges = vmOptions.fakeEdges;
  const vmNumericStyle = typeof vmOptions.numericStyle === "string"
    ? vmOptions.numericStyle.toLowerCase()
    : null;
  const vmDecoyRuntime = vmOptions.decoyRuntime;
  const vmDecoyProbability = normalizeProbability(vmOptions.decoyProbability, 0.85);
  const vmDecoyStrings = normalizeCount(vmOptions.decoyStrings, 12, { min: 4, max: 96 });
  const vmSymbolNoise = vmOptions.symbolNoise;
  const vmInstructionFusion = vmOptions.instructionFusion;
  const vmSemanticMisdirection = vmOptions.semanticMisdirection;
  const vmDynamicCoupling = vmOptions.dynamicCoupling;
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
    all: vmOptions.all === undefined
      ? (lang === "js" && Boolean(vmOptions.enabled) && (!Array.isArray(vmOptions.include) || vmOptions.include.length === 0))
      : Boolean(vmOptions.all),
    layers: vmLayers,
    topLevel: Boolean(vmOptions.topLevel),
    opcodeShuffle: vmOptions.opcodeShuffle !== false,
    runtimeKey: vmRuntimeKey,
    runtimeSplit: vmRuntimeSplit,
    fakeOpcodes,
    bytecodeEncrypt: vmOptions.bytecodeEncrypt !== false,
    constsEncrypt: vmOptions.constsEncrypt !== false,
    constsEncoding: vmConstsEncoding === "table" ? "table" : "string",
    constsSplit: Boolean(vmConstsSplit),
    constsSplitSize: vmConstsSplitSize,
    blockDispatch: Boolean(vmBlockDispatch),
    dispatchGraph: vmDispatchGraph || "tree",
    stackProtocol: vmStackProtocol || "auto",
    isaPolymorph: vmIsaPolymorph === undefined ? false : vmIsaPolymorph,
    fakeEdges: vmFakeEdges === undefined ? false : Boolean(vmFakeEdges),
    numericStyle: vmNumericStyle || (lang === "luau" && Boolean(vmOptions.enabled) ? "mixed" : "plain"),
    decoyRuntime: vmDecoyRuntime === undefined ? false : Boolean(vmDecoyRuntime),
    decoyProbability: vmDecoyProbability,
    decoyStrings: vmDecoyStrings,
    symbolNoise: vmSymbolNoise === undefined ? false : Boolean(vmSymbolNoise),
    instructionFusion: vmInstructionFusion === undefined
      ? (lang === "luau" && (Boolean(vmOptions.enabled) || vmCffEnabled))
      : Boolean(vmInstructionFusion),
    semanticMisdirection: vmSemanticMisdirection === undefined
      ? false
      : Boolean(vmSemanticMisdirection),
    dynamicCoupling: vmDynamicCoupling === undefined
      ? false
      : Boolean(vmDynamicCoupling),
    downlevel: Boolean(vmOptions.downlevel),
    debug: Boolean(vmOptions.debug),
  };

  return options;
}

module.exports = {
  normalizeOptions,
  PRESETS,
};
