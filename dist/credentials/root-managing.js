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
exports.RootManagingCredentialRequester = exports.RootMissingError = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default("playactor-iobroker:credentials:root");
class RootMissingError extends Error {
}
exports.RootMissingError = RootMissingError;
/**
 * The RootManagingCredentialRequester wraps another ICredentialRequester
 * and ensures that root access is available before delegating to that
 * requester, and relinquishes root access afterward by setting the
 * process UID to the provided `restoreUserId`.
 */
class RootManagingCredentialRequester {
    constructor(delegate, restoreUserId) {
        this.delegate = delegate;
        this.restoreUserId = restoreUserId;
    }
    requestForDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.getuid && process.getuid()) {
                throw new RootMissingError(`No credentials for ${device.name} and unable to request (need root permissions).`);
            }
            const result = yield this.delegate.requestForDevice(device);
            if (process.setuid && this.restoreUserId) {
                process.setuid(this.restoreUserId);
                debug("Restored user ID to:", this.restoreUserId);
            }
            return result;
        });
    }
}
exports.RootManagingCredentialRequester = RootManagingCredentialRequester;
