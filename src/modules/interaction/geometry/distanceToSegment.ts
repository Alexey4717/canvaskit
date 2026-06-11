/**
 * Возвращает минимальную дистанцию от точки до отрезка.
 * Используется для hit-test stroke-линий у Graphics/POLY.
 */
export const distanceToSegment = (
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
