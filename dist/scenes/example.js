"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _2d_1 = require("@revideo/2d");
const core_1 = require("@revideo/core");
exports.default = (0, _2d_1.makeScene2D)('example', function* (view) {
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
    yield* (0, core_1.waitFor)(5);
});
//# sourceMappingURL=example.js.map