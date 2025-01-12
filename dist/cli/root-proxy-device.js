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
exports.RootProxyDevice = exports.RootProxiedError = void 0;
const clime_1 = require("clime");
const debug_1 = __importDefault(require("debug"));
const path_1 = require("path");
const credentials_1 = require("../credentials");
const root_managing_1 = require("../credentials/root-managing");
const open_1 = require("../socket/open");
const debug = debug_1.default("playactor-iobroker:cli:root");
const PROXIED_ID_ARG = "--proxied-user-id";
class RootProxiedError extends Error {
    print() {
        debug("root proxied; this process became nop");
    }
}
exports.RootProxiedError = RootProxiedError;
function stopCurrentInvocationForProxy() {
    throw new RootProxiedError();
}
/**
 * The RootProxyDevice wraps another IDevice implementation and delegates
 * entirely to it. If `wake` or `openConnection` reject with a
 * RootMissingError, the error will be suppressed and, if possible, the
 * CLI invocation will be "proxied" into a new subprocess that will
 * request root and this process will be gracefully stopped with the same
 * exit code as the "proxied" subprocess.
 *
 * This class is meant exclusively for use with the CLI; API clients
 * should almost certainly not use this.
 */
class RootProxyDevice {
    constructor(io, cliProxy, delegate, config, resolvePath = path_1.resolve) {
        this.io = io;
        this.cliProxy = cliProxy;
        this.delegate = delegate;
        this.config = config;
        this.resolvePath = resolvePath;
    }
    static extractProxiedUserId(args) {
        var _a;
        const argIndex = args.indexOf(PROXIED_ID_ARG);
        const valueIndex = argIndex + 1;
        if (valueIndex > 0 && valueIndex < args.length) {
            return parseInt(args[valueIndex], 10);
        }
        return (_a = process.getuid) === null || _a === void 0 ? void 0 : _a.call(process);
    }
    static removeProxiedUserId(args) {
        const argIndex = args.indexOf(PROXIED_ID_ARG);
        const valueIndex = argIndex + 1;
        if (argIndex >= 0) {
            const deleteCount = valueIndex < args.length ? 2 : 1;
            args.splice(argIndex, deleteCount);
            return args;
        }
        return args;
    }
    discover(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.delegate.discover(config);
        });
    }
    wake() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.delegate.wake();
            }
            catch (e) {
                yield this.tryResolveError(e);
            }
        });
    }
    openConnection(config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.delegate.openConnection(config);
            }
            catch (e) {
                yield this.tryResolveError(e);
                // NOTE: this should never happen (note the Promise<never>
                // return type) but typescript doesn't agree, so we re-throw
                // here to make sure the interface matches properly
                throw e;
            }
        });
    }
    tryResolveError(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (e instanceof root_managing_1.RootMissingError) {
                const { currentUserId } = this.config;
                if (currentUserId === 0 || currentUserId == null) {
                    // already root (or not on a root-relevant platform), but
                    // root missing? this probably shouldn't happen...
                    throw e;
                }
                this.io.logInfo(e.message);
                yield this.proxyCliInvocation(currentUserId);
                stopCurrentInvocationForProxy();
            }
            else if (e instanceof credentials_1.CredentialsError
                || e instanceof open_1.ConnectionRefusedError) {
                throw new clime_1.ExpectedError(e.message);
            }
            // nothing to resolve
            throw e;
        });
    }
    proxyCliInvocation(currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseArgs = [...this.config.invocationArgs];
            if (!this.config.providedCredentialsPath) {
                // if we aren't already explicitly passing a credentials
                // file path, do so now (to avoid potential confusion)
                baseArgs.push("--credentials", this.config.effectiveCredentialsPath);
            }
            else {
                // if we *did* provide credentials, we need to make sure the
                // full path is resolved, just in case sudo changes things
                // in weird ways (for example, if they used ~ in the path,
                // and being sudo changes the meaning of that)
                const oldIndex = baseArgs.indexOf(this.config.providedCredentialsPath);
                baseArgs[oldIndex] = this.resolvePath(this.config.providedCredentialsPath);
            }
            this.io.logInfo("Attempting to request root permissions now (we will relinquish them as soon as possible)...");
            yield this.cliProxy.invoke([
                ...baseArgs,
                PROXIED_ID_ARG,
                currentUserId.toString(),
            ]);
        });
    }
}
exports.RootProxyDevice = RootProxyDevice;
