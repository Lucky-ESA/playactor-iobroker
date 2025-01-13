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
exports.OauthCredentialRequester = exports.registKeyToCredential = exports.extractAccountId = void 0;
const debug_1 = __importDefault(require("debug"));
const got_1 = __importDefault(require("got"));
const protocol_1 = require("../../remoteplay/protocol");
const registration_1 = require("../../remoteplay/registration");
const redact_1 = require("../../util/redact");
const debug = debug_1.default("playactor-iob:credentials:oauth");
// Remote Play Windows Client
// TODO: it'd be nice to pull these for macOS and Linux so any
// login history/notification will show the right platform
const CLIENT_ID = "ba495a24-818c-472b-b12d-ff231c1b5745";
const CLIENT_SECRET = "mvaiZkRsAsI1IBkY";
const REDIRECT_URI = "https://remoteplay.dl.playstation.net/remoteplay/redirect";
const LOGIN_URL = `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize?service_entity=urn:service-entity:psn&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=psn:clientapp&request_locale=en_US&ui=pr&service_logo=ps&layout_type=popup&smcid=remoteplay&prompt=always&PlatformPrivacyWs1=minimal&`;
const TOKEN_URL = "https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token";
function extractAccountId(accountInfo) {
    const asNumber = BigInt(accountInfo.user_id);
    const buffer = Buffer.alloc(8, "binary");
    buffer.writeBigUInt64LE(asNumber);
    return buffer.toString("base64");
}
exports.extractAccountId = extractAccountId;
function registKeyToCredential(registKey) {
    // this is so bizarre, but here it is:
    // 1. Every 2 chars in data is interpreted as a hex byte
    const buffer = protocol_1.parseHexBytes(registKey);
    // 2. The bytes are treated as a utf-8-encoded string
    const asString = buffer.toString("utf-8");
    // 3. That string is parsed as a hex-encoded long
    const asNumber = BigInt(`0x${asString}`);
    // Finally, we convert that back into a string for storage
    return asNumber.toString();
}
exports.registKeyToCredential = registKeyToCredential;
class OauthCredentialRequester {
    constructor(io, strategy) {
        this.io = io;
        this.strategy = strategy;
    }
    requestForDevice(device) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const accountId = yield this.performOauth();
            this.io.logInfo("Registering with device via Remote Play.");
            this.io.logInfo("Go to Settings > System > Remote Play > Link Device");
            const pin = yield this.io.prompt("Enter PIN here> ");
            const registration = yield this.registerWithDevice(device, accountId, pin);
            const registKey = (_a = registration["PS5-RegistKey"]) !== null && _a !== void 0 ? _a : registration["PS4-RegistKey"];
            if (!registKey) {
                throw new Error("Did not receive reigstration key");
            }
            const credential = registKeyToCredential(registKey);
            return {
                "app-type": "r",
                "auth-type": "R",
                "client-type": "vr",
                model: "w",
                "user-credential": credential,
                accountId,
                registration,
            };
        });
    }
    performOauth() {
        return __awaiter(this, void 0, void 0, function* () {
            const redirected = yield this.strategy.performLogin(LOGIN_URL);
            const url = new URL(redirected);
            const code = url.searchParams.get("code");
            if (!code) {
                throw new Error("Did not get OAuth Code");
            }
            const accessToken = yield this.exchangeCodeForAccess(code);
            debug(`Fetched access token (${redact_1.redact(accessToken)}); requesting account info`);
            const accountInfo = yield got_1.default(`${TOKEN_URL}/${accessToken}`, {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
            }).json();
            return extractAccountId(accountInfo);
        });
    }
    registerWithDevice(device, accountId, pin) {
        return __awaiter(this, void 0, void 0, function* () {
            const registration = new registration_1.RemotePlayRegistration();
            return registration.register(device, {
                accountId,
                pin,
            });
        });
    }
    exchangeCodeForAccess(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessToken = yield got_1.default.post(TOKEN_URL, {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
                form: {
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: REDIRECT_URI,
                },
            }).json();
            if (!accessToken) {
                throw new Error("Did not receive OAuth access_token");
            }
            return { access_token: accessToken };
        });
    }
}
exports.OauthCredentialRequester = OauthCredentialRequester;
