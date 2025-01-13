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
exports.RemotePlayDeviceConnection = void 0;
const debug_1 = __importDefault(require("debug"));
const packets_1 = require("../remoteplay/packets");
const debug = debug_1.default("playactor-iob:connection:remoteplay");
class RemotePlayDeviceConnection {
    constructor(socket) {
        this.socket = socket;
    }
    get isConnected() {
        return !this.socket.isConnected;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.socket.close();
        });
    }
    standby() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.socket.send(new packets_1.RemotePlayOutgoingPacket(packets_1.RemotePlayCommand.Standby));
            try {
                // wait until the socket closes
                for (var _b = __asyncValues(this.socket.receive()), _c; _c = yield _b.next(), !_c.done;) {
                    const pack = _c.value;
                    debug("received...", pack);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
}
exports.RemotePlayDeviceConnection = RemotePlayDeviceConnection;
