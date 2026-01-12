"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _2d_1 = require("@revideo/2d");
const core_1 = require("@revideo/core");
const scene = (0, _2d_1.makeScene2D)('test', function* (view) {
    // Simple black background
    const bg = new _2d_1.Rect({
        size: { x: 1920, y: 1080 },
        fill: '#000000'
    });
    view.add(bg);
    // Main headline
    view.add(new _2d_1.Txt({
        text: 'Revideo Test Render',
        fill: 'white',
        fontSize: 120,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 800,
        y: -200
    }));
    // Subheading
    view.add(new _2d_1.Txt({
        text: 'Simple Direct Rendering',
        fill: '#888888',
        fontSize: 60,
        fontFamily: 'Arial, sans-serif',
        y: 100
    }));
    // Wait for 3 seconds
    yield* (0, core_1.waitFor)(3);
});
exports.default = (0, core_1.makeProject)({
    scenes: [scene],
    settings: {
        shared: {
            size: { x: 1920, y: 1080 }
        },
        rendering: {
            fps: 24,
            exporter: {
                name: '@revideo/core/ffmpeg',
                options: {
                    format: 'mp4'
                }
            }
        }
    }
});
//# sourceMappingURL=project-simple.js.map