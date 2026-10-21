"use strict";

const crypto = require("node:crypto");

const RC_OP = {
  NOP: 0x00,
  ANTI_DEBUG: 0x01,
  LOAD_BYTES: 0x02,
  XOR_SLOT: 0x03,
  HASH_PKG: 0x04,
  READ_ASSET: 0x05,
  AES_DEC: 0x06,
  EXTRACT_DEX: 0x07,
  HALT: 0x08,
  CHECK_SIG: 0x09,
  B64_DEC: 0x0A,
  B85_DEC: 0x0B,
  MOV_SLOT: 0x0C,
  ADD_SLOT: 0x0D,
  SUB_SLOT: 0x0E,
  ROL_SLOT: 0x0F,
  NOT_SLOT: 0x10,
  MEM_ZERO: 0x11,
  JMP: 0x12,
  JEQ: 0x13,
  JNE: 0x14,
  DEX_FIXUP: 0x15,
};

/**
 * Emits an opaque jump block that skips over a trap sequence.
 * The trap sequence contains realistic math / state transforms but ends in an infinite loop or fatal trap.
 */
function createTrapBlock(kind) {
  const scratch = 10 + Math.floor(Math.random() * 5);
  const rnd = crypto.randomBytes(4 + Math.floor(Math.random() * 8));
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16LE(rnd.length, 0);

  const parts = [
    Buffer.from([RC_OP.LOAD_BYTES, scratch]),
    lenBuf,
    rnd,
    Buffer.from([RC_OP.ROL_SLOT, scratch, 1 + Math.floor(Math.random() * 3)]),
    Buffer.from([RC_OP.NOT_SLOT, 15, scratch]),
  ];

  if (kind === "loop") {
    // Dead end: Infinite self-trap (JMP -3 bytes back to itself)
    parts.push(Buffer.from([RC_OP.JMP, 0xFD, 0xFF]));
  } else if (kind === "illegal") {
    parts.push(Buffer.from([0xFE]));
  } else {
    // Dead end: Early memory zeroing of crucial slots followed by invalid opcode
    parts.push(Buffer.from([RC_OP.MEM_ZERO, scratch, 0xFE]));
  }

  const trapBytes = Buffer.concat(parts);
  const jmp = Buffer.alloc(3);
  jmp[0] = RC_OP.JMP;
  jmp.writeInt16LE(trapBytes.length, 1);
  return Buffer.concat([jmp, trapBytes]);
}

/**
 * Emits a realistic math sequence that actually executes safely on scratch registers (slots 10-15).
 * Uses ALU ops (MOV_SLOT, ADD_SLOT, SUB_SLOT, ROL_SLOT, NOT_SLOT, XOR_SLOT, MEM_ZERO)
 * and cleans up its own scratch memory while embedding traps.
 */
function createSafeLabyrinthBlock(index) {
  const s1 = 10 + (index % 2);
  const s2 = 12 + (index % 2);
  const s3 = 14;

  const b1 = crypto.randomBytes(8);
  const b2 = crypto.randomBytes(8);
  const len1 = Buffer.alloc(2);
  len1.writeUInt16LE(b1.length, 0);
  const len2 = Buffer.alloc(2);
  len2.writeUInt16LE(b2.length, 0);

  const trapType = index % 3 === 0 ? "loop" : (index % 3 === 1 ? "illegal" : "zero");

  return Buffer.concat([
    Buffer.from([RC_OP.LOAD_BYTES, s1]), len1, b1,
    Buffer.from([RC_OP.LOAD_BYTES, s2]), len2, b2,
    Buffer.from([RC_OP.XOR_SLOT, s3, s1, s2]),
    Buffer.from([RC_OP.ROL_SLOT, s3, 2]),
    Buffer.from([RC_OP.ADD_SLOT, s1, s3, s2]),
    Buffer.from([RC_OP.NOT_SLOT, s2, s1]),
    createTrapBlock(trapType),
    Buffer.from([RC_OP.SUB_SLOT, s3, s1, s2]),
    Buffer.from([RC_OP.MEM_ZERO, s1]),
    Buffer.from([RC_OP.MEM_ZERO, s2]),
    Buffer.from([RC_OP.MEM_ZERO, s3]),
  ]);
}

/**
 * Compiles decryption and extraction routine into binary bytecode for the native RC VM.
 */
function compileRcVmBytecode(options) {
  const {
    keyBuffer,
    ivBuffer,
    appPackageName,
    payloadFragments = [],
    antiDebug = false,
    checkSignature = false,
    expectedSignatureSha256 = null,
    vmBloat = true,
    decoyBlocks = 32,
  } = options;

  const key = Buffer.isBuffer(keyBuffer) ? keyBuffer : Buffer.from(keyBuffer, "hex");
  const iv = Buffer.isBuffer(ivBuffer) ? ivBuffer : Buffer.from(ivBuffer, "hex");

  const salt = crypto.randomBytes(16);
  const h = crypto.createHash("sha256");
  if (appPackageName) {
    h.update(appPackageName);
  }
  h.update(salt);
  const digest = h.digest();

  const keyMask = crypto.randomBytes(32);
  const maskedKey = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    maskedKey[i] = key[i] ^ digest[i] ^ keyMask[i];
  }

  const ivMask = crypto.randomBytes(16);
  const maskedIv = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    maskedIv[i] = iv[i] ^ digest[i % digest.length] ^ ivMask[i];
  }

  const chunks = [];

  // 1. OP_ANTI_DEBUG (checks TracerPid, /proc/self/maps for Frida/Xposed, port 27042, root, emulator)
  // Disabled by default so normal testing, emulators, and debugging environments do not crash.
  if (antiDebug) {
    chunks.push(Buffer.from([RC_OP.ANTI_DEBUG]));
  }

  // 1b. OP_CHECK_SIG (verifies APK signature hash against expected certificate SHA256)
  if (checkSignature && expectedSignatureSha256) {
    const sigBuf = Buffer.isBuffer(expectedSignatureSha256)
      ? expectedSignatureSha256
      : (typeof expectedSignatureSha256 === "string"
          ? Buffer.from(expectedSignatureSha256, "hex")
          : Buffer.alloc(32));
    chunks.push(Buffer.from([RC_OP.CHECK_SIG]));
    chunks.push(sigBuf.length === 32 ? sigBuf : Buffer.alloc(32));
  }

  // 2. Derive digest: slot 5 = SHA256((bindPkg ? pkg : "") + salt)
  const bindPkg = appPackageName ? 1 : 0;
  chunks.push(Buffer.from([RC_OP.HASH_PKG, 5, bindPkg, salt.length]));
  chunks.push(salt);

  // 3. Key:
  // slot 6 = maskedKey
  const keyLenBuf = Buffer.alloc(2);
  keyLenBuf.writeUInt16LE(maskedKey.length, 0);
  chunks.push(Buffer.from([RC_OP.LOAD_BYTES, 6]));
  chunks.push(keyLenBuf);
  chunks.push(maskedKey);

  // slot 7 = keyMask
  const keyMaskLenBuf = Buffer.alloc(2);
  keyMaskLenBuf.writeUInt16LE(keyMask.length, 0);
  chunks.push(Buffer.from([RC_OP.LOAD_BYTES, 7]));
  chunks.push(keyMaskLenBuf);
  chunks.push(keyMask);

  // slot 1 = slot 6 ^ slot 7
  chunks.push(Buffer.from([RC_OP.XOR_SLOT, 1, 6, 7]));
  // slot 1 = slot 1 ^ slot 5 (restores actual AES key)
  chunks.push(Buffer.from([RC_OP.XOR_SLOT, 1, 1, 5]));

  // 4. IV:
  // slot 8 = maskedIv
  const ivLenBuf = Buffer.alloc(2);
  ivLenBuf.writeUInt16LE(maskedIv.length, 0);
  chunks.push(Buffer.from([RC_OP.LOAD_BYTES, 8]));
  chunks.push(ivLenBuf);
  chunks.push(maskedIv);

  // slot 9 = ivMask
  const ivMaskLenBuf = Buffer.alloc(2);
  ivMaskLenBuf.writeUInt16LE(ivMask.length, 0);
  chunks.push(Buffer.from([RC_OP.LOAD_BYTES, 9]));
  chunks.push(ivMaskLenBuf);
  chunks.push(ivMask);

  // slot 2 = slot 8 ^ slot 9
  chunks.push(Buffer.from([RC_OP.XOR_SLOT, 2, 8, 9]));
  // slot 2 = slot 2 ^ slot 5 (restores actual AES IV)
  chunks.push(Buffer.from([RC_OP.XOR_SLOT, 2, 2, 5]));

  // Labyrinth Phase 1: Mathematical state transforms and traps
  if (vmBloat) {
    const p1Count = Math.max(2, Math.floor(decoyBlocks / 4));
    for (let b = 0; b < p1Count; b++) {
      chunks.push(createSafeLabyrinthBlock(b));
    }
  }

  // 5. Read fragments into slot 0 (combined Base64 ASCII text)
  for (const frag of payloadFragments) {
    const fragBuf = Buffer.from(frag, "utf8");
    chunks.push(Buffer.from([RC_OP.READ_ASSET, 0, fragBuf.length]));
    chunks.push(fragBuf);
  }

  // Labyrinth Phase 2: Interleaved fragment decoy traps
  if (vmBloat) {
    const p2Count = Math.max(2, Math.floor(decoyBlocks / 4));
    for (let b = 0; b < p2Count; b++) {
      chunks.push(createSafeLabyrinthBlock(b + 10));
    }
  }

  // 5b. Base64 decode slot 0 -> slot 0 (raw AES ciphertext)
  chunks.push(Buffer.from([RC_OP.B64_DEC, 0, 0]));

  // Labyrinth Phase 3: Pre-decryption non-linear loops and traps
  if (vmBloat) {
    const p3Count = Math.max(2, Math.floor(decoyBlocks / 4));
    for (let b = 0; b < p3Count; b++) {
      chunks.push(createSafeLabyrinthBlock(b + 20));
    }
  }

  // Bytecode CFF: Insert opaque jump over decoy instruction sequence that leads to dead end
  const decoy1 = Buffer.from([
    RC_OP.LOAD_BYTES, 14, 0x04, 0x00, 0x78, 0x56, 0x34, 0x12,
    RC_OP.ROL_SLOT, 14, 2,
    RC_OP.NOT_SLOT, 15, 14,
    // Dead end: Infinite self-trap (JMP -3 bytes to itself)
    RC_OP.JMP, 0xFD, 0xFF,
  ]);
  const jmpBuf1 = Buffer.alloc(3);
  jmpBuf1[0] = RC_OP.JMP;
  jmpBuf1.writeInt16LE(decoy1.length, 1);
  chunks.push(jmpBuf1);
  chunks.push(decoy1);

  // 6. Decrypt slot 0 with key (slot 1) and iv (slot 2) into slot 3 (Base85 text)
  chunks.push(Buffer.from([RC_OP.AES_DEC, 0, 1, 2, 3]));

  // Secure RAM zeroing of key, IV, intermediate masks
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 1])); // key
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 2])); // iv
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 5])); // digest
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 6])); // maskedKey
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 7])); // keyMask
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 8])); // maskedIv
  chunks.push(Buffer.from([RC_OP.MEM_ZERO, 9])); // ivMask

  // 6b. Base85 decode slot 3 -> slot 3 (raw OBVF payload)
  chunks.push(Buffer.from([RC_OP.B85_DEC, 3, 3]));

  // 6c. Native DEX Header Fixup (unmasks DEX magic directly in native memory)
  chunks.push(Buffer.from([RC_OP.DEX_FIXUP, 3]));

  // Labyrinth Phase 4: Post-fixup arithmetic labyrinth
  if (vmBloat) {
    const p4Count = Math.max(2, Math.floor(decoyBlocks / 4));
    for (let b = 0; b < p4Count; b++) {
      chunks.push(createSafeLabyrinthBlock(b + 30));
    }
  }

  // Bytecode CFF: Second opaque jump over decoy block leading to dead end
  const decoy2 = Buffer.from([
    RC_OP.LOAD_BYTES, 13, 0x02, 0x00, 0xAA, 0x55,
    RC_OP.MEM_ZERO, 13,
    // Dead end: Invalid opcode fatal trap
    0xFE,
  ]);
  const jmpBuf2 = Buffer.alloc(3);
  jmpBuf2[0] = RC_OP.JMP;
  jmpBuf2.writeInt16LE(decoy2.length, 1);
  chunks.push(jmpBuf2);
  chunks.push(decoy2);

  // 7. Extract DEX files from slot 3
  chunks.push(Buffer.from([RC_OP.EXTRACT_DEX, 3]));

  // 8. Halt
  chunks.push(Buffer.from([RC_OP.HALT]));

  return Buffer.concat(chunks);
}

module.exports = {
  RC_OP,
  compileRcVmBytecode,
};
