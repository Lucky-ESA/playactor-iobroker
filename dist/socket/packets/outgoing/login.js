"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPacket = void 0;
const os_1 = __importDefault(require("os"));
const base_1 = require("../base");
const types_1 = require("../types");
const defaultConfig = {
    appLabel: "PlayStation",
    model: "PlayActor-iobroker",
    osVersion: "4.4",
    passCode: "",
    pinCode: "",
    appendHostnameToModel: true,
};
class LoginPacket extends base_1.OutgoingPacket {
    constructor(userCredential, config = {}) {
        super();
        this.userCredential = userCredential;
        this.type = types_1.PacketType.Login;
        this.totalLength = 384;
        // NOTE: this is an "info" bitfield, but I'm not entirely
        // sure how to build it. here are some constants:
        //      INFO_ACCOUNT_ID_HASHED = 0;
        //      INFO_ACCOUNT_ID_RAW = 1;
        //      INFO_DEVICE_ANDROID = 0;
        //      INFO_DEVICE_IOS = 1;
        //      INFO_DEVICE_OTHERS = 3;
        //      INFO_DEVICE_VITA = 2;
        //      INFO_KIND_GAMECOMPANION = 1;
        //      INFO_KIND_SYSTEMCOMPANION = 0;
        //      INFO_SDK_VERSION = 4;
        //
        // Here are some guesses:
        //      0xF000 = device type?
        //      0x0F00 = sdk version?
        //      0x0010 = account id hashed/raw
        //      0x0001 = KIND flag?
        //
        // Note that the 0F00 position used to be 2 (and using that value is
        // still accepted, as is using 3) so it seems reasonable to expect
        // that to be the sdk version. 4 bits seems a rather small number to
        // encode the SDK version, however, so device type could be further
        // back—we do have 32 bits here...
        this.info = 0x0401;
        this.config = Object.assign(Object.assign({}, defaultConfig), config);
    }
    fillBuffer(builder) {
        let { model } = this.config;
        if (this.config.appendHostnameToModel) {
            model += ` ${os_1.default.hostname()}`;
        }
        builder
            .writePadded(this.config.passCode, 4)
            .writeInt(this.info)
            .writePadded(this.userCredential, 64)
            .writePadded(this.config.appLabel, 256)
            .writePadded(this.config.osVersion, 16)
            .writePadded(model, 16)
            .writePadded(this.config.pinCode, 16);
    }
}
exports.LoginPacket = LoginPacket;
