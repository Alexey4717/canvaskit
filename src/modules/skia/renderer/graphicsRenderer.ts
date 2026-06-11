import {
  Circle,
  Ellipse,
  Graphics,
  Polygon,
  Rectangle,
  RoundedRectangle,
  SHAPES,
} from 'pixi.js-legacy';
import type { Canvas, CanvasKit, Paint, Path } from 'canvaskit-wasm';
import type { GraphicsData } from '@pixi/graphics';

import { hexToRgba } from '@/shared/lib/color';

import { toSkMatrix } from './matrix';
import { makePathBuilder } from './pathBuilder';

const createPaint = (
  canvasKit: CanvasKit,
  color: number,
  alpha: number,
  style: 'fill' | 'stroke',
): Paint => {
  const paint = new canvasKit.Paint();
  const rgba = hexToRgba(color, alpha);
  paint.setColor(canvasKit.Color4f(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a));
  paint.setStyle(style === 'fill' ? canvasKit.PaintStyle.Fill : canvasKit.PaintStyle.Stroke);

  return paint;
};

const toStrokeCap = (
  canvasKit: CanvasKit,
  cap: unknown,
): Parameters<Paint['setStrokeCap']>[0] => {
  const normalizedCap = String(cap).toLowerCase();
  if (normalizedCap === 'round') {
    return canvasKit.StrokeCap.Round;
  }
  if (normalizedCap === 'square') {
    return canvasKit.StrokeCap.Square;
  }

  return canvasKit.StrokeCap.Butt;
};

const toStrokeJoin = (
  canvasKit: CanvasKit,
  join: unknown,
): Parameters<Paint['setStrokeJoin']>[0] => {
  const normalizedJoin = String(join).toLowerCase();
  if (normalizedJoin === 'round') {
    return canvasKit.StrokeJoin.Round;
  }
  if (normalizedJoin === 'bevel') {
    return canvasKit.StrokeJoin.Bevel;
  }

  return canvasKit.StrokeJoin.Miter;
};

const buildPath = (canvasKit: CanvasKit, graphicsData: GraphicsData): Path | null => {
  const pathBuilder = makePathBuilder(canvasKit);
  const { shape } = graphicsData;

  switch (graphicsData.type) {
    case SHAPES.RECT: {
      const rect = shape as Rectangle;
      pathBuilder.addRect(canvasKit.XYWHRect(rect.x, rect.y, rect.width, rect.height));
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
        canvasKit.XYWHRect(
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
        canvasKit.RRectXY(
          canvasKit.XYWHRect(
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
        pathBuilder.delete();

        return null;
      }

      const firstX = polygon.points[0];
      const firstY = polygon.points[1];
      if (firstX === undefined || firstY === undefined) {
        pathBuilder.delete();

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

      // Для линий/полилиний повторяем поведение PIXI:
      // замыкаем контур только если closeStroke включён.
      if (polygon.closeStroke) {
        pathBuilder.close();
      }
      break;
    }
    default:
      pathBuilder.delete();

      return null;
  }

  if (graphicsData.matrix) {
    pathBuilder.transform(toSkMatrix(graphicsData.matrix));
  }

  const path = pathBuilder.detach();
  pathBuilder.delete();

  return path;
};

/** Рисует все fill/stroke команды у PIXI.Graphics в текущем состоянии canvas transform. */
export const renderGraphics = (
  canvasKit: CanvasKit,
  graphics: Graphics,
  canvas: Canvas,
  opacity: number,
): void => {
  for (const graphicsData of graphics.geometry.graphicsData) {
    const path = buildPath(canvasKit, graphicsData);
    if (!path) {
      continue;
    }

    const fillStyle = graphicsData.fillStyle;
    if (fillStyle.visible && fillStyle.alpha > 0) {
      const fillPaint = createPaint(canvasKit, fillStyle.color, fillStyle.alpha * opacity, 'fill');
      canvas.drawPath(path, fillPaint);
      fillPaint.delete();
    }

    const lineStyle = graphicsData.lineStyle;
    if (lineStyle.visible && lineStyle.width > 0 && lineStyle.alpha > 0) {
      const strokePaint = createPaint(canvasKit, lineStyle.color, lineStyle.alpha * opacity, 'stroke');
      strokePaint.setStrokeWidth(lineStyle.width);
      strokePaint.setStrokeCap(toStrokeCap(canvasKit, lineStyle.cap));
      strokePaint.setStrokeJoin(toStrokeJoin(canvasKit, lineStyle.join));
      strokePaint.setStrokeMiter(lineStyle.miterLimit);
      canvas.drawPath(path, strokePaint);
      strokePaint.delete();
    }

    path.delete();
  }
};
