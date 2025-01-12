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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKeys = void 0;
const clime_1 = require("clime");
const remote_1 = require("../../socket/remote");
const options_1 = require("../options");
const nameToOp = Object.keys(remote_1.RemoteOperation).reduce((m, name) => {
    // eslint-disable-next-line no-param-reassign
    m[name.toLowerCase()] = remote_1.RemoteOperation[name];
    return m;
}, {});
/** Public for testing */
function parseKeys(keys) {
    return keys.map(raw => {
        const [keyName, holdTimeString] = raw.split(":");
        const key = nameToOp[keyName.toLowerCase()];
        if (!key) {
            throw new Error(`Invalid key name: ${key}`);
        }
        if (holdTimeString) {
            const holdTimeMillis = parseInt(holdTimeString, 10);
            if (holdTimeMillis < 0) {
                throw new Error(`Hold time must not be negative: ${holdTimeMillis}`);
            }
            return {
                key,
                holdTimeMillis,
            };
        }
        return { key };
    });
}
exports.parseKeys = parseKeys;
let default_1 = class default_1 extends clime_1.Command {
    /* eslint-disable @typescript-eslint/indent */
    execute(keys, deviceSpec) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPresses = parseKeys(keys);
            const device = yield deviceSpec.findDevice();
            const connection = yield device.openConnection(deviceSpec.connectionConfig);
            try {
                if (!connection.sendKeys) {
                    throw new Error("send-keys not supported for this device");
                }
                yield connection.sendKeys(keyPresses);
            }
            finally {
                yield connection.close();
            }
        });
    }
};
__decorate([
    __param(0, clime_1.params({
        description: "The keys to send",
        required: true,
        type: String,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, options_1.DeviceOptions]),
    __metadata("design:returntype", Promise)
], default_1.prototype, "execute", null);
default_1 = __decorate([
    clime_1.command({
        brief: "Send a sequence of keys",
        description: `
Send a sequence of keys to the device. Valid keys are:

    up, down, left, right, enter, back, option, ps

You cannot send the actual x, square, etc. buttons. Each provided key
will be sent sequentially.

In addition, a key name may be followed by a colon and a duration in
milliseconds to hold that key, eg: playactor-iobroker send-keys ps:1000
    `.trim(),
    })
], default_1);
exports.default = default_1;
