import type { CanvasKit, Path, RRect, Rect } from 'canvaskit-wasm';

export type PathBuilderLike = {
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

/**
 * Создаёт унифицированный PathBuilder API.
 * Для старых сборок CanvasKit с отсутствующим PathBuilder использует Path fallback.
 */
export const makePathBuilder = (canvasKit: CanvasKit): PathBuilderLike => {
  const dynamicCanvasKit = canvasKit as CanvasKit & {
    PathBuilder?: new () => PathBuilderLike;
    Path: new () => Path;
  };

  if (typeof dynamicCanvasKit.PathBuilder === 'function') {
    return new dynamicCanvasKit.PathBuilder();
  }

  // Fallback для сборок CanvasKit без PathBuilder:
  // используем Path и адаптируем его к совместимому API.
  const path = new dynamicCanvasKit.Path();
  const pathApi = path as unknown as Omit<PathBuilderLike, 'detach' | 'delete'>;

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
};
