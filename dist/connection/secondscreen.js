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
exports.SecondScreenDeviceConnection = void 0;
const debug_1 = __importDefault(require("debug"));
const helpers_1 = require("../socket/helpers");
const open_keyboard_1 = require("../socket/proc/open-keyboard");
const remote_control_1 = require("../socket/proc/remote-control");
const standby_1 = require("../socket/proc/standby");
const start_title_1 = require("../socket/proc/start-title");
const remote_1 = require("../socket/remote");
const RunningAppId = "running-app-titleid";
const RunningAppName = "running-app-name";
// NOTE: This code doesn't seem to match with our standard set
// (which would call this NO_SUCH_GAME) but does seem to be what
// the console is sending in this situation
const WillQuitExistingAppResult = 12;
const debug = debug_1.default("playactor-iob:secondscreen:connection");
class SecondScreenDeviceConnection {
    constructor(resolveDevice, socket) {
        this.resolveDevice = resolveDevice;
        this.socket = socket;
    }
    get isConnected() {
        return this.socket.isConnected;
    }
    /**
     * End the connection with the device
     */
    close() {
        return this.socket.close();
    }
    /**
     * Attempt to control the on-screen keyboard for a text field on the
     * screen. If there is no such text field, this method will reject
     * with an error.
     */
    openKeyboard() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.socket.execute(new open_keyboard_1.OpenKeyboardProc());
        });
    }
    /**
     * Send a sequence of keypress events
     */
    sendKeys(events) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.socket.execute(new remote_control_1.RemoteControlProc(events));
        });
    }
    /**
     * Put the device into standby mode
     */
    standby() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.socket.execute(new standby_1.StandbyProc());
        });
    }
    /**
     * Attempt to start an app or game by its "title ID"
     */
    startTitleId(titleId, config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.resolveDevice();
            const runningApp = state.extras[RunningAppId];
            if (runningApp === titleId) {
                debug("title id", titleId, "already running");
                return;
            }
            const willAutoQuit = config.autoQuitExisting !== false;
            const willQuit = runningApp && willAutoQuit;
            if (willQuit) {
                // something else is running
                debug("another app (", state.extras[RunningAppName], ") is running; quitting that first");
                yield this.sendKeys([{
                        key: remote_1.RemoteOperation.PS,
                    }]);
            }
            try {
                yield this.socket.execute(new start_title_1.StartTitleProc(titleId));
            }
            catch (e) {
                if (e instanceof helpers_1.RpcError
                    && e.result === WillQuitExistingAppResult) {
                    debug("accepting prompt to quit existing app");
                    yield this.sendKeys([{
                            key: remote_1.RemoteOperation.Enter,
                        }]);
                    return;
                }
                throw e;
            }
        });
    }
}
exports.SecondScreenDeviceConnection = SecondScreenDeviceConnection;
