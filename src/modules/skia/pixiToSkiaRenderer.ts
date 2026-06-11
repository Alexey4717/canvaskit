import { Graphics, Sprite } from 'pixi.js-legacy';
import type { Container, DisplayObject } from 'pixi.js-legacy';
import type { Canvas, CanvasKit, Image } from 'canvaskit-wasm';

import { renderGraphics } from './renderer/graphicsRenderer';
import { toSkMatrix } from './renderer/matrix';
import { renderSprite } from './renderer/spriteRenderer';

const BACKGROUND_COLOR: [number, number, number, number] = [0.94, 0.94, 0.94, 1];

export class PixiToSkiaRenderer {
  private readonly imageCache = new Map<number, Image>();

  constructor(private readonly canvasKit: CanvasKit) {}

  /**
   * Рендерит всё display-tree PIXI в переданный Skia canvas.
   * Метод не делает flush поверхности: это остаётся задачей вызывающего кода.
   */
  public render(container: Container, canvas: Canvas): void {
    canvas.clear(
      this.canvasKit.Color4f(
        BACKGROUND_COLOR[0],
        BACKGROUND_COLOR[1],
        BACKGROUND_COLOR[2],
        BACKGROUND_COLOR[3],
      ),
    );
    this.renderDisplayObject(container, canvas, 1);
  }

  public dispose(): void {
    this.imageCache.forEach((image) => image.delete());
    this.imageCache.clear();
  }

  /** Рекурсивно обходит дерево display-объектов и применяет локальные трансформации/opacity. */
  private renderDisplayObject(displayObject: DisplayObject, canvas: Canvas, parentOpacity: number): void {
    if (!displayObject.visible) {
      return;
    }

    const opacity = parentOpacity * displayObject.alpha;
    if (opacity <= 0) {
      return;
    }

    canvas.save();
    canvas.concat(toSkMatrix(displayObject.localTransform));

    if (displayObject instanceof Graphics) {
      renderGraphics(this.canvasKit, displayObject, canvas, opacity);
    } else if (displayObject instanceof Sprite) {
      renderSprite(this.canvasKit, displayObject, canvas, opacity, this.imageCache);
    }

    if ('children' in displayObject && Array.isArray(displayObject.children)) {
      for (const child of displayObject.children) {
        this.renderDisplayObject(child, canvas, opacity);
      }
    }

    canvas.restore();
  }
}
