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
exports.MimCredentialRequester = void 0;
const debug_1 = __importDefault(require("debug"));
const async_1 = require("../util/async");
const udp_1 = require("../waker/udp");
const defaultEmulatorOptions = {
    hostId: "1234567890AB",
    hostName: "PlayActor-iob",
};
const debug = debug_1.default("playactor-iob:credentials:mim");
/**
 * The MimCredentialRequester works by emulating a PlayStation device
 * on the network that the PlayStation App can connect to. It then
 * acts as a "man in the middle" to intercept the credentials that
 * the app is passing.
 */
class MimCredentialRequester {
    constructor(networkFactory, networkConfig, io, emulatorOptions = {}) {
        this.networkFactory = networkFactory;
        this.networkConfig = networkConfig;
        this.io = io;
        this.emulatorOptions = Object.assign(Object.assign({}, defaultEmulatorOptions), emulatorOptions);
    }
    requestForDevice(device) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const sink = new async_1.CancellableAsyncSink();
            const localBindPort = udp_1.wakePortsByType[device.type];
            if (!localBindPort) {
                throw new Error(`Unexpected discovery protocol: ${device.discoveryVersion}`);
            }
            const network = this.networkFactory.createMessages(Object.assign(Object.assign({}, this.networkConfig), { localBindPort }), message => {
                debug("received:", message);
                sink.write(message);
            });
            sink.onCancel = () => network.close();
            (_a = this.io) === null || _a === void 0 ? void 0 : _a.logInfo("Registering with device via Second Screen.");
            (_b = this.io) === null || _b === void 0 ? void 0 : _b.logInfo("Open the PS4 Second Screen app and attempt to connect to the device named:");
            (_c = this.io) === null || _c === void 0 ? void 0 : _c.logInfo(`  ${this.emulatorOptions.hostName}`);
            debug("emulating device", this.emulatorOptions, "awaiting WAKE...");
            return this.emulateUntilWoken(sink, network, device.type, localBindPort);
        });
    }
    emulateUntilWoken(incomingMessages, network, hostType, localBindPort) {
        var incomingMessages_1, incomingMessages_1_1;
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const searchStatus = "HTTP/1.1 620 Server Standby";
            const searchResponse = {
                "host-id": this.emulatorOptions.hostId,
                "host-name": this.emulatorOptions.hostName,
                "host-request-port": localBindPort,
                "host-type": hostType,
            };
            try {
                for (incomingMessages_1 = __asyncValues(incomingMessages); incomingMessages_1_1 = yield incomingMessages_1.next(), !incomingMessages_1_1.done;) {
                    const message = incomingMessages_1_1.value;
                    const { sender } = message;
                    switch (message.type) {
                        case "SRCH":
                            debug("respond to SRCH request from", sender);
                            yield network.send(sender.address, sender.port, searchStatus, searchResponse);
                            break;
                        case "WAKEUP":
                            debug("received WAKEUP from", sender);
                            return message.data;
                        default:
                            break; // nop
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (incomingMessages_1_1 && !incomingMessages_1_1.done && (_a = incomingMessages_1.return)) yield _a.call(incomingMessages_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            throw new Error("No credentials received");
        });
    }
}
exports.MimCredentialRequester = MimCredentialRequester;
