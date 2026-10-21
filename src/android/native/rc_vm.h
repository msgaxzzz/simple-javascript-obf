#ifndef OBV_RC_VM_H
#define OBV_RC_VM_H

#include <jni.h>
#include <stdint.h>
#include <stddef.h>

#define RC_OP_NOP         0x00
#define RC_OP_ANTI_DEBUG  0x01
#define RC_OP_LOAD_BYTES  0x02
#define RC_OP_XOR_SLOT    0x03
#define RC_OP_HASH_PKG    0x04
#define RC_OP_READ_ASSET  0x05
#define RC_OP_AES_DEC     0x06
#define RC_OP_EXTRACT_DEX 0x07
#define RC_OP_HALT        0x08
#define RC_OP_CHECK_SIG   0x09
#define RC_OP_B64_DEC     0x0A
#define RC_OP_B85_DEC     0x0B
#define RC_OP_MOV_SLOT    0x0C
#define RC_OP_ADD_SLOT    0x0D
#define RC_OP_SUB_SLOT    0x0E
#define RC_OP_ROL_SLOT    0x0F
#define RC_OP_NOT_SLOT    0x10
#define RC_OP_MEM_ZERO    0x11
#define RC_OP_JMP         0x12
#define RC_OP_JEQ         0x13
#define RC_OP_JNE         0x14
#define RC_OP_DEX_FIXUP   0x15

typedef struct {
    uint8_t *heap_bufs[16];
    size_t   heap_lens[16];
    JNIEnv   *env;
    jobject  context;
    int      dex_slot;
} obv_rc_vm_state;

int obv_rc_vm_run(obv_rc_vm_state *vm, const uint8_t *bytecode, size_t bc_len);

#endif
