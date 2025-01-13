"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandshakeProc = void 0;
const debug_1 = __importDefault(require("debug"));
const node_rsa_1 = __importDefault(require("node-rsa"));
const crypto_codec_1 = require("../crypto-codec");
const helpers_1 = require("../helpers");
const client_hello_1 = require("../packets/outgoing/client-hello");
const handshake_1 = require("../packets/outgoing/handshake");
const types_1 = require("../packets/types");
const debug = debug_1.default("playactor-iob:proc:handshake");
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxfAO/MDk5ovZpp7xlG9J
JKc4Sg4ztAz+BbOt6Gbhub02tF9bryklpTIyzM0v817pwQ3TCoigpxEcWdTykhDL
cGhAbcp6E7Xh8aHEsqgtQ/c+wY1zIl3fU//uddlB1XuipXthDv6emXsyyU/tJWqc
zy9HCJncLJeYo7MJvf2TE9nnlVm1x4flmD0k1zrvb3MONqoZbKb/TQVuVhBv7SM+
U5PSi3diXIx1Nnj4vQ8clRNUJ5X1tT9XfVmKQS1J513XNZ0uYHYRDzQYujpLWucu
ob7v50wCpUm3iKP1fYCixMP6xFm0jPYz1YQaMV35VkYwc40qgk3av0PDS+1G0dCm
swIDAQAB
-----END PUBLIC KEY-----`;
class HandshakeProc {
    perform(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const greeting = yield helpers_1.performRpc(socket, new client_hello_1.ClientHelloPacket(socket.protocolVersion), types_1.PacketType.Hello);
            debug("received greeting:", greeting);
            // prepare crypto with the "seed" in `greeting`
            const crypto = new crypto_codec_1.CryptoCodec(greeting.seed);
            // sign our "random key" with the public key
            const key = this.signWithPublicKey(crypto.seed);
            yield socket.send(new handshake_1.HandshakePacket(key, greeting.seed));
            // set crypto *after* responding with the handshake
            socket.setCodec(crypto);
        });
    }
    // public for testing
    signWithPublicKey(bytes) {
        const publicKey = new node_rsa_1.default(PUBLIC_KEY, "pkcs8-public");
        return publicKey.encrypt(bytes);
    }
}
exports.HandshakeProc = HandshakeProc;
