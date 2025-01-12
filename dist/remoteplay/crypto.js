"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemotePlayCrypto = exports.pickCryptoStrategyForDevice = void 0;
const crypto_1 = __importDefault(require("crypto"));
const debug_1 = __importDefault(require("debug"));
const redact_1 = require("../util/redact");
const legacy_1 = require("./crypto/legacy");
const modern_1 = require("./crypto/modern");
const model_1 = require("./model");
const protocol_1 = require("./protocol");
const debug = debug_1.default("playactor-iobroker:remoteplay:crypto");
function generateNonce() {
    const nonce = Buffer.alloc(protocol_1.CRYPTO_NONCE_LENGTH);
    crypto_1.default.randomFillSync(nonce);
    return nonce;
}
function pickCryptoStrategyForDevice(device) {
    const version = model_1.remotePlayVersionFor(device);
    const strategy = version < model_1.RemotePlayVersion.PS4_10
        ? new legacy_1.LegacyCryptoStrategy(version)
        : new modern_1.ModernCryptoStrategy(device.type, version);
    debug("selected", strategy, "for remote play version", model_1.RemotePlayVersion[version]);
    return strategy;
}
exports.pickCryptoStrategyForDevice = pickCryptoStrategyForDevice;
class RemotePlayCrypto {
    constructor(codec, preface, nonce) {
        this.codec = codec;
        this.preface = preface;
        if (nonce.length !== protocol_1.CRYPTO_NONCE_LENGTH) {
            throw new Error(`Invalid nonce: ${nonce.toString("base64")}`);
        }
    }
    static forDeviceAndPin(device, pin, nonce = generateNonce()) {
        const strategy = pickCryptoStrategyForDevice(device);
        const { codec, preface } = strategy.createCodecForPin(pin, nonce);
        return new RemotePlayCrypto(codec, preface, nonce);
    }
    createSignedPayload(payload) {
        return this.encryptRecord(payload);
    }
    decrypt(payload) {
        return this.codec.decode(payload);
    }
    encryptRecord(record) {
        let formatted = "";
        for (const key of Object.keys(record)) {
            formatted += key;
            formatted += ": ";
            formatted += record[key];
            formatted += "\r\n";
        }
        const payload = Buffer.from(formatted, "utf-8");
        debug("formatted record:\n", redact_1.redact(formatted));
        debug("encrypting record:", redact_1.redact(payload.toString("hex")));
        debug("preface:", redact_1.redact(this.preface));
        const encodedPayload = this.codec.encode(payload);
        if (encodedPayload.length !== payload.length) {
            throw new Error(`${encodedPayload.length} !== ${payload.length}`);
        }
        return Buffer.concat([
            this.preface,
            encodedPayload,
        ]);
    }
}
exports.RemotePlayCrypto = RemotePlayCrypto;
