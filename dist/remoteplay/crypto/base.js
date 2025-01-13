"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCryptoStrategy = exports.generateIv = void 0;
const crypto_1 = __importDefault(require("crypto"));
const debug_1 = __importDefault(require("debug"));
const crypto_codec_1 = require("../../socket/crypto-codec");
const model_1 = require("../model");
const protocol_1 = require("../protocol");
const debug = debug_1.default("playactor-iob:remoteplay:crypto:base");
const CRYPTO_ALGORITHM = "aes-128-cfb";
const PADDING_BYTES = 480;
const hmacKeys = {
    [model_1.RemotePlayVersion.PS5_1]: "464687b349ca8ce859c5270f5d7a69d6",
    [model_1.RemotePlayVersion.PS4_10]: "20d66f5904ea7c14e557ffc52e488ac8",
    [model_1.RemotePlayVersion.PS4_9]: "ac078883c83a1fe811463af39ee3e377",
    [model_1.RemotePlayVersion.PS4_8]: "ac078883c83a1fe811463af39ee3e377",
};
// NOTE: public for testing
function generateIv(version, nonce, counter) {
    const counterBuffer = Buffer.alloc(8, "binary");
    counterBuffer.writeBigUInt64BE(counter);
    const hmacKey = hmacKeys[version];
    const hmac = crypto_1.default.createHmac("sha256", Buffer.from(hmacKey, "hex"));
    hmac.update(nonce);
    hmac.update(counterBuffer);
    const digest = hmac.digest();
    return digest.slice(0, protocol_1.CRYPTO_NONCE_LENGTH);
}
exports.generateIv = generateIv;
class BaseCryptoStrategy {
    constructor(version) {
        this.version = version;
    }
    createCodecForPin(pin, nonce) {
        const pinNumber = parseInt(pin, 10);
        const preface = Buffer.alloc(PADDING_BYTES).fill("A");
        const iv = generateIv(this.version, nonce, /* counter = */ BigInt(0));
        const seed = this.generatePinSeed(preface, pinNumber);
        this.signPadding(nonce, preface);
        const codec = new crypto_codec_1.CryptoCodec(iv, seed, CRYPTO_ALGORITHM);
        return {
            preface,
            codec,
        };
    }
    createCodecForAuth(creds, serverNonce, counter) {
        // this is known as "morning" to chiaki for some reason
        const key = protocol_1.parseHexBytes(creds.registration["RP-Key"]);
        if (key.length !== protocol_1.CRYPTO_NONCE_LENGTH) {
            debug("got RP-Key", key);
            debug("   length:", key.length);
            throw new Error("Invalid RP Key; try deleting credentials and performing auth again");
        }
        const seed = this.generateAuthSeed(key, serverNonce);
        const nonce = this.transformServerNonceForAuth(serverNonce);
        const iv = generateIv(this.version, nonce, counter);
        return new crypto_codec_1.CryptoCodec(iv, seed, CRYPTO_ALGORITHM);
    }
}
exports.BaseCryptoStrategy = BaseCryptoStrategy;
