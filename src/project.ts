import {makeProject} from '@revideo/core';
import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {waitFor} from '@revideo/core';

const example = makeScene2D('example', function* (view) {
  // Ultra simple static scene for testing
  view.add(
    new Rect({
      size: { x: 1920, y: 1080 },
      fill: '#111111'
    })
  );

  view.add(
    new Txt({
      text: 'VPS Render Test',
      fill: 'white',
      fontSize: 120,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 800,
      x: 0,
      y: 0
    })
  );

  // Wait for 5 seconds to give video encoder time to work
  yield* waitFor(5);
});

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
          format: 'mp4'
        }
      }
    }
  }
});
