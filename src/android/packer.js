"use strict";

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { resolveAndroidTools } = require("./config");
const { runTool } = require("./exec");
const { packAndEncryptDexes, splitPayload } = require("./crypto");
const { findManifestDetails, updateAxmlStrings } = require("./axml");
const { buildObfuscatedStubDex } = require("./stubBuilder");
const { alignApk, signApk, getCertificateSha256 } = require("./signer");
const { compileRcVmBytecode } = require("./rcVmCompiler");
const { compileNativeLibraries } = require("./ndkBuilder");

function resolveJavaJar() {
  if (process.env.JAVA_HOME) {
    const jarPath = path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "jar.exe" : "jar");
    if (fsSync.existsSync(jarPath)) return jarPath;
  }
  return "jar";
}

async function packApk(inputApkPath, outputApkPath, options = {}) {
  const resolvedInput = path.resolve(inputApkPath);
  const resolvedOutput = path.resolve(outputApkPath);

  if (!fsSync.existsSync(resolvedInput)) {
    throw new Error(`Input APK not found: ${resolvedInput}`);
  }

  const stubPackage = options.stubPackage || "com.obveil.stub";
  const stubClass = options.stubClass || ("_0x" + crypto.randomBytes(8).toString("hex"));
  const fullStubName = `${stubPackage}.${stubClass}`;

  const jarCmd = resolveJavaJar();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obveil-apk-"));

  try {
    const contentDir = path.join(tempDir, "content");
    await fs.mkdir(contentDir, { recursive: true });

    // 1. Unpack APK into contentDir
    await runTool(jarCmd, ["-x", "-f", resolvedInput], {
      cwd: contentDir,
      windowsHide: true,
    });

    // 2. Locate all DEX files
    const entries = await fs.readdir(contentDir);
    const dexFileNames = entries
      .filter((name) => /^classes\d*\.dex$/i.test(name))
      .sort((a, b) => {
        const numA = a === "classes.dex" ? 1 : parseInt(a.replace(/\D/g, ""), 10);
        const numB = b === "classes.dex" ? 1 : parseInt(b.replace(/\D/g, ""), 10);
        return numA - numB;
      });

    if (dexFileNames.length === 0) {
      throw new Error("No classes.dex found in the input APK");
    }

    const dexBuffers = [];
    for (const name of dexFileNames) {
      const fullPath = path.join(contentDir, name);
      dexBuffers.push(await fs.readFile(fullPath));
      await fs.unlink(fullPath); // remove original plain DEX
    }

    // 3. Encrypt original DEX files into payload and split into fragments (strictly without .bin)
    const { encrypted, keyHex, ivHex, key, iv } = packAndEncryptDexes(dexBuffers);
    const fragments = splitPayload(encrypted, {
      prefix: options.fragmentPrefix || "data_seg_",
      chunkCount: options.chunkCount,
    });

    const assetsDir = path.join(contentDir, "assets");
    await fs.mkdir(assetsDir, { recursive: true });

    const fragmentNames = [];
    for (const frag of fragments) {
      fragmentNames.push(frag.name);
      await fs.writeFile(path.join(assetsDir, frag.name), frag.data);
    }

    // 4. Inspect and modify AndroidManifest.xml
    const manifestPath = path.join(contentDir, "AndroidManifest.xml");
    let originalAppClass = null;
    let manifestPackage = null;
    if (fsSync.existsSync(manifestPath)) {
      const manifestBuf = await fs.readFile(manifestPath);
      const manifestInfo = findManifestDetails(manifestBuf);
      originalAppClass = manifestInfo.originalAppClass;
      manifestPackage = manifestInfo.packageName;

      if (manifestInfo.appStringIndex !== -1) {
        const updatedManifest = updateAxmlStrings(manifestBuf, manifestInfo.appStringIndex, fullStubName);
        await fs.writeFile(manifestPath, updatedManifest);
      }
    }

    // Derive signing certificate hash for native RC VM signature verification
    let expectedSignatureSha256 = null;
    if (!options.unsigned) {
      try {
        expectedSignatureSha256 = await getCertificateSha256({
          keystore: options.keystore,
          storePass: options.storePass,
          alias: options.alias,
          keyPass: options.keyPass,
        });
      } catch (err) {
        expectedSignatureSha256 = null;
      }
    }

    // 5. Compile RC VM bytecode for native execution
    const vmBytecode = compileRcVmBytecode({
      keyBuffer: key,
      ivBuffer: iv,
      appPackageName: manifestPackage,
      payloadFragments: fragmentNames,
      expectedSignatureSha256,
      antiDebug: Boolean(options.antiDebug),
      checkSignature: Boolean(options.checkSignature),
    });
    await fs.writeFile(path.join(assetsDir, "obv_vm.dat"), vmBytecode);

    // 6. Compile Native libobv.so with Register-based RC VM (if NDK is available)
    const libDir = path.join(contentDir, "lib");
    const ndkResult = await compileNativeLibraries(libDir, {
      abis: options.abis,
      stubPackage,
      stubClass,
    });

    // 7. Generate, obfuscate via Java engine, and compile Stub DEX
    const { dexBuffer: stubDexBuf } = await buildObfuscatedStubDex({
      packageName: stubPackage,
      className: stubClass,
      payloadFragments: fragmentNames,
      keyBuffer: key,
      ivBuffer: iv,
      appPackageName: manifestPackage,
      originalAppClass,
    });

    await fs.writeFile(path.join(contentDir, "classes.dex"), stubDexBuf);

    // 8. Strip existing signature files from META-INF
    const metaInfDir = path.join(contentDir, "META-INF");
    if (fsSync.existsSync(metaInfDir)) {
      const metaFiles = await fs.readdir(metaInfDir);
      for (const mf of metaFiles) {
        if (/\.(SF|RSA|DSA|EC|MF)$/i.test(mf)) {
          await fs.unlink(path.join(metaInfDir, mf)).catch(() => {});
        }
      }
    }

    // 9. Repack ZIP
    const unalignedApk = path.join(tempDir, "unaligned.apk");
    await runTool(jarCmd, ["-c", "-f", unalignedApk, "-M", "-C", contentDir, "."], {
      windowsHide: true,
    });

    // 10. 4-byte Align with zipalign
    const alignedApk = path.join(tempDir, "aligned.apk");
    await alignApk(unalignedApk, alignedApk);

    // 11. Sign with apksigner (unless --unsigned requested)
    if (!options.unsigned) {
      await signApk(alignedApk, {
        keystore: options.keystore,
        storePass: options.storePass,
        alias: options.alias,
        keyPass: options.keyPass,
      });
    }

    // 12. Copy final artifact
    const outDir = path.dirname(resolvedOutput);
    if (!fsSync.existsSync(outDir)) {
      await fs.mkdir(outDir, { recursive: true });
    }
    await fs.copyFile(alignedApk, resolvedOutput);

    return {
      ok: true,
      outputPath: resolvedOutput,
      protectedDexCount: dexBuffers.length,
      stubClass: fullStubName,
      originalAppClass,
      signed: !options.unsigned,
      keyHex,
      ivHex,
      payloadFragments: fragmentNames,
      nativeOk: ndkResult.ok,
      nativeLibraries: ndkResult.libraries || [],
      vmBytecodeSize: vmBytecode.length,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = {
  packApk,
};
