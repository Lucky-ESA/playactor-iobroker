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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandbyProc = void 0;
const helpers_1 = require("../helpers");
const standby_1 = require("../packets/outgoing/standby");
const types_1 = require("../packets/types");
class StandbyProc {
    perform(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            yield helpers_1.performRpc(socket, new standby_1.StandbyPacket(), types_1.PacketType.StandbyResult);
        });
    }
}
exports.StandbyProc = StandbyProc;
