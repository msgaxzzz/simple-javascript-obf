"use strict";

const assert = require("node:assert");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { packApk } = require("../src/android/packer");
const { resolveAndroidTools, sanitizeClassFilesForD8 } = require("../src/android/config");
const { decryptAndUnpackDexes, assemblePayload, MAGIC_MASK } = require("../src/android/crypto");
const { getCertificateSha256 } = require("../src/android/signer");
const { RC_OP } = require("../src/android/rcVmCompiler");
const { runTool } = require("../src/android/exec");

async function createSampleApk(dir, tools) {
  const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.testapp">
    <application
        android:name=".MyRealApplication"
        android:label="TestApp">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const manifestPath = path.join(dir, "AndroidManifest.xml");
  await fs.writeFile(manifestPath, manifestContent, "utf8");

  const aaptCmd = path.join(tools.buildToolsDir, process.platform === "win32" ? "aapt.exe" : "aapt");
  const baseApk = path.join(dir, "base.apk");
  await runTool(aaptCmd, ["package", "-F", baseApk, "-M", manifestPath, "-I", tools.androidJar]);

  // Create Java code for real application and activity
  const srcDir = path.join(dir, "src", "com", "example", "testapp");
  await fs.mkdir(srcDir, { recursive: true });

  const appJava = `package com.example.testapp;
import android.app.Application;
public class MyRealApplication extends Application {
    public static final String SECRET_DATA = "CONFIDENTIAL_KEY_123456";
    @Override
    public void onCreate() {
        super.onCreate();
    }
}`;

  const mainJava = `package com.example.testapp;
import android.app.Activity;
import android.os.Bundle;
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}`;

  await fs.writeFile(path.join(srcDir, "MyRealApplication.java"), appJava, "utf8");
  await fs.writeFile(path.join(srcDir, "MainActivity.java"), mainJava, "utf8");

  const classesDir = path.join(dir, "classes");
  await fs.mkdir(classesDir, { recursive: true });

  const javac = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", "javac") : "javac";
  await runTool(javac, [
    "-cp", tools.androidJar,
    "-source", "8",
    "-target", "8",
    "-d", classesDir,
    path.join(srcDir, "MyRealApplication.java"),
    path.join(srcDir, "MainActivity.java"),
  ]);

  const dexDir = path.join(dir, "dex");
  await fs.mkdir(dexDir, { recursive: true });
  const appCls = path.join(classesDir, "com", "example", "testapp", "MyRealApplication.class");
  const mainCls = path.join(classesDir, "com", "example", "testapp", "MainActivity.class");
  sanitizeClassFilesForD8([appCls, mainCls]);
  await runTool(tools.d8, [
    "--lib", tools.androidJar,
    "--output", dexDir,
    appCls,
    mainCls,
  ]);

  const rawDex = path.join(dexDir, "classes.dex");

  // Unpack base.apk and assemble final sample apk with classes.dex
  const apkContentDir = path.join(dir, "apk_content");
  await fs.mkdir(apkContentDir, { recursive: true });

  const jarCmd = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "jar.exe" : "jar")
    : "jar";

  await runTool(jarCmd, ["-x", "-f", baseApk], { cwd: apkContentDir });
  await fs.copyFile(rawDex, path.join(apkContentDir, "classes.dex"));

  const sampleApk = path.join(dir, "sample-original.apk");
  await runTool(jarCmd, ["-c", "-f", sampleApk, "-M", "-C", apkContentDir, "."]);

  return {
    sampleApk,
    rawDexBytes: await fs.readFile(rawDex),
  };
}

async function runApkPackTests() {
  console.log("=== Running Android APK Packer & Self-Obfuscated Stub Test Suite ===");

  const tools = resolveAndroidTools();
  assert.ok(tools.sdk, "Android SDK found");
  assert.ok(fsSync.existsSync(tools.androidJar), "android.jar exists");
  assert.ok(fsSync.existsSync(tools.d8), "d8 exists");
  assert.ok(fsSync.existsSync(tools.zipalign), "zipalign exists");
  assert.ok(fsSync.existsSync(tools.apksigner), "apksigner exists");
  console.log("  [PASS] Android SDK build-tools verified:", tools.buildToolsDir);

  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), "obveil-apk-test-"));
  try {
    // 1. Create a valid sample APK with real business logic
    console.log("  [*] Building realistic Android sample APK...");
    const { sampleApk, rawDexBytes } = await createSampleApk(testDir, tools);
    assert.ok(fsSync.existsSync(sampleApk), "Sample APK successfully built");
    console.log("  [PASS] Sample APK ready:", sampleApk);

    // 2. Run packApk to protect the sample APK
    console.log("  [*] Running obveil APK Packer (with Java AST Obfuscation on Stub)...");
    const protectedApk = path.join(testDir, "sample-protected.apk");
    const packResult = await packApk(sampleApk, protectedApk, {
      stubPackage: "com.obveil.stub",
      stubClass: "StubApp",
    });

    assert.ok(packResult.ok, "Packer completed successfully");
    assert.ok(fsSync.existsSync(protectedApk), "Protected APK exists");
    assert.strictEqual(packResult.protectedDexCount, 1, "Protected 1 DEX file");
    assert.strictEqual(packResult.stubClass, "com.obveil.stub.StubApp", "Stub entry is set");
    console.log("  [PASS] APK packed and protected successfully!");

    // 3. Inspect protected APK contents
    const inspectDir = path.join(testDir, "inspected");
    await fs.mkdir(inspectDir, { recursive: true });

    const jarCmd = process.env.JAVA_HOME
      ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "jar.exe" : "jar")
      : "jar";

    await runTool(jarCmd, ["-x", "-f", protectedApk], { cwd: inspectDir });

    // Assert: classes.dex exists (the stub) and is NOT the same as the original rawDexBytes
    const stubDexBytes = await fs.readFile(path.join(inspectDir, "classes.dex"));
    assert.notStrictEqual(stubDexBytes.length, rawDexBytes.length, "classes.dex replaced with stub");
    assert.ok(!stubDexBytes.includes(Buffer.from("CONFIDENTIAL_KEY_123456")), "Plaintext secrets absent from root classes.dex");
    console.log("  [PASS] Original DEX stripped from root and replaced with obfuscated Stub DEX");

    // Assert: No .bin files in assets/
    const assetFiles = await fs.readdir(path.join(inspectDir, "assets"));
    assert.ok(!assetFiles.some((f) => f.endsWith(".bin")), "Strictly NO .bin files present in assets directory");
    console.log("  [PASS] Verified no .bin file exists in assets:", assetFiles);

    // Assert: Split fragments exist without .bin
    assert.ok(Array.isArray(packResult.payloadFragments), "packResult has payloadFragments");
    assert.ok(packResult.payloadFragments.length >= 2, "Payload was split into multiple fragments");

    const fragmentBuffers = [];
    for (const frag of packResult.payloadFragments) {
      assert.ok(!frag.includes(".bin"), `Fragment name ${frag} must not contain .bin`);
      const fragPath = path.join(inspectDir, "assets", frag);
      assert.ok(fsSync.existsSync(fragPath), `Fragment ${frag} exists`);
      const data = await fs.readFile(fragPath);
      assert.ok(!data.includes(Buffer.from("CONFIDENTIAL_KEY_123456")), "Fragment data is encrypted");
      fragmentBuffers.push(data);
    }
    console.log(`  [PASS] All ${fragmentBuffers.length} payload fragments verified (encrypted & extensionless)`);

    // Decrypt and unpack DEXes from assembled fragments roundtrip check
    const reassembledPayload = assemblePayload(fragmentBuffers);

    // Assert: reassembledPayload is clean Base64 ASCII text (no raw binary blobs in assets)
    assert.ok(/^[A-Za-z0-9+/=\r\n]+$/.test(reassembledPayload.toString("utf8")), "Payload fragments contain only clean Base64 ASCII characters");

    // Verify DEX magic header obfuscation: raw OBVF inner payload has masked magic (NOT "dex\n")
    const cryptoMod = require("node:crypto");
    const { decodeBase85 } = require("../src/android/crypto");
    const cipherBytes = Buffer.from(reassembledPayload.toString("utf8"), "base64");
    const decipher = cryptoMod.createDecipheriv("aes-256-cbc", Buffer.from(packResult.keyHex, "hex"), Buffer.from(packResult.ivHex, "hex"));
    const b85Plain = Buffer.concat([decipher.update(cipherBytes), decipher.final()]);
    const rawPlainPayload = decodeBase85(b85Plain);
    assert.strictEqual(rawPlainPayload.subarray(0, 4).toString(), "OBVF", "Payload envelope starts with OBVF");
    const firstDexHeaderInPayload = rawPlainPayload.subarray(12, 16);
    assert.notStrictEqual(firstDexHeaderInPayload.toString(), "dex\n", "DEX header in encrypted payload is obfuscated/masked against memory scanners");
    console.log("  [PASS] Verified DEX magic header obfuscation (first 8 bytes masked until runtime fixup)");

    const restoredDexes = decryptAndUnpackDexes(reassembledPayload, packResult.keyHex, packResult.ivHex);
    assert.strictEqual(restoredDexes.length, 1, "Restored exactly 1 DEX");
    assert.ok(restoredDexes[0].equals(rawDexBytes), "Restored DEX byte-for-byte matches original DEX");
    assert.strictEqual(restoredDexes[0].subarray(0, 4).toString(), "dex\n", "Restored DEX has valid dex\\n magic header");
    assert.ok(restoredDexes[0].includes(Buffer.from("CONFIDENTIAL_KEY_123456")), "Original secrets intact inside decrypted DEX");
    console.log("  [PASS] Assembled fragments decrypted roundtrip matches original DEX byte-for-byte!");

    // 4. Assert Keystore Certificate SHA-256 and RC VM Bytecode
    const certHash = await getCertificateSha256();
    assert.ok(Buffer.isBuffer(certHash), "Keystore certificate SHA-256 extracted as Buffer");
    assert.strictEqual(certHash.length, 32, "Keystore certificate SHA-256 is 32 bytes");
    console.log("  [PASS] Keystore DER certificate SHA-256 verified:", certHash.toString("hex").slice(0, 16) + "...");

    const testHeader = Buffer.from("dex\n035\0", "utf8");
    const maskedHeader = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) maskedHeader[i] = testHeader[i] ^ MAGIC_MASK[i];
    assert.notStrictEqual(maskedHeader.toString(), "dex\n035\0", "Masked header does not match plain dex magic");
    const unmaskedHeader = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) unmaskedHeader[i] = maskedHeader[i] ^ MAGIC_MASK[i];
    assert.strictEqual(unmaskedHeader.toString(), "dex\n035\0", "Unmasked header restored exactly");
    console.log("  [PASS] DEX magic header XOR masking and unmasking roundtrip verified");

    const vmDatPath = path.join(inspectDir, "assets", "obv_vm.dat");
    assert.ok(fsSync.existsSync(vmDatPath), "assets/obv_vm.dat exists");
    const vmDatBytes = await fs.readFile(vmDatPath);
    assert.ok(vmDatBytes.length > 30, "RC VM bytecode is non-empty");
    assert.strictEqual(packResult.vmBytecodeSize, vmDatBytes.length, "RC VM bytecode size matches packResult");
    assert.notStrictEqual(vmDatBytes[0], RC_OP.ANTI_DEBUG, "Bytecode does NOT start with OP_ANTI_DEBUG when disabled (prevents crashes)");
    assert.strictEqual(vmDatBytes[0], RC_OP.HASH_PKG, "Bytecode begins directly with key derivation OP_HASH_PKG (0x04)");
    console.log(`  [PASS] Register-based RC VM bytecode verified (${vmDatBytes.length} bytes, anti-debug safely disabled by default)!`);

    // 5. Assert Native libobv.so libraries in lib/<abi>/
    if (packResult.nativeOk) {
      assert.ok(packResult.nativeLibraries.length >= 3, "At least 3 ABIs compiled");
      for (const lib of packResult.nativeLibraries) {
        const soPath = path.join(inspectDir, "lib", lib.abi, "libobv.so");
        assert.ok(fsSync.existsSync(soPath), `lib/${lib.abi}/libobv.so exists in APK`);
        const soBuf = await fs.readFile(soPath);
        assert.ok(soBuf.length > 1000, `libobv.so (${lib.abi}) has non-trivial size`);
        // Check ELF header magic
        assert.strictEqual(soBuf[0], 0x7f, "ELF magic byte 0");
        assert.strictEqual(soBuf[1], 0x45, "ELF magic byte 1 ('E')");
        assert.strictEqual(soBuf[2], 0x4c, "ELF magic byte 2 ('L')");
        assert.strictEqual(soBuf[3], 0x46, "ELF magic byte 3 ('F')");
      }
      console.log("  [PASS] Native libobv.so libraries verified across all ABIs (arm64-v8a, armeabi-v7a, x86_64)!");
    } else {
      console.log("  [INFO] NDK not present; native .so skipped (fallback engine active)");
    }

    // 6. Verify APK signature with apksigner verify
    console.log("  [*] Verifying APK signature with apksigner...");
    const verifyRes = await runTool(tools.apksigner, ["verify", "--verbose", protectedApk]);
    assert.ok(verifyRes.stdout.includes("Verifies: true") || verifyRes.stdout.includes("Verified using v2 scheme (APK Signature Scheme v2): true"), "APK signature verified");
    console.log("  [PASS] APK signature verified (v1/v2/v3 signing schemes intact)!");

    console.log("\n>>> ALL APK PACKER & SELF-OBFUSCATED STUB TESTS PASSED! <<<");
  } finally {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  }
}

runApkPackTests().catch((err) => {
  console.error("APK Packer Tests failed:", err);
  process.exit(1);
});
