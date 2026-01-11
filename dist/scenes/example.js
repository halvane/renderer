"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _2d_1 = require("@revideo/2d");
const core_1 = require("@revideo/core");
exports.default = (0, _2d_1.makeScene2D)('example', function* (view) {
    const txtRef = (0, core_1.createRef)();
    const bgRef = (0, core_1.createRef)();
    // Get variables passed from the handler
    const title = 'RunPod Render'; // For now, hardcoded
    const subtitle = 'Serverless Video Generation';
    const themeColor = '#00ff88';
    view.add(new _2d_1.Rect({
        ref: bgRef,
        size: view.size,
        fill: '#111111'
    }));
    view.add(new _2d_1.Txt({
        ref: txtRef,
        text: title,
        fill: 'white',
        fontSize: 120,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 800,
        y: -50
    }));
    view.add(new _2d_1.Txt({
        text: subtitle,
        fill: themeColor,
        fontSize: 60,
        fontFamily: 'Arial, sans-serif',
        y: 80,
        opacity: 0.8
    }));
    // Simple animation
    yield* txtRef().scale(1.1, 2);
    yield* bgRef().fill('#1a1a1a', 2);
});
//# sourceMappingURL=example.js.map