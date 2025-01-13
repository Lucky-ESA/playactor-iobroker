"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemotePlayPacketCodec = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default("playactor-iob:remoteplay:codec");
const HEADER_SIZE = 8;
class RemotePlayPacketCodec {
    constructor(crypto, creds, serverNonce) {
        this.crypto = crypto;
        this.creds = creds;
        this.serverNonce = serverNonce;
        this.encryptCounter = BigInt(0);
        this.decryptCounter = BigInt(0);
    }
    encode(packet) {
        if (packet.length === HEADER_SIZE) {
            debug("original: ", packet);
            debug(" encoded: (nop)");
            return packet;
        }
        const encoded = Buffer.concat([
            packet.slice(0, HEADER_SIZE),
            this.encodeBuffer(packet.slice(HEADER_SIZE)),
        ]);
        debug("original: ", packet);
        debug(" encoded: ", encoded);
        return encoded;
    }
    decode(packet) {
        // NOTE: baking the header read into this codec like we're doing here
        // is not ideal, but it's important to avoid double/over-decoding
        if (packet.length < HEADER_SIZE) {
            return packet;
        }
        const length = packet.readUInt32BE();
        if (packet.length < HEADER_SIZE + length) {
            return packet;
        }
        if (!length) {
            return packet;
        }
        return Buffer.concat([
            packet.slice(0, HEADER_SIZE),
            this.decodeBuffer(packet.slice(HEADER_SIZE, HEADER_SIZE + length)),
            packet.slice(HEADER_SIZE + length),
        ]);
    }
    encodeBuffer(buffer) {
        const codec = this.crypto.createCodecForAuth(this.creds, this.serverNonce, this.encryptCounter++);
        return codec.encode(buffer);
    }
    decodeBuffer(buffer) {
        const codec = this.crypto.createCodecForAuth(this.creds, this.serverNonce, this.decryptCounter++);
        return codec.decode(buffer);
    }
}
exports.RemotePlayPacketCodec = RemotePlayPacketCodec;
