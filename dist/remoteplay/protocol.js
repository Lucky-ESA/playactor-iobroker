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
exports.RemotePlayDeviceProtocol = exports.RemotePlayPacketReader = exports.urlWith = exports.typedPath = exports.request = exports.parseBody = exports.parseHexBytes = exports.padBuffer = exports.CRYPTO_NONCE_LENGTH = exports.REST_PORT = void 0;
const debug_1 = __importDefault(require("debug"));
const got_1 = __importDefault(require("got"));
const base_1 = require("../socket/protocol/base");
const redact_1 = require("../util/redact");
const model_1 = require("./model");
const packets_1 = require("./packets");
const login_result_1 = require("./packets/login-result");
const passcode_request_1 = require("./packets/passcode-request");
const debug = debug_1.default("playactor-iobroker:remoteplay:protocol");
exports.REST_PORT = 9295;
exports.CRYPTO_NONCE_LENGTH = 16;
function padBuffer(buffer, expectedBytes = exports.CRYPTO_NONCE_LENGTH) {
    if (buffer.length > expectedBytes) {
        throw new Error(`Expected ${expectedBytes} but buffer was ${buffer.length}`);
    }
    return Buffer.concat([
        buffer,
        Buffer.alloc(expectedBytes - buffer.length, 0),
    ]);
}
exports.padBuffer = padBuffer;
function parseHexBytes(data) {
    const buffer = Buffer.alloc(data.length / 2);
    for (let i = 0; i < data.length; i += 2) {
        const byteAsString = data.slice(i, i + 2);
        const byte = parseInt(byteAsString, 16);
        buffer.writeUInt8(byte, i / 2);
    }
    return buffer;
}
exports.parseHexBytes = parseHexBytes;
function parseBody(body) {
    const message = body.toString("utf-8");
    return message.split("\r\n").reduce((m, line) => {
        /* eslint-disable no-param-reassign */
        const [k, v] = line.split(":");
        if (v) {
            m[k] = v.trim();
        }
        return m;
        /* eslint-enable no-param-reassign */
    }, {});
}
exports.parseBody = parseBody;
function request(url, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (debug.enabled) {
            debug("performing ", (_a = options.method) !== null && _a !== void 0 ? _a : "GET", url);
            const withoutAgent = Object.assign({}, options);
            delete withoutAgent.agent;
            debug(redact_1.redact(withoutAgent));
        }
        const headers = Object.assign({ "User-Agent": "remoteplay Windows" }, options.headers);
        if (!headers["Content-Length"] && !options.method) {
            // NOTE: We *must* specify Content-Length: 0 for GET requests,
            // or else get a 403 response for some reason
            headers["Content-Length"] = "0";
        }
        debug("combined request headers:", redact_1.redact(headers));
        const result = yield got_1.default(url, Object.assign(Object.assign({}, options), { headers, decompress: false, responseType: "buffer", throwHttpErrors: false }));
        debug("result headers:", redact_1.redact(result.headers));
        debug("result body:", redact_1.redact(result.body.toString("base64")));
        if (result.statusCode >= 300) {
            let message = `Registration error: ${result.statusCode}: ${result.statusMessage}`;
            const reasonCode = result.headers["rp-application-reason"];
            if (reasonCode && !Array.isArray(reasonCode)) {
                const reason = model_1.errorReasonString(reasonCode);
                if (reason) {
                    message += `: ${reason}`;
                }
            }
            throw new Error(message);
        }
        return result;
    });
}
exports.request = request;
function typedPath(device, path) {
    return path.replace(":type", device.type.toLowerCase());
}
exports.typedPath = typedPath;
function urlWith(device, path) {
    return `http://${device.address.address}:${exports.REST_PORT}${path}`;
}
exports.urlWith = urlWith;
const PACKET_TYPE_OFFSET = 4;
class RemotePlayPacketReader extends base_1.TypedPacketReader {
    constructor() {
        super({
            [packets_1.RemotePlayResponseType.Login]: login_result_1.RemotePlayLoginResultPacket,
            [packets_1.RemotePlayResponseType.Passcode]: passcode_request_1.RemotePlayPasscodeRequestPacket,
        }, new base_1.LengthDelimitedBufferReader({
            minPacketLength: 8,
            lengthIncludesHeader: false,
            littleEndian: false,
        }));
    }
    readType(buffer) {
        return buffer.readInt16BE(PACKET_TYPE_OFFSET);
    }
    createDefaultPacket(type, buffer) {
        return new packets_1.RemotePlayIncomingPacket(type, buffer);
    }
}
exports.RemotePlayPacketReader = RemotePlayPacketReader;
exports.RemotePlayDeviceProtocol = {
    version: { major: 10, minor: 0 },
    createPacketReader() {
        return new RemotePlayPacketReader();
    },
    onPacketReceived(socket, packet) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (packet.type) {
                case packets_1.RemotePlayResponseType.Heartbeat:
                    yield socket.send(new packets_1.RemotePlayOutgoingPacket(packets_1.RemotePlayCommand.Heartbeat));
                    break;
            }
        });
    },
};
