import { Matrix } from 'pixi.js-legacy';

/**
 * CanvasKit принимает матрицу в row-major формате 3x3.
 * PIXI хранит 2D affine-компоненты, поэтому дополняем их до 3x3.
 */
export const toSkMatrix = (matrix: Matrix): number[] => {
  return [matrix.a, matrix.c, matrix.tx, matrix.b, matrix.d, matrix.ty, 0, 0, 1];
};
