import * as PIXI from 'pixi.js-legacy';

export const mapByOptionalMatrix = (
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
