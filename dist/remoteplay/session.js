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
exports.openSession = void 0;
const debug_1 = __importDefault(require("debug"));
const http_1 = __importDefault(require("http"));
const tcp_1 = require("../socket/tcp");
const codec_1 = require("./codec");
const crypto_1 = require("./crypto");
const model_1 = require("./model");
const login_1 = require("./proc/login");
const protocol_1 = require("./protocol");
const debug = debug_1.default("playactor-iob:remoteplay:session");
const DID_PREFIX = Buffer.from([
    0x00, 0x18, 0x00, 0x00, 0x00, 0x07, 0x00, 0x40, 0x00, 0x80,
]);
const DID_SUFFIX = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const OS_TYPE = "Win10.0.0";
/**
 * Step 1: initialize the session and fetch the "server nonce" value
 */
function initializeSession(device, creds) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const version = model_1.remotePlayVersionFor(device);
        const path = version < model_1.RemotePlayVersion.PS4_10
            ? "/sce/rp/session" // PS4 with system version < 8.0
            : protocol_1.typedPath(device, "/sie/:type/rp/sess/init");
        const registKey = (_a = creds.registration["PS5-RegistKey"]) !== null && _a !== void 0 ? _a : creds.registration["PS4-RegistKey"];
        if (!registKey) {
            throw new Error("Invalid credentials: missing RegistKey");
        }
        const response = yield protocol_1.request(protocol_1.urlWith(device, path), {
            headers: {
                "RP-RegistKey": registKey,
                "RP-Version": model_1.remotePlayVersionToString(version),
            },
        });
        const nonceBase64 = response.headers["rp-nonce"];
        debug("session init nonce=", nonceBase64);
        if (typeof nonceBase64 !== "string") {
            throw new Error(`Unexpected nonce format: "${nonceBase64}"`);
        }
        const nonce = Buffer.from(nonceBase64, "base64");
        if (nonce.length !== protocol_1.CRYPTO_NONCE_LENGTH) {
            throw new Error(`Unexpected nonce length: ${nonce.length}`);
        }
        return nonce;
    });
}
function urlFor(device) {
    const version = model_1.remotePlayVersionFor(device);
    const path = version < model_1.RemotePlayVersion.PS4_10
        ? "/sce/rp/session/ctrl" // PS4 with system version < 8.0
        : protocol_1.typedPath(device, "/sie/:type/rp/sess/ctrl");
    return protocol_1.urlWith(device, path);
}
function openControlSocket(device, creds, nonce) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const codec = new codec_1.RemotePlayPacketCodec(crypto_1.pickCryptoStrategyForDevice(device), creds, nonce);
        const registKey = (_a = creds.registration["PS5-RegistKey"]) !== null && _a !== void 0 ? _a : creds.registration["PS4-RegistKey"];
        if (!registKey) {
            throw new Error("Missing RegistKey?");
        }
        // "device ID"? Seems to just be random bytes with some
        // prefix and suffix
        const did = Buffer.concat([
            DID_PREFIX,
            Buffer.alloc(16),
            DID_SUFFIX,
        ]);
        function encrypt(data) {
            return codec.encodeBuffer(data).toString("base64");
        }
        const version = model_1.remotePlayVersionFor(device);
        const headers = {
            "RP-Auth": encrypt(protocol_1.padBuffer(protocol_1.parseHexBytes(registKey), protocol_1.CRYPTO_NONCE_LENGTH)),
            "RP-Version": model_1.remotePlayVersionToString(version),
            "RP-Did": encrypt(did),
            "RP-ControllerType": "3",
            "RP-ClientType": "11",
            "RP-OSType": encrypt(Buffer.from(OS_TYPE, "utf-8")),
            "RP-ConPath": "1",
        };
        if (version >= model_1.RemotePlayVersion.PS4_10) {
            headers["RP-StartBitrate"] = encrypt(Buffer.alloc(4, 0));
            const typeBuffer = Buffer.alloc(4, 0);
            typeBuffer.writeInt32LE(1);
            headers["RP-StreamingType"] = encrypt(typeBuffer);
        }
        const agent = new http_1.default.Agent({
            keepAlive: true,
            timeout: 30000,
        });
        debug("sending session control request...");
        const response = yield protocol_1.request(urlFor(device), {
            agent: {
                http: agent,
            },
            headers,
        });
        function decrypt(map, name) {
            const value = map[name];
            if (typeof value !== "string") {
                throw new Error(`Missing required response header ${name}`);
            }
            return codec.decodeBuffer(Buffer.from(value, "base64"));
        }
        const serverType = decrypt(response.headers, "rp-server-type");
        debug("received server type=", serverType);
        // NOTE: response.socket SHOULD never be null, per its typing and documentation,
        // but apparently it can be on at least Node v14+. request.socket seems to work
        // on these versions, but is explicitly typed as optional.
        const socket = (_b = response.request.socket) !== null && _b !== void 0 ? _b : response.socket;
        // take ownership of the socket
        socket.removeAllListeners();
        socket.ref();
        return new tcp_1.TcpDeviceSocket(device, protocol_1.RemotePlayDeviceProtocol, socket, {
            refSocket: true,
        }, codec);
    });
}
function openSession(device, config, creds) {
    return __awaiter(this, void 0, void 0, function* () {
        const nonce = yield initializeSession(device, creds);
        const socket = yield openControlSocket(device, creds, nonce);
        yield socket.execute(new login_1.RemotePlayLoginProc(config));
        debug("RemotePlaySession ready!");
        return socket;
    });
}
exports.openSession = openSession;
