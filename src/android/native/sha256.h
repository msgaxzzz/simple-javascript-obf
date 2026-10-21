#ifndef OBV_SHA256_H
#define OBV_SHA256_H

#include <stddef.h>
#include <stdint.h>

typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[64];
} obv_sha256_ctx;

void obv_sha256_init(obv_sha256_ctx *ctx);
void obv_sha256_update(obv_sha256_ctx *ctx, const uint8_t *data, size_t len);
void obv_sha256_final(obv_sha256_ctx *ctx, uint8_t hash[32]);
void obv_sha256_digest(const uint8_t *data, size_t len, uint8_t hash[32]);

#endif
