import {Rect, Txt, makeScene2D} from '@revideo/2d';
import {createRef, useScene} from '@revideo/core';

export default makeScene2D(function* (view) {
  const txtRef = createRef<Txt>();
  const bgRef = createRef<Rect>();

  // Get variables passed from the handler
  const title = useScene().variables.get('title', 'RunPod Render')();
  const subtitle = useScene().variables.get('subtitle', 'Serverless Video Generation')();
  const themeColor = useScene().variables.get('themeColor', '#00ff88')();

  view.add(
    <Rect
        ref={bgRef}
        size={'100%'}
        fill={'#111111'}
    >
      <Txt
        ref={txtRef}
        text={title}
        fill={'white'}
        fontSize={120}
        fontFamily={'Arial, sans-serif'}
        fontWeight={800}
        y={-50}
      />
      <Txt
        text={subtitle}
        fill={themeColor}
        fontSize={60}
        fontFamily={'Arial, sans-serif'}
        y={80}
        opacity={0.8}
      />
    </Rect>
  );

  // Simple animation
  yield* txtRef().scale(1.1, 2);
  yield* bgRef().fill('#1a1a1a', 2);
});
