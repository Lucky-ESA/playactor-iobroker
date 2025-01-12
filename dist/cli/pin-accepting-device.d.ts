import { IDeviceConnection } from "../connection/model";
import { IConnectionConfig, IDevice } from "../device/model";
import { INetworkConfig } from "../discovery/model";
import { IInputOutput } from "./io";
/**
 * The PinAcceptingDevice delegates to another IDevice implementation
 * and, if a login error is encountered caused by a missing pincode,
 * will prompt for pincode input and retry login.
 *
 * This class is meant exclusively for use with the CLI; API clients
 * should almost certainly not use this.
 */
export declare class PinAcceptingDevice implements IDevice {
    private readonly io;
    private readonly delegate;
    private readonly pin;
    constructor(io: IInputOutput, delegate: IDevice, pin: string | undefined);
    discover(config?: INetworkConfig): Promise<import("../discovery/model").IDiscoveredDevice>;
    wake(): Promise<void>;
    openConnection(config?: IConnectionConfig): Promise<IDeviceConnection>;
    private tryResolveError;
    private registerWithPincode;
}
