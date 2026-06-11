import { Sprite } from 'pixi.js-legacy';
import type { Canvas, CanvasKit, Image } from 'canvaskit-wasm';

import { isCanvasImageSource } from './imageSource';

/** Рисует PIXI.Sprite и переиспользует кэшированные Skia Image по uid текстуры. */
export const renderSprite = (
  canvasKit: CanvasKit,
  sprite: Sprite,
  canvas: Canvas,
  opacity: number,
  imageCache: Map<number, Image>,
): void => {
  const texture = sprite.texture;
  const source = (texture.baseTexture.resource as { source?: unknown } | undefined)?.source;
  if (!isCanvasImageSource(source)) {
    return;
  }

  let image = imageCache.get(texture.baseTexture.uid);
  if (!image) {
    image = canvasKit.MakeImageFromCanvasImageSource(source);
    imageCache.set(texture.baseTexture.uid, image);
  }

  const width = texture.orig.width;
  const height = texture.orig.height;
  const offsetX = -sprite.anchor.x * width;
  const offsetY = -sprite.anchor.y * height;

  const paint = new canvasKit.Paint();
  paint.setAlphaf(opacity);

  canvas.drawImageRect(
    image,
    canvasKit.XYWHRect(0, 0, width, height),
    canvasKit.XYWHRect(offsetX, offsetY, width, height),
    paint,
    false,
  );

  paint.delete();
};
