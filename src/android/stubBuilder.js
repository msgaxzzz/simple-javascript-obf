"use strict";

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { obfuscateJava } = require("../java");
const { resolveAndroidTools, sanitizeClassFilesForD8 } = require("./config");
const { runTool } = require("./exec");

/**
 * Dynamically derives masked key/iv data and package binding to avoid static plaintext constants.
 */
function generateMaskedKeyJava(keyBuffer, ivBuffer, appPackageName) {
  const key = Buffer.isBuffer(keyBuffer)
    ? keyBuffer
    : Buffer.from(keyBuffer || "00".repeat(32), "hex");
  const iv = Buffer.isBuffer(ivBuffer)
    ? ivBuffer
    : Buffer.from(ivBuffer || "00".repeat(16), "hex");

  const salt = crypto.randomBytes(16);
  const h = crypto.createHash("sha256");
  if (appPackageName) {
    h.update(appPackageName);
  }
  h.update(salt);
  const digest = h.digest();

  const keyMask = crypto.randomBytes(32);
  const maskedKey = [];
  for (let i = 0; i < 32; i++) {
    maskedKey.push(key[i] ^ digest[i] ^ keyMask[i]);
  }

  const ivMask = crypto.randomBytes(16);
  const maskedIv = [];
  for (let i = 0; i < 16; i++) {
    maskedIv.push(iv[i] ^ digest[i % digest.length] ^ ivMask[i]);
  }

  return {
    saltArray: Array.from(salt),
    keyMaskArray: Array.from(keyMask),
    maskedKeyArray: maskedKey,
    ivMaskArray: Array.from(ivMask),
    maskedIvArray: maskedIv,
    hasPackageBinding: !!appPackageName,
  };
}

/**
 * Builds the raw StubApp.java source code.
 */
function generateStubSource(options) {
  const {
    packageName = "com.obveil.stub",
    className = "StubApp",
    payloadFragments = null,
    payloadPath = null,
    keyBuffer = null,
    ivBuffer = null,
    keyHex = null,
    ivHex = null,
    appPackageName = null,
    originalAppClass = null,
  } = options;

  const fragments = Array.isArray(payloadFragments) && payloadFragments.length > 0
    ? payloadFragments
    : [payloadPath || "data_seg_00"];

  const resolvedKey = keyBuffer || (keyHex ? Buffer.from(keyHex, "hex") : crypto.randomBytes(32));
  const resolvedIv = ivBuffer || (ivHex ? Buffer.from(ivHex, "hex") : crypto.randomBytes(16));
  const masked = generateMaskedKeyJava(resolvedKey, resolvedIv, appPackageName);

  return `package ${packageName};

import android.app.Application;
import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Configuration;
import android.util.Base64;
import android.util.Log;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.RandomAccessFile;
import java.lang.reflect.Array;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import dalvik.system.DexClassLoader;

public class ${className} extends Application {
    private static final String TAG = "AppStub";
    private static final int[] MAGIC_MASK = new int[] { 0x5F, 0x2A, 0x4B, 0x7E, 0x33, 0x19, 0x8D, 0x6C };
    private static final String B85_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#";
    private static final List<File> sExtractedFiles = new ArrayList<File>();
    private Application realApplication = null;

    private static native byte[][] nativeInit(Context ctx, byte[] bytecode);

    private static byte[] decodeBase85(byte[] b85Bytes) {
        byte[] result = null;
        try {
            if (b85Bytes == null || b85Bytes.length < 5) return null;
            int[] map = new int[256];
            Arrays.fill(map, -1);
            for (int i = 0; i < B85_ALPHABET.length(); i++) {
                map[B85_ALPHABET.charAt(i)] = i;
            }
            int blocks = b85Bytes.length / 5;
            byte[] raw = new byte[blocks * 4];
            int outIdx = 0;
            for (int i = 0; i < blocks; i++) {
                int off = i * 5;
                int c0 = b85Bytes[off] & 0xFF;
                int c1 = b85Bytes[off + 1] & 0xFF;
                int c2 = b85Bytes[off + 2] & 0xFF;
                int c3 = b85Bytes[off + 3] & 0xFF;
                int c4 = b85Bytes[off + 4] & 0xFF;

                int d0 = (c0 < 256 && map[c0] >= 0) ? map[c0] : 0;
                int d1 = (c1 < 256 && map[c1] >= 0) ? map[c1] : 0;
                int d2 = (c2 < 256 && map[c2] >= 0) ? map[c2] : 0;
                int d3 = (c3 < 256 && map[c3] >= 0) ? map[c3] : 0;
                int d4 = (c4 < 256 && map[c4] >= 0) ? map[c4] : 0;

                long v0 = d0 * 85L;
                long v1 = (v0 + d1) * 85L;
                long v2 = (v1 + d2) * 85L;
                long v3 = (v2 + d3) * 85L;
                long val = v3 + d4;

                raw[outIdx] = (byte) ((val >> 24) & 0xFF);
                raw[outIdx + 1] = (byte) ((val >> 16) & 0xFF);
                raw[outIdx + 2] = (byte) ((val >> 8) & 0xFF);
                raw[outIdx + 3] = (byte) (val & 0xFF);
                outIdx += 4;
            }
            if (raw.length >= 4) {
                int origLen = ((raw[0] & 0xFF) << 24) | ((raw[1] & 0xFF) << 16) | ((raw[2] & 0xFF) << 8) | (raw[3] & 0xFF);
                if (origLen >= 0 && origLen <= raw.length - 4) {
                    result = new byte[origLen];
                    System.arraycopy(raw, 4, result, 0, origLen);
                }
            }
            Arrays.fill(raw, (byte) 0);
        } catch (Throwable ignored) {
            result = null;
        }
        return result;
    }

    private static String getRealAppName() {
        return "${originalAppClass || ""}";
    }

    private static String[] getPayloadFragments() {
        return new String[] {
            ${fragments.map((f) => `"${f}"`).join(", ")}
        };
    }

    // ==========================================
    // Register-based RC VM (VMP) Virtualized Core Routines in DEX
    // ==========================================
    private static int vmCalculateHeaderMask(int raw, int mask) {
        int res = (raw ^ mask) & 0xFF;
        return res;
    }

    private static int vmUnmaskKeyByte(int masked, int mask, int digest) {
        int x = masked ^ mask;
        int res = (x ^ digest) & 0xFF;
        return res;
    }

    private static int vmComputeSecurityEntropy(int seed, int rounds) {
        int acc = seed;
        int i = 0;
        while (i < rounds) {
            acc = (acc * 31) + (i ^ 0x5a);
            i = i + 1;
        }
        return acc;
    }

    private static int vmVerifyIntegrityToken(int token, int salt) {
        int diff = salt - 20;
        return (token + 100) * diff;
    }

    private static void fixupDexHeader(byte[] dex) {
        if (dex == null || dex.length < 8) return;
        if (dex[0] != 0x64 || dex[1] != 0x65 || dex[2] != 0x78 || dex[3] != 0x0A) {
            for (int i = 0; i < 8 && i < dex.length; i++) {
                dex[i] = (byte) vmCalculateHeaderMask(dex[i], MAGIC_MASK[i]);
            }
        }
    }

    private static byte[] getSecretKey(Context ctx) {
        byte[] key = new byte[32];
        try {
            int[] salt = new int[] { ${masked.saltArray.join(", ")} };
            int[] mKey = new int[] { ${masked.maskedKeyArray.join(", ")} };
            int[] mask = new int[] { ${masked.keyMaskArray.join(", ")} };

            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            ${masked.hasPackageBinding ? `md.update(ctx.getPackageName().getBytes("UTF-8"));` : ""}
            byte[] sBytes = new byte[salt.length];
            for (int i = 0; i < salt.length; i++) {
                sBytes[i] = (byte) salt[i];
            }
            md.update(sBytes);
            byte[] d = md.digest();

            for (int i = 0; i < 32; i++) {
                key[i] = (byte) vmUnmaskKeyByte(mKey[i], mask[i], d[i]);
            }
            Arrays.fill(d, (byte) 0);
            Arrays.fill(sBytes, (byte) 0);
        } catch (Throwable t) {
            Arrays.fill(key, (byte) 0);
        }
        return key;
    }

    private static byte[] getSecretIv(Context ctx) {
        byte[] iv = new byte[16];
        try {
            int[] salt = new int[] { ${masked.saltArray.join(", ")} };
            int[] mIv = new int[] { ${masked.maskedIvArray.join(", ")} };
            int[] mask = new int[] { ${masked.ivMaskArray.join(", ")} };

            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            ${masked.hasPackageBinding ? `md.update(ctx.getPackageName().getBytes("UTF-8"));` : ""}
            byte[] sBytes = new byte[salt.length];
            for (int i = 0; i < salt.length; i++) {
                sBytes[i] = (byte) salt[i];
            }
            md.update(sBytes);
            byte[] d = md.digest();

            for (int i = 0; i < 16; i++) {
                iv[i] = (byte) vmUnmaskKeyByte(mIv[i], mask[i], d[i % d.length]);
            }
            Arrays.fill(d, (byte) 0);
            Arrays.fill(sBytes, (byte) 0);
        } catch (Throwable t) {
            Arrays.fill(iv, (byte) 0);
        }
        return iv;
    }

    private static void unsealHiddenApi() {
        try {
            Method forName = Class.class.getDeclaredMethod("forName", String.class);
            Method getMethod = Class.class.getDeclaredMethod("getDeclaredMethod", String.class, Class[].class);
            Class<?> vmRuntimeClass = (Class<?>) forName.invoke(null, "dalvik.system.VMRuntime");
            Method getRuntimeMethod = (Method) getMethod.invoke(vmRuntimeClass, "getRuntime", null);
            Method setExemptionsMethod = (Method) getMethod.invoke(vmRuntimeClass, "setHiddenApiExemptions", new Class[]{String[].class});
            Object vmRuntime = getRuntimeMethod.invoke(null);
            setExemptionsMethod.invoke(vmRuntime, new Object[]{new String[]{"L"}});
        } catch (Throwable ignored) {
        }
    }

    private static Field findField(Object instance, String name) {
        Field target = null;
        try {
            Class<?> cur = instance.getClass();
            while (cur != null) {
                try {
                    Field field = cur.getDeclaredField(name);
                    field.setAccessible(true);
                    target = field;
                    break;
                } catch (NoSuchFieldException e) {
                    cur = cur.getSuperclass();
                }
            }
        } catch (Throwable ignored) {
            target = null;
        }
        return target;
    }

    private static void replaceApplicationContext(Context base, Application realApp, Application stubApp) {
        if (realApp == null) return;
        try {
            Class<?> ctxImplClass = base.getClass();

            // 1. ContextImpl.mOuterContext
            try {
                Field mOuterContext = ctxImplClass.getDeclaredField("mOuterContext");
                mOuterContext.setAccessible(true);
                mOuterContext.set(base, realApp);
            } catch (Throwable ignored) {}

            // 2. LoadedApk via ContextImpl.mPackageInfo
            Field mPackageInfoField = null;
            Object loadedApk = null;
            try {
                mPackageInfoField = ctxImplClass.getDeclaredField("mPackageInfo");
                mPackageInfoField.setAccessible(true);
                loadedApk = mPackageInfoField.get(base);
            } catch (Throwable ignored) {}

            if (loadedApk != null) {
                // 3. LoadedApk.mApplication
                try {
                    Field mApplicationField = loadedApk.getClass().getDeclaredField("mApplication");
                    mApplicationField.setAccessible(true);
                    mApplicationField.set(loadedApk, realApp);
                } catch (Throwable ignored) {}

                // 4. ActivityThread via LoadedApk.mActivityThread
                Object activityThread = null;
                try {
                    Field mActivityThreadField = loadedApk.getClass().getDeclaredField("mActivityThread");
                    mActivityThreadField.setAccessible(true);
                    activityThread = mActivityThreadField.get(loadedApk);
                } catch (Throwable ignored) {}

                if (activityThread != null) {
                    // 5. ActivityThread.mInitialApplication
                    try {
                        Field mInitialApplicationField = activityThread.getClass().getDeclaredField("mInitialApplication");
                        mInitialApplicationField.setAccessible(true);
                        mInitialApplicationField.set(activityThread, realApp);
                    } catch (Throwable ignored) {}

                    // 6. ActivityThread.mAllApplications
                    try {
                        Field mAllApplicationsField = activityThread.getClass().getDeclaredField("mAllApplications");
                        mAllApplicationsField.setAccessible(true);
                        List<Application> allApps = (List<Application>) mAllApplicationsField.get(activityThread);
                        if (allApps != null) {
                            allApps.remove(stubApp);
                            if (!allApps.contains(realApp)) {
                                allApps.add(realApp);
                            }
                        }
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private static byte[] decrypt(byte[] src, byte[] key, byte[] iv) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        return cipher.doFinal(src);
    }

    private static boolean injectInMemoryDexList(ClassLoader loader, byte[][] dexList) {
        try {
            if (dexList == null || dexList.length == 0 || android.os.Build.VERSION.SDK_INT < 26) {
                return false;
            }

            ByteBuffer[] buffers = new ByteBuffer[dexList.length];
            for (int i = 0; i < dexList.length; i++) {
                byte[] dex = dexList[i];
                fixupDexHeader(dex);
                buffers[i] = ByteBuffer.wrap(dex);
            }

            Class<?> inMemCls = Class.forName("dalvik.system.InMemoryDexClassLoader");
            ClassLoader inMemoryLoader = null;

            // Try 1: Android 8.0+ (API 26+) 3-argument constructor: (ByteBuffer[], String, ClassLoader)
            try {
                Constructor<?> ctor3 = inMemCls.getConstructor(ByteBuffer[].class, String.class, ClassLoader.class);
                inMemoryLoader = (ClassLoader) ctor3.newInstance(buffers, null, loader);
            } catch (NoSuchMethodException e1) {
                // Try 2: Android 10+ (API 29+) 2-argument constructor: (ByteBuffer[], ClassLoader)
                try {
                    Constructor<?> ctor2 = inMemCls.getConstructor(ByteBuffer[].class, ClassLoader.class);
                    inMemoryLoader = (ClassLoader) ctor2.newInstance(buffers, loader);
                } catch (NoSuchMethodException e2) {
                    // Try 3: Single buffer constructor if 1 DEX
                    if (buffers.length == 1) {
                        try {
                            Constructor<?> ctor1 = inMemCls.getConstructor(ByteBuffer.class, ClassLoader.class);
                            inMemoryLoader = (ClassLoader) ctor1.newInstance(buffers[0], loader);
                        } catch (NoSuchMethodException ignored) {}
                    }
                }
            }

            if (inMemoryLoader == null) {
                return false;
            }

            Field pathListField = findField(loader, "pathList");
            if (pathListField == null) return false;
            Object appPathList = pathListField.get(loader);
            Object memPathList = pathListField.get(inMemoryLoader);

            Field dexElementsField = findField(appPathList, "dexElements");
            if (dexElementsField == null) return false;
            Object appElements = dexElementsField.get(appPathList);
            Object memElements = dexElementsField.get(memPathList);

            int appLen = Array.getLength(appElements);
            int memLen = Array.getLength(memElements);
            Object combined = Array.newInstance(appElements.getClass().getComponentType(), appLen + memLen);

            System.arraycopy(memElements, 0, combined, 0, memLen);
            System.arraycopy(appElements, 0, combined, memLen, appLen);

            dexElementsField.set(appPathList, combined);
            return true;
        } catch (Throwable t) {
            Log.w(TAG, "InMemoryDexClassLoader injection fallback: " + t.getMessage());
            return false;
        }
    }

    private static void shredFile(File file) {
        if (file == null || !file.exists()) return;
        try {
            long len = file.length();
            if (len > 0) {
                RandomAccessFile raf = new RandomAccessFile(file, "rws");
                byte[] zeros = new byte[(int) Math.min(len, 65536)];
                long rem = len;
                raf.seek(0);
                while (rem > 0) {
                    int toWrite = (int) Math.min(rem, zeros.length);
                    raf.write(zeros, 0, toWrite);
                    rem -= toWrite;
                }
                raf.close();
            }
        } catch (Throwable ignored) {}
        try {
            file.delete();
        } catch (Throwable ignored) {}
    }

    private static void injectDiskDexesWithShredding(ClassLoader loader, byte[][] dexList, File dexDir, File optDir) throws Exception {
        if (dexList == null || dexList.length == 0) return;
        dexDir.mkdirs();
        optDir.mkdirs();

        for (int i = 0; i < dexList.length; i++) {
            byte[] dex = dexList[i];
            fixupDexHeader(dex);

            File target = File.createTempFile("obv_" + i + "_", ".dex", dexDir);
            target.setReadable(true, true);
            target.setWritable(true, true);
            target.setExecutable(false, false);
            target.deleteOnExit();

            FileOutputStream fos = new FileOutputStream(target);
            fos.write(dex);
            fos.flush();
            fos.close();

            sExtractedFiles.add(target);
        }

        // Register process shutdown hook to securely shred and delete extracted files on termination
        try {
            Runtime.getRuntime().addShutdownHook(new Thread() {
                @Override
                public void run() {
                    for (File f : sExtractedFiles) {
                        shredFile(f);
                    }
                }
            });
        } catch (Throwable ignored) {}

        Field pathListField = findField(loader, "pathList");
        if (pathListField != null) {
            Object pathList = pathListField.get(loader);
            Field dexElementsField = findField(pathList, "dexElements");
            if (dexElementsField != null) {
                Object originalElements = dexElementsField.get(pathList);

                for (File dexFile : sExtractedFiles) {
                    DexClassLoader subLoader = new DexClassLoader(
                        dexFile.getAbsolutePath(),
                        optDir.getAbsolutePath(),
                        null,
                        loader
                    );
                    Object subPathList = pathListField.get(subLoader);
                    Object subElements = dexElementsField.get(subPathList);

                    int origLen = Array.getLength(originalElements);
                    int subLen = Array.getLength(subElements);
                    Object combined = Array.newInstance(originalElements.getClass().getComponentType(), origLen + subLen);

                    System.arraycopy(subElements, 0, combined, 0, subLen);
                    System.arraycopy(originalElements, 0, combined, subLen, origLen);

                    dexElementsField.set(pathList, combined);
                    originalElements = combined;
                }
            }
        }
    }

    private static byte[] readAssetFragments(Context ctx) {
        byte[] data = null;
        try {
            AssetManager am = ctx.getAssets();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            String[] frags = getPayloadFragments();
            for (int i = 0; i < frags.length; i++) {
                InputStream is = am.open(frags[i]);
                int r;
                while ((r = is.read(buf)) != -1) {
                    baos.write(buf, 0, r);
                }
                is.close();
            }
            data = baos.toByteArray();
            baos.close();
        } catch (Throwable t) {
            data = null;
        }
        return data;
    }

    private static byte[][] parseObvfDexes(byte[] obvf) {
        byte[][] dexList = null;
        if (obvf != null && obvf.length >= 8 && obvf[0] == 0x4F && obvf[1] == 0x42 && obvf[2] == 0x56 && obvf[3] == 0x46) {
            try {
                ByteBuffer bb = ByteBuffer.wrap(obvf);
                bb.getInt(); // skip magic "OBVF"
                int count = bb.getInt();
                if (count > 0 && count <= 100) {
                    dexList = new byte[count][];
                    for (int i = 0; i < count; i++) {
                        int len = bb.getInt();
                        byte[] dex = new byte[len];
                        bb.get(dex);
                        dexList[i] = dex;
                    }
                }
            } catch (Throwable t) {
                dexList = null;
            }
        }
        return dexList;
    }

    private static byte[] decryptSafe(byte[] src, byte[] key, byte[] iv) {
        byte[] pt = null;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            pt = cipher.doFinal(src);
        } catch (Throwable ignored) {
            pt = null;
        }
        return pt;
    }

    private static byte[][] decryptDexesFromAssets(Context base) {
        byte[][] result = null;
        byte[] b64Ciphertext = null;
        byte[] rawCiphertext = null;
        byte[] key = null;
        byte[] iv = null;
        byte[] b85Data = null;
        byte[] plainObvf = null;

        int _0xm = 0x5a;
        int[] _0xseq = new int[] {
            0x2d ^ 0x5a, 0x61 ^ 0x5a, 0x18 ^ 0x5a, 0x74 ^ 0x5a,
            0x39 ^ 0x5a, 0x4f ^ 0x5a, 0x6e ^ 0x5a, 0x13 ^ 0x5a,
            0x57 ^ 0x5a, 0x22 ^ 0x5a, 0x7b ^ 0x5a, 0x3c ^ 0x5a,
            0 ^ 0x5a
        };
        int _0xptr = 0;
        int step = _0xseq[_0xptr++] ^ _0xm;
        while (step != 0) {
            switch (step) {
                case 0x2d:
                    b64Ciphertext = readAssetFragments(base);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x61:
                    rawCiphertext = (b64Ciphertext != null) ? Base64.decode(b64Ciphertext, Base64.DEFAULT) : null;
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x18:
                    key = getSecretKey(base);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x74:
                    iv = getSecretIv(base);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x39:
                    b85Data = (rawCiphertext != null && key != null && iv != null) ? decryptSafe(rawCiphertext, key, iv) : null;
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x4f:
                    plainObvf = (b85Data != null) ? decodeBase85(b85Data) : null;
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x6e:
                    result = (plainObvf != null) ? parseObvfDexes(plainObvf) : null;
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x13:
                    if (key != null) Arrays.fill(key, (byte) 0);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x57:
                    if (iv != null) Arrays.fill(iv, (byte) 0);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x22:
                    if (b85Data != null) Arrays.fill(b85Data, (byte) 0);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x7b:
                    if (plainObvf != null) Arrays.fill(plainObvf, (byte) 0);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x3c:
                    if (rawCiphertext != null) Arrays.fill(rawCiphertext, (byte) 0);
                    step = _0xseq[_0xptr++] ^ _0xm;
                    break;
                case 0x93:
                    _0xm ^= 0x3f;
                    step = 0xab;
                    break;
                case 0xab:
                    throw new IllegalStateException();
                default:
                    throw new IllegalStateException();
            }
        }

        return result;
    }

    private static void writeCrashLog(Context ctx, Throwable t, String message) {
        try {
            if (message != null) Log.e(TAG, "[OBVEIL_ERROR] " + message);
            if (t != null) Log.e(TAG, "[OBVEIL_CRASH] " + t.getMessage(), t);

            File filesDir = ctx.getFilesDir();
            if (filesDir == null) return;
            filesDir.mkdirs();
            File logFile = new File(filesDir, "obveil_crash.log");
            FileOutputStream fos = new FileOutputStream(logFile, true);
            PrintWriter pw = new PrintWriter(fos);
            pw.println("================================================================================");
            pw.println("TIMESTAMP: " + new java.util.Date().toString());
            pw.println("PACKAGE:   " + ctx.getPackageName());
            pw.println("DEVICE:    " + android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL + " (API " + android.os.Build.VERSION.SDK_INT + ")");
            if (message != null) {
                pw.println("MESSAGE:   " + message);
            }
            if (t != null) {
                pw.println("STACKTRACE:");
                t.printStackTrace(pw);
            }
            pw.println("================================================================================");
            pw.flush();
            fos.close();
        } catch (Throwable ignored) {}
    }

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        unsealHiddenApi();
        verifyIntegrityCheck();

        File dexDir = base.getDir("obv_dex", Context.MODE_PRIVATE);
        File optDir = base.getDir("obv_opt", Context.MODE_PRIVATE);

        byte[][] decryptedDexes = null;
        try {
            System.loadLibrary("obv");
            InputStream vmIs = base.getAssets().open("obv_vm.dat");
            ByteArrayOutputStream vmBaos = new ByteArrayOutputStream();
            byte[] vmBuf = new byte[4096];
            int vmRead;
            while ((vmRead = vmIs.read(vmBuf)) != -1) {
                vmBaos.write(vmBuf, 0, vmRead);
            }
            vmIs.close();
            decryptedDexes = nativeInit(base, vmBaos.toByteArray());
            if (decryptedDexes == null) {
                Log.w(TAG, "Native RC VM returned null (anti-analysis triggered, signature mismatch, or bad payload). Falling back to Java.");
            }
        } catch (Throwable t) {
            Log.w(TAG, "Native library 'obv' load error: " + t.getMessage() + ". Falling back to Java.", t);
            decryptedDexes = null;
        }

        if (decryptedDexes == null) {
            decryptedDexes = decryptDexesFromAssets(base);
        }

        if (decryptedDexes == null || decryptedDexes.length == 0) {
            String err = "ObveilStub: payload decryption failed or anti-analysis triggered (check logcat tags 'ObvRcVm' or 'AppStub', or pull /data/data/" + base.getPackageName() + "/files/obveil_crash.log)";
            writeCrashLog(base, null, err);
            throw new RuntimeException(err);
        }

        try {
            boolean loaded = false;
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                loaded = injectInMemoryDexList(base.getClassLoader(), decryptedDexes);
            }
            if (!loaded) {
                injectDiskDexesWithShredding(base.getClassLoader(), decryptedDexes, dexDir, optDir);
            }

            // Secure memory wiping: zero out all decrypted DEX byte arrays in Java memory
            for (int i = 0; i < decryptedDexes.length; i++) {
                if (decryptedDexes[i] != null) {
                    Arrays.fill(decryptedDexes[i], (byte) 0);
                }
            }

            // Instantiate and bind real Application
            String realAppName = getRealAppName();
            if (realAppName != null && realAppName.length() > 0 && !realAppName.equals("${className}") && !realAppName.equals("android.app.Application")) {
                String targetApp = realAppName;
                if (targetApp.startsWith(".")) {
                    targetApp = base.getPackageName() + targetApp;
                } else if (!targetApp.contains(".")) {
                    targetApp = base.getPackageName() + "." + targetApp;
                }

                Class<?> appCls = base.getClassLoader().loadClass(targetApp);
                realApplication = (Application) appCls.newInstance();
                Method m = null;
                Class<?> curCls = realApplication.getClass();
                while (curCls != null) {
                    try {
                        m = curCls.getDeclaredMethod("attachBaseContext", Context.class);
                        break;
                    } catch (NoSuchMethodException ignored) {
                        curCls = curCls.getSuperclass();
                    }
                }
                if (m != null) {
                    m.setAccessible(true);
                    m.invoke(realApplication, base);
                }

                // Replace all internal framework references to prevent ClassCastException
                replaceApplicationContext(base, realApplication, this);
            }
        } catch (Throwable t) {
            writeCrashLog(base, t, "Fatal error initializing Obveil protected payload");
            throw new RuntimeException("ObveilStub initialization failed: " + t.getMessage(), t);
        }
    }

    private static class ObveilCrashHandler implements Thread.UncaughtExceptionHandler {
        private final Context mContext;
        private final Thread.UncaughtExceptionHandler mDefaultHandler;

        public ObveilCrashHandler(Context ctx, Thread.UncaughtExceptionHandler defaultHandler) {
            this.mContext = ctx;
            this.mDefaultHandler = defaultHandler;
        }

        @Override
        public void uncaughtException(Thread t, Throwable e) {
            writeCrashLog(mContext, e, "Uncaught exception in thread " + t.getName());
            if (mDefaultHandler != null) {
                mDefaultHandler.uncaughtException(t, e);
            }
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            Thread.UncaughtExceptionHandler def = Thread.getDefaultUncaughtExceptionHandler();
            Thread.setDefaultUncaughtExceptionHandler(new ObveilCrashHandler(this, def));
        } catch (Throwable ignored) {}
        if (realApplication != null) {
            realApplication.onCreate();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (realApplication != null) {
            realApplication.onConfigurationChanged(newConfig);
        }
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        if (realApplication != null) {
            realApplication.onLowMemory();
        }
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        if (realApplication != null) {
            realApplication.onTrimMemory(level);
        }
    }

    @Override
    public void onTerminate() {
        super.onTerminate();
        for (File f : sExtractedFiles) {
            shredFile(f);
        }
        if (realApplication != null) {
            realApplication.onTerminate();
        }
    }

    private static int verifyIntegrityCheck() {
        try {
            int entropy = vmComputeSecurityEntropy(0x1234, 10);
            int token = vmVerifyIntegrityToken(50, 25);
            if (entropy != -1469407623 || token != 750) {
                throw new java.lang.IllegalStateException("Obveil VMP integrity failure");
            }
            if (DecoyReflectionBridge.checkIntegrityEnvironment()) {
                return entropy ^ token ^ DecoyEntropySecurityManager.verifySecurityState(0x1234, 0x5678) ^ DecoyNativeBridge.executeNativeCheck(42);
            }
            return entropy ^ token;
        } catch (Throwable ignored) {}
        return 0;
    }
}

class DecoyEntropySecurityManager {
    public static int verifySecurityState(int a, int b) {
        int res = (a ^ 0x55aa55aa) + (b * 31);
        int state = 1;
        while (state < 5) {
            switch (state) {
                case 1: res = (res << 2) ^ (res >>> 3); state = 2; break;
                case 2: res += (a * b) & 0xff; state = 3; break;
                case 3: res ^= (b - a); state = 4; break;
                case 4: state = 5; break;
                default: throw new InternalError();
            }
        }
        return res;
    }

    public static byte[] dynamicEntropyCheck(byte[] in, int mask) {
        if (in == null || in.length == 0) return new byte[0];
        byte[] out = new byte[in.length];
        for (int i = 0; i < in.length; i++) {
            out[i] = (byte) ((in[i] ^ mask) + (i & 7));
        }
        return out;
    }
}

class DecoyReflectionBridge {
    public static boolean checkIntegrityEnvironment() {
        int acc = 0;
        for (int i = 0; i < 16; i++) {
            acc = (acc * 33) ^ i;
            if (acc == 0xdeadbeef) {
                throw new IllegalStateException();
            }
        }
        return (acc & 1) == 0;
    }

    public static String resolveDecoySymbol(int id) {
        switch (id) {
            case 101: return "dalvik.system.DexPathList";
            case 102: return "makeDexElements";
            case 103: return "InMemoryDexClassLoader";
            default: return "null";
        }
    }
}

class DecoyNativeBridge {
    public static int executeNativeCheck(int flag) {
        int x = flag ^ 0x12345678;
        int y = (x << 4) | (x >>> 28);
        return y ^ 0x87654321;
    }
}
`;
}

/**
 * Generates, obfuscates (via obveil Java engine), compiles, and dex-compiles the Stub.
 */
async function buildObfuscatedStubDex(options = {}) {
  const tools = resolveAndroidTools();
  const rawJava = generateStubSource(options);

  // 1. Obfuscate Java source using project's own Java Obfuscator engine
  const obfRes = await obfuscateJava(rawJava, {
    rename: true,
    renameMembers: true,
    javaClasses: true,
    javaTypes: true,
    strings: true,
    numbers: true,
    dead: true,
    cff: true,
    vm: true,
    wrap: true,
    filename: `${options.className || "StubApp"}.java`,
    javaOptions: {
      classpath: tools.androidJar,
    },
  });

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "obveil-stub-"));
  try {
    const pkgDir = path.join(tempDir, "src", ...(options.packageName || "com.obveil.stub").split("."));
    await fs.mkdir(pkgDir, { recursive: true });

    const javaFile = path.join(pkgDir, `${options.className || "StubApp"}.java`);
    await fs.writeFile(javaFile, obfRes.code, "utf8");

    const classesDir = path.join(tempDir, "classes");
    await fs.mkdir(classesDir, { recursive: true });

    // 2. Compile obfuscated Java source with javac
    const javac = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", "javac") : "javac";
    try {
      await runTool(javac, [
        "-encoding", "UTF-8",
        "-source", "8",
        "-target", "8",
        "-cp", tools.androidJar,
        "-d", classesDir,
        javaFile,
      ]);
    } catch (e) {
      console.error("=== JAVAC STUB ERROR ===");
      console.error(e.stderr || e.stdout || e.message);
      console.error("========================");
      throw e;
    }

    // Collect all generated .class files
    const classFiles = [];
    function collectClasses(dir) {
      for (const entry of fsSync.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectClasses(full);
        } else if (entry.isFile() && entry.name.endsWith(".class")) {
          classFiles.push(full);
        }
      }
    }
    collectClasses(classesDir);
    sanitizeClassFilesForD8(classFiles);

    // 3. Compile .class to classes.dex using d8
    const dexOutDir = path.join(tempDir, "dex");
    await fs.mkdir(dexOutDir, { recursive: true });

    await runTool(tools.d8, [
      "--lib", tools.androidJar,
      "--output", dexOutDir,
      "--min-api", "21",
      ...classFiles,
    ]);

    const generatedDex = path.join(dexOutDir, "classes.dex");
    const dexBuffer = await fs.readFile(generatedDex);

    return {
      dexBuffer,
      obfuscatedSource: obfRes.code,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = {
  generateStubSource,
  buildObfuscatedStubDex,
};
