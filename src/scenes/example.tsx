import {Rect, Txt, makeScene2D, waitFor} from '@revideo/2d';

export default makeScene2D('example', function* (view) {
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

  // Wait for 3 seconds to give video encoder time to work
  yield* waitFor(3);
});
