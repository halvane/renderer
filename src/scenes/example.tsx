import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {createRef} from '@revideo/core';

export default makeScene2D('example', function* (view) {
  const txtRef = createRef<Txt>();
  const bgRef = createRef<Rect>();

  // Get variables passed from the handler
  const title = 'RunPod Render'; // For now, hardcoded
  const subtitle = 'Serverless Video Generation';
  const themeColor = '#00ff88';

  view.add(
    new Rect({
      ref: bgRef,
      size: view.size,
      fill: '#111111'
    })
  );

  view.add(
    new Txt({
      ref: txtRef,
      text: title,
      fill: 'white',
      fontSize: 120,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 800,
      y: -50
    })
  );

  view.add(
    new Txt({
      text: subtitle,
      fill: themeColor,
      fontSize: 60,
      fontFamily: 'Arial, sans-serif',
      y: 80,
      opacity: 0.8
    })
  );

  // Simple animation
  yield* txtRef().scale(1.1, 2);
  yield* bgRef().fill('#1a1a1a', 2);
});
