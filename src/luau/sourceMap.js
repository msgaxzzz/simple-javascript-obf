const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeVlqSigned(value) {
  const num = Number(value) || 0;
  return num < 0 ? ((-num) << 1) + 1 : (num << 1);
}

function encodeVlq(value) {
  let vlq = encodeVlqSigned(value);
  let out = "";
  do {
    let digit = vlq & 31;
    vlq >>>= 5;
    if (vlq > 0) {
      digit |= 32;
    }
    out += BASE64[digit];
  } while (vlq > 0);
  return out;
}

function buildMappings(entries, names = []) {
  if (!Array.isArray(entries) || !entries.length) {
    return "";
  }
  const nameIndexMap = new Map();
  if (Array.isArray(names)) {
    names.forEach((name, idx) => nameIndexMap.set(name, idx));
  }
  const sorted = entries
    .filter((entry) => entry && Number.isFinite(entry.generatedLine) && Number.isFinite(entry.generatedColumn))
    .sort((a, b) => (
      a.generatedLine - b.generatedLine || a.generatedColumn - b.generatedColumn
    ));

  let mappings = "";
  let currentLine = 0;
  let prevGeneratedColumn = 0;
  let prevSourceIndex = 0;
  let prevSourceLine = 0;
  let prevSourceColumn = 0;
  let prevNameIndex = 0;
  let firstSegmentInLine = true;
  let lastRecordedCol = -1;

  sorted.forEach((entry) => {
    while (currentLine < entry.generatedLine) {
      mappings += ";";
      currentLine += 1;
      prevGeneratedColumn = 0;
      firstSegmentInLine = true;
      lastRecordedCol = -1;
    }
    if (entry.generatedColumn === lastRecordedCol && !entry.name) {
      return;
    }
    lastRecordedCol = entry.generatedColumn;

    if (!firstSegmentInLine) {
      mappings += ",";
    }
    const sourceIndex = Number(entry.sourceIndex) || 0;
    const sourceLine = Number(entry.sourceLine) || 0;
    const sourceColumn = Number(entry.sourceColumn) || 0;
    mappings += encodeVlq(entry.generatedColumn - prevGeneratedColumn);
    mappings += encodeVlq(sourceIndex - prevSourceIndex);
    mappings += encodeVlq(sourceLine - prevSourceLine);
    mappings += encodeVlq(sourceColumn - prevSourceColumn);

    if (entry.name && nameIndexMap.has(entry.name)) {
      const nameIndex = nameIndexMap.get(entry.name);
      mappings += encodeVlq(nameIndex - prevNameIndex);
      prevNameIndex = nameIndex;
    }

    prevGeneratedColumn = entry.generatedColumn;
    prevSourceIndex = sourceIndex;
    prevSourceLine = sourceLine;
    prevSourceColumn = sourceColumn;
    firstSegmentInLine = false;
  });

  return mappings;
}

function shiftMappings(entries, lineOffset = 0, columnOffset = 0) {
  return (entries || []).map((entry) => ({
    ...entry,
    generatedLine: entry.generatedLine + lineOffset,
    generatedColumn: entry.generatedLine === 0 ? entry.generatedColumn + columnOffset : entry.generatedColumn,
  }));
}

function buildSourceMap(entries, {
  file = "output.lua",
  source = "input.lua",
  sourceContent = null,
  names = null,
  genTimeNs = null,
  genTimeMs = null,
  timings = null,
  generatedAt = null,
} = {}) {
  const extractedNames = Array.isArray(names) ? names.slice() : [];
  if (!names && Array.isArray(entries)) {
    const nameSet = new Set();
    entries.forEach((e) => {
      if (e && typeof e.name === "string" && e.name.length > 0) {
        nameSet.add(e.name);
      }
    });
    extractedNames.push(...nameSet);
  }

  const map = {
    version: 3,
    file,
    sources: [source],
    names: extractedNames,
    mappings: buildMappings(entries, extractedNames),
    sourcesContent: sourceContent === null ? [] : [sourceContent],
  };

  if (genTimeNs !== null || genTimeMs !== null || timings !== null || generatedAt !== null) {
    const actualGenTimeNs = genTimeNs !== null ? String(genTimeNs) : (timings?.total?.durationNs || null);
    const actualGenTimeMs = genTimeMs !== null ? Number(genTimeMs) : (timings?.total?.durationMs || null);
    map.x_generator = "simple-javascript-obf/luau";
    map.x_generated_at = generatedAt || new Date().toISOString();
    if (actualGenTimeNs !== null) {
      map.x_gen_time_ns = actualGenTimeNs;
    }
    if (actualGenTimeMs !== null) {
      map.x_gen_time_ms = actualGenTimeMs;
    }
    if (timings) {
      map.x_timings = timings;
    }
    map.metadata = {
      generatedAt: map.x_generated_at,
      genTimeNs: actualGenTimeNs,
      genTimeMs: actualGenTimeMs,
      timings: timings || undefined,
    };
  }

  return map;
}

export {
  buildSourceMap,
  shiftMappings,
};

export default {
  buildSourceMap,
  shiftMappings,
};
