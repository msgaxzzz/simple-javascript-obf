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

function buildMappings(entries) {
  if (!Array.isArray(entries) || !entries.length) {
    return "";
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
  let firstSegmentInLine = true;

  sorted.forEach((entry) => {
    while (currentLine < entry.generatedLine) {
      mappings += ";";
      currentLine += 1;
      prevGeneratedColumn = 0;
      firstSegmentInLine = true;
    }
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
} = {}) {
  return {
    version: 3,
    file,
    sources: [source],
    names: [],
    mappings: buildMappings(entries),
    sourcesContent: sourceContent === null ? [] : [sourceContent],
  };
}

module.exports = {
  buildSourceMap,
  shiftMappings,
};
