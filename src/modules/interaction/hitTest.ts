import * as PIXI from 'pixi.js-legacy';

const distanceToSegment = (
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (segmentLengthSquared === 0) {
    const offsetX = pointX - startX;
    const offsetY = pointY - startY;

    return Math.hypot(offsetX, offsetY);
  }

  const t = Math.max(
    0,
    Math.min(1, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / segmentLengthSquared),
  );
  const projectionX = startX + t * deltaX;
  const projectionY = startY + t * deltaY;

  return Math.hypot(pointX - projectionX, pointY - projectionY);
};

const mapByOptionalMatrix = (
  matrix: PIXI.Matrix | null,
  x: number,
  y: number,
): { x: number; y: number } => {
  if (!matrix) {
    return { x, y };
  }

  const mapped = matrix.apply(new PIXI.Point(x, y));

  return {
    x: mapped.x,
    y: mapped.y,
  };
};

const containsGraphicsStrokePoint = (graphics: PIXI.Graphics, localPoint: PIXI.Point): boolean => {
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

const containsInLocalBounds = (
  displayObject: PIXI.DisplayObject,
  localPoint: PIXI.Point,
): boolean => {
  const bounds = displayObject.getLocalBounds();

  return (
    localPoint.x >= bounds.x &&
    localPoint.x <= bounds.x + bounds.width &&
    localPoint.y >= bounds.y &&
    localPoint.y <= bounds.y + bounds.height
  );
};

const hitTestSingle = (
  displayObject: PIXI.DisplayObject,
  globalPoint: PIXI.Point,
): PIXI.DisplayObject | null => {
  if (!displayObject.visible || displayObject.worldAlpha <= 0 || !displayObject.renderable) {
    return null;
  }

  if ('children' in displayObject && Array.isArray(displayObject.children)) {
    for (let i = displayObject.children.length - 1; i >= 0; i -= 1) {
      const child = displayObject.children[i];
      const childMatch = hitTestSingle(child, globalPoint);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  const localPoint = displayObject.worldTransform.applyInverse(globalPoint);

  if (displayObject.hitArea?.contains(localPoint.x, localPoint.y)) {
    return displayObject;
  }

  if (displayObject instanceof PIXI.Graphics) {
    if (displayObject.geometry.containsPoint(localPoint)) {
      return displayObject;
    }

    return containsGraphicsStrokePoint(displayObject, localPoint) ? displayObject : null;
  }

  if (displayObject instanceof PIXI.Sprite) {
    return containsInLocalBounds(displayObject, localPoint) ? displayObject : null;
  }

  return null;
};

export const hitTestDisplayTree = (
  root: PIXI.Container,
  globalX: number,
  globalY: number,
): PIXI.DisplayObject | null => {
  return hitTestSingle(root, new PIXI.Point(globalX, globalY));
};
