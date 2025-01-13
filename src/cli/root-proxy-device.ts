import { ExpectedError, Printable } from "clime";
import _debug from "debug";
import { resolve as realResolvePath } from "path";
import { CredentialsError } from "../credentials";

import { RootMissingError } from "../credentials/root-managing";
import { IConnectionConfig, IDevice } from "../device/model";
import { INetworkConfig } from "../discovery/model";
import { ConnectionRefusedError } from "../socket/open";
import { ICliProxy } from "./cli-proxy";
import { IInputOutput } from "./io";

const debug = _debug("playactor-iob:cli:root");

const PROXIED_ID_ARG = "--proxied-user-id";

export class RootProxiedError extends Error implements Printable {
    public print() {
        debug("root proxied; this process became nop");
    }
}

function stopCurrentInvocationForProxy() {
    throw new RootProxiedError();
}

export interface IRootProxyConfig {
    providedCredentialsPath?: string;
    effectiveCredentialsPath: string;
    invocationArgs: string[];

    /** NOTE: Can be undefined on eg Windows, which doesn't support getuid */
    currentUserId?: number;
}

/**
 * The RootProxyDevice wraps another IDevice implementation and delegates
 * entirely to it. If `wake` or `openConnection` reject with a
 * RootMissingError, the error will be suppressed and, if possible, the
 * CLI invocation will be "proxied" into a new subprocess that will
 * request root and this process will be gracefully stopped with the same
 * exit code as the "proxied" subprocess.
 *
 * This class is meant exclusively for use with the CLI; API clients
 * should almost certainly not use this.
 */
export class RootProxyDevice implements IDevice {
    public static extractProxiedUserId(
        args: string[],
    ): number | undefined {
        const argIndex = args.indexOf(PROXIED_ID_ARG);
        const valueIndex = argIndex + 1;
        if (valueIndex > 0 && valueIndex < args.length) {
            return parseInt(args[valueIndex], 10);
        }

        return process.getuid?.();
    }

    public static removeProxiedUserId(
        args: string[],
    ) {
        const argIndex = args.indexOf(PROXIED_ID_ARG);
        const valueIndex = argIndex + 1;
        if (argIndex >= 0) {
            const deleteCount = valueIndex < args.length ? 2 : 1;
            args.splice(argIndex, deleteCount);
            return args;
        }

        return args;
    }

    constructor(
        private readonly io: IInputOutput,
        private readonly cliProxy: ICliProxy,
        private readonly delegate: IDevice,
        private readonly config: IRootProxyConfig,
        private readonly resolvePath: (p: string) => string = realResolvePath,
    ) {}

    public async discover(config?: INetworkConfig) {
        return this.delegate.discover(config);
    }

    public async wake() {
        try {
            await this.delegate.wake();
        } catch (e) {
            await this.tryResolveError(e);
        }
    }

    public async openConnection(config: IConnectionConfig = {}) {
        try {
            return await this.delegate.openConnection(config);
        } catch (e) {
            await this.tryResolveError(e);

            // NOTE: this should never happen (note the Promise<never>
            // return type) but typescript doesn't agree, so we re-throw
            // here to make sure the interface matches properly
            throw e;
        }
    }

    private async tryResolveError(e: any): Promise<never> {
        if (e instanceof RootMissingError) {
            const { currentUserId } = this.config;
            if (currentUserId === 0 || currentUserId == null) {
                // already root (or not on a root-relevant platform), but
                // root missing? this probably shouldn't happen...
                throw e;
            }

            this.io.logInfo(e.message);
            await this.proxyCliInvocation(currentUserId);

            stopCurrentInvocationForProxy();
        } else if (
            e instanceof CredentialsError
            || e instanceof ConnectionRefusedError
        ) {
            throw new ExpectedError(e.message);
        }

        // nothing to resolve
        throw e;
    }

    private async proxyCliInvocation(currentUserId: number) {
        const baseArgs = [...this.config.invocationArgs];

        if (!this.config.providedCredentialsPath) {
            // if we aren't already explicitly passing a credentials
            // file path, do so now (to avoid potential confusion)
            baseArgs.push(
                "--credentials",
                this.config.effectiveCredentialsPath,
            );
        } else {
            // if we *did* provide credentials, we need to make sure the
            // full path is resolved, just in case sudo changes things
            // in weird ways (for example, if they used ~ in the path,
            // and being sudo changes the meaning of that)
            const oldIndex = baseArgs.indexOf(this.config.providedCredentialsPath);
            baseArgs[oldIndex] = this.resolvePath(this.config.providedCredentialsPath);
        }

        this.io.logInfo("Attempting to request root permissions now (we will relinquish them as soon as possible)...");

        await this.cliProxy.invoke([
            ...baseArgs,
            PROXIED_ID_ARG,
            currentUserId.toString(),
        ]);
    }
}
