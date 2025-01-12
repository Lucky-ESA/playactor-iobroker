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
exports.performRpc = exports.RpcError = exports.receiveType = exports.receiveWhere = void 0;
const debug_1 = __importDefault(require("debug"));
const unsupported_1 = require("./packets/incoming/unsupported");
function receiveWhere(socket, predicate) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (var _b = __asyncValues(socket.receive()), _c; _c = yield _b.next(), !_c.done;) {
                const packet = _c.value;
                if (predicate(packet)) {
                    return packet;
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
        throw new Error("Did not receive packet");
    });
}
exports.receiveWhere = receiveWhere;
function receiveType(socket, type) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield receiveWhere(socket, packet => packet.type === type);
    });
}
exports.receiveType = receiveType;
class RpcError extends Error {
    constructor(result, code) {
        super(`Error[${result}] ${code}`);
        this.result = result;
        this.code = code;
    }
}
exports.RpcError = RpcError;
const rpcDebug = debug_1.default("playactor-iobroker:socket:rpc");
function performRpc(socket, request, ...resultTypes) {
    return __awaiter(this, void 0, void 0, function* () {
        yield socket.send(request);
        const typesSet = new Set(resultTypes);
        const resultPacket = yield receiveWhere(socket, packet => typesSet.has(packet.type));
        if (resultPacket instanceof unsupported_1.UnsupportedIncomingPacket) {
            throw new Error(`Unexpectedly received UnsupportedIncomingPacket for ${typesSet}`);
        }
        const { errorCode, result } = resultPacket;
        if (result === undefined) {
            throw new Error(`Received packet has no result: ${resultPacket.constructor.name} ${JSON.stringify(resultPacket)}`);
        }
        else if (result !== 0) {
            rpcDebug(`Received error result ${result} (in: `, resultPacket, `) expected type ${resultTypes} from request:`, request);
            throw new RpcError(result, errorCode);
        }
        return resultPacket;
    });
}
exports.performRpc = performRpc;
