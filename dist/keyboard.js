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
exports.OnScreenKeyboard = void 0;
const debug_1 = __importDefault(require("debug"));
const osk_1 = require("./socket/osk");
const osk_change_string_1 = require("./socket/packets/outgoing/osk-change-string");
const osk_control_1 = require("./socket/packets/outgoing/osk-control");
const debug = debug_1.default("playactor-iobroker:keyboard");
/**
 * Represents an active on-screen keyboard control session
 */
class OnScreenKeyboard {
    constructor(socket, maxLength, initialContent, actionType = osk_1.OskActionType.Default, inputType = osk_1.OskInputType.Default, flags = osk_1.OskFlags.None) {
        this.socket = socket;
        this.maxLength = maxLength;
        this.initialContent = initialContent;
        this.actionType = actionType;
        this.inputType = inputType;
        this.flags = flags;
        this.isValid = true;
    }
    get isActive() {
        return this.isValid;
    }
    hasFlag(flag) {
        // eslint-disable-next-line no-bitwise
        return (this.flags & flag) !== 0;
    }
    /**
     * Close the keyboard. This instance will become unusable, isActive
     * will return false, and all other method calls on this instance
     * will fail
     */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureValid();
            yield this.socket.send(new osk_control_1.OskControlPacket(osk_1.OskCommand.Close));
            this.isValid = false;
        });
    }
    /**
     * Set the current OSK text, optionally choosing a specific
     *  position for the caret.
     */
    setText(text, caretIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureValid();
            debug("setting text:", text);
            yield this.socket.send(new osk_change_string_1.OskChangeStringPacket(text, { caretIndex }));
        });
    }
    /**
     * "Submit" the text currently in the keyboard, like pressing the
     * "return" key. This also has the effect of `close()`.
     */
    submit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureValid();
            yield this.socket.send(new osk_control_1.OskControlPacket(osk_1.OskCommand.Submit));
            this.isValid = false;
            // give the device some time to process before we disconnect
            debug("keep socket alive after submitting");
            this.socket.requestKeepAlive(450);
        });
    }
    ensureValid() {
        if (!this.isValid) {
            throw new Error("Performing actions on inactive Keyboard");
        }
        if (!this.socket.isConnected) {
            throw new Error("Perfroming OSK actions on disconnected socket");
        }
    }
}
exports.OnScreenKeyboard = OnScreenKeyboard;
