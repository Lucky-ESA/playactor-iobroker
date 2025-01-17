/// <reference types="node" />
export interface ISocketConfig {
    maxRetries: number;
    retryBackoffMillis: number;
    connectTimeoutMillis: number;
}
export declare const defaultSocketConfig: ISocketConfig;
export interface IPacket {
    type: number;
    toBuffer(): Buffer;
}
export interface IPacketCodec {
    paddingSize?: number;
    encode(packet: Buffer): Buffer;
    decode(packet: Buffer): Buffer;
}
export declare const PlaintextCodec: IPacketCodec;
export declare enum PacketReadState {
    PENDING = 0,
    DONE = 1
}
export interface IBufferReader {
    read(data: Buffer, paddingSize?: number): PacketReadState;
    get(): Buffer;
    remainder(): Buffer | undefined;
}
/**
 * Reads a single packet then should be discarded; any data
 * overflow can be retrieved from `remainder()`
 */
export interface IPacketReader {
    read(data: Buffer, paddingSize?: number): PacketReadState;
    get(): IPacket;
    remainder(): Buffer | undefined;
}
export interface IProtocolVersion {
    major: number;
    minor: number;
}
export interface IDeviceProtocol {
    version: IProtocolVersion;
    createPacketReader(): IPacketReader;
    onPacketReceived?(socket: IDeviceSocket, packet: IPacket): Promise<void>;
    requestDisconnect?(socket: IDeviceSocket): Promise<void>;
}
/**
 * Represents a persistent, low-level connection to a device
 */
export interface IDeviceSocket {
    protocolVersion: IProtocolVersion;
    isConnected: boolean;
    openedTimestamp: number;
    close(): Promise<void>;
    receive(): AsyncIterable<IPacket>;
    send(packet: IPacket): Promise<void>;
    setCodec(encoder: IPacketCodec): void;
    execute<R = void>(proc: IDeviceProc<R>): Promise<R>;
    /**
     * Request that this socket stay connected for at least
     * `extraLifeMillis` longer. May be helpful in certain procs to
     * ensure a task is completed before we disconnect when close()
     * is called
     */
    requestKeepAlive(extraLifeMillis: number): void;
}
export interface IDeviceProc<R = void> {
    perform(socket: IDeviceSocket): Promise<R>;
}
