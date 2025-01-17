import crypto from "crypto";
import _debug from "debug";

import { IDiscoveredDevice } from "../discovery/model";
import { CryptoCodec } from "../socket/crypto-codec";
import { redact } from "../util/redact";
import { LegacyCryptoStrategy } from "./crypto/legacy";
import { ModernCryptoStrategy } from "./crypto/modern";
import { RemotePlayVersion, remotePlayVersionFor } from "./model";
import { CRYPTO_NONCE_LENGTH } from "./protocol";

const debug = _debug("playactor-iob:remoteplay:crypto");

function generateNonce() {
    const nonce = Buffer.alloc(CRYPTO_NONCE_LENGTH);
    crypto.randomFillSync(nonce);
    return nonce;
}

export function pickCryptoStrategyForDevice(device: IDiscoveredDevice) {
    const version = remotePlayVersionFor(device);
    const strategy = version < RemotePlayVersion.PS4_10
        ? new LegacyCryptoStrategy(version)
        : new ModernCryptoStrategy(device.type, version);

    debug("selected", strategy, "for remote play version", RemotePlayVersion[version]);
    return strategy;
}

export class RemotePlayCrypto {
    public static forDeviceAndPin(
        device: IDiscoveredDevice,
        pin: string,
        nonce: Buffer = generateNonce(),
    ) {
        const strategy = pickCryptoStrategyForDevice(device);
        const { codec, preface } = strategy.createCodecForPin(pin, nonce);

        return new RemotePlayCrypto(codec, preface, nonce);
    }

    constructor(
        private readonly codec: CryptoCodec,
        private readonly preface: Buffer,
        nonce: Buffer,
    ) {
        if (nonce.length !== CRYPTO_NONCE_LENGTH) {
            throw new Error(`Invalid nonce: ${nonce.toString("base64")}`);
        }
    }

    public createSignedPayload(payload: Record<string, string>) {
        return this.encryptRecord(payload);
    }

    public decrypt(payload: Buffer) {
        return this.codec.decode(payload);
    }

    private encryptRecord(record: Record<string, string>) {
        let formatted = "";
        for (const key of Object.keys(record)) {
            formatted += key;
            formatted += ": ";
            formatted += record[key];
            formatted += "\r\n";
        }
        const payload = Buffer.from(formatted, "utf-8");

        debug("formatted record:\n", redact(formatted));
        debug("encrypting record:", redact(payload.toString("hex")));
        debug("preface:", redact(this.preface));

        const encodedPayload = this.codec.encode(payload);
        if (encodedPayload.length !== payload.length) {
            throw new Error(`${encodedPayload.length} !== ${payload.length}`);
        }

        return Buffer.concat([
            this.preface,
            encodedPayload,
        ]);
    }
}
