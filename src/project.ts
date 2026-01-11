import {makeProject} from '@revideo/core';
import example from './scenes/example?scene';

export default makeProject({
  scenes: [example],
  settings: {
    shared: {
        size: { x: 1920, y: 1080 },
    },
    rendering: {
        exporter: {
            name: '@revideo/renderer-ffmpeg',
            options: {
                fps: 30,
            }
        }
    }
  }
});
