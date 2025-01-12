"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedPacketReader = exports.LengthDelimitedBufferReader = void 0;
const debug_1 = __importDefault(require("debug"));
const model_1 = require("../model");
const DEFAULT_MIN_PACKET_LENGTH = 4;
const debug = debug_1.default("playactor-iobroker:socket:base");
class LengthDelimitedBufferReader {
    constructor({ minPacketLength = DEFAULT_MIN_PACKET_LENGTH, lengthIncludesHeader = true, littleEndian = true, } = {}) {
        this.minPacketLength = minPacketLength;
        this.lengthIncludesHeader = lengthIncludesHeader;
        this.littleEndian = littleEndian;
    }
    read(data, paddingSize) {
        if (this.currentBuffer) {
            this.currentBuffer = Buffer.concat([this.currentBuffer, data]);
        }
        else {
            this.currentBuffer = data;
        }
        if (this.currentBuffer.length < this.minPacketLength) {
            return model_1.PacketReadState.PENDING;
        }
        if (this.expectedLength === undefined) {
            this.actualLength = this.littleEndian
                ? this.currentBuffer.readInt32LE(0)
                : this.currentBuffer.readInt32BE(0);
            this.expectedLength = paddingSize
                ? Math.ceil(this.actualLength / paddingSize) * paddingSize
                : this.actualLength;
            debug("determined next packet length: ", this.expectedLength, `(actual: ${this.actualLength}; padding: ${paddingSize})`);
        }
        if (this.currentBuffer.length >= this.expectedLength) {
            debug("have", this.currentBuffer.length, "of expected", this.expectedLength);
            return model_1.PacketReadState.DONE;
        }
        return model_1.PacketReadState.PENDING;
    }
    get() {
        const buffer = this.currentBuffer;
        if (!buffer)
            throw new Error("Invalid state: no buffer read");
        return buffer.slice(0, this.currentPacketLength);
    }
    remainder() {
        const data = this.currentBuffer;
        if (!data)
            throw new Error("Illegal state: no buffer read");
        const expected = this.currentPacketExpectedLength;
        if (expected && expected < data.byteLength) {
            return data.slice(expected);
        }
    }
    get currentPacketLength() {
        if (!this.actualLength)
            return;
        return this.lengthIncludesHeader
            ? this.actualLength
            : this.actualLength + this.minPacketLength;
    }
    get currentPacketExpectedLength() {
        if (!this.expectedLength)
            return;
        return this.lengthIncludesHeader
            ? this.expectedLength
            : this.expectedLength + this.minPacketLength;
    }
}
exports.LengthDelimitedBufferReader = LengthDelimitedBufferReader;
/**
 * The [TypedPacketReader] delegates most of its functionality to an
 * [IBufferReader] (by default, [LengthDelimitedBufferReader]) and
 * creates packets given a map of type to constructor
 */
class TypedPacketReader {
    constructor(packets, base = new LengthDelimitedBufferReader()) {
        this.packets = packets;
        this.base = base;
    }
    read(data, paddingSize) {
        return this.base.read(data, paddingSize);
    }
    get() {
        const buf = this.base.get();
        const type = this.readType(buf);
        const Constructor = this.packets[type];
        if (!Constructor) {
            debug(`received unsupported packet[${type}]: `, buf);
            return this.createDefaultPacket(type, buf);
        }
        return new Constructor(buf);
    }
    remainder() {
        return this.base.remainder();
    }
}
exports.TypedPacketReader = TypedPacketReader;
