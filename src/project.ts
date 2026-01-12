import {makeProject} from '@revideo/core';
import example from './scenes/example';

export default makeProject({
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
          format: 'mp4',
          crf: 23, // Add quality setting
          preset: 'medium' // Add encoding preset
        }
      }
    }
  }
});
