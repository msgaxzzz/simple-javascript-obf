#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif

#include "rc_vm.h"
#include "aes.h"
#include "sha256.h"

#include <android/log.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <sys/time.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <dirent.h>

#define LOG_TAG "ObvRcVm"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static int check_anti_debug(void) {
    // 1. TracerPid check via /proc/self/status
    FILE *fp = fopen("/proc/self/status", "r");
    if (fp) {
        char line[256];
        int tracer_pid = 0;
        while (fgets(line, sizeof(line), fp)) {
            if (strncmp(line, "TracerPid:", 10) == 0) {
                tracer_pid = atoi(&line[10]);
                break;
            }
        }
        fclose(fp);
        if (tracer_pid > 0) return 1;
    }

    // 2. Scan /proc/self/wchan for trace-related blocks
    FILE *wchan = fopen("/proc/self/wchan", "r");
    if (wchan) {
        char wbuf[64] = {0};
        if (fgets(wbuf, sizeof(wbuf), wchan)) {
            if (strstr(wbuf, "ptrace") || strstr(wbuf, "trace")) {
                fclose(wchan);
                return 1;
            }
        }
        fclose(wchan);
    }

    return 0;
}

static int check_maps_injections(void) {
    FILE *fp = fopen("/proc/self/maps", "r");
    if (!fp) return 0;

    char line[512];
    int detected = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strcasestr(line, "frida") != NULL ||
            strcasestr(line, "gadget") != NULL ||
            strcasestr(line, "gum-js-loop") != NULL ||
            strcasestr(line, "gmain") != NULL ||
            strcasestr(line, "xposed") != NULL ||
            strcasestr(line, "edxposed") != NULL ||
            strcasestr(line, "lsposed") != NULL ||
            strcasestr(line, "substrate") != NULL ||
            strcasestr(line, "cydia") != NULL ||
            strcasestr(line, "sandhook") != NULL ||
            strcasestr(line, "yahfa") != NULL ||
            strcasestr(line, "riru") != NULL ||
            strcasestr(line, "zygisk") != NULL) {
            detected = 1;
            break;
        }
    }
    fclose(fp);
    return detected;
}

static int check_frida_port(void) {
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    sa.sin_port = htons(27042);
    if (inet_pton(AF_INET, "127.0.0.1", &sa.sin_addr) <= 0) {
        return 0;
    }

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) return 0;

    int flags = fcntl(sock, F_GETFL, 0);
    if (flags != -1) {
        fcntl(sock, F_SETFL, flags | O_NONBLOCK);
    }

    int res = connect(sock, (struct sockaddr *)&sa, sizeof(sa));
    if (res == 0) {
        close(sock);
        return 1;
    }

    if (errno == EINPROGRESS) {
        fd_set fdset;
        FD_ZERO(&fdset);
        FD_SET(sock, &fdset);
        struct timeval tv;
        tv.tv_sec = 0;
        tv.tv_usec = 30000; // 30ms timeout for localhost handshake
        if (select(sock + 1, NULL, &fdset, NULL, &tv) > 0) {
            int so_error = 0;
            socklen_t len = sizeof(so_error);
            if (getsockopt(sock, SOL_SOCKET, SO_ERROR, &so_error, &len) == 0 && so_error == 0) {
                close(sock);
                return 1;
            }
        }
    }

    close(sock);
    return 0;
}

static int check_frida_threads(void) {
    DIR *dir = opendir("/proc/self/task");
    if (!dir) return 0;

    struct dirent *entry;
    int detected = 0;
    while ((entry = readdir(dir)) != NULL) {
        if (entry->d_name[0] == '.') continue;

        char path[64];
        snprintf(path, sizeof(path), "/proc/self/task/%s/comm", entry->d_name);
        FILE *fp = fopen(path, "r");
        if (fp) {
            char comm[64];
            if (fgets(comm, sizeof(comm), fp)) {
                size_t len = strlen(comm);
                while (len > 0 && (comm[len - 1] == '\n' || comm[len - 1] == '\r')) {
                    comm[--len] = '\0';
                }
                if (strstr(comm, "gmain") != NULL ||
                    strstr(comm, "gdbus") != NULL ||
                    strstr(comm, "gum-js-loop") != NULL ||
                    strstr(comm, "pool-frida") != NULL ||
                    strstr(comm, "frida") != NULL) {
                    detected = 1;
                    fclose(fp);
                    break;
                }
            }
            fclose(fp);
        }
    }
    closedir(dir);
    return detected;
}

static int check_root_binaries(void) {
    static const char * const su_paths[] = {
        "/system/bin/su",
        "/system/xbin/su",
        "/sbin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/data/local/su",
        "/su/bin/su"
    };
    for (size_t i = 0; i < sizeof(su_paths) / sizeof(su_paths[0]); i++) {
        if (access(su_paths[i], F_OK) == 0) {
            return 1;
        }
    }
    return 0;
}

static int check_emulator(void) {
    static const char * const emu_drivers[] = {
        "/dev/socket/qemud",
        "/dev/qemu_pipe",
        "/dev/goldfish_pipe",
        "/dev/vboxguest",
        "/dev/vboxuser",
        "/sys/module/qemu_trace",
        "/sys/module/goldfish_audio"
    };
    for (size_t i = 0; i < sizeof(emu_drivers) / sizeof(emu_drivers[0]); i++) {
        if (access(emu_drivers[i], F_OK) == 0) {
            return 1;
        }
    }

    FILE *cpuinfo = fopen("/proc/cpuinfo", "r");
    if (cpuinfo) {
        char line[256];
        while (fgets(line, sizeof(line), cpuinfo)) {
            if (strstr(line, "goldfish") || strstr(line, "ranchu") || strstr(line, "qemu")) {
                fclose(cpuinfo);
                return 1;
            }
        }
        fclose(cpuinfo);
    }
    return 0;
}

static int perform_anti_analysis(void) {
    if (check_anti_debug()) return 1;
    if (check_maps_injections()) return 2;
    if (check_frida_port()) return 3;
    if (check_frida_threads()) return 4;
    if (check_root_binaries()) return 5;
    if (check_emulator()) return 6;
    return 0;
}

static int verify_apk_signature(JNIEnv *env, jobject context, const uint8_t *expected_sha256) {
    if (!env || !context) return -1;

    int all_zeros = 1;
    for (int i = 0; i < 32; i++) {
        if (expected_sha256[i] != 0) {
            all_zeros = 0;
            break;
        }
    }

    jclass ctx_class = (*env)->GetObjectClass(env, context);
    if (!ctx_class) return -2;

    jmethodID get_pkg_mid = (*env)->GetMethodID(env, ctx_class, "getPackageName", "()Ljava/lang/String;");
    jmethodID get_pm_mid = (*env)->GetMethodID(env, ctx_class, "getPackageManager", "()Landroid/content/pm/PackageManager;");
    if (!get_pkg_mid || !get_pm_mid) return -3;

    jstring pkg_name = (jstring)(*env)->CallObjectMethod(env, context, get_pkg_mid);
    jobject pm_obj = (*env)->CallObjectMethod(env, context, get_pm_mid);
    if (!pkg_name || !pm_obj) {
        if (pkg_name) (*env)->DeleteLocalRef(env, pkg_name);
        if (pm_obj) (*env)->DeleteLocalRef(env, pm_obj);
        return -4;
    }

    jclass pm_class = (*env)->GetObjectClass(env, pm_obj);
    jmethodID get_pkg_info_mid = (*env)->GetMethodID(
        env, pm_class, "getPackageInfo", "(Ljava/lang/String;I)Landroid/content/pm/PackageInfo;"
    );
    if (!get_pkg_info_mid) {
        (*env)->DeleteLocalRef(env, pkg_name);
        (*env)->DeleteLocalRef(env, pm_obj);
        return -5;
    }

    // Flags: 64 = GET_SIGNATURES, 0x08000000 = GET_SIGNING_CERTIFICATES (Android 9+)
    jint flags = 64 | 0x08000000;
    jobject pkg_info = (*env)->CallObjectMethod(env, pm_obj, get_pkg_info_mid, pkg_name, flags);
    if (!pkg_info) {
        if ((*env)->ExceptionCheck(env)) (*env)->ExceptionClear(env);
        // Fallback with 64 only if high bit flag was rejected on early Android
        pkg_info = (*env)->CallObjectMethod(env, pm_obj, get_pkg_info_mid, pkg_name, 64);
    }
    (*env)->DeleteLocalRef(env, pkg_name);
    (*env)->DeleteLocalRef(env, pm_obj);
    if (!pkg_info) return -6;

    jclass pkg_info_class = (*env)->GetObjectClass(env, pkg_info);
    jobject sig0 = NULL;

    // 1. Try legacy 'signatures' field
    jfieldID sigs_fid = (*env)->GetFieldID(env, pkg_info_class, "signatures", "[Landroid/content/pm/Signature;");
    if (sigs_fid) {
        jobjectArray sigs_array = (jobjectArray)(*env)->GetObjectField(env, pkg_info, sigs_fid);
        if (sigs_array) {
            jsize sig_count = (*env)->GetArrayLength(env, sigs_array);
            if (sig_count > 0) {
                sig0 = (*env)->GetObjectArrayElement(env, sigs_array, 0);
            }
            (*env)->DeleteLocalRef(env, sigs_array);
        }
    }
    if ((*env)->ExceptionCheck(env)) (*env)->ExceptionClear(env);

    // 2. Fallback to Android 9+ 'signingInfo'
    if (!sig0) {
        jfieldID signing_info_fid = (*env)->GetFieldID(env, pkg_info_class, "signingInfo", "Landroid/content/pm/SigningInfo;");
        if (signing_info_fid) {
            jobject signing_info = (*env)->GetObjectField(env, pkg_info, signing_info_fid);
            if (signing_info) {
                jclass signing_info_class = (*env)->GetObjectClass(env, signing_info);
                jmethodID get_signers_mid = (*env)->GetMethodID(env, signing_info_class, "getApkContentsSigners", "()[Landroid/content/pm/Signature;");
                if (get_signers_mid) {
                    jobjectArray sigs_array = (jobjectArray)(*env)->CallObjectMethod(env, signing_info, get_signers_mid);
                    if (sigs_array) {
                        jsize sig_count = (*env)->GetArrayLength(env, sigs_array);
                        if (sig_count > 0) {
                            sig0 = (*env)->GetObjectArrayElement(env, sigs_array, 0);
                        }
                        (*env)->DeleteLocalRef(env, sigs_array);
                    }
                }
                if (!sig0) {
                    jmethodID get_history_mid = (*env)->GetMethodID(env, signing_info_class, "getSigningCertificateHistory", "()[Landroid/content/pm/Signature;");
                    if (get_history_mid) {
                        jobjectArray sigs_array = (jobjectArray)(*env)->CallObjectMethod(env, signing_info, get_history_mid);
                        if (sigs_array) {
                            jsize sig_count = (*env)->GetArrayLength(env, sigs_array);
                            if (sig_count > 0) {
                                sig0 = (*env)->GetObjectArrayElement(env, sigs_array, 0);
                            }
                            (*env)->DeleteLocalRef(env, sigs_array);
                        }
                    }
                }
                (*env)->DeleteLocalRef(env, signing_info_class);
                (*env)->DeleteLocalRef(env, signing_info);
            }
        }
        if ((*env)->ExceptionCheck(env)) (*env)->ExceptionClear(env);
    }
    (*env)->DeleteLocalRef(env, pkg_info_class);
    (*env)->DeleteLocalRef(env, pkg_info);

    if (!sig0) return -8;

    jclass sig_class = (*env)->GetObjectClass(env, sig0);
    jmethodID to_byte_arr_mid = (*env)->GetMethodID(env, sig_class, "toByteArray", "()[B");
    if (!to_byte_arr_mid) {
        (*env)->DeleteLocalRef(env, sig0);
        return -11;
    }

    jbyteArray cert_bytes_arr = (jbyteArray)(*env)->CallObjectMethod(env, sig0, to_byte_arr_mid);
    (*env)->DeleteLocalRef(env, sig0);
    if (!cert_bytes_arr) return -12;

    jsize cert_len = (*env)->GetArrayLength(env, cert_bytes_arr);
    if (cert_len <= 0) {
        (*env)->DeleteLocalRef(env, cert_bytes_arr);
        return -13;
    }

    jbyte *cert_bytes = (*env)->GetByteArrayElements(env, cert_bytes_arr, NULL);
    if (!cert_bytes) {
        (*env)->DeleteLocalRef(env, cert_bytes_arr);
        return -14;
    }

    uint8_t computed_sha256[32];
    obv_sha256_ctx s_ctx;
    obv_sha256_init(&s_ctx);
    obv_sha256_update(&s_ctx, (const uint8_t *)cert_bytes, (size_t)cert_len);
    obv_sha256_final(&s_ctx, computed_sha256);

    (*env)->ReleaseByteArrayElements(env, cert_bytes_arr, cert_bytes, JNI_ABORT);
    (*env)->DeleteLocalRef(env, cert_bytes_arr);

    if (all_zeros) {
        return 0; // Certificate present and verified
    }

    if (memcmp(computed_sha256, expected_sha256, 32) != 0) {
        LOGE("Signature mismatch! Signature verification failed.");
        return -15;
    }

    return 0;
}

static uint8_t *read_asset_bytes(JNIEnv *env, jobject context, const char *asset_name, size_t *out_len) {
    jclass ctx_class = (*env)->GetObjectClass(env, context);
    jmethodID get_assets_mid = (*env)->GetMethodID(env, ctx_class, "getAssets", "()Landroid/content/res/AssetManager;");
    if (!get_assets_mid) return NULL;

    jobject asset_mgr_obj = (*env)->CallObjectMethod(env, context, get_assets_mid);
    if (!asset_mgr_obj) return NULL;

    AAssetManager *mgr = AAssetManager_fromJava(env, asset_mgr_obj);
    if (!mgr) return NULL;

    AAsset *asset = AAssetManager_open(mgr, asset_name, AASSET_MODE_BUFFER);
    if (!asset) return NULL;

    off_t len = AAsset_getLength(asset);
    uint8_t *buf = (uint8_t *)malloc(len);
    if (buf) {
        AAsset_read(asset, buf, len);
        *out_len = (size_t)len;
    }
    AAsset_close(asset);
    return buf;
}

static const char B85_ALPHABET[] = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#";

static uint8_t *b64_decode(const uint8_t *src, size_t src_len, size_t *out_len) {
    if (!src || src_len == 0) return NULL;
    static const int8_t b64_table[256] = {
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,
        52,53,54,55,56,57,58,59,60,61,-1,-1,-1, 0,-1,-1,
        -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,
        15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,
        -1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
        41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
    };

    size_t alloc_len = (src_len / 4) * 3 + 8;
    uint8_t *out = (uint8_t *)malloc(alloc_len);
    if (!out) return NULL;

    size_t out_idx = 0;
    uint32_t buf = 0;
    int bits = 0;

    for (size_t i = 0; i < src_len; i++) {
        uint8_t c = src[i];
        if (c == '=' || c == '\r' || c == '\n' || c == ' ') continue;
        int8_t val = b64_table[c];
        if (val < 0) continue;
        buf = (buf << 6) | (uint32_t)val;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out[out_idx++] = (uint8_t)((buf >> bits) & 0xFF);
        }
    }
    *out_len = out_idx;
    return out;
}

static uint8_t *b85_decode(const uint8_t *src, size_t src_len, size_t *out_len) {
    if (!src || src_len < 5) return NULL;

    int8_t b85_map[256];
    memset(b85_map, -1, sizeof(b85_map));
    for (int i = 0; i < 85; i++) {
        b85_map[(uint8_t)B85_ALPHABET[i]] = (int8_t)i;
    }

    size_t blocks = src_len / 5;
    size_t alloc_len = blocks * 4;
    uint8_t *raw = (uint8_t *)malloc(alloc_len + 4);
    if (!raw) return NULL;

    size_t raw_idx = 0;
    for (size_t i = 0; i < blocks; i++) {
        uint64_t val = 0;
        for (int j = 0; j < 5; j++) {
            uint8_t c = src[i * 5 + j];
            int8_t v = b85_map[c];
            if (v < 0) v = 0;
            val = val * 85 + (uint64_t)v;
        }
        raw[raw_idx++] = (uint8_t)((val >> 24) & 0xFF);
        raw[raw_idx++] = (uint8_t)((val >> 16) & 0xFF);
        raw[raw_idx++] = (uint8_t)((val >> 8) & 0xFF);
        raw[raw_idx++] = (uint8_t)(val & 0xFF);
    }

    if (raw_idx < 4) {
        free(raw);
        return NULL;
    }

    uint32_t orig_len = ((uint32_t)raw[0] << 24) | ((uint32_t)raw[1] << 16) | ((uint32_t)raw[2] << 8) | ((uint32_t)raw[3]);
    if (orig_len > raw_idx - 4) {
        free(raw);
        return NULL;
    }

    uint8_t *out = (uint8_t *)malloc(orig_len);
    if (!out) {
        free(raw);
        return NULL;
    }
    memcpy(out, raw + 4, orig_len);
    memset(raw, 0, alloc_len + 4);
    free(raw);

    *out_len = orig_len;
    return out;
}

int obv_rc_vm_run(obv_rc_vm_state *vm, const uint8_t *bytecode, size_t bc_len) {
    size_t pc = 0;

    while (pc < bc_len) {
        uint8_t op = bytecode[pc++];

        switch (op) {
            case RC_OP_NOP:
                break;

            case RC_OP_ANTI_DEBUG: {
                int anti_res = perform_anti_analysis();
                if (anti_res != 0) {
                    LOGE("Anti-analysis check triggered: %d", anti_res);
                    return -10;
                }
                break;
            }

            case RC_OP_CHECK_SIG: {
                if (pc + 32 > bc_len) return -1;
                const uint8_t *expected_hash = &bytecode[pc];
                pc += 32;

                int sig_res = verify_apk_signature(vm->env, vm->context, expected_hash);
                if (sig_res != 0) {
                    LOGE("Signature verification failed: %d", sig_res);
                    return -17;
                }
                break;
            }

            case RC_OP_LOAD_BYTES: {
                if (pc + 3 > bc_len) return -1;
                uint8_t slot = bytecode[pc++];
                size_t len = (size_t)bytecode[pc] | ((size_t)bytecode[pc + 1] << 8);
                pc += 2;
                if (pc + len > bc_len) return -1;

                if (slot < 16) {
                    if (vm->heap_bufs[slot]) {
                        memset(vm->heap_bufs[slot], 0, vm->heap_lens[slot]);
                        free(vm->heap_bufs[slot]);
                    }
                    vm->heap_bufs[slot] = (uint8_t *)malloc(len);
                    if (!vm->heap_bufs[slot]) return -2;
                    memcpy(vm->heap_bufs[slot], &bytecode[pc], len);
                    vm->heap_lens[slot] = len;
                }
                pc += len;
                break;
            }

            case RC_OP_XOR_SLOT: {
                if (pc + 3 > bc_len) return -1;
                uint8_t dst = bytecode[pc++];
                uint8_t src_a = bytecode[pc++];
                uint8_t src_b = bytecode[pc++];

                if (dst < 16 && src_a < 16 && src_b < 16) {
                    if (!vm->heap_bufs[src_a] || !vm->heap_bufs[src_b]) return -3;
                    size_t len = vm->heap_lens[src_a];
                    if (vm->heap_lens[src_b] < len) len = vm->heap_lens[src_b];

                    uint8_t *res = (uint8_t *)malloc(len);
                    if (!res) return -4;
                    for (size_t i = 0; i < len; i++) {
                        res[i] = vm->heap_bufs[src_a][i] ^ vm->heap_bufs[src_b][i];
                    }
                    if (vm->heap_bufs[dst]) {
                        memset(vm->heap_bufs[dst], 0, vm->heap_lens[dst]);
                        free(vm->heap_bufs[dst]);
                    }
                    vm->heap_bufs[dst] = res;
                    vm->heap_lens[dst] = len;
                }
                break;
            }

            case RC_OP_HASH_PKG: {
                if (pc + 3 > bc_len) return -1;
                uint8_t dst = bytecode[pc++];
                uint8_t bind_pkg = bytecode[pc++];
                uint8_t salt_len = bytecode[pc++];
                if (pc + salt_len > bc_len) return -1;

                const uint8_t *salt = &bytecode[pc];
                pc += salt_len;

                obv_sha256_ctx s_ctx;
                obv_sha256_init(&s_ctx);

                if (bind_pkg) {
                    jclass ctx_class = (*vm->env)->GetObjectClass(vm->env, vm->context);
                    jmethodID get_pkg_mid = (*vm->env)->GetMethodID(vm->env, ctx_class, "getPackageName", "()Ljava/lang/String;");
                    if (!get_pkg_mid) return -5;

                    jstring pkg_str = (jstring)(*vm->env)->CallObjectMethod(vm->env, vm->context, get_pkg_mid);
                    if (!pkg_str) return -6;

                    const char *pkg_chars = (*vm->env)->GetStringUTFChars(vm->env, pkg_str, NULL);
                    size_t pkg_len = strlen(pkg_chars);
                    obv_sha256_update(&s_ctx, (const uint8_t *)pkg_chars, pkg_len);
                    (*vm->env)->ReleaseStringUTFChars(vm->env, pkg_str, pkg_chars);
                    (*vm->env)->DeleteLocalRef(vm->env, pkg_str);
                }

                obv_sha256_update(&s_ctx, salt, salt_len);

                uint8_t *digest = (uint8_t *)malloc(32);
                if (!digest) return -7;
                obv_sha256_final(&s_ctx, digest);

                if (dst < 16) {
                    if (vm->heap_bufs[dst]) {
                        memset(vm->heap_bufs[dst], 0, vm->heap_lens[dst]);
                        free(vm->heap_bufs[dst]);
                    }
                    vm->heap_bufs[dst] = digest;
                    vm->heap_lens[dst] = 32;
                } else {
                    memset(digest, 0, 32);
                    free(digest);
                }
                break;
            }

            case RC_OP_READ_ASSET: {
                if (pc + 2 > bc_len) return -1;
                uint8_t dst_slot = bytecode[pc++];
                uint8_t str_len = bytecode[pc++];
                if (pc + str_len > bc_len) return -1;

                char name[256];
                memcpy(name, &bytecode[pc], str_len);
                name[str_len] = '\0';
                pc += str_len;

                size_t asset_len = 0;
                uint8_t *asset_data = read_asset_bytes(vm->env, vm->context, name, &asset_len);
                if (!asset_data) return -8;

                if (dst_slot < 16) {
                    if (vm->heap_bufs[dst_slot]) {
                        size_t old_len = vm->heap_lens[dst_slot];
                        uint8_t *comb = (uint8_t *)realloc(vm->heap_bufs[dst_slot], old_len + asset_len);
                        if (!comb) {
                            memset(asset_data, 0, asset_len);
                            free(asset_data);
                            return -9;
                        }
                        memcpy(comb + old_len, asset_data, asset_len);
                        memset(asset_data, 0, asset_len);
                        free(asset_data);
                        vm->heap_bufs[dst_slot] = comb;
                        vm->heap_lens[dst_slot] = old_len + asset_len;
                    } else {
                        vm->heap_bufs[dst_slot] = asset_data;
                        vm->heap_lens[dst_slot] = asset_len;
                    }
                } else {
                    memset(asset_data, 0, asset_len);
                    free(asset_data);
                }
                break;
            }

            case RC_OP_AES_DEC: {
                if (pc + 4 > bc_len) return -1;
                uint8_t ct_slot  = bytecode[pc++];
                uint8_t key_slot = bytecode[pc++];
                uint8_t iv_slot  = bytecode[pc++];
                uint8_t dst_slot = bytecode[pc++];

                if (ct_slot >= 16 || key_slot >= 16 || iv_slot >= 16 || dst_slot >= 16) return -1;
                if (!vm->heap_bufs[ct_slot] || !vm->heap_bufs[key_slot] || !vm->heap_bufs[iv_slot]) return -10;

                size_t ct_len = vm->heap_lens[ct_slot];
                uint8_t *plain = (uint8_t *)malloc(ct_len);
                if (!plain) return -11;
                size_t pt_len = 0;

                int res = obv_aes_256_cbc_decrypt(
                    vm->heap_bufs[ct_slot],
                    ct_len,
                    vm->heap_bufs[key_slot],
                    vm->heap_bufs[iv_slot],
                    plain,
                    &pt_len
                );

                // Memory-Wiping: immediately wipe key and iv from heap buffers!
                memset(vm->heap_bufs[key_slot], 0, vm->heap_lens[key_slot]);
                free(vm->heap_bufs[key_slot]);
                vm->heap_bufs[key_slot] = NULL;
                vm->heap_lens[key_slot] = 0;

                memset(vm->heap_bufs[iv_slot], 0, vm->heap_lens[iv_slot]);
                free(vm->heap_bufs[iv_slot]);
                vm->heap_bufs[iv_slot] = NULL;
                vm->heap_lens[iv_slot] = 0;

                memset(vm->heap_bufs[ct_slot], 0, vm->heap_lens[ct_slot]);
                free(vm->heap_bufs[ct_slot]);
                vm->heap_bufs[ct_slot] = NULL;
                vm->heap_lens[ct_slot] = 0;

                if (res != 0) {
                    memset(plain, 0, ct_len);
                    free(plain);
                    return -12;
                }

                if (vm->heap_bufs[dst_slot]) {
                    memset(vm->heap_bufs[dst_slot], 0, vm->heap_lens[dst_slot]);
                    free(vm->heap_bufs[dst_slot]);
                }
                vm->heap_bufs[dst_slot] = plain;
                vm->heap_lens[dst_slot] = pt_len;
                break;
            }

            case RC_OP_B64_DEC: {
                if (pc + 2 > bc_len) return -1;
                uint8_t src_slot = bytecode[pc++];
                uint8_t dst_slot = bytecode[pc++];
                if (src_slot >= 16 || dst_slot >= 16) return -1;
                if (!vm->heap_bufs[src_slot]) return -17;

                size_t out_len = 0;
                uint8_t *dec = b64_decode(vm->heap_bufs[src_slot], vm->heap_lens[src_slot], &out_len);
                if (!dec) return -18;

                if (src_slot != dst_slot) {
                    memset(vm->heap_bufs[src_slot], 0, vm->heap_lens[src_slot]);
                    free(vm->heap_bufs[src_slot]);
                    vm->heap_bufs[src_slot] = NULL;
                    vm->heap_lens[src_slot] = 0;
                }
                if (vm->heap_bufs[dst_slot]) {
                    memset(vm->heap_bufs[dst_slot], 0, vm->heap_lens[dst_slot]);
                    free(vm->heap_bufs[dst_slot]);
                }
                vm->heap_bufs[dst_slot] = dec;
                vm->heap_lens[dst_slot] = out_len;
                break;
            }

            case RC_OP_B85_DEC: {
                if (pc + 2 > bc_len) return -1;
                uint8_t src_slot = bytecode[pc++];
                uint8_t dst_slot = bytecode[pc++];
                if (src_slot >= 16 || dst_slot >= 16) return -1;
                if (!vm->heap_bufs[src_slot]) return -17;

                size_t out_len = 0;
                uint8_t *dec = b85_decode(vm->heap_bufs[src_slot], vm->heap_lens[src_slot], &out_len);
                if (!dec) return -19;

                if (src_slot != dst_slot) {
                    memset(vm->heap_bufs[src_slot], 0, vm->heap_lens[src_slot]);
                    free(vm->heap_bufs[src_slot]);
                    vm->heap_bufs[src_slot] = NULL;
                    vm->heap_lens[src_slot] = 0;
                }
                if (vm->heap_bufs[dst_slot]) {
                    memset(vm->heap_bufs[dst_slot], 0, vm->heap_lens[dst_slot]);
                    free(vm->heap_bufs[dst_slot]);
                }
                vm->heap_bufs[dst_slot] = dec;
                vm->heap_lens[dst_slot] = out_len;
                break;
            }

            case RC_OP_EXTRACT_DEX: {
                if (pc + 1 > bc_len) return -1;
                uint8_t src_slot = bytecode[pc++];
                if (src_slot >= 16 || !vm->heap_bufs[src_slot]) return -1;

                uint8_t *p = vm->heap_bufs[src_slot];
                size_t total = vm->heap_lens[src_slot];

                // Check magic "OBVF"
                if (total < 8 || p[0] != 0x4F || p[1] != 0x42 || p[2] != 0x56 || p[3] != 0x46) {
                    return -13;
                }

                uint32_t count = ((uint32_t)p[4] << 24) | ((uint32_t)p[5] << 16) | ((uint32_t)p[6] << 8) | ((uint32_t)p[7]);
                if (count == 0 || count > 100) return -14;

                size_t off = 8;
                for (uint32_t i = 0; i < count; i++) {
                    if (off + 4 > total) return -15;
                    uint32_t dlen = ((uint32_t)p[off] << 24) | ((uint32_t)p[off + 1] << 16) | ((uint32_t)p[off + 2] << 8) | ((uint32_t)p[off + 3]);
                    off += 4;
                    if (off + dlen > total) return -16;
                    off += dlen;
                }

                vm->dex_slot = (int)src_slot;
                break;
            }

            case RC_OP_MOV_SLOT: {
                if (pc + 2 > bc_len) return -1;
                uint8_t dst = bytecode[pc++];
                uint8_t src = bytecode[pc++];
                if (dst < 16 && src < 16 && dst != src) {
                    if (vm->heap_bufs[dst]) {
                        memset(vm->heap_bufs[dst], 0, vm->heap_lens[dst]);
                        free(vm->heap_bufs[dst]);
                        vm->heap_bufs[dst] = NULL;
                        vm->heap_lens[dst] = 0;
                    }
                    if (vm->heap_bufs[src] && vm->heap_lens[src] > 0) {
                        vm->heap_bufs[dst] = (uint8_t *)malloc(vm->heap_lens[src]);
                        if (!vm->heap_bufs[dst]) return -2;
                        memcpy(vm->heap_bufs[dst], vm->heap_bufs[src], vm->heap_lens[src]);
                        vm->heap_lens[dst] = vm->heap_lens[src];
                    }
                }
                break;
            }

            case RC_OP_ADD_SLOT: {
                if (pc + 3 > bc_len) return -1;
                uint8_t dst = bytecode[pc++];
                uint8_t s1 = bytecode[pc++];
                uint8_t s2 = bytecode[pc++];
                if (dst < 16 && s1 < 16 && s2 < 16 && vm->heap_bufs[s1] && vm->heap_bufs[s2]) {
                    size_t len = vm->heap_lens[s1] < vm->heap_lens[s2] ? vm->heap_lens[s1] : vm->heap_lens[s2];
                    uint8_t *tmp = (uint8_t *)malloc(len);
                    if (!tmp) return -2;
                    for (size_t i = 0; i < len; i++) {
                        tmp[i] = (uint8_t)((vm->heap_bufs[s1][i] + vm->heap_bufs[s2][i]) & 0xFF);
                    }
                    if (vm->heap_bufs[dst]) {
                        memset(vm->heap_bufs[dst], 0, vm->heap_lens[dst]);
                        free(vm->heap_bufs[dst]);
                    }
                    vm->heap_bufs[dst] = tmp;
                    vm->heap_lens[dst] = len;
                }
                break;
            }

            case RC_OP_SUB_SLOT: {
                if (pc + 3 > bc_len) return -1;
                uint8_t dst = bytecode[pc++];
                uint8_t s1 = bytecode[pc++];
                uint8_t s2 = bytecode[pc++];
                if (dst < 16 && s1 < 16 && s2 < 16 && vm->heap_bufs[s1] && vm->heap_bufs[s2]) {
                    size_t len = vm->heap_lens[s1] < vm->heap_lens[s2] ? vm->heap_lens[s1] : vm->heap_lens[s2];
                    uint8_t *tmp = (uint8_t *)malloc(len);
                    if (!tmp) return -2;
                    for (size_t i = 0; i < len; i++) {
                        tmp[i] = (uint8_t)((vm->heap_bufs[s1][i] - vm->heap_bufs[s2][i]) & 0xFF);
                    }
                    if (vm->heap_bufs[dst]) {
                        memset(vm->heap_bufs[dst], 0, vm->heap_lens[dst]);
                        free(vm->heap_bufs[dst]);
                    }
                    vm->heap_bufs[dst] = tmp;
                    vm->heap_lens[dst] = len;
                }
                break;
            }

            case RC_OP_ROL_SLOT: {
                if (pc + 2 > bc_len) return -1;
                uint8_t slot = bytecode[pc++];
                uint8_t shift = bytecode[pc++];
                if (slot < 16 && vm->heap_bufs[slot] && vm->heap_lens[slot] > 1) {
                    size_t len = vm->heap_lens[slot];
                    shift = shift % len;
                    if (shift > 0) {
                        uint8_t *tmp = (uint8_t *)malloc(len);
                        if (!tmp) return -2;
                        memcpy(tmp, vm->heap_bufs[slot] + shift, len - shift);
                        memcpy(tmp + (len - shift), vm->heap_bufs[slot], shift);
                        memcpy(vm->heap_bufs[slot], tmp, len);
                        free(tmp);
                    }
                }
                break;
            }

            case RC_OP_NOT_SLOT: {
                if (pc + 2 > bc_len) return -1;
                uint8_t dst = bytecode[pc++];
                uint8_t src = bytecode[pc++];
                if (dst < 16 && src < 16 && vm->heap_bufs[src]) {
                    size_t len = vm->heap_lens[src];
                    uint8_t *tmp = (uint8_t *)malloc(len);
                    if (!tmp) return -2;
                    for (size_t i = 0; i < len; i++) {
                        tmp[i] = ~vm->heap_bufs[src][i];
                    }
                    if (vm->heap_bufs[dst]) {
                        memset(vm->heap_bufs[dst], 0, vm->heap_lens[dst]);
                        free(vm->heap_bufs[dst]);
                    }
                    vm->heap_bufs[dst] = tmp;
                    vm->heap_lens[dst] = len;
                }
                break;
            }

            case RC_OP_MEM_ZERO: {
                if (pc + 1 > bc_len) return -1;
                uint8_t slot = bytecode[pc++];
                if (slot < 16 && vm->heap_bufs[slot]) {
                    memset(vm->heap_bufs[slot], 0, vm->heap_lens[slot]);
                    free(vm->heap_bufs[slot]);
                    vm->heap_bufs[slot] = NULL;
                    vm->heap_lens[slot] = 0;
                }
                break;
            }

            case RC_OP_JMP: {
                if (pc + 2 > bc_len) return -1;
                int16_t off = (int16_t)((uint16_t)bytecode[pc] | ((uint16_t)bytecode[pc + 1] << 8));
                pc += 2;
                int64_t target_pc = (int64_t)pc + off;
                if (target_pc < 0 || (size_t)target_pc > bc_len) return -1;
                pc = (size_t)target_pc;
                break;
            }

            case RC_OP_JEQ: {
                if (pc + 5 > bc_len) return -1;
                uint8_t slot = bytecode[pc++];
                uint8_t b_idx = bytecode[pc++];
                uint8_t val = bytecode[pc++];
                int16_t off = (int16_t)((uint16_t)bytecode[pc] | ((uint16_t)bytecode[pc + 1] << 8));
                pc += 2;
                int cond = (slot < 16 && vm->heap_bufs[slot] && b_idx < vm->heap_lens[slot] && vm->heap_bufs[slot][b_idx] == val);
                if (cond) {
                    int64_t target_pc = (int64_t)pc + off;
                    if (target_pc < 0 || (size_t)target_pc > bc_len) return -1;
                    pc = (size_t)target_pc;
                }
                break;
            }

            case RC_OP_JNE: {
                if (pc + 5 > bc_len) return -1;
                uint8_t slot = bytecode[pc++];
                uint8_t b_idx = bytecode[pc++];
                uint8_t val = bytecode[pc++];
                int16_t off = (int16_t)((uint16_t)bytecode[pc] | ((uint16_t)bytecode[pc + 1] << 8));
                pc += 2;
                int cond = (slot < 16 && vm->heap_bufs[slot] && b_idx < vm->heap_lens[slot] && vm->heap_bufs[slot][b_idx] != val);
                if (cond) {
                    int64_t target_pc = (int64_t)pc + off;
                    if (target_pc < 0 || (size_t)target_pc > bc_len) return -1;
                    pc = (size_t)target_pc;
                }
                break;
            }

            case RC_OP_DEX_FIXUP: {
                if (pc + 1 > bc_len) return -1;
                uint8_t slot = bytecode[pc++];
                if (slot < 16 && vm->heap_bufs[slot]) {
                    uint8_t *p = vm->heap_bufs[slot];
                    size_t total = vm->heap_lens[slot];
                    static const uint8_t mask[8] = { 0x5F, 0x2A, 0x4B, 0x7E, 0x33, 0x19, 0x8D, 0x6C };
                    if (total >= 8 && p[0] == 0x4F && p[1] == 0x42 && p[2] == 0x56 && p[3] == 0x46) {
                        uint32_t count = ((uint32_t)p[4] << 24) | ((uint32_t)p[5] << 16) | ((uint32_t)p[6] << 8) | ((uint32_t)p[7]);
                        size_t off = 8;
                        for (uint32_t i = 0; i < count && off + 4 <= total; i++) {
                            uint32_t dlen = ((uint32_t)p[off] << 24) | ((uint32_t)p[off + 1] << 16) | ((uint32_t)p[off + 2] << 8) | ((uint32_t)p[off + 3]);
                            off += 4;
                            if (off + dlen <= total && dlen >= 8) {
                                uint8_t *dex = &p[off];
                                if (dex[0] != 0x64 || dex[1] != 0x65 || dex[2] != 0x78 || dex[3] != 0x0A) {
                                    for (int k = 0; k < 8; k++) {
                                        dex[k] ^= mask[k];
                                    }
                                }
                            }
                            off += dlen;
                        }
                    }
                }
                break;
            }

            case RC_OP_HALT:
                return 0;

            default:
                return -20;
        }
    }

    return 0;
}

static jobjectArray run_native_init(
    JNIEnv *env,
    jclass clazz,
    jobject context,
    jbyteArray bytecode_arr
) {
    if (!context || !bytecode_arr) return NULL;

    jsize bc_len = (*env)->GetArrayLength(env, bytecode_arr);
    if (bc_len <= 0) return NULL;

    jbyte *bc_bytes = (*env)->GetByteArrayElements(env, bytecode_arr, NULL);
    if (!bc_bytes) return NULL;

    obv_rc_vm_state vm;
    memset(&vm, 0, sizeof(vm));
    vm.dex_slot = -1;
    vm.env = env;
    vm.context = context;

    int res = obv_rc_vm_run(&vm, (const uint8_t *)bc_bytes, (size_t)bc_len);
    (*env)->ReleaseByteArrayElements(env, bytecode_arr, bc_bytes, JNI_ABORT);

    if (res != 0) {
        LOGE("Native RC VM execution halted with error code %d", res);
    }

    jobjectArray result = NULL;
    if (res == 0 && vm.dex_slot >= 0 && vm.heap_bufs[vm.dex_slot]) {
        uint8_t *p = vm.heap_bufs[vm.dex_slot];
        size_t total = vm.heap_lens[vm.dex_slot];
        if (total >= 8 && p[0] == 0x4F && p[1] == 0x42 && p[2] == 0x56 && p[3] == 0x46) {
            uint32_t count = ((uint32_t)p[4] << 24) | ((uint32_t)p[5] << 16) | ((uint32_t)p[6] << 8) | ((uint32_t)p[7]);
            jclass byte_arr_cls = (*env)->FindClass(env, "[B");
            if (byte_arr_cls && count > 0) {
                result = (*env)->NewObjectArray(env, (jsize)count, byte_arr_cls, NULL);
                size_t off = 8;
                for (uint32_t i = 0; i < count; i++) {
                    uint32_t dlen = ((uint32_t)p[off] << 24) | ((uint32_t)p[off + 1] << 16) | ((uint32_t)p[off + 2] << 8) | ((uint32_t)p[off + 3]);
                    off += 4;
                    jbyteArray dex_arr = (*env)->NewByteArray(env, (jsize)dlen);
                    if (dex_arr) {
                        (*env)->SetByteArrayRegion(env, dex_arr, 0, (jsize)dlen, (const jbyte *)&p[off]);
                        (*env)->SetObjectArrayElement(env, result, (jsize)i, dex_arr);
                        (*env)->DeleteLocalRef(env, dex_arr);
                    }
                    off += dlen;
                }
                (*env)->DeleteLocalRef(env, byte_arr_cls);
            }
        }
    }

    // Native Memory-Wiping: securely zero and free all VM heap buffers
    for (int i = 0; i < 16; i++) {
        if (vm.heap_bufs[i]) {
            memset(vm.heap_bufs[i], 0, vm.heap_lens[i]);
            free(vm.heap_bufs[i]);
            vm.heap_bufs[i] = NULL;
            vm.heap_lens[i] = 0;
        }
    }
    memset(&vm, 0, sizeof(vm));

    return result;
}

#if defined(JNI_FUNC_NAME)
JNIEXPORT jobjectArray JNICALL JNI_FUNC_NAME(
    JNIEnv *env,
    jclass clazz,
    jobject context,
    jbyteArray bytecode_arr
) {
    return run_native_init(env, clazz, context, bytecode_arr);
}
#else
JNIEXPORT jobjectArray JNICALL Java_com_obveil_stub_StubApp_nativeInit(
    JNIEnv *env,
    jclass clazz,
    jobject context,
    jbyteArray bytecode_arr
) {
    return run_native_init(env, clazz, context, bytecode_arr);
}
#endif
