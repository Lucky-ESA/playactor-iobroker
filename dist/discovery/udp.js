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
exports.UdpDiscoveryNetworkFactory = exports.UdpDiscoveryNetwork = void 0;
const debug_1 = __importDefault(require("debug"));
const dgram_1 = __importDefault(require("dgram"));
const protocol_1 = require("../protocol");
const redact_1 = require("../util/redact");
const messages_1 = require("./messages");
const model_1 = require("./model");
const debug = debug_1.default("playactor-iobroker:discovery:udp");
const BROADCAST_ADDRESS = "255.255.255.255";
class UdpSocketManager {
    constructor() {
        this.sockets = {};
    }
    acquire(port) {
        debug("acquire @", port);
        const existing = this.sockets[port];
        if (existing) {
            ++existing.references;
            return { socket: existing.socket };
        }
        const managed = {
            socket: dgram_1.default.createSocket("udp4"),
            references: 1,
        };
        this.sockets[port] = managed;
        return {
            socket: managed.socket,
            isNew: true,
        };
    }
    release(port) {
        debug("release @", port);
        const managed = this.sockets[port];
        if (!managed) {
            throw new Error("Unbalanced release()");
        }
        const remainingReferences = --managed.references;
        if (!remainingReferences) {
            delete this.sockets[port];
            managed.socket.close();
        }
    }
}
class UdpDiscoveryNetwork {
    constructor(socketManager, boundPort, socket, port, version) {
        this.socketManager = socketManager;
        this.boundPort = boundPort;
        this.socket = socket;
        this.port = port;
        this.version = version;
    }
    close() {
        debug("closing udp network");
        this.socketManager.release(this.boundPort);
    }
    ping(deviceIp) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.send(deviceIp !== null && deviceIp !== void 0 ? deviceIp : BROADCAST_ADDRESS, this.port, "SRCH");
        });
    }
    send(recipientAddress, recipientPort, type, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = protocol_1.formatDiscoveryMessage({
                data,
                type,
                version: this.version,
            });
            return this.sendBuffer(recipientAddress, recipientPort, message);
        });
    }
    sendBuffer(recipientAddress, recipientPort, message) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("send:", redact_1.redact(message.toString("hex")), " to ", recipientAddress, ":", recipientPort);
            this.socket.send(message, recipientPort, recipientAddress);
        });
    }
}
exports.UdpDiscoveryNetwork = UdpDiscoveryNetwork;
function extractDeviceExtras(message) {
    const extras = {};
    for (const key of Object.keys(message.data)) {
        if (!(key === "type" || model_1.isDiscoveryKey(key))) {
            const value = message.data[key];
            if (value !== undefined) {
                extras[key] = value;
            }
        }
    }
    return extras;
}
const singletonUdpSocketManager = new UdpSocketManager();
class UdpDiscoveryNetworkFactory {
    constructor(port, version, socketManager = singletonUdpSocketManager) {
        this.port = port;
        this.version = version;
        this.socketManager = socketManager;
    }
    createMessages(config, onMessage) {
        return this.createRawMessages(config, (buffer, rinfo) => {
            try {
                const parsed = messages_1.parseMessage(buffer);
                onMessage({
                    type: parsed.type,
                    sender: rinfo,
                    version: this.version,
                    data: parsed,
                });
            }
            catch (err) {
                debug("failed to parse message:", err);
            }
        });
    }
    createRawMessages(config, onMessage) {
        var _a;
        const bindPort = (_a = config.localBindPort) !== null && _a !== void 0 ? _a : 0;
        const { socket, isNew } = this.socketManager.acquire(bindPort);
        socket.on("message", onMessage);
        if (isNew) {
            debug("created new socket for ", config);
            socket.on("listening", () => {
                debug("listening on ", socket.address());
            });
            socket.bind(config.localBindPort, config.localBindAddress, () => {
                socket.setBroadcast(true);
            });
        }
        else {
            debug("joining existing socket for ", config);
        }
        return new UdpDiscoveryNetwork(this.socketManager, bindPort, socket, this.port, this.version);
    }
    createDevices(config, onDevice) {
        return this.createMessages(config, message => {
            var _a;
            if (message.type === "DEVICE") {
                debug("received device:", redact_1.redact(message));
                onDevice({
                    address: message.sender,
                    hostRequestPort: parseInt(message.data["host-request-port"], 10),
                    extras: extractDeviceExtras(message),
                    discoveryVersion: (_a = message.data["device-discovery-protocol-version"]) !== null && _a !== void 0 ? _a : message.version,
                    systemVersion: message.data["system-version"],
                    id: message.data["host-id"],
                    name: message.data["host-name"],
                    status: message.data.status,
                    type: message.data["host-type"],
                });
            }
        });
    }
}
exports.UdpDiscoveryNetworkFactory = UdpDiscoveryNetworkFactory;
