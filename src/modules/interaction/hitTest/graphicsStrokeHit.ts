import * as PIXI from 'pixi.js-legacy';

import { distanceToSegment } from '../geometry/distanceToSegment';
import { mapByOptionalMatrix } from '../geometry/mapByOptionalMatrix';

/**
 * PIXI geometry.containsPoint покрывает только fill.
 * Для line-only графики дополнительно проверяем расстояние до каждого сегмента.
 */
export const containsGraphicsStrokePoint = (
  graphics: PIXI.Graphics,
  localPoint: PIXI.Point,
): boolean => {
  for (const graphicsData of graphics.geometry.graphicsData) {
    const lineStyle = graphicsData.lineStyle;
    if (!lineStyle.visible || lineStyle.alpha <= 0 || lineStyle.width <= 0) {
      continue;
    }

    if (graphicsData.type !== PIXI.SHAPES.POLY) {
      continue;
    }

    const polygon = graphicsData.shape as PIXI.Polygon;
    if (polygon.points.length < 4) {
      continue;
    }

    const matrix = graphicsData.matrix ?? null;
    const threshold = lineStyle.width / 2;

    for (let i = 0; i + 3 < polygon.points.length; i += 2) {
      const start = mapByOptionalMatrix(matrix, polygon.points[i] ?? 0, polygon.points[i + 1] ?? 0);
      const end = mapByOptionalMatrix(matrix, polygon.points[i + 2] ?? 0, polygon.points[i + 3] ?? 0);

      if (distanceToSegment(localPoint.x, localPoint.y, start.x, start.y, end.x, end.y) <= threshold) {
        return true;
      }
    }

    if (polygon.closeStroke) {
      const first = mapByOptionalMatrix(matrix, polygon.points[0] ?? 0, polygon.points[1] ?? 0);
      const last = mapByOptionalMatrix(
        matrix,
        polygon.points[polygon.points.length - 2] ?? 0,
        polygon.points[polygon.points.length - 1] ?? 0,
      );

      if (distanceToSegment(localPoint.x, localPoint.y, last.x, last.y, first.x, first.y) <= threshold) {
        return true;
      }
    }
  }

  return false;
};
