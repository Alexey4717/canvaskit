import {
  Circle,
  Ellipse,
  Graphics,
  Matrix,
  Polygon,
  Rectangle,
  RoundedRectangle,
  SHAPES,
  Sprite,
} from 'pixi.js-legacy';
import type { Canvas, CanvasKit, Image, Paint, Path, RRect, Rect } from 'canvaskit-wasm';

import { hexToRgba } from '@/shared/lib/color';

const BACKGROUND_COLOR: [number, number, number, number] = [0.94, 0.94, 0.94, 1];

const toSkMatrix = (matrix: Matrix): number[] => {
  return [matrix.a, matrix.c, matrix.tx, matrix.b, matrix.d, matrix.ty, 0, 0, 1];
};

const isCanvasImageSource = (value: unknown): value is CanvasImageSource => {
  if (!value) {
    return false;
  }

  return (
    value instanceof HTMLImageElement ||
    value instanceof HTMLCanvasElement ||
    value instanceof HTMLVideoElement ||
    value instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas)
  );
};

export class PixiToSkiaRenderer {
  private readonly imageCache = new Map<number, Image>();

  constructor(private readonly canvasKit: CanvasKit) {}

  public render(container: import('pixi.js-legacy').Container, canvas: Canvas): void {
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

  private renderDisplayObject(
    displayObject: import('pixi.js-legacy').DisplayObject,
    canvas: Canvas,
    parentOpacity: number,
  ): void {
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
      this.renderGraphics(displayObject, canvas, opacity);
    } else if (displayObject instanceof Sprite) {
      this.renderSprite(displayObject, canvas, opacity);
    }

    if ('children' in displayObject && Array.isArray(displayObject.children)) {
      for (const child of displayObject.children) {
        this.renderDisplayObject(child, canvas, opacity);
      }
    }

    canvas.restore();
  }

  private renderGraphics(graphics: Graphics, canvas: Canvas, opacity: number): void {
    for (const graphicsData of graphics.geometry.graphicsData) {
      const pathBuilder = this.makePathBuilder();
      const path = this.buildPath(pathBuilder, graphicsData);
      if (!path) {
        pathBuilder.delete();
        continue;
      }

      const fillStyle = graphicsData.fillStyle;
      if (fillStyle.visible && fillStyle.alpha > 0) {
        const fillPaint = this.createPaint(fillStyle.color, fillStyle.alpha * opacity, 'fill');
        canvas.drawPath(path, fillPaint);
        fillPaint.delete();
      }

      const lineStyle = graphicsData.lineStyle;
      if (lineStyle.visible && lineStyle.width > 0 && lineStyle.alpha > 0) {
        const strokePaint = this.createPaint(lineStyle.color, lineStyle.alpha * opacity, 'stroke');
        strokePaint.setStrokeWidth(lineStyle.width);
        canvas.drawPath(path, strokePaint);
        strokePaint.delete();
      }

      path.delete();
      pathBuilder.delete();
    }
  }

  private makePathBuilder(): {
    addRect: (rect: Rect) => void;
    addCircle: (x: number, y: number, radius: number) => void;
    addOval: (rect: Rect) => void;
    addRRect: (rrect: RRect) => void;
    moveTo: (x: number, y: number) => void;
    lineTo: (x: number, y: number) => void;
    close: () => void;
    transform: (matrix: number[]) => void;
    detach: () => Path;
    delete: () => void;
  } {
    const dynamicCanvasKit = this.canvasKit as CanvasKit & {
      PathBuilder?: new () => {
        addRect: (rect: Rect) => void;
        addCircle: (x: number, y: number, radius: number) => void;
        addOval: (rect: Rect) => void;
        addRRect: (rrect: RRect) => void;
        moveTo: (x: number, y: number) => void;
        lineTo: (x: number, y: number) => void;
        close: () => void;
        transform: (matrix: number[]) => void;
        detach: () => Path;
        delete: () => void;
      };
      Path: new () => Path;
    };

    if (typeof dynamicCanvasKit.PathBuilder === 'function') {
      return new dynamicCanvasKit.PathBuilder();
    }

    const path = new dynamicCanvasKit.Path();
    const pathApi = path as unknown as {
      addRect: (rect: Rect) => void;
      addCircle: (x: number, y: number, radius: number) => void;
      addOval: (rect: Rect) => void;
      addRRect: (rrect: RRect) => void;
      moveTo: (x: number, y: number) => void;
      lineTo: (x: number, y: number) => void;
      close: () => void;
      transform: (matrix: number[]) => void;
    };

    return {
      addRect: (rect) => {
        pathApi.addRect(rect);
      },
      addCircle: (x, y, radius) => {
        pathApi.addCircle(x, y, radius);
      },
      addOval: (rect) => {
        pathApi.addOval(rect);
      },
      addRRect: (rrect) => {
        pathApi.addRRect(rrect);
      },
      moveTo: (x, y) => {
        pathApi.moveTo(x, y);
      },
      lineTo: (x, y) => {
        pathApi.lineTo(x, y);
      },
      close: () => {
        pathApi.close();
      },
      transform: (matrix) => {
        pathApi.transform(matrix);
      },
      detach: () => path,
      delete: () => {},
    };
  }

  private buildPath(
    pathBuilder: ReturnType<PixiToSkiaRenderer['makePathBuilder']>,
    graphicsData: import('@pixi/graphics').GraphicsData,
  ): Path | null {
    const { shape } = graphicsData;

    switch (graphicsData.type) {
      case SHAPES.RECT: {
        const rect = shape as Rectangle;
        pathBuilder.addRect(this.canvasKit.XYWHRect(rect.x, rect.y, rect.width, rect.height));
        break;
      }
      case SHAPES.CIRC: {
        const circle = shape as Circle;
        pathBuilder.addCircle(circle.x, circle.y, circle.radius);
        break;
      }
      case SHAPES.ELIP: {
        const ellipse = shape as Ellipse;
        pathBuilder.addOval(
          this.canvasKit.XYWHRect(
            ellipse.x - ellipse.width,
            ellipse.y - ellipse.height,
            ellipse.width * 2,
            ellipse.height * 2,
          ),
        );
        break;
      }
      case SHAPES.RREC: {
        const roundedRect = shape as RoundedRectangle;
        pathBuilder.addRRect(
          this.canvasKit.RRectXY(
            this.canvasKit.XYWHRect(
              roundedRect.x,
              roundedRect.y,
              roundedRect.width,
              roundedRect.height,
            ),
            roundedRect.radius,
            roundedRect.radius,
          ),
        );
        break;
      }
      case SHAPES.POLY: {
        const polygon = shape as Polygon;
        if (polygon.points.length < 2) {
          return null;
        }

        const firstX = polygon.points[0];
        const firstY = polygon.points[1];
        if (firstX === undefined || firstY === undefined) {
          return null;
        }

        pathBuilder.moveTo(firstX, firstY);
        for (let i = 2; i < polygon.points.length; i += 2) {
          const pointX = polygon.points[i];
          const pointY = polygon.points[i + 1];
          if (pointX === undefined || pointY === undefined) {
            continue;
          }
          pathBuilder.lineTo(pointX, pointY);
        }

        if (polygon.closeStroke) {
          pathBuilder.close();
        }
        break;
      }
      default:
        return null;
    }

    if (graphicsData.matrix) {
      pathBuilder.transform(toSkMatrix(graphicsData.matrix));
    }

    return pathBuilder.detach();
  }

  private renderSprite(sprite: Sprite, canvas: Canvas, opacity: number): void {
    const texture = sprite.texture;
    const source = (texture.baseTexture.resource as { source?: unknown } | undefined)?.source;
    if (!isCanvasImageSource(source)) {
      return;
    }

    let image = this.imageCache.get(texture.baseTexture.uid);
    if (!image) {
      image = this.canvasKit.MakeImageFromCanvasImageSource(source);
      this.imageCache.set(texture.baseTexture.uid, image);
    }

    const width = texture.orig.width;
    const height = texture.orig.height;
    const offsetX = -sprite.anchor.x * width;
    const offsetY = -sprite.anchor.y * height;

    const paint = new this.canvasKit.Paint();
    paint.setAlphaf(opacity);

    canvas.drawImageRect(
      image,
      this.canvasKit.XYWHRect(0, 0, width, height),
      this.canvasKit.XYWHRect(offsetX, offsetY, width, height),
      paint,
      false,
    );

    paint.delete();
  }

  private createPaint(color: number, alpha: number, style: 'fill' | 'stroke'): Paint {
    const paint = new this.canvasKit.Paint();
    const rgba = hexToRgba(color, alpha);
    paint.setColor(this.canvasKit.Color4f(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a));
    paint.setStyle(
      style === 'fill' ? this.canvasKit.PaintStyle.Fill : this.canvasKit.PaintStyle.Stroke,
    );

    return paint;
  }
}
