"use strict";

/**
 * Android Binary XML (AXML) parser and editor.
 * Replaces or updates the Application class in the StringPool.
 */

const RES_XML_TYPE = 0x0003;
const RES_STRING_POOL_TYPE = 0x0001;
const UTF8_FLAG = 0x00000100;

function parseAxmlStrings(buffer) {
  if (buffer.readUInt16LE(0) !== RES_XML_TYPE) {
    throw new Error("Invalid AXML file: not RES_XML_TYPE");
  }

  // String pool starts immediately after file header
  const fileHeaderSize = buffer.readUInt16LE(2);
  let offset = fileHeaderSize;

  const chunkType = buffer.readUInt16LE(offset);
  if (chunkType !== RES_STRING_POOL_TYPE) {
    throw new Error("Expected RES_STRING_POOL_TYPE at offset " + offset);
  }

  const poolHeaderSize = buffer.readUInt16LE(offset + 2);
  const poolChunkSize = buffer.readUInt32LE(offset + 4);
  const stringCount = buffer.readUInt32LE(offset + 8);
  const styleCount = buffer.readUInt32LE(offset + 12);
  const flags = buffer.readUInt32LE(offset + 16);
  const stringsStart = buffer.readUInt32LE(offset + 20);
  const stylesStart = buffer.readUInt32LE(offset + 24);
  const isUtf8 = (flags & UTF8_FLAG) !== 0;

  const stringOffsets = [];
  for (let i = 0; i < stringCount; i++) {
    stringOffsets.push(buffer.readUInt32LE(offset + poolHeaderSize + i * 4));
  }

  const dataBase = offset + stringsStart;
  const strings = [];

  for (let i = 0; i < stringCount; i++) {
    const strOffset = dataBase + stringOffsets[i];
    if (isUtf8) {
      // UTF-8 length encoding: 1 or 2 bytes for char count, then 1 or 2 bytes for byte length
      let ptr = strOffset;
      let charLen = buffer[ptr++];
      if (charLen & 0x80) {
        charLen = ((charLen & 0x7f) << 8) | buffer[ptr++];
      }
      let byteLen = buffer[ptr++];
      if (byteLen & 0x80) {
        byteLen = ((byteLen & 0x7f) << 8) | buffer[ptr++];
      }
      strings.push(buffer.toString("utf8", ptr, ptr + byteLen));
    } else {
      // UTF-16LE: 2 or 4 bytes char count
      let ptr = strOffset;
      let charLen = buffer.readUInt16LE(ptr);
      ptr += 2;
      if (charLen & 0x8000) {
        charLen = ((charLen & 0x7fff) << 16) | buffer.readUInt16LE(ptr);
        ptr += 2;
      }
      strings.push(buffer.toString("utf16le", ptr, ptr + charLen * 2));
    }
  }

  return {
    offset,
    fileHeaderSize,
    poolHeaderSize,
    poolChunkSize,
    stringCount,
    styleCount,
    flags,
    stringsStart,
    stylesStart,
    isUtf8,
    strings,
  };
}

/**
 * Rebuilds the AXML buffer with modified strings in the string pool.
 */
function updateAxmlStrings(buffer, stringIndexToReplace, newString) {
  const meta = parseAxmlStrings(buffer);
  const strings = [...meta.strings];
  strings[stringIndexToReplace] = newString;

  const isUtf8 = meta.isUtf8;
  const stringBuffers = [];
  const newOffsets = [];
  let currentDataOffset = 0;

  for (const s of strings) {
    newOffsets.push(currentDataOffset);
    if (isUtf8) {
      const sBuf = Buffer.from(s, "utf8");
      const charLen = s.length;
      const byteLen = sBuf.length;

      // Char length
      let charLenBuf;
      if (charLen > 0x7f) {
        charLenBuf = Buffer.from([(charLen >> 8) | 0x80, charLen & 0xff]);
      } else {
        charLenBuf = Buffer.from([charLen]);
      }

      // Byte length
      let byteLenBuf;
      if (byteLen > 0x7f) {
        byteLenBuf = Buffer.from([(byteLen >> 8) | 0x80, byteLen & 0xff]);
      } else {
        byteLenBuf = Buffer.from([byteLen]);
      }

      const entry = Buffer.concat([charLenBuf, byteLenBuf, sBuf, Buffer.from([0x00])]);
      stringBuffers.push(entry);
      currentDataOffset += entry.length;
    } else {
      const sBuf = Buffer.from(s, "utf16le");
      const charLen = s.length;

      let lenBuf;
      if (charLen > 0x7fff) {
        lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt16LE((charLen >> 16) | 0x8000, 0);
        lenBuf.writeUInt16LE(charLen & 0xffff, 2);
      } else {
        lenBuf = Buffer.alloc(2);
        lenBuf.writeUInt16LE(charLen, 0);
      }

      const entry = Buffer.concat([lenBuf, sBuf, Buffer.alloc(2)]); // null terminated word
      stringBuffers.push(entry);
      currentDataOffset += entry.length;
    }
  }

  // 4-byte align the string data
  const dataPadding = (4 - (currentDataOffset % 4)) % 4;
  if (dataPadding > 0) {
    stringBuffers.push(Buffer.alloc(dataPadding));
    currentDataOffset += dataPadding;
  }

  const allStringData = Buffer.concat(stringBuffers);

  // New string offsets array size
  const offsetsSize = meta.stringCount * 4;
  const newStringsStart = meta.poolHeaderSize + offsetsSize;
  const newPoolChunkSize = newStringsStart + allStringData.length;

  const poolHeader = Buffer.alloc(meta.poolHeaderSize);
  poolHeader.writeUInt16LE(RES_STRING_POOL_TYPE, 0);
  poolHeader.writeUInt16LE(meta.poolHeaderSize, 2);
  poolHeader.writeUInt32LE(newPoolChunkSize, 4);
  poolHeader.writeUInt32LE(meta.stringCount, 8);
  poolHeader.writeUInt32LE(meta.styleCount, 12);
  poolHeader.writeUInt32LE(meta.flags, 16);
  poolHeader.writeUInt32LE(newStringsStart, 20);
  poolHeader.writeUInt32LE(meta.stylesStart === 0 ? 0 : newPoolChunkSize, 24);

  const offsetsBuf = Buffer.alloc(offsetsSize);
  for (let i = 0; i < newOffsets.length; i++) {
    offsetsBuf.writeUInt32LE(newOffsets[i], i * 4);
  }

  const newPool = Buffer.concat([poolHeader, offsetsBuf, allStringData]);

  // Remainder of the original AXML (tags, attributes, etc.)
  const originalRemainderOffset = meta.offset + meta.poolChunkSize;
  const remainder = buffer.subarray(originalRemainderOffset);

  // Rebuild whole file buffer
  const newFileSize = meta.fileHeaderSize + newPool.length + remainder.length;
  const fileHeader = Buffer.alloc(meta.fileHeaderSize);
  buffer.copy(fileHeader, 0, 0, meta.fileHeaderSize);
  fileHeader.writeUInt32LE(newFileSize, 4);

  return Buffer.concat([fileHeader, newPool, remainder]);
}

/**
 * Finds the Package and Application class details in the manifest by parsing AXML tree nodes.
 */
function findManifestDetails(buffer) {
  const meta = parseAxmlStrings(buffer);
  const strings = meta.strings;

  let pkgName = null;
  let rawAppClass = null;
  let appStringIndex = -1;

  // Walk AXML chunks after string pool
  let offset = meta.offset + meta.poolChunkSize;
  while (offset < buffer.length - 8) {
    const chunkType = buffer.readUInt16LE(offset);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkSize < 8 || offset + chunkSize > buffer.length) break;

    // 0x0102: RES_XML_START_ELEMENT_TYPE
    if (chunkType === 0x0102) {
      const headerSize = buffer.readUInt16LE(offset + 2);
      const nameIndex = buffer.readUInt32LE(offset + headerSize + 4);
      const attrStart = buffer.readUInt16LE(offset + headerSize + 8);
      const attrCount = buffer.readUInt16LE(offset + headerSize + 12);
      const tagName = strings[nameIndex];

      if (tagName === "manifest") {
        for (let a = 0; a < attrCount; a++) {
          const aOffset = offset + headerSize + attrStart + a * 20;
          const aNameIndex = buffer.readUInt32LE(aOffset + 4);
          const aRawValIndex = buffer.readUInt32LE(aOffset + 8);
          if (strings[aNameIndex] === "package" && aRawValIndex < strings.length) {
            pkgName = strings[aRawValIndex];
          }
        }
      } else if (tagName === "application") {
        for (let a = 0; a < attrCount; a++) {
          const aOffset = offset + headerSize + attrStart + a * 20;
          const aNameIndex = buffer.readUInt32LE(aOffset + 4);
          const aRawValIndex = buffer.readUInt32LE(aOffset + 8);
          if (strings[aNameIndex] === "name" && aRawValIndex < strings.length) {
            rawAppClass = strings[aRawValIndex];
            appStringIndex = aRawValIndex;
            break;
          }
        }
      }
    }

    offset += chunkSize;
  }

  // Fallback heuristic if not found via tree
  if (!pkgName) {
    for (const s of strings) {
      if (s.includes(".") && !s.startsWith("http://") && !s.startsWith("android.") && !s.endsWith(".xml")) {
        if (s.split(".").length >= 2) {
          pkgName = s;
          break;
        }
      }
    }
  }

  pkgName = pkgName || "com.example.app";

  // Normalize app class name (e.g. .MyApplication -> com.obveil.demo.MyApplication)
  let normalizedAppClass = rawAppClass;
  if (normalizedAppClass) {
    if (normalizedAppClass.startsWith(".")) {
      normalizedAppClass = pkgName + normalizedAppClass;
    } else if (!normalizedAppClass.includes(".")) {
      normalizedAppClass = pkgName + "." + normalizedAppClass;
    }
  }

  return {
    packageName: pkgName,
    originalAppClass: normalizedAppClass,
    rawAppClass,
    appStringIndex,
    allStrings: strings,
  };
}

module.exports = {
  parseAxmlStrings,
  updateAxmlStrings,
  findManifestDetails,
};
