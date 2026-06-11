import type { CanvasKit } from 'canvaskit-wasm';

import type { SkiaRuntime } from './types';

let runtimePromise: Promise<SkiaRuntime> | null = null;

const FALLBACK_WASM_URL = '/canvaskit/custom/canvaskit.wasm';
const ALLOWED_WASM_PATH_PREFIX = '/canvaskit/custom/';

const isAllowedWasmPath = (pathName: string): boolean => {
  return pathName.startsWith(ALLOWED_WASM_PATH_PREFIX) && pathName.endsWith('.wasm');
};

const toSafeWasmUrl = (rawUrl: string): string => {
  const parsedUrl = new URL(rawUrl, window.location.origin);
  const isSameOrigin = parsedUrl.origin === window.location.origin;
  const hasAllowedPath = isAllowedWasmPath(parsedUrl.pathname);

  if (!isSameOrigin || !hasAllowedPath) {
    throw new Error(
      `Недопустимый URL CanvasKit WASM: "${rawUrl}". Разрешены только same-origin пути "${ALLOWED_WASM_PATH_PREFIX}*.wasm".`,
    );
  }

  return `${parsedUrl.pathname}${parsedUrl.search}`;
};

const resolveCanvasKitWasmUrl = (): string => {
  const customUrl = import.meta.env.VITE_CANVASKIT_WASM_URL?.trim();
  const fallbackUrl = FALLBACK_WASM_URL;

  if (!customUrl || customUrl.length === 0) {
    return fallbackUrl;
  }

  return toSafeWasmUrl(customUrl);
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

/**
 * Инициализирует CanvasKit runtime и Surface один раз (singleton per page load).
 * Последующие вызовы возвращают тот же Promise с уже созданным runtime.
 */
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
