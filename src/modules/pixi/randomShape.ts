import * as PIXI from 'pixi.js-legacy';

import { randomBetween, randomHexColor, randomInt } from '@/shared/lib/random';

const bindPointerLogs = (shape: PIXI.Graphics): void => {
  shape.eventMode = 'static';
  shape.cursor = 'pointer';
  shape.on('pointerdown', () => {
    console.log('random-shape pointerdown!');
  });
  shape.on('pointerup', () => {
    console.log('random-shape pointerup!');
  });
};

const makeRandomLine = (): PIXI.Graphics => {
  const shape = new PIXI.Graphics();
  const lineWidth = randomInt(3, 12);
  const color = randomHexColor();
  const x1 = randomBetween(-20, 160);
  const y1 = randomBetween(-20, 140);
  const x2 = randomBetween(70, 240);
  const y2 = randomBetween(20, 170);

  shape.lineStyle(lineWidth, color, 1).moveTo(x1, y1).lineTo(x2, y2);
  shape.rotation = randomBetween(-0.6, 0.6);
  shape.position.set(randomBetween(40, 220), randomBetween(20, 120));

  bindPointerLogs(shape);

  return shape;
};

const makeRandomRect = (): PIXI.Graphics => {
  const shape = new PIXI.Graphics();
  const width = randomBetween(40, 120);
  const height = randomBetween(30, 90);
  const color = randomHexColor();

  shape
    .beginFill(color)
    .drawRect(-width / 2, -height / 2, width, height)
    .endFill();
  shape.position.set(randomBetween(40, 260), randomBetween(30, 140));
  shape.rotation = randomBetween(-0.9, 0.9);
  shape.scale.set(randomBetween(0.75, 1.4), randomBetween(0.75, 1.4));

  bindPointerLogs(shape);

  return shape;
};

const makeRandomEllipse = (): PIXI.Graphics => {
  const shape = new PIXI.Graphics();
  const color = randomHexColor();
  const radiusX = randomBetween(18, 64);
  const radiusY = randomBetween(12, 48);

  shape.beginFill(color).drawEllipse(0, 0, radiusX, radiusY).endFill();
  shape.position.set(randomBetween(40, 260), randomBetween(30, 140));
  shape.rotation = randomBetween(-0.6, 0.6);

  bindPointerLogs(shape);

  return shape;
};

export const createRandomGraphics = (): PIXI.Graphics => {
  const variant = randomInt(0, 2);

  if (variant === 0) {
    return makeRandomLine();
  }

  if (variant === 1) {
    return makeRandomRect();
  }

  return makeRandomEllipse();
};
