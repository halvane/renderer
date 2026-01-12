import { makeScene2D, Rect, Txt } from '@revideo/2d';
import { all, makeProject, waitFor } from '@revideo/core';

const scene = makeScene2D('test', function* (view) {
  // Simple black background
  const bg = new Rect({
    size: { x: 1920, y: 1080 },
    fill: '#000000'
  });

  view.add(bg);

  // Main headline
  view.add(
    new Txt({
      text: 'Revideo Test Render',
      fill: 'white',
      fontSize: 120,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 800,
      y: -200
    })
  );

  // Subheading
  view.add(
    new Txt({
      text: 'Simple Direct Rendering',
      fill: '#888888',
      fontSize: 60,
      fontFamily: 'Arial, sans-serif',
      y: 100
    })
  );

  // Wait for 3 seconds
  yield* waitFor(3);
});

export default makeProject({
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
