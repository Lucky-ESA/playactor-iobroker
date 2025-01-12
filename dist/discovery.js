"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Discovery = void 0;
const debug_1 = __importDefault(require("debug"));
const model_1 = require("./discovery/model");
const standard_1 = require("./discovery/standard");
const async_1 = require("./util/async");
const debug = debug_1.default("playactor-iobroker:discovery");
class Discovery {
    constructor(config = {}, networkFactory = standard_1.StandardDiscoveryNetworkFactory) {
        this.networkFactory = networkFactory;
        this.discoveryConfig = Object.assign(Object.assign({}, model_1.defaultDiscoveryConfig), config);
    }
    discover(networkConfig = {}, discoveryConfig = {}) {
        const fullConfig = Object.assign(Object.assign({}, this.discoveryConfig), discoveryConfig);
        debug("discover(", fullConfig, ")");
        const discoveredIds = new Set();
        const sink = new async_1.CancellableAsyncSink();
        const network = this.networkFactory.createDevices(networkConfig, device => {
            if (!(fullConfig.uniqueDevices && discoveredIds.has(device.id))) {
                discoveredIds.add(device.id);
                sink.write(device);
            }
        });
        const { deviceIp } = this.discoveryConfig;
        network.ping(deviceIp); // send an initial ping immediately
        const discoverInterval = setInterval(() => {
            debug("sending subsequent network discovery ping");
            network.ping(deviceIp);
        }, fullConfig.pingIntervalMillis);
        function stopDiscovering() {
            clearInterval(discoverInterval);
            network.close();
            sink.end();
        }
        const timeout = setTimeout(stopDiscovering, fullConfig.timeoutMillis);
        sink.onCancel = () => {
            clearTimeout(timeout);
            stopDiscovering();
        };
        return sink;
    }
}
exports.Discovery = Discovery;
