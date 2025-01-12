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
exports.PinAcceptingDevice = void 0;
const clime_1 = require("clime");
const debug_1 = __importDefault(require("debug"));
const helpers_1 = require("../socket/helpers");
const login_result_1 = require("../socket/packets/incoming/login-result");
const exit_codes_1 = require("./exit-codes");
const debug = debug_1.default("playactor-iobroker:cli:pin");
/**
 * The PinAcceptingDevice delegates to another IDevice implementation
 * and, if a login error is encountered caused by a missing pincode,
 * will prompt for pincode input and retry login.
 *
 * This class is meant exclusively for use with the CLI; API clients
 * should almost certainly not use this.
 */
class PinAcceptingDevice {
    constructor(io, delegate, pin) {
        this.io = io;
        this.delegate = delegate;
        this.pin = pin;
    }
    discover(config) {
        return this.delegate.discover(config);
    }
    wake() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.delegate.wake();
            }
            catch (e) {
                const conn = yield this.tryResolveError(e);
                conn.close();
            }
        });
    }
    openConnection(config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.delegate.openConnection(config);
            }
            catch (e) {
                return this.tryResolveError(e, config);
            }
        });
    }
    tryResolveError(e, config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(e instanceof helpers_1.RpcError)) {
                debug("non-login error encountered: ", e);
                throw e;
            }
            switch (e.code) {
                case login_result_1.LoginResultError.PIN_IS_NEEDED:
                    return this.registerWithPincode(config);
                case login_result_1.LoginResultError.PASSCODE_IS_NEEDED:
                    throw new clime_1.ExpectedError("Login Error: Passcode is required", exit_codes_1.ExitCode.PassCodeNeeded);
                case login_result_1.LoginResultError.PASSCODE_IS_UNMATCHED:
                    throw new clime_1.ExpectedError("Login Error: Incorrect passcode", exit_codes_1.ExitCode.PassCodeUnmatched);
                default:
                    // some other error
                    debug("unexpected error: ", e);
                    throw e;
            }
        });
    }
    registerWithPincode(config) {
        return __awaiter(this, void 0, void 0, function* () {
            debug("pincode required; prompting from user...");
            let pinCode;
            if (this.pin === undefined) {
                this.io.logInfo("Go to 'Settings -> Mobile App Connection Settings -> Add Device'"
                    + " on your console to obtain a PIN code.");
                pinCode = yield this.io.prompt("Pin code> ");
            }
            else {
                this.io.logInfo(`PIN ${this.pin} OK`);
                pinCode = this.pin;
            }
            debug("opening connection with user-provided pin");
            return this.delegate.openConnection(Object.assign(Object.assign({}, config), { login: Object.assign(Object.assign({}, config.login), { pinCode }) }));
        });
    }
}
exports.PinAcceptingDevice = PinAcceptingDevice;
