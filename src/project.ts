import {makeProject} from '@revideo/core';
import example from './scenes/example';

export default makeProject({
  scenes: [example],
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
