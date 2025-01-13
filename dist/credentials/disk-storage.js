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
exports.DiskCredentialsStorage = exports.determineDefaultFile = void 0;
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = require("os");
const path_1 = require("path");
function determineDefaultFile() {
    return path_1.join(os_1.homedir(), ".config", "playactor-iobroker", "credentials.json");
}
exports.determineDefaultFile = determineDefaultFile;
const debug = debug_1.default("playactor-iob:credentials:disk");
class DiskCredentialsStorage {
    constructor(filePath) {
        this.filePath = filePath !== null && filePath !== void 0 ? filePath : determineDefaultFile();
    }
    read(deviceId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const json = yield this.readCredentialsMap();
            return (_a = json[deviceId]) !== null && _a !== void 0 ? _a : null;
        });
    }
    write(deviceId, credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            // NOTE: this is not perfectly safe, but should be *mostly* okay...
            // if we run into a situation where concurrency is an issue, we can
            // set up locks
            const json = yield this.readCredentialsMap();
            json[deviceId] = credentials;
            debug("writing credentials to ", this.filePath);
            yield fs_extra_1.default.mkdirp(path_1.dirname(this.filePath));
            yield fs_extra_1.default.writeFile(this.filePath, JSON.stringify(json));
        });
    }
    readCredentialsMap() {
        return __awaiter(this, void 0, void 0, function* () {
            let contents;
            try {
                debug("reading credentials at", this.filePath);
                contents = yield fs_extra_1.default.readFile(this.filePath);
            }
            catch (e) {
                return {};
            }
            return JSON.parse(contents.toString());
        });
    }
}
exports.DiskCredentialsStorage = DiskCredentialsStorage;
