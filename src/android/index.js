"use strict";

const { packApk } = require("./packer");
const { resolveAndroidTools, findSdkPath } = require("./config");
const { buildObfuscatedStubDex, generateStubSource } = require("./stubBuilder");
const { packAndEncryptDexes, decryptAndUnpackDexes, splitPayload, assemblePayload } = require("./crypto");
const { alignApk, signApk, ensureKeystore } = require("./signer");
const { parseAxmlStrings, updateAxmlStrings, findManifestDetails } = require("./axml");
const { compileRcVmBytecode, RC_OP } = require("./rcVmCompiler");
const { compileNativeLibraries } = require("./ndkBuilder");

module.exports = {
  packApk,
  resolveAndroidTools,
  findSdkPath,
  buildObfuscatedStubDex,
  generateStubSource,
  packAndEncryptDexes,
  decryptAndUnpackDexes,
  splitPayload,
  assemblePayload,
  alignApk,
  signApk,
  ensureKeystore,
  parseAxmlStrings,
  updateAxmlStrings,
  findManifestDetails,
  compileRcVmBytecode,
  compileNativeLibraries,
  RC_OP,
};
