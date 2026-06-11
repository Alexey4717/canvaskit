import * as PIXI from 'pixi.js-legacy';

const bindDebugPointerEvents = (displayObject: PIXI.DisplayObject, name: string): void => {
  displayObject.eventMode = 'static';
  displayObject.cursor = 'pointer';
  displayObject.on('pointerdown', () => {
    console.log(`${name} pointerdown!`);
  });
  displayObject.on('pointerup', () => {
    console.log(`${name} pointerup!`);
  });
};

const DEMO_IMAGE_URL = '/images/reference-photo.jpg';

const createFallbackTexture = (): PIXI.Texture => {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = 120;
  sourceCanvas.height = 70;

  const context = sourceCanvas.getContext('2d');
  if (context) {
    context.fillStyle = '#d9dce1';
    context.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    context.fillStyle = '#a3aab5';
    context.fillRect(10, 10, 44, 20);
    context.fillStyle = '#7a8699';
    context.fillRect(58, 18, 52, 30);
    context.fillStyle = '#141922';
    context.font = 'bold 14px sans-serif';
    context.fillText('PNG', 44, 44);
  }

  return PIXI.Texture.from(sourceCanvas.toDataURL('image/png'));
};

const createDemoSprite = (): PIXI.Sprite => {
  const sprite = new PIXI.Sprite(createFallbackTexture());
  sprite.anchor.set(0.5);
  sprite.position.set(168, 135);
  sprite.width = 106;
  sprite.height = 58;
  bindDebugPointerEvents(sprite, 'sprite');

  const imageTexture = PIXI.Texture.from(DEMO_IMAGE_URL);
  if (imageTexture.baseTexture.valid) {
    sprite.texture = imageTexture;
    sprite.width = 106;
    sprite.height = 58;
  } else {
    imageTexture.baseTexture.once('loaded', () => {
      sprite.texture = imageTexture;
      sprite.width = 106;
      sprite.height = 58;
    });
  }

  return sprite;
};

/** Формирует стартовую демо-сцену с интерактивными объектами. */
export const createInitialScene = (): PIXI.Container => {
  const mainContainer = new PIXI.Container();
  const line = new PIXI.Graphics();
  const triangle = new PIXI.Graphics();
  const hexagon = new PIXI.Graphics();
  const greenRect = new PIXI.Graphics();

  line.lineStyle(4, '#141414', 1).moveTo(0, 0).lineTo(130, -30);
  line.position.set(122, 96);
  bindDebugPointerEvents(line, 'line');

  triangle
    .beginFill('#f4a580')
    .lineStyle(2, '#141414', 0.35)
    .drawPolygon([0, 34, 18, -24, 36, 34])
    .endFill();
  triangle.position.set(196, 59);
  triangle.angle = -8;
  bindDebugPointerEvents(triangle, 'triangle');

  hexagon
    .beginFill('#4a90e2')
    .lineStyle(2, '#2f5f95', 1)
    .drawPolygon([0, -27, 23, -13, 23, 13, 0, 27, -23, 13, -23, -13])
    .endFill();
  hexagon.position.set(168, 90);
  bindDebugPointerEvents(hexagon, 'hexagon');

  greenRect.beginFill('#a4d46d').drawRect(-22, -16, 44, 32).endFill();
  greenRect.position.set(159, 60);
  greenRect.angle = -21;
  bindDebugPointerEvents(greenRect, 'greenRect');

  const sprite = createDemoSprite();
  mainContainer.addChild(sprite, line, greenRect, triangle, hexagon);

  return mainContainer;
};
