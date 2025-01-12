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
exports.RemoteControlProc = void 0;
const debug_1 = __importDefault(require("debug"));
const async_1 = require("../../util/async");
const remote_control_1 = require("../packets/outgoing/remote-control");
const remote_1 = require("../remote");
const POST_CONNECT_SENDKEY_DELAY = 1500;
/** min delay between sendKey sends */
const MIN_SENDKEY_DELAY = 200;
const debug = debug_1.default("playactor-iobroker:socket:RemoteControlProc");
function sendKey(socket, key, holdTimeMillis = 0) {
    return socket.send(new remote_control_1.RemoteControlPacket(key, holdTimeMillis));
}
class RemoteControlProc {
    constructor(events) {
        this.events = events;
    }
    perform(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const msSinceConnect = Date.now() - socket.openedTimestamp;
            const delay = POST_CONNECT_SENDKEY_DELAY - msSinceConnect;
            if (delay > 0) {
                // give it some time to think---if we try to OpenRc too soon
                // after connecting, the ps4 seems to disregard
                debug("socket just opened; wait", delay, "ms before remote control");
                yield async_1.delayMillis(delay);
            }
            else {
                debug("socket opened", msSinceConnect, "ms ago");
            }
            debug("open RC");
            yield sendKey(socket, remote_1.InternalRemoteOperation.OpenRC);
            yield async_1.delayMillis(MIN_SENDKEY_DELAY);
            yield this.sendKeys(socket);
            debug("close RC");
            yield sendKey(socket, remote_1.InternalRemoteOperation.CloseRC);
            yield async_1.delayMillis(MIN_SENDKEY_DELAY);
            debug("done!");
        });
    }
    sendKeys(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            // near as I can tell, here's how this works:
            // - For a simple tap, you send the key with holdTime=0,
            //   followed by KEY_OFF and holdTime = 0
            // - For a long press/hold, you still send the key with
            //   holdTime=0, then follow it with the key again, but
            //   specifying holdTime as the hold duration.
            // - After sending a direction, you should send KEY_OFF
            //   to clean it up (since it can just be held forever).
            //   Doing this after a long-press of PS just breaks it,
            //   however.
            for (const event of this.events) {
                /* eslint-disable no-await-in-loop */
                debug("sending:", event);
                yield sendKey(socket, event.key);
                if (event.holdTimeMillis) {
                    yield async_1.delayMillis(event.holdTimeMillis);
                    yield sendKey(socket, event.key, event.holdTimeMillis);
                }
                // clean up the keypress. As mentioned above, after holding a
                // direction, sending KEY_OFF seems to make further presses
                // more reliable; doing that after holding PS button breaks
                // it, however.
                if (!event.holdTimeMillis || event.key !== remote_1.RemoteOperation.PS) {
                    yield sendKey(socket, remote_1.InternalRemoteOperation.KeyOff);
                }
                yield async_1.delayMillis(event.key === remote_1.RemoteOperation.PS
                    ? 1000 // higher delay after PS button press
                    : MIN_SENDKEY_DELAY);
            }
        });
    }
}
exports.RemoteControlProc = RemoteControlProc;
