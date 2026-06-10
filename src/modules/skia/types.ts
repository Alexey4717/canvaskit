import type { Canvas, CanvasKit, Surface } from 'canvaskit-wasm';

export interface SkiaRuntime {
  canvasKit: CanvasKit;
  surface: Surface;
  canvas: Canvas;
}

export type PdfBackendDocument = {
  beginPage: (width: number, height: number) => Canvas;
  endPage: () => void;
  close: () => Uint8Array;
};
