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
exports.OpenKeyboardProc = void 0;
const debug_1 = __importDefault(require("debug"));
const keyboard_1 = require("../../keyboard");
const helpers_1 = require("../helpers");
const osk_start_1 = require("../packets/outgoing/osk-start");
const types_1 = require("../packets/types");
const debug = debug_1.default("playactor-iobroker:socket:OpenKeyboardProc");
class OpenKeyboardProc {
    perform(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield helpers_1.performRpc(socket, new osk_start_1.OskStartPacket(), types_1.PacketType.OskStartResult);
            debug("Opened keyboard! result = ", result);
            return new keyboard_1.OnScreenKeyboard(socket, result.maxLength, result.initialContent, result.actionType, result.inputType, result.flags);
        });
    }
}
exports.OpenKeyboardProc = OpenKeyboardProc;
