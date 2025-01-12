"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.DeviceOptions = exports.DiscoveryOptions = exports.InputOutputOptions = void 0;
const debug_1 = __importDefault(require("debug"));
const clime_1 = require("clime");
const readline_1 = __importDefault(require("readline"));
const credentials_1 = require("../credentials");
const pending_1 = require("../device/pending");
const model_1 = require("../discovery/model");
const standard_1 = require("../discovery/standard");
const mim_requester_1 = require("../credentials/mim-requester");
const disk_storage_1 = require("../credentials/disk-storage");
const root_managing_1 = require("../credentials/root-managing");
const cli_proxy_1 = require("./cli-proxy");
const root_proxy_device_1 = require("./root-proxy-device");
const pin_accepting_device_1 = require("./pin-accepting-device");
const rejecting_requester_1 = require("../credentials/rejecting-requester");
const pass_code_1 = require("./pass-code");
const model_2 = require("../socket/model");
const cli_1 = require("../credentials/oauth/cli");
const requester_1 = require("../credentials/oauth/requester");
const device_type_strategy_1 = require("../credentials/device-type-strategy");
const write_only_storage_1 = require("../credentials/write-only-storage");
const log = debug_1.default("playactor:cli:options");
class InputOutputOptions extends clime_1.Options {
    constructor() {
        /* eslint-disable no-console */
        super(...arguments);
        this.enableDebug = false;
        this.machineFriendly = false;
        this.dontAutoOpenUrls = false;
    }
    logError(error) {
        console.error(error);
    }
    logInfo(message) {
        // NOTE: log on stderr by default so only "results"
        // are on stdout.
        console.error(message);
    }
    logResult(result) {
        if (typeof result === "string") {
            console.log(result);
        }
        else if (this.machineFriendly) {
            console.log(JSON.stringify(result));
        }
        else {
            console.log(JSON.stringify(result, null, 2));
        }
    }
    prompt(promptText) {
        return new Promise(resolve => {
            const prompter = readline_1.default.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            prompter.question(promptText, result => {
                prompter.close();
                resolve(result);
            });
        });
    }
    configureLogging() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.enableDebug) {
                debug_1.default.enable("playactor-iobroker:*");
            }
        });
    }
}
__decorate([
    clime_1.option({
        name: "debug",
        description: "Enable debug logging",
        toggle: true,
    }),
    __metadata("design:type", Object)
], InputOutputOptions.prototype, "enableDebug", void 0);
__decorate([
    clime_1.option({
        name: "machine-friendly",
        description: "Enable machine-friendly output",
        toggle: true,
    }),
    __metadata("design:type", Object)
], InputOutputOptions.prototype, "machineFriendly", void 0);
__decorate([
    clime_1.option({
        name: "no-open-urls",
        description: "Disable URL-opening convenience",
        toggle: true,
    }),
    __metadata("design:type", Object)
], InputOutputOptions.prototype, "dontAutoOpenUrls", void 0);
exports.InputOutputOptions = InputOutputOptions;
class DiscoveryOptions extends InputOutputOptions {
    constructor() {
        super(...arguments);
        this.searchTimeout = model_1.defaultDiscoveryConfig.timeoutMillis;
        this.connectTimeout = model_2.defaultSocketConfig.connectTimeoutMillis;
    }
    get discoveryConfig() {
        return {
            timeoutMillis: this.searchTimeout,
        };
    }
    get networkConfig() {
        return {
            localBindAddress: this.localBindAddress,
            localBindPort: this.localBindPort,
        };
    }
    get socketConfig() {
        return Object.assign(Object.assign({}, model_2.defaultSocketConfig), { connectTimeoutMillis: this.connectTimeout });
    }
}
__decorate([
    clime_1.option({
        name: "timeout",
        default: model_1.defaultDiscoveryConfig.timeoutMillis,
        description: "How long to look for device(s)",
        placeholder: "millis",
    }),
    __metadata("design:type", Number)
], DiscoveryOptions.prototype, "searchTimeout", void 0);
__decorate([
    clime_1.option({
        name: "connect-timeout",
        default: model_2.defaultSocketConfig.connectTimeoutMillis,
        description: "How long to look wait for connection",
        placeholder: "millis",
    }),
    __metadata("design:type", Number)
], DiscoveryOptions.prototype, "connectTimeout", void 0);
__decorate([
    clime_1.option({
        name: "bind-address",
        description: "Bind to a specific network adapter IP",
        placeholder: "ip",
    }),
    __metadata("design:type", String)
], DiscoveryOptions.prototype, "localBindAddress", void 0);
__decorate([
    clime_1.option({
        name: "bind-port",
        description: "Bind on a specific port",
        placeholder: "port",
    }),
    __metadata("design:type", Number)
], DiscoveryOptions.prototype, "localBindPort", void 0);
exports.DiscoveryOptions = DiscoveryOptions;
class DeviceOptions extends DiscoveryOptions {
    constructor() {
        super(...arguments);
        this.dontAuthenticate = false;
        this.alwaysAuthenticate = false;
        this.deviceOnlyPS4 = false;
        this.deviceOnlyPS5 = false;
    }
    findDevice() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.configureLogging();
            log("findDevice with:", this);
            const { description, predicate } = this.configurePending();
            const networkConfig = Object.assign({}, this.connectionConfig.network);
            const args = process.argv;
            const proxiedUserId = root_proxy_device_1.RootProxyDevice.extractProxiedUserId(args);
            const { requestedDeviceType: deviceType, networkFactory } = this;
            const diskCredentialsStorage = new disk_storage_1.DiskCredentialsStorage(this.credentialsPath);
            const credentialsStorage = this.alwaysAuthenticate
                ? new write_only_storage_1.WriteOnlyStorage(diskCredentialsStorage)
                : diskCredentialsStorage;
            const credentialsRequester = this.dontAuthenticate
                ? new rejecting_requester_1.RejectingCredentialRequester("Not authenticated")
                : this.buildCredentialsRequester(networkFactory, networkConfig, proxiedUserId);
            const credentials = new credentials_1.CredentialManager(credentialsRequester, credentialsStorage);
            const device = new pending_1.PendingDevice(description, predicate, networkConfig, Object.assign(Object.assign({}, this.discoveryConfig), { deviceIp: this.deviceIp, deviceType }), networkFactory, credentials);
            yield device.discover();
            if (this.dontAuthenticate) {
                // no sense doing extra work
                return device;
            }
            // if we got here, the device was found! wrap it up in case we
            // need we need to request root privileges or something to
            // complete the login process
            return new root_proxy_device_1.RootProxyDevice(this, new cli_proxy_1.SudoCliProxy(), new pin_accepting_device_1.PinAcceptingDevice(this, device, this.pinCode), {
                providedCredentialsPath: this.credentialsPath,
                effectiveCredentialsPath: diskCredentialsStorage.filePath,
                invocationArgs: args,
                currentUserId: (_a = process.getuid) === null || _a === void 0 ? void 0 : _a.call(process),
            });
        });
    }
    get connectionConfig() {
        var _a, _b;
        return {
            network: this.networkConfig,
            socket: this.socketConfig,
            login: {
                passCode: (_b = (_a = this.passCode) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "",
            },
        };
    }
    get networkFactory() {
        const deviceType = this.requestedDeviceType;
        if (deviceType === model_1.DeviceType.PS4) {
            return standard_1.StandardPS4DiscoveryNetworkFactory;
        }
        if (deviceType === model_1.DeviceType.PS5) {
            return standard_1.StandardPS5DiscoveryNetworkFactory;
        }
        return standard_1.StandardDiscoveryNetworkFactory;
    }
    get requestedDeviceType() {
        if (this.deviceOnlyPS4 && this.deviceOnlyPS5) {
            const flags = ["--ps4", "--ps5"].join(", ");
            throw new clime_1.ExpectedError(
            // eslint-disable-next-line prefer-template
            `You must have no more than one of any of these flags:\n  ${flags}`);
        }
        else if (this.deviceOnlyPS4) {
            return model_1.DeviceType.PS4;
        }
        else if (this.deviceOnlyPS5) {
            return model_1.DeviceType.PS5;
        }
    }
    buildCredentialsRequester(networkFactory, networkConfig, proxiedUserId) {
        const ps4 = new root_managing_1.RootManagingCredentialRequester(new mim_requester_1.MimCredentialRequester(networkFactory, networkConfig, this), proxiedUserId);
        const ps5 = new requester_1.OauthCredentialRequester(this, new cli_1.CliOauthStrategy(this, !this.dontAutoOpenUrls));
        return new device_type_strategy_1.DeviceTypeStrategyCredentialRequester({
            [model_1.DeviceType.PS4]: ps4,
            [model_1.DeviceType.PS5]: ps5,
        });
    }
    configurePending() {
        let description = "device (any)";
        let predicate = () => true;
        if (this.deviceIp) {
            description = `device at ${this.deviceIp}`;
            predicate = device => device.address.address === this.deviceIp;
        }
        else if (this.deviceHostName) {
            description = `device named ${this.deviceHostName}`;
            predicate = device => device.name === this.deviceHostName;
        }
        else if (this.deviceHostId) {
            description = `device with id ${this.deviceHostId}`;
            predicate = device => device.id === this.deviceHostId;
        }
        const requestedType = this.requestedDeviceType;
        if (requestedType) {
            const base = predicate;
            description = `${requestedType} ${description}`;
            predicate = device => base(device)
                && device.type === requestedType;
        }
        return { description, predicate };
    }
}
__decorate([
    clime_1.option({
        name: "no-auth",
        description: "Don't attempt to authenticate if not already",
        toggle: true,
    }),
    __metadata("design:type", Object)
], DeviceOptions.prototype, "dontAuthenticate", void 0);
__decorate([
    clime_1.option({
        name: "force-auth",
        description: "Ignore existing credentials",
        toggle: true,
    }),
    __metadata("design:type", Object)
], DeviceOptions.prototype, "alwaysAuthenticate", void 0);
__decorate([
    clime_1.option({
        name: "credentials",
        flag: "c",
        placeholder: "path",
        description: "Path to a file for storing credentials",
    }),
    __metadata("design:type", String)
], DeviceOptions.prototype, "credentialsPath", void 0);
__decorate([
    clime_1.option({
        name: "pass-code",
        flag: "p",
        description: "Your numeric passcode, or a string of key names",
    }),
    __metadata("design:type", pass_code_1.CliPassCode)
], DeviceOptions.prototype, "passCode", void 0);
__decorate([
    clime_1.option({
        name: "ip",
        description: "Select a specific device by IP",
    }),
    __metadata("design:type", String)
], DeviceOptions.prototype, "deviceIp", void 0);
__decorate([
    clime_1.option({
        name: "host-name",
        description: "Select a specific device by its host-name",
        placeholder: "name",
    }),
    __metadata("design:type", String)
], DeviceOptions.prototype, "deviceHostName", void 0);
__decorate([
    clime_1.option({
        name: "pin-code",
        description: "Pin Code from the PS4",
        placeholder: "8 digits",
    }),
    __metadata("design:type", String)
], DeviceOptions.prototype, "pinCode", void 0);
__decorate([
    clime_1.option({
        name: "host-id",
        description: "Select a specific device by its host-id",
        placeholder: "id",
    }),
    __metadata("design:type", String)
], DeviceOptions.prototype, "deviceHostId", void 0);
__decorate([
    clime_1.option({
        name: "ps4",
        description: "Ignore non-PS4 devices",
        toggle: true,
    }),
    __metadata("design:type", Object)
], DeviceOptions.prototype, "deviceOnlyPS4", void 0);
__decorate([
    clime_1.option({
        name: "ps5",
        description: "Ignore non-PS5 devices",
        toggle: true,
    }),
    __metadata("design:type", Object)
], DeviceOptions.prototype, "deviceOnlyPS5", void 0);
exports.DeviceOptions = DeviceOptions;
