import _debug from "debug";

import { IDiscoveredDevice } from "../discovery/model";
import { ICredentialRequester, ICredentials } from "./model";

const debug = _debug("playactor-iob:credentials:root");

export class RootMissingError extends Error {
}

/**
 * The RootManagingCredentialRequester wraps another ICredentialRequester
 * and ensures that root access is available before delegating to that
 * requester, and relinquishes root access afterward by setting the
 * process UID to the provided `restoreUserId`.
 */
export class RootManagingCredentialRequester implements ICredentialRequester {
    constructor(
        private readonly delegate: ICredentialRequester,
        private readonly restoreUserId?: number,
    ) {}

    public async requestForDevice(device: IDiscoveredDevice): Promise<ICredentials> {
        if (process.getuid && process.getuid()) {
            throw new RootMissingError(`No credentials for ${device.name} and unable to request (need root permissions).`);
        }

        const result = await this.delegate.requestForDevice(device);

        if (process.setuid && this.restoreUserId) {
            process.setuid(this.restoreUserId);
            debug("Restored user ID to:", this.restoreUserId);
        }

        return result;
    }
}
