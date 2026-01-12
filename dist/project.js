"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@revideo/core");
const _2d_1 = require("@revideo/2d");
const core_2 = require("@revideo/core");
const example = (0, _2d_1.makeScene2D)('example', function* (view) {
    // Ultra simple static scene for testing
    view.add(new _2d_1.Rect({
        size: { x: 1920, y: 1080 },
        fill: '#111111'
    }));
    view.add(new _2d_1.Txt({
        text: 'VPS Render Test',
        fill: 'white',
        fontSize: 120,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 800,
        x: 0,
        y: 0
    }));
    // Wait for 5 seconds to give video encoder time to work
    yield* (0, core_2.waitFor)(5);
});
exports.default = (0, core_1.makeProject)({
    scenes: [example],
    settings: {
        shared: {
            size: { x: 1920, y: 1080 },
        },
        rendering: {
            fps: 24, // Reduced from 30 to 24 for more stable encoding
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