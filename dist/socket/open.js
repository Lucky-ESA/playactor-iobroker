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
exports.openSocket = exports.ConnectionRefusedError = void 0;
const debug_1 = __importDefault(require("debug"));
const model_1 = require("../connection/model");
const model_2 = require("../discovery/model");
const protocol_1 = require("../protocol");
const async_1 = require("../util/async");
const model_3 = require("./model");
const handshake_1 = require("./proc/handshake");
const login_1 = require("./proc/login");
const tcp_1 = require("./tcp");
const debug = debug_1.default("playactor-iobroker:socket:open");
/**
 * If thrown when trying to authenticate, the device has probably
 * closed the socket and, because we're not authenticated, will
 * be unable to do so.
 */
class ConnectionRefusedError extends Error {
    constructor() {
        super("Connection refused; if unauthenticated, try restarting the device");
    }
}
exports.ConnectionRefusedError = ConnectionRefusedError;
function openConnection(device, config) {
    switch (device.type) {
        case model_2.DeviceType.PS4:
            return tcp_1.TcpDeviceSocket.connectTo(device, config);
        default:
            throw new model_1.UnsupportedDeviceError();
    }
}
function attemptOpen(waker, device, credentials, config, loginConfig = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        // send some packets to make sure the device is willing to accept our
        // TCP connection
        debug("requesting device wake up to ensure socket availability");
        const credsRecord = credentials;
        yield waker.sendTo(device, protocol_1.formatDiscoveryMessage({
            data: credsRecord,
            type: "WAKEUP",
            version: device.discoveryVersion,
        }));
        yield waker.sendTo(device, protocol_1.formatDiscoveryMessage({
            data: credsRecord,
            type: "LAUNCH",
            version: device.discoveryVersion,
        }));
        // slight delay to give it a chance to respond
        yield async_1.delayMillis(250);
        waker.close();
        debug("attempting to open socket...");
        const socket = yield openConnection(device, config);
        debug("performing handshake and login...");
        yield socket.execute(new handshake_1.HandshakeProc());
        yield socket.execute(new login_1.LoginProc(credentials, loginConfig));
        return socket;
    });
}
function isRetryable(error) {
    return error.code === "ECONNREFUSED";
}
function openSocket(wakerFactory, device, credentials, socketConfig = {}, networkConfig = {}, loginConfig = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const mySocketConfig = Object.assign(Object.assign({}, model_3.defaultSocketConfig), socketConfig);
        let wasRefused = false;
        for (let i = 0; i < mySocketConfig.maxRetries; ++i) {
            /* eslint-disable no-await-in-loop */
            const waker = wakerFactory.create(networkConfig);
            try {
                return yield attemptOpen(waker, device, credentials, mySocketConfig, loginConfig);
            }
            catch (e) {
                const err = e;
                wasRefused = wasRefused || err.message === "ECONNREFUSED";
                if (isRetryable(e) && i + 1 !== mySocketConfig.maxRetries) {
                    const backoff = mySocketConfig.retryBackoffMillis * (i + 1);
                    debug("encountered retryable error:", e);
                    debug("retrying after", backoff);
                    yield async_1.delayMillis(backoff);
                }
                else if (wasRefused) {
                    debug("can no longer retry (was refused): ", e);
                    throw new ConnectionRefusedError();
                }
                else {
                    debug("cannot retry:", e);
                    throw e;
                }
            }
        }
        throw new Error("Failed to open a connection");
    });
}
exports.openSocket = openSocket;
