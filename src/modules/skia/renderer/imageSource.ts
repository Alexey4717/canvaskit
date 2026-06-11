/** Проверяет, что источник текстуры можно конвертировать в Skia Image. */
export const isCanvasImageSource = (value: unknown): value is CanvasImageSource => {
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
