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
exports.UdpWakerNetworkFactory = exports.UdpWakerNetwork = exports.wakePortsByType = void 0;
const debug_1 = __importDefault(require("debug"));
const dgram_1 = __importDefault(require("dgram"));
const model_1 = require("../discovery/model");
exports.wakePortsByType = {
    [model_1.DeviceType.PS4]: 987,
    [model_1.DeviceType.PS5]: 9302,
};
const debug = debug_1.default("playactor-iob:waker:udp");
class UdpWakerNetwork {
    constructor(config) {
        this.config = config;
    }
    close() {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
    }
    sendTo(device, message) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const socket = (_a = this.socket) !== null && _a !== void 0 ? _a : yield this.open();
            const wakePort = exports.wakePortsByType[device.type];
            if (!wakePort) {
                throw new Error(`Unexpected device type: ${device.type}`);
            }
            return new Promise((resolve, reject) => {
                const { address } = device.address;
                debug("sending ", message, "to:", address, wakePort);
                socket.send(message, wakePort, address, err => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
    open() {
        return new Promise(resolve => {
            const socket = dgram_1.default.createSocket("udp4");
            socket.bind(undefined, this.config.localBindAddress, () => {
                this.socket = socket;
                resolve(socket);
            });
        });
    }
}
exports.UdpWakerNetwork = UdpWakerNetwork;
class UdpWakerNetworkFactory {
    create(config) {
        return new UdpWakerNetwork(config);
    }
}
exports.UdpWakerNetworkFactory = UdpWakerNetworkFactory;
