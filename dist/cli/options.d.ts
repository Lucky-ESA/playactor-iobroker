import { Options } from "clime";
import { DeviceType, IDiscoveryConfig, IDiscoveryNetworkFactory, INetworkConfig } from "../discovery/model";
import { IConnectionConfig, IDevice } from "../device/model";
import { IInputOutput } from "./io";
import { CliPassCode } from "./pass-code";
import { ISocketConfig } from "../socket/model";
export declare class InputOutputOptions extends Options implements IInputOutput {
    enableDebug: boolean;
    machineFriendly: boolean;
    dontAutoOpenUrls: boolean;
    logError(error: any): void;
    logInfo(message: string): void;
    logResult(result: any): void;
    prompt(promptText: string): Promise<string>;
    configureLogging(): Promise<void>;
}
export declare class DiscoveryOptions extends InputOutputOptions {
    searchTimeout: number;
    connectTimeout: number;
    localBindAddress?: string;
    localBindPort?: number;
    get discoveryConfig(): Partial<IDiscoveryConfig>;
    get networkConfig(): INetworkConfig;
    get socketConfig(): ISocketConfig;
}
export declare class DeviceOptions extends DiscoveryOptions {
    dontAuthenticate: boolean;
    alwaysAuthenticate: boolean;
    credentialsPath?: string;
    passCode?: CliPassCode;
    deviceIp?: string;
    deviceHostName?: string;
    pinCode?: string;
    deviceHostId?: string;
    deviceOnlyPS4: boolean;
    deviceOnlyPS5: boolean;
    findDevice(): Promise<IDevice>;
    get connectionConfig(): IConnectionConfig;
    get networkFactory(): IDiscoveryNetworkFactory;
    get requestedDeviceType(): DeviceType | undefined;
    private buildCredentialsRequester;
    private configurePending;
}
