"use strict";

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const { findNdkPath } = require("./config");
const { runTool } = require("./exec");

const TARGET_ABIS = [
  {
    abi: "arm64-v8a",
    prefix: "aarch64-linux-android",
    minApi: 21,
  },
  {
    abi: "armeabi-v7a",
    prefix: "armv7a-linux-androideabi",
    minApi: 21,
  },
  {
    abi: "x86_64",
    prefix: "x86_64-linux-android",
    minApi: 21,
  },
];

/**
 * Compiles native libobv.so libraries across all supported Android ABIs.
 */
async function compileNativeLibraries(outputDir, options = {}) {
  const ndkRoot = findNdkPath();
  if (!ndkRoot) {
    return { ok: false, reason: "NDK not found" };
  }

  const hostTag = process.platform === "win32"
    ? "windows-x86_64"
    : (process.platform === "darwin" ? "darwin-x86_64" : "linux-x86_64");
  const binDir = path.join(ndkRoot, "toolchains", "llvm", "prebuilt", hostTag, "bin");
  if (!fsSync.existsSync(binDir)) {
    return { ok: false, reason: "LLVM bin not found in NDK" };
  }

  const nativeSrcDir = path.resolve(__dirname, "native");
  const cFiles = [
    path.join(nativeSrcDir, "aes.c"),
    path.join(nativeSrcDir, "sha256.c"),
    path.join(nativeSrcDir, "rc_vm.c"),
  ];

  const results = [];
  const cmdExt = process.platform === "win32" ? ".cmd" : "";

  for (const target of TARGET_ABIS) {
    if (options.abis && !options.abis.includes(target.abi)) {
      continue;
    }

    const compilerName = `${target.prefix}${target.minApi}-clang${cmdExt}`;
    const compilerPath = path.join(binDir, compilerName);
    if (!fsSync.existsSync(compilerPath)) {
      continue;
    }

    const abiOutDir = path.join(outputDir, target.abi);
    await fs.mkdir(abiOutDir, { recursive: true });
    const soPath = path.join(abiOutDir, "libobv.so");

    const extraFlags = [];
    if (options.stubPackage || options.stubClass) {
      const pkg = (options.stubPackage || "com.obveil.stub").replace(/_/g, "_1").replace(/\./g, "_");
      const cls = (options.stubClass || "StubApp").replace(/_/g, "_1");
      extraFlags.push(`-DJNI_FUNC_NAME=Java_${pkg}_${cls}_nativeInit`);
    }

    try {
      await runTool(compilerPath, [
        "-shared",
        "-fPIC",
        "-O3",
        "-Wall",
        "-I" + nativeSrcDir,
        ...extraFlags,
        ...cFiles,
        "-landroid",
        "-llog",
        "-o",
        soPath,
      ]);

      if (fsSync.existsSync(soPath)) {
        results.push({
          abi: target.abi,
          path: soPath,
          size: fsSync.statSync(soPath).size,
        });
      }
    } catch (err) {
      console.warn(`[!] NDK build warning for ${target.abi}:`, err.message || err);
    }
  }

  return {
    ok: results.length > 0,
    libraries: results,
  };
}

module.exports = {
  TARGET_ABIS,
  compileNativeLibraries,
};
