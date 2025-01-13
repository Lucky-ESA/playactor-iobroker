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
exports.SimpleWakerFactory = exports.Waker = exports.WakeResult = void 0;
const debug_1 = __importDefault(require("debug"));
const discovery_1 = require("./discovery");
const model_1 = require("./discovery/model");
const standard_1 = require("./discovery/standard");
const protocol_1 = require("./protocol");
const redact_1 = require("./util/redact");
const udp_1 = require("./waker/udp");
const debug = debug_1.default("playactor-iob:waker");
var WakeResult;
(function (WakeResult) {
    WakeResult[WakeResult["ALREADY_AWAKE"] = 0] = "ALREADY_AWAKE";
    WakeResult[WakeResult["SUCCESS"] = 1] = "SUCCESS";
})(WakeResult = exports.WakeResult || (exports.WakeResult = {}));
class Waker {
    constructor(credentials, discoveryConfig, networkFactory = new udp_1.UdpWakerNetworkFactory(), discoveryFactory = standard_1.StandardDiscoveryNetworkFactory) {
        this.credentials = credentials;
        this.discoveryConfig = discoveryConfig;
        this.networkFactory = networkFactory;
        this.discoveryFactory = discoveryFactory;
    }
    wake(device, config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device.status === model_1.DeviceStatus.AWAKE) {
                debug("device", redact_1.redact(device), "is already awake");
                return WakeResult.ALREADY_AWAKE;
            }
            debug("loading credentials");
            const creds = yield this.credentials.getForDevice(device);
            const network = this.networkFactory.create(config);
            try {
                // TODO perhaps we should retry this periodically?
                debug("sending WAKEUP");
                const message = protocol_1.formatDiscoveryMessage({
                    data: creds,
                    type: "WAKEUP",
                    version: device.discoveryVersion,
                });
                debug("sending:", redact_1.redact(message.toString("hex")));
                yield network.sendTo(device, message);
                yield this.deviceAwakened(device, config);
                return WakeResult.SUCCESS;
            }
            finally {
                network.close();
            }
        });
    }
    deviceAwakened(device, config) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const discovery = new discovery_1.Discovery(this.discoveryConfig, this.discoveryFactory);
            debug("waiting for ", redact_1.redact(device), "to become awake");
            try {
                for (var _b = __asyncValues(discovery.discover(config, { uniqueDevices: false })), _c; _c = yield _b.next(), !_c.done;) {
                    const d = _c.value;
                    if (d.id === device.id && d.status === model_1.DeviceStatus.AWAKE) {
                        debug("received AWAKE status:", redact_1.redact(d));
                        return;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            throw new Error("Device didn't wake in time");
        });
    }
}
exports.Waker = Waker;
class SimpleWakerFactory {
    constructor(config) {
        this.config = config;
    }
    create() {
        return new Waker(this.config.credentials, this.config.discoveryConfig, this.config.networkFactory, this.config.discoveryFactory);
    }
}
exports.SimpleWakerFactory = SimpleWakerFactory;
