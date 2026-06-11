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

  const sourceFrame = texture.frame;
  const originalWidth = texture.orig.width;
  const originalHeight = texture.orig.height;
  const trim = texture.trim;
  const destinationX = trim
    ? trim.x - sprite.anchor.x * originalWidth
    : -sprite.anchor.x * originalWidth;
  const destinationY = trim
    ? trim.y - sprite.anchor.y * originalHeight
    : -sprite.anchor.y * originalHeight;
  const destinationWidth = trim ? trim.width : originalWidth;
  const destinationHeight = trim ? trim.height : originalHeight;
  if (destinationWidth <= 0 || destinationHeight <= 0) {
    return;
  }

  const paint = new canvasKit.Paint();
  paint.setAlphaf(opacity);

  canvas.drawImageRect(
    image,
    canvasKit.XYWHRect(sourceFrame.x, sourceFrame.y, sourceFrame.width, sourceFrame.height),
    canvasKit.XYWHRect(destinationX, destinationY, destinationWidth, destinationHeight),
    paint,
    false,
  );

  paint.delete();
};
