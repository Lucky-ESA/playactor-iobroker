"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const path_1 = __importDefault(require("path"));
const clime_1 = require("clime");
// The second parameter is the path to folder that contains command modules.
exports.cli = new clime_1.CLI("playactor-iobroker", path_1.default.join(__dirname, "commands"));
if (process.argv[0].endsWith("ts-node")) {
    clime_1.CLI.commandModuleExtension = ".ts";
}
