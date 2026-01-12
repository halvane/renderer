import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {createRef} from '@revideo/core';

export default makeScene2D('example', function* (view) {
  const txtRef = createRef<Txt>();
  const bgRef = createRef<Rect>();

  // Simple hardcoded scene for testing
  view.add(
    new Rect({
      ref: bgRef,
      size: { x: 1920, y: 1080 },
      fill: '#111111'
    })
  );

  view.add(
    new Txt({
      ref: txtRef,
      text: 'VPS Render Test',
      fill: 'white',
      fontSize: 120,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 800,
      x: 0,
      y: -50
    })
  );

  // Simple animation
  yield* txtRef().scale(1.2, 1);
  yield* txtRef().scale(1, 0.5);
});
