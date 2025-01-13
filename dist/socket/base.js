"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferPacketProcessor = void 0;
const debug_1 = __importDefault(require("debug"));
const model_1 = require("./model");
const debug = debug_1.default("playactor-iob:socket:BufferPacketProcessor");
class BufferPacketProcessor {
    constructor(protocol, codec, onNewPacket) {
        this.protocol = protocol;
        this.codec = codec;
        this.onNewPacket = onNewPacket;
    }
    onDataReceived(data) {
        var _a;
        const reader = (_a = this.reader) !== null && _a !== void 0 ? _a : (this.reader = this.protocol.createPacketReader());
        const decoded = this.codec.decode(data);
        debug(" ... decoded: ", decoded);
        const result = reader.read(decoded, this.paddingSize);
        switch (result) {
            case model_1.PacketReadState.PENDING:
                debug("wait for rest of packet");
                break;
            case model_1.PacketReadState.DONE:
                this.dispatchNewPacket(reader);
                break;
        }
    }
    setCodec(codec) {
        this.codec = codec;
        this.paddingSize = codec.paddingSize;
    }
    dispatchNewPacket(reader) {
        const packet = reader.get();
        const remainder = reader.remainder();
        debug("dispatch:", packet);
        this.onNewPacket(packet);
        if (remainder) {
            this.reader = this.protocol.createPacketReader();
            // recursion isn't my first choice here, but we're unlikely
            // to receive enough packets at once to blow up the stack...
            this.onDataReceived(remainder);
        }
        else {
            this.reader = undefined;
        }
    }
}
exports.BufferPacketProcessor = BufferPacketProcessor;
