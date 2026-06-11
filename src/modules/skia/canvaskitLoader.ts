import CanvasKitInit from 'canvaskit-wasm/full';
import wasmBinaryUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm?url';

import type { SkiaRuntime } from './types';

let runtimePromise: Promise<SkiaRuntime> | null = null;

const resolveCanvasKitWasmUrl = (): string => {
  const customUrl = import.meta.env.VITE_CANVASKIT_WASM_URL?.trim();

  return customUrl && customUrl.length > 0 ? customUrl : wasmBinaryUrl;
};

export const loadSkiaRuntime = (
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<SkiaRuntime> => {
  if (!runtimePromise) {
    const resolvedWasmUrl = resolveCanvasKitWasmUrl();
    runtimePromise = CanvasKitInit({
      locateFile: (fileName: string) => {
        if (fileName.endsWith('.wasm')) {
          return resolvedWasmUrl;
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
