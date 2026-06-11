import type { CanvasKit } from 'canvaskit-wasm';

import type { SkiaRuntime } from './types';

let runtimePromise: Promise<SkiaRuntime> | null = null;

const resolveCanvasKitWasmUrl = (): string => {
  const customUrl = import.meta.env.VITE_CANVASKIT_WASM_URL?.trim();
  const fallbackUrl = '/canvaskit/custom/canvaskit.wasm';

  return customUrl && customUrl.length > 0 ? customUrl : fallbackUrl;
};

type CanvasKitInit = (options: {
  locateFile: (fileName: string) => string;
}) => Promise<CanvasKit>;

const getCanvasKitInit = (): CanvasKitInit => {
  const globalInit = (window as Window & { CanvasKitInit?: unknown }).CanvasKitInit;
  if (typeof globalInit !== 'function') {
    throw new Error(
      'CanvasKitInit не найден. Проверьте подключение /canvaskit/custom/canvaskit.js в index.html.',
    );
  }

  return globalInit as CanvasKitInit;
};

export const loadSkiaRuntime = (
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<SkiaRuntime> => {
  if (!runtimePromise) {
    const resolvedWasmUrl = resolveCanvasKitWasmUrl();
    const canvasKitInit = getCanvasKitInit();

    runtimePromise = canvasKitInit({
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
