#ifndef OBV_AES_H
#define OBV_AES_H

#include <stddef.h>
#include <stdint.h>

int obv_aes_256_cbc_decrypt(
    const uint8_t *ciphertext,
    size_t ct_len,
    const uint8_t key[32],
    const uint8_t iv[16],
    uint8_t *plaintext,
    size_t *pt_len
);

#endif
