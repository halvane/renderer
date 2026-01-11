"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@revideo/core");
const example_1 = __importDefault(require("./scenes/example"));
exports.default = (0, core_1.makeProject)({
    scenes: [example_1.default],
    settings: {
        shared: {
            size: { x: 1920, y: 1080 },
        },
        rendering: {
            exporter: {
                name: '@revideo/core/ffmpeg',
                options: {
                    format: 'mp4'
                }
            }
        }
    }
});
//# sourceMappingURL=project.js.map