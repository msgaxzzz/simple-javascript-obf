"use strict";

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { resolveAndroidTools, sanitizeClassFilesForD8 } = require("../src/android/config");
const { runTool } = require("../src/android/exec");
const { alignApk, signApk } = require("../src/android/signer");
const { packApk } = require("../src/android/packer");

function resolveJava(bin) {
  if (process.env.JAVA_HOME) {
    const ext = process.platform === "win32" ? ".exe" : "";
    const p = path.join(process.env.JAVA_HOME, "bin", bin + ext);
    if (fsSync.existsSync(p)) return p;
  }
  return bin;
}

async function main() {
  console.log("======================================================");
  console.log("       Obveil Android Test APK Generator");
  console.log("======================================================");

  const tools = resolveAndroidTools();
  console.log("[*] Using Android SDK at:", tools.sdk);
  console.log("[*] Build tools:", tools.buildToolsDir);

  const outDir = path.resolve(__dirname, "../dist");
  await fs.mkdir(outDir, { recursive: true });

  const originalApkPath = path.join(outDir, "test-app-original.apk");
  const protectedApkPath = path.join(outDir, "test-app-protected.apk");

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "obveil-gen-apk-"));

  try {
    const srcDir = path.join(tmpDir, "src", "com", "obveil", "demo");
    await fs.mkdir(srcDir, { recursive: true });

    // 1. AndroidManifest.xml
    const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.obveil.demo"
    android:versionCode="123"
    android:versionName="1.2.3-A">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:name=".MyApplication"
        android:label="ObveilDemo"
        android:hasCode="true">
        <activity
            android:name=".MainActivity"
            android:label="Obveil Demo Activity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
    const manifestPath = path.join(tmpDir, "AndroidManifest.xml");
    await fs.writeFile(manifestPath, manifestContent, "utf8");

    // 2. Application & Activity Java code with business logic
    const myAppJava = `package com.obveil.demo;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import java.security.MessageDigest;

public class MyApplication extends Application {
    private static final String TAG = "ObveilDemo";

    // 存储一堆 SK (Secret Keys)
    private static final String[] SECRET_KEYS = new String[] {
        "sk-live-obveil-99887766554433221100",
        "sk-auth-prod-4a8b9c0d1e2f3a4b5c6d7e8f",
        "sk-agent-gw-8f7e6d5c4b3a2100ffeeddcc",
        "sk-enc-vault-112233445566778899aabbcc",
        "sk-deepseek-ai-aabbccddee001122334455",
        "sk-pay-stripe-live-0987654321fedcba",
        "sk-backup-s3-99aa88bb77cc66dd55ee"
    };

    static class AuthEngine {
        int seedMask;
        AuthEngine(int mask) { this.seedMask = mask; }
        int compute(int seed) {
            int token = (seed * 31) ^ seedMask;
            return token;
        }
    }

    public static int calcAuthToken(int seed) {
        AuthEngine engine = new AuthEngine(0x5a5a);
        return engine.compute(seed);
    }

    public static String computeSha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(b & 0xff);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (Throwable t) {
            return "";
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        int auth = calcAuthToken(1234);

        // 存储一堆 SK 到 SharedPreferences 持久化
        SharedPreferences sp = getSharedPreferences("secure_sk_vault", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sp.edit();
        editor.putInt("sk_count", SECRET_KEYS.length);
        for (int i = 0; i < SECRET_KEYS.length; i++) {
            editor.putString("sk_slot_" + i, SECRET_KEYS[i]);
            editor.putString("sk_hash_" + i, computeSha256(SECRET_KEYS[i]));
        }
        editor.apply();

        Log.i(TAG, "MyApplication initialized! Auth token=" + auth + ", Stored " + SECRET_KEYS.length + " secret keys into SharedPreferences vault.");
    }
}
`;

    const mainActivityJava = `package com.obveil.demo;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.widget.TextView;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final String TAG = "ObveilDemo";

    static class SecurityPayload {
        int salt;
        SecurityPayload(int s) { this.salt = s; }
        int calcLicense(int seed, int rounds) {
            int acc = seed;
            int i = 0;
            while (i < rounds) {
                acc = (acc * 31) + (i ^ salt);
                i = i + 1;
            }
            return acc;
        }
        int verifySecurity(int a, int b) {
            int diff = b - 20;
            return (a + 100) * diff;
        }
    }

    public static int calcLicenseChecksum(int seed, int rounds) {
        SecurityPayload sp = new SecurityPayload(0x5a);
        return sp.calcLicense(seed, rounds);
    }

    public static int verifySecurityPayload(int a, int b) {
        SecurityPayload sp = new SecurityPayload(0x5a);
        return sp.verifySecurity(a, b);
    }

    public static String computeSha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(b & 0xff);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (Throwable t) {
            return "";
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. 检查版本号是多少 (Check App Version)
        String versionName = "Unknown";
        int versionCode = -1;
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            versionName = pInfo.versionName;
            versionCode = pInfo.versionCode;
        } catch (Throwable t) {
            Log.e(TAG, "Failed to retrieve package version info", t);
        }

        // 2. 读取并校验存储的一堆 SK (Validate Stored SKs)
        SharedPreferences sp = getSharedPreferences("secure_sk_vault", Context.MODE_PRIVATE);
        int skCount = sp.getInt("sk_count", 0);
        List<String> skList = new ArrayList<String>();
        boolean allSksValid = (skCount > 0);

        for (int i = 0; i < skCount; i++) {
            String sk = sp.getString("sk_slot_" + i, "");
            String expectedHash = sp.getString("sk_hash_" + i, "");
            skList.add(sk);

            // 校验逻辑：检查前缀、非空、以及 SHA-256 完整性哈希是否匹配
            boolean prefixOk = (sk != null && sk.startsWith("sk-"));
            String calcHash = computeSha256(sk != null ? sk : "");
            boolean hashOk = calcHash.length() > 0 && calcHash.equalsIgnoreCase(expectedHash);

            if (!prefixOk || !hashOk) {
                allSksValid = false;
            }
            String masked = (sk != null && sk.length() > 14) ? (sk.substring(0, 10) + "..." + sk.substring(sk.length() - 4)) : "invalid";
            Log.i(TAG, "  [SK #" + i + "] " + masked + " -> PrefixOK: " + prefixOk + ", HashMatch: " + hashOk);
        }

        // 3. RC VM 逻辑校验
        int license = calcLicenseChecksum(7, 10);
        int sec = verifySecurityPayload(50, 25);
        boolean licenseOk = (license == 1738907788);
        boolean secOk = (sec == 750);
        boolean overallSuccess = allSksValid && licenseOk && secOk;

        Log.i(TAG, "==========================================================");
        Log.i(TAG, ">>> [VERSION] App Version: " + versionName + " (versionCode: " + versionCode + ") <<<");
        Log.i(TAG, ">>> [SK VERIFICATION] Stored Keys: " + skCount + ", All Keys Valid: " + allSksValid + " <<<");
        Log.i(TAG, ">>> [VM VERIFICATION] License=" + license + " (" + (licenseOk ? "OK" : "FAIL") + "), Sec=" + sec + " (" + (secOk ? "OK" : "FAIL") + ") <<<");
        Log.i(TAG, ">>> [FINAL STATUS] " + (overallSuccess ? "ALL CHECKS PASSED (VERIFICATION CORRECT)" : "VERIFICATION FAILED") + " <<<");
        Log.i(TAG, "==========================================================");

        // 4. UI 界面展示
        StringBuilder sb = new StringBuilder();
        sb.append("=== Obveil Hardened App Verification ===\\n\\n");
        sb.append("[1] Version Info (版本号):\\n");
        sb.append("    * versionName: ").append(versionName).append("\\n");
        sb.append("    * versionCode: ").append(versionCode).append("\\n\\n");

        sb.append("[2] Stored Secret Keys (存储的一堆 SK):\\n");
        sb.append("    * Total SK Count: ").append(skCount).append("\\n");
        for (int i = 0; i < skList.size(); i++) {
            String sk = skList.get(i);
            String masked = (sk != null && sk.length() > 14) ? (sk.substring(0, 10) + "..." + sk.substring(sk.length() - 4)) : "invalid";
            sb.append("    * Slot #").append(i).append(": ").append(masked).append(" [Verified OK]\\n");
        }

        sb.append("\\n[3] Verification Checks (校验逻辑):\\n");
        sb.append("    * SK Format & SHA-256 Hash: ").append(allSksValid ? "PASS (Correct)" : "FAIL").append("\\n");
        sb.append("    * Java RC VM License Math:  ").append(license).append(licenseOk ? " [PASS]" : " [FAIL]").append("\\n");
        sb.append("    * Java RC VM Security Math: ").append(sec).append(secOk ? " [PASS]" : " [FAIL]").append("\\n\\n");

        sb.append(">>> Status: ").append(overallSuccess ? "100% VERIFIED CORRECT" : "VERIFICATION FAILED").append(" <<<");

        TextView tv = new TextView(this);
        tv.setText(sb.toString());
        tv.setPadding(36, 50, 36, 50);
        tv.setTextSize(14f);
        tv.setLineSpacing(6f, 1f);
        setContentView(tv);
    }
}
`;

    console.log("[*] Pre-virtualizing business Java sources with Register-Context RC VM, CFF, Class Obf & Type Obf...");
    const { obfuscateJava } = require("../src/java");
    const obfMyApp = await obfuscateJava(myAppJava, {
      javaVm: true,
      javaWrap: true,
      javaCff: true,
      javaNumbers: true,
      javaDead: true,
      javaClasses: true,
      javaTypes: true,
      rename: true,
      renameMembers: true,
      javaOptions: { classpath: tools.androidJar },
    });
    const obfMainActivity = await obfuscateJava(mainActivityJava, {
      javaVm: true,
      javaWrap: true,
      javaCff: true,
      javaNumbers: true,
      javaDead: true,
      javaClasses: true,
      javaTypes: true,
      rename: true,
      renameMembers: true,
      javaOptions: { classpath: tools.androidJar },
    });

    await fs.writeFile(path.join(srcDir, "MyApplication.java"), obfMyApp.code, "utf8");
    await fs.writeFile(path.join(srcDir, "MainActivity.java"), obfMainActivity.code, "utf8");

    // 3. Compile Java to .class
    console.log("[*] Compiling Java sources with javac...");
    const classesDir = path.join(tmpDir, "classes");
    await fs.mkdir(classesDir, { recursive: true });

    const javac = resolveJava("javac");
    await runTool(javac, [
      "-encoding", "UTF-8",
      "-source", "8",
      "-target", "8",
      "-cp", tools.androidJar,
      "-d", classesDir,
      path.join(srcDir, "MyApplication.java"),
      path.join(srcDir, "MainActivity.java"),
    ]);

    // 4. Compile .class to DEX with d8
    console.log("[*] Compiling DEX with d8...");
    const dexDir = path.join(tmpDir, "dex");
    await fs.mkdir(dexDir, { recursive: true });

    const classFiles = [];
    async function collectAllClasses(d) {
      for (const ent of await fs.readdir(d, { withFileTypes: true })) {
        const fp = path.join(d, ent.name);
        if (ent.isDirectory()) await collectAllClasses(fp);
        else if (ent.name.endsWith(".class")) classFiles.push(fp);
      }
    }
    await collectAllClasses(classesDir);
    sanitizeClassFilesForD8(classFiles);

    await runTool(tools.d8, [
      "--lib", tools.androidJar,
      "--output", dexDir,
      "--min-api", "21",
      ...classFiles,
    ]);

    // 5. Build base APK container with aapt
    console.log("[*] Packaging Android resources with aapt...");
    const aapt = path.join(tools.buildToolsDir, process.platform === "win32" ? "aapt.exe" : "aapt");
    const baseApk = path.join(tmpDir, "base.apk");
    await runTool(aapt, [
      "package",
      "-F", baseApk,
      "-M", manifestPath,
      "-I", tools.androidJar,
    ]);

    // 6. Assemble unaligned APK
    const apkContentDir = path.join(tmpDir, "apk_content");
    await fs.mkdir(apkContentDir, { recursive: true });

    const jar = resolveJava("jar");
    await runTool(jar, ["-x", "-f", baseApk], { cwd: apkContentDir });
    await fs.copyFile(path.join(dexDir, "classes.dex"), path.join(apkContentDir, "classes.dex"));

    const unalignedOriginal = path.join(tmpDir, "unaligned-original.apk");
    await runTool(jar, ["-c", "-f", unalignedOriginal, "-M", "-C", apkContentDir, "."]);

    // 7. Align and sign original APK
    console.log("[*] Aligning and signing original APK...");
    const alignedOriginal = path.join(tmpDir, "aligned-original.apk");
    await alignApk(unalignedOriginal, alignedOriginal);
    await signApk(alignedOriginal);
    await fs.copyFile(alignedOriginal, originalApkPath);
    console.log("[+] Original APK generated:", originalApkPath);

    // 8. Pack & Protect APK using obveil
    console.log("[*] Hardening APK with obveil packApk (self-obfuscated Stub DEX + AES-256 encrypted payload)...");
    const packRes = await packApk(originalApkPath, protectedApkPath, {
      stubPackage: "com.obveil.stub",
    });

    console.log("[+] Protected APK generated:", protectedApkPath);
    console.log("    - Original Application:", packRes.originalAppClass);
    console.log("    - Injected Obfuscated Stub:", packRes.stubClass);
    console.log("    - DEX count protected:", packRes.protectedDexCount);
    console.log("    - Signed with v1/v2/v3 schemes:", packRes.signed);

    // 9. Inspect stats
    const origStat = await fs.stat(originalApkPath);
    const protStat = await fs.stat(protectedApkPath);

    const origHash = crypto.createHash("sha256").update(await fs.readFile(originalApkPath)).digest("hex");
    const protHash = crypto.createHash("sha256").update(await fs.readFile(protectedApkPath)).digest("hex");

    console.log("\n======================================================");
    console.log("                 Summary & Artifacts");
    console.log("======================================================");
    console.log("1. Original APK:");
    console.log("   Path:   ", originalApkPath);
    console.log("   Size:   ", origStat.size, "bytes");
    console.log("   SHA256: ", origHash);
    console.log("2. Protected APK (Obveil Shell + Obfuscated Stub):");
    console.log("   Path:   ", protectedApkPath);
    console.log("   Size:   ", protStat.size, "bytes");
    console.log("   SHA256: ", protHash);
    console.log("3. Application Verification & Metadata:");
    console.log("   - Version Name:       1.2.3-A");
    console.log("   - Version Code:       123");
    console.log("   - Package Name:       com.obveil.demo");
    console.log("   - Stored Secret Keys: 7 SK slots (sk-live-..., sk-auth-..., sk-agent-..., sk-enc-..., etc.)");
    console.log("   - Verification Logic: SharedPreferences storage + SHA-256 integrity check + Dual RC VM");
    console.log("   - Stub Obfuscation:   Hex Application Class + CFF + VM + ClassWrapper + Renamer + MBA");
    console.log("======================================================\n");

  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error("Failed to generate test APK:", err);
  process.exit(1);
});
