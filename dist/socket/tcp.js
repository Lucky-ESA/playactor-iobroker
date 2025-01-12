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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpDeviceSocket = void 0;
const debug_1 = __importDefault(require("debug"));
const net_1 = __importDefault(require("net"));
const model_1 = require("../discovery/model");
const async_1 = require("../util/async");
const base_1 = require("./base");
const model_2 = require("./model");
const v1_1 = require("./protocol/v1");
const protocolsByVersion = {
    [model_1.DeviceType.PS4]: v1_1.DeviceProtocolV1,
    [model_1.DeviceType.PS5]: undefined,
};
const debug = debug_1.default("playactor-iobroker:socket:tcp");
const defaultOptions = {
    refSocket: false,
};
class TcpDeviceSocket {
    constructor(device, protocol, stream, options = defaultOptions, initialCodec = model_2.PlaintextCodec, openedTimestamp = Date.now()) {
        this.device = device;
        this.protocol = protocol;
        this.stream = stream;
        this.options = options;
        this.openedTimestamp = openedTimestamp;
        this.receivers = [];
        this.stayAliveUntil = 0;
        this.isClosed = false;
        this.codec = initialCodec;
        this.processor = new base_1.BufferPacketProcessor(protocol, initialCodec, packet => this.onPacketReceived(packet));
        if (this.options.refSocket) {
            stream.ref();
        }
        stream.on("end", () => this.handleEnd());
        stream.on("error", err => this.handleEnd(err));
        stream.on("data", data => {
            debug("<<", data);
            this.processor.onDataReceived(data);
        });
    }
    static connectTo(device, config, options = defaultOptions) {
        const port = device.hostRequestPort;
        if (!port) {
            throw new Error(`No port known for protocol ${device.discoveryVersion}`);
        }
        const protocol = protocolsByVersion[device.type];
        if (!protocol) {
            throw new Error(`No protocol known device ${device.type}`);
        }
        return new Promise((resolve, reject) => {
            const socket = net_1.default.createConnection({
                port,
                host: device.address.address,
                timeout: config.connectTimeoutMillis,
            });
            socket.once("connect", () => {
                debug("socket connected!");
                socket.removeAllListeners("error");
                resolve(new TcpDeviceSocket(device, protocol, socket, options));
            });
            socket.once("error", err => {
                debug("error on socket:", err);
                reject(err);
            });
        });
    }
    get protocolVersion() {
        return this.protocol.version;
    }
    get isConnected() {
        return !this.isClosed;
    }
    execute(proc) {
        return proc.perform(this);
    }
    receive() {
        const receiver = new async_1.CancellableAsyncSink();
        receiver.onCancel = () => {
            const idx = this.receivers.indexOf(receiver);
            if (idx !== -1) {
                this.receivers.splice(idx, 1);
            }
        };
        this.receivers.push(receiver);
        return receiver;
    }
    requestKeepAlive(extraLifeMillis) {
        this.stayAliveUntil = Math.max(this.stayAliveUntil, Date.now() + extraLifeMillis);
    }
    send(packet) {
        const buffer = packet.toBuffer();
        const encoded = this.codec.encode(buffer);
        if (encoded === buffer) {
            debug(">>", packet, "(", buffer, ")");
        }
        else {
            debug(">>", packet, ": ", buffer);
        }
        return new Promise((resolve, reject) => {
            this.stream.write(encoded, err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    setCodec(codec) {
        debug("switch to codec:", codec);
        this.codec = codec;
        this.processor.setCodec(codec);
    }
    close() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            debug("close()");
            const extraLife = this.stayAliveUntil - Date.now();
            if (extraLife > 0) {
                debug("waiting", extraLife, "millis before closing");
                yield async_1.delayMillis(extraLife);
            }
            if (this.options.refSocket) {
                this.stream.unref();
            }
            const politeDisconnect = this.protocol.requestDisconnect;
            if (politeDisconnect) {
                debug("requesting polite disconnect");
                yield politeDisconnect(this);
                try {
                    for (var _b = __asyncValues(this.receive()), _c; _c = yield _b.next(), !_c.done;) {
                        const packet = _c.value;
                        debug("received while awaiting close:", packet);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                this.stream.destroy();
            }
        });
    }
    onPacketReceived(packet) {
        var _a, _b;
        (_b = (_a = this.protocol).onPacketReceived) === null || _b === void 0 ? void 0 : _b.call(_a, this, packet).catch(err => {
            debug("protocol error from", packet, ":", err);
            if (!this.isConnected) {
                throw err;
            }
        });
        for (const receiver of this.receivers) {
            receiver.write(packet);
        }
    }
    handleEnd(err) {
        debug("socket closed:", err);
        this.isClosed = true;
        for (const receiver of this.receivers) {
            receiver.end(err);
        }
    }
}
exports.TcpDeviceSocket = TcpDeviceSocket;
