"use strict";

const fs = require("node:fs");
const path = require("node:path");

function findSdkPath() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    "D:\\Android\\android-sdk",
    "C:\\Android\\android-sdk",
    path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk"),
  ].filter(Boolean);

  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.existsSync(path.join(cand, "build-tools"))) {
      return cand;
    }
  }
  return null;
}

function resolveAndroidTools() {
  const sdk = findSdkPath();
  if (!sdk) {
    throw new Error("Android SDK not found. Please set ANDROID_HOME or install Android build-tools.");
  }

  const buildToolsDir = path.join(sdk, "build-tools");
  const versions = fs.readdirSync(buildToolsDir).sort().reverse();
  if (versions.length === 0) {
    throw new Error("No build-tools versions found in " + buildToolsDir);
  }
  const latestBuildTools = path.join(buildToolsDir, versions[0]);

  const ext = process.platform === "win32" ? ".exe" : "";
  const batExt = process.platform === "win32" ? ".bat" : "";

  const zipalign = path.join(latestBuildTools, `zipalign${ext}`);
  const apksigner = path.join(latestBuildTools, `apksigner${batExt}`);
  const d8 = path.join(latestBuildTools, `d8${batExt}`);

  const platformsDir = path.join(sdk, "platforms");
  let androidJar = null;
  if (fs.existsSync(platformsDir)) {
    const platforms = fs.readdirSync(platformsDir).sort().reverse();
    for (const p of platforms) {
      const jarPath = path.join(platformsDir, p, "android.jar");
      if (fs.existsSync(jarPath)) {
        androidJar = jarPath;
        break;
      }
    }
  }

  if (!androidJar) {
    throw new Error("android.jar not found in " + platformsDir);
  }

  return {
    sdk,
    buildToolsDir: latestBuildTools,
    zipalign,
    apksigner,
    d8,
    androidJar,
  };
}

function findNdkPath() {
  const sdk = findSdkPath();
  const candidates = [
    process.env.ANDROID_NDK_HOME,
    process.env.NDK_HOME,
    sdk ? path.join(sdk, "ndk") : null,
    sdk ? path.join(sdk, "ndk-bundle") : null,
  ].filter(Boolean);

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      const llvmBinDirect = path.join(
        cand,
        "toolchains",
        "llvm",
        "prebuilt",
        process.platform === "win32" ? "windows-x86_64" : "linux-x86_64",
        "bin"
      );
      if (fs.existsSync(llvmBinDirect)) {
        return cand;
      }

      const subdirs = fs.readdirSync(cand).sort().reverse();
      for (const sub of subdirs) {
        const subPath = path.join(cand, sub);
        try {
          if (fs.statSync(subPath).isDirectory()) {
            const subLlvm = path.join(
              subPath,
              "toolchains",
              "llvm",
              "prebuilt",
              process.platform === "win32" ? "windows-x86_64" : "linux-x86_64",
              "bin"
            );
            if (fs.existsSync(subLlvm)) {
              return subPath;
            }
          }
        } catch (_) {}
      }
    }
  }
  return null;
}

function sanitizeClassFilesForD8(classFiles) {
  const target = Buffer.from("MethodParameters");
  const replace = Buffer.from("MethodParamDummy");
  for (const file of classFiles) {
    try {
      const buf = fs.readFileSync(file);
      let idx = 0;
      let modified = false;
      while ((idx = buf.indexOf(target, idx)) !== -1) {
        replace.copy(buf, idx);
        modified = true;
        idx += target.length;
      }
      if (modified) {
        fs.writeFileSync(file, buf);
      }
    } catch (_) {}
  }
}

module.exports = {
  findSdkPath,
  findNdkPath,
  resolveAndroidTools,
  sanitizeClassFilesForD8,
};
