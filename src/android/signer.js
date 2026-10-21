"use strict";

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { resolveAndroidTools } = require("./config");
const { runTool } = require("./exec");

function getDefaultKeystorePath() {
  const home = os.homedir();
  const androidDir = path.join(home, ".android");
  if (!fsSync.existsSync(androidDir)) {
    fsSync.mkdirSync(androidDir, { recursive: true });
  }
  return path.join(androidDir, "obveil_debug.keystore");
}

/**
 * Ensures a valid debug keystore exists, generating one with keytool if necessary.
 */
async function ensureKeystore(customKeystore = null, storePass = "android", alias = "androiddebugkey", keyPass = "android") {
  if (customKeystore && fsSync.existsSync(customKeystore)) {
    return {
      keystore: customKeystore,
      storePass,
      alias,
      keyPass,
    };
  }

  const defaultKs = getDefaultKeystorePath();
  if (!fsSync.existsSync(defaultKs)) {
    const keytool = process.env.JAVA_HOME
      ? path.join(process.env.JAVA_HOME, "bin", "keytool")
      : "keytool";

    await runTool(keytool, [
      "-genkeypair",
      "-v",
      "-keystore", defaultKs,
      "-storepass", storePass,
      "-alias", alias,
      "-keypass", keyPass,
      "-keyalg", "RSA",
      "-keysize", "2048",
      "-validity", "10000",
      "-dname", "CN=ObveilDebug, O=Obveil, C=US",
    ]);
  }

  return {
    keystore: defaultKs,
    storePass,
    alias,
    keyPass,
  };
}

/**
 * Aligns the APK using 4-byte boundaries.
 */
async function alignApk(inputApk, outputApk) {
  const tools = resolveAndroidTools();
  await runTool(tools.zipalign, ["-f", "-p", "4", inputApk, outputApk]);
}

/**
 * Signs the aligned APK with apksigner.
 */
async function signApk(apkPath, keystoreOptions = {}) {
  const tools = resolveAndroidTools();
  const ks = await ensureKeystore(
    keystoreOptions.keystore,
    keystoreOptions.storePass,
    keystoreOptions.alias,
    keystoreOptions.keyPass
  );

  await runTool(tools.apksigner, [
    "sign",
    "--ks", ks.keystore,
    "--ks-pass", `pass:${ks.storePass}`,
    "--ks-key-alias", ks.alias,
    "--key-pass", `pass:${ks.keyPass}`,
    "--v1-signing-enabled", "true",
    "--v2-signing-enabled", "true",
    "--v3-signing-enabled", "true",
    apkPath,
  ]);

  // Verify
  const verifyRes = await runTool(tools.apksigner, ["verify", "--verbose", apkPath]);
  return {
    ok: true,
    details: verifyRes.stdout,
  };
}

/**
 * Extracts raw DER certificate from keystore and computes its SHA-256 hash.
 */
async function getCertificateSha256(keystoreOptions = {}) {
  const ks = await ensureKeystore(
    keystoreOptions.keystore,
    keystoreOptions.storePass,
    keystoreOptions.alias,
    keystoreOptions.keyPass
  );

  const keytool = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "keytool.exe" : "keytool")
    : "keytool";

  const tempDerPath = path.join(os.tmpdir(), `obv_cert_${Date.now()}_${Math.random().toString(36).slice(2)}.der`);
  try {
    await runTool(keytool, [
      "-exportcert",
      "-keystore", ks.keystore,
      "-storepass", ks.storePass,
      "-alias", ks.alias,
      "-file", tempDerPath,
    ]);

    if (fsSync.existsSync(tempDerPath)) {
      const certBytes = await fs.readFile(tempDerPath);
      if (certBytes.length > 0) {
        return crypto.createHash("sha256").update(certBytes).digest();
      }
    }
    return null;
  } catch (err) {
    return null;
  } finally {
    await fs.rm(tempDerPath, { force: true }).catch(() => {});
  }
}

module.exports = {
  ensureKeystore,
  alignApk,
  signApk,
  getCertificateSha256,
};
