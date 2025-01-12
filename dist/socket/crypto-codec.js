"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoCodec = void 0;
const crypto_1 = __importDefault(require("crypto"));
const debug_1 = __importDefault(require("debug"));
const CRYPTO_ALGORITHM = "aes-128-cbc";
// I don't think true randomness is required
const randomSeed = Buffer.alloc(16, 0);
const debug = debug_1.default("playactor-iobroker:socket:crypto");
class CryptoCodec {
    constructor(initVector, seed = randomSeed, algorithm = CRYPTO_ALGORITHM) {
        this.initVector = initVector;
        this.seed = seed;
        this.algorithm = algorithm;
        this.paddingSize = 16;
        this.cipher = crypto_1.default.createCipheriv(algorithm, seed, initVector);
        this.decipher = crypto_1.default.createDecipheriv(this.algorithm, this.seed, this.initVector);
        this.decipher.setAutoPadding(false);
        this.padEncoding = algorithm === CRYPTO_ALGORITHM;
        if (!this.padEncoding) {
            this.cipher.setAutoPadding(false);
        }
        this.chunkDecoding = this.padEncoding;
    }
    encode(packet) {
        if (this.padEncoding) {
            /* eslint-disable no-bitwise */
            // pad the input the same way the client app does
            const newLen = 1 + (packet.length - 1) / 16 << 4;
            const bytes = Buffer.alloc(newLen);
            packet.copy(bytes, 0, 0, packet.length);
            return this.cipher.update(bytes);
            /* eslint-enable no-bitwise */
        }
        return this.cipher.update(packet);
    }
    decode(packet) {
        const { pending } = this;
        const p = pending ? Buffer.concat([pending, packet]) : packet;
        this.pending = undefined;
        // decipher in 16-byte chunks (if chunkDecoding is true)
        if (this.chunkDecoding && p.length < 16) {
            debug("wait for 16-byte chunk");
            this.pending = p;
            return Buffer.from([]);
        }
        const availableBytes = this.chunkDecoding
            ? Math.floor(p.length / 16) * 16
            : p.length;
        if (availableBytes === 0) {
            return Buffer.from([]);
        }
        const decodable = p.slice(0, availableBytes);
        this.pending = availableBytes < p.length
            ? p.slice(availableBytes)
            : undefined;
        debug("decoding", availableBytes, " of ", p.length, "total buffered");
        return this.decipher.update(decodable);
    }
}
exports.CryptoCodec = CryptoCodec;
