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

const createDemoSprite = (): PIXI.Sprite => {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = 96;
  sourceCanvas.height = 56;

  const context = sourceCanvas.getContext('2d');
  if (context) {
    context.fillStyle = '#e2e8f0';
    context.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    context.fillStyle = '#94a3b8';
    context.fillRect(8, 10, 30, 16);
    context.fillStyle = '#64748b';
    context.fillRect(42, 20, 46, 24);
    context.fillStyle = '#0f172a';
    context.font = '12px sans-serif';
    context.fillText('PNG', 34, 36);
  }

  const sprite = PIXI.Sprite.from(sourceCanvas.toDataURL('image/png'));
  sprite.anchor.set(0.5);
  sprite.position.set(160, 130);
  sprite.scale.set(1.35, 1.35);
  bindDebugPointerEvents(sprite, 'sprite');

  return sprite;
};

export const createInitialScene = (): PIXI.Container => {
  const mainContainer = new PIXI.Container();
  const subContainer = new PIXI.Container();

  const g1 = new PIXI.Graphics();
  const g2 = new PIXI.Graphics();
  const g3 = new PIXI.Graphics();
  const g4 = new PIXI.Graphics();

  g1.beginFill('#ff0000').drawEllipse(0, 0, 80, 42).endFill();
  g1.position.set(178, 88);
  g1.angle = 30;
  bindDebugPointerEvents(g1, 'g1');

  g2.beginFill('#0000ff').drawRect(-50, -75, 100, 150).endFill();
  g2.position.set(112, 72);
  g2.angle = 15;
  g2.scale.set(0.65, 0.75);
  bindDebugPointerEvents(g2, 'g2');

  g3.lineStyle(8, '#ffffff', 1).moveTo(0, 0).lineTo(120, 80);
  g3.angle = -20;
  bindDebugPointerEvents(g3, 'g3');

  g4.lineStyle(8, '#ffff00', 1).moveTo(0, 70).lineTo(120, -30);
  g4.angle = 20;
  bindDebugPointerEvents(g4, 'g4');

  subContainer.position.set(55, 30);
  subContainer.addChild(g3, g4);

  const sprite = createDemoSprite();
  mainContainer.addChild(subContainer, g1, g2, sprite);

  return mainContainer;
};
