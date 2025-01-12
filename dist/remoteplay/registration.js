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
exports.RemotePlayRegistration = void 0;
const debug_1 = __importDefault(require("debug"));
const model_1 = require("../discovery/model");
const udp_1 = require("../discovery/udp");
const async_1 = require("../util/async");
const redact_1 = require("../util/redact");
const crypto_1 = require("./crypto");
const model_2 = require("./model");
const protocol_1 = require("./protocol");
const debug = debug_1.default("playactor-iobroker:remoteplay:registration");
const REGISTRATION_PORT = 9295;
const CLIENT_TYPE = "dabfa2ec873de5839bee8d3f4c0239c4282c07c25c6077a2931afcf0adc0d34f";
const CLIENT_TYPE_LEGACY = "Windows";
const searchConfigs = {
    [model_1.DeviceType.PS4]: {
        type: "SRC2",
        response: "RES2",
        version: model_1.DiscoveryVersions.PS4,
    },
    [model_1.DeviceType.PS5]: {
        type: "SRC3",
        response: "RES3",
        version: model_1.DiscoveryVersions.PS5,
    },
};
class RemotePlayRegistration {
    createPayload(crypto, device, credentials) {
        const version = model_2.remotePlayVersionFor(device);
        return crypto.createSignedPayload({
            "Client-Type": version < model_2.RemotePlayVersion.PS4_10
                ? CLIENT_TYPE_LEGACY
                : CLIENT_TYPE,
            "Np-AccountId": credentials.accountId,
        });
    }
    register(device, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            // NOTE: this search step is important; it lets the device know
            // that we're about to attempt a registration, I guess. If we
            // don't perform it, our registration request WILL be rejected
            yield this.searchForDevice(device);
            const crypto = crypto_1.RemotePlayCrypto.forDeviceAndPin(device, credentials.pin);
            const body = this.createPayload(crypto, device, credentials);
            debug("request body", redact_1.redact(body.toString("hex")));
            debug("request length:", body.length);
            const response = yield this.sendRegistrationRequest(device, body);
            const decoded = crypto.decrypt(response);
            debug("result decrypted:", redact_1.redact(decoded.toString("hex")));
            const registration = protocol_1.parseBody(decoded);
            debug("registration map:", redact_1.redact(registration));
            const rpKey = registration["RP-Key"];
            if (!rpKey || rpKey.length !== 2 * protocol_1.CRYPTO_NONCE_LENGTH) {
                throw new Error(`Received invalid key from registration (value: ${rpKey})`);
            }
            return registration;
        });
    }
    searchForDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, response, version } = searchConfigs[device.type];
            const factory = new udp_1.UdpDiscoveryNetworkFactory(REGISTRATION_PORT, version);
            debug("Performing SEARCH with", type);
            yield new Promise((resolve, reject) => {
                let timeout;
                const net = factory.createRawMessages({
                    localBindPort: REGISTRATION_PORT,
                }, message => {
                    const asString = message.toString();
                    debug("RECEIVED", message, asString);
                    if (asString.substring(0, response.length) === response) {
                        clearTimeout(timeout);
                        net.close();
                        resolve();
                    }
                });
                timeout = setTimeout(() => reject(new Error("Timeout")), 30000);
                net.sendBuffer(device.address.address, REGISTRATION_PORT, Buffer.from(type));
            });
            // NOTE: some devices may not accept requests immediately, so
            // give them a moment
            yield async_1.delayMillis(100);
        });
    }
    sendRegistrationRequest(device, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield protocol_1.request(this.urlFor(device), {
                body,
                headers: {
                    "RP-Version": this.versionFor(device),
                },
                method: "POST",
            });
            return response.body;
        });
    }
    urlFor(device) {
        const version = model_2.remotePlayVersionFor(device);
        const path = version < model_2.RemotePlayVersion.PS4_10
            ? "/sce/rp/regist" // PS4 with system version < 8.0
            : protocol_1.typedPath(device, "/sie/:type/rp/sess/rgst");
        return protocol_1.urlWith(device, path);
    }
    versionFor(device) {
        return model_2.remotePlayVersionToString(model_2.remotePlayVersionFor(device));
    }
}
exports.RemotePlayRegistration = RemotePlayRegistration;
