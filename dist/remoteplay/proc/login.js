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
exports.RemotePlayLoginProc = void 0;
const debug_1 = __importDefault(require("debug"));
const helpers_1 = require("../../socket/helpers");
const login_result_1 = require("../../socket/packets/incoming/login-result");
const packets_1 = require("../packets");
const passcode_response_1 = require("../packets/passcode-response");
const debug = debug_1.default("playactor-iob:remoteplay:LoginProc");
class RemotePlayLoginProc {
    constructor(config) {
        this.config = config;
    }
    perform(socket) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            debug("Performing Login");
            const response = yield helpers_1.performRpc(socket, new packets_1.RemotePlayOutgoingPacket(packets_1.RemotePlayCommand.Login), packets_1.RemotePlayResponseType.Login, packets_1.RemotePlayResponseType.Passcode);
            debug("Received: ", response);
            if (response.type === packets_1.RemotePlayResponseType.Passcode) {
                debug("Passcode was required");
                const passCode = (_a = this.config.login) === null || _a === void 0 ? void 0 : _a.passCode;
                if (!passCode || !passCode.length) {
                    debug("... but no passcode provided", this.config.login);
                    throw new helpers_1.RpcError(1, login_result_1.LoginResultError.PASSCODE_IS_NEEDED);
                }
                // send the passcode
                debug("Sending passcode...");
                yield helpers_1.performRpc(socket, new passcode_response_1.RemotePlayPasscodeResponsePacket(passCode), packets_1.RemotePlayResponseType.Login);
            }
            debug("Done!");
        });
    }
}
exports.RemotePlayLoginProc = RemotePlayLoginProc;
