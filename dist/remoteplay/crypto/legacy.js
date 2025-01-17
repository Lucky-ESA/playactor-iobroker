"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyCryptoStrategy = void 0;
const base_1 = require("./base");
const KEY_SIZE = 16;
const AES_KEY = "3f1cc4b6dcbb3ecc50baedef9734c7c9";
function generateSeed(pin) {
    /* eslint-disable no-bitwise */
    const seed = Buffer.from(AES_KEY, "hex");
    seed[0] ^= (pin >> 0x18) & 0xff;
    seed[1] ^= (pin >> 0x10) & 0xff;
    seed[2] ^= (pin >> 0x08) & 0xff;
    seed[3] ^= (pin >> 0x00) & 0xff;
    return seed;
    /* eslint-enable no-bitwise */
}
const ECHO_A = [
    0x01, 0x49, 0x87, 0x9b, 0x65, 0x39, 0x8b, 0x39,
    0x4b, 0x3a, 0x8d, 0x48, 0xc3, 0x0a, 0xef, 0x51,
];
const ECHO_B = [
    0xe1, 0xec, 0x9c, 0x3a, 0xdd, 0xbd, 0x08, 0x85,
    0xfc, 0x0e, 0x1d, 0x78, 0x90, 0x32, 0xc0, 0x04,
];
function aeropause(padding, offset, nonce) {
    /* eslint-disable no-bitwise, no-param-reassign */
    for (let i = 0; i < KEY_SIZE; ++i) {
        padding[offset + i] = (nonce[i] - i - 0x29) ^ ECHO_B[i];
    }
    /* eslint-enable no-bitwise, no-param-reassign */
}
class LegacyCryptoStrategy extends base_1.BaseCryptoStrategy {
    generatePinSeed(_padding, pinNumber) {
        return generateSeed(pinNumber);
    }
    signPadding(nonce, padding) {
        const AEROPAUSE_DESTINATION = 0x11c;
        aeropause(padding, AEROPAUSE_DESTINATION, nonce);
    }
    /* eslint-disable no-bitwise */
    generateAuthSeed(key, serverNonce) {
        return Buffer.from(key.map((keyValue, i) => ((keyValue - i + 0x34) ^ ECHO_B[i]) ^ serverNonce[i]).buffer);
    }
    transformServerNonceForAuth(serverNonce) {
        return Buffer.from(serverNonce.map((nonceValue, i) => (nonceValue - i - 0x27) ^ ECHO_A[i]).buffer);
    }
}
exports.LegacyCryptoStrategy = LegacyCryptoStrategy;
