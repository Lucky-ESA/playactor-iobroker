"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultOptions = void 0;
const clime_1 = require("clime");
const clime_2 = require("../clime");
const about_1 = require("./about");
class DefaultOptions extends clime_1.Options {
    constructor() {
        super(...arguments);
        this.showVersion = false;
    }
}
__decorate([
    clime_1.option({
        name: "version",
        description: "Show version information",
        toggle: true,
    }),
    __metadata("design:type", Object)
], DefaultOptions.prototype, "showVersion", void 0);
exports.DefaultOptions = DefaultOptions;
let default_1 = class default_1 extends clime_1.Command {
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            /* eslint-disable no-console */
            if (options.showVersion) {
                const version = about_1.getAppVersion();
                console.log(`playactor v${version}`);
                return;
            }
            // Default to showing the normal help information.
            const shim = new clime_1.Shim(clime_2.cli);
            yield shim.execute(["node", "playactor-iobroker-cli.js", "--help"]);
            /* eslint-enable no-console */
        });
    }
};
__decorate([
    clime_1.metadata,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DefaultOptions]),
    __metadata("design:returntype", Promise)
], default_1.prototype, "execute", null);
default_1 = __decorate([
    clime_1.command()
], default_1);
exports.default = default_1;
