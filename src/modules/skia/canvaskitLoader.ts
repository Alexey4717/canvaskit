import CanvasKitInit from 'canvaskit-wasm/full';
import wasmBinaryUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url';

import type { SkiaRuntime } from './types';

let runtimePromise: Promise<SkiaRuntime> | null = null;

export const loadSkiaRuntime = (
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<SkiaRuntime> => {
  if (!runtimePromise) {
    runtimePromise = CanvasKitInit({
      locateFile: (fileName: string) => {
        if (fileName.endsWith('.wasm')) {
          return wasmBinaryUrl;
        }

        return fileName;
      },
    }).then((canvasKit) => {
      const surface = canvasKit.MakeCanvasSurface(targetCanvas);
      if (!surface) {
        throw new Error('CanvasKit: не удалось создать Surface для Skia canvas.');
      }

      targetCanvas.width = width;
      targetCanvas.height = height;

      return {
        canvasKit,
        surface,
        canvas: surface.getCanvas(),
      };
    });
  }

  return runtimePromise;
};
