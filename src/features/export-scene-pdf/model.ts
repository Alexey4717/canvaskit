import type * as PIXI from 'pixi.js-legacy';
import type { CanvasKit } from 'canvaskit-wasm';

type StatusTone = 'neutral' | 'success' | 'error' | 'info';

type ExportScenePdfDeps = {
  canvasKit: CanvasKit;
  sceneRoot: PIXI.Container;
  viewportWidth: number;
  viewportHeight: number;
  exportSceneToPdf: (
    canvasKit: CanvasKit,
    container: PIXI.Container,
    width: number,
    height: number,
  ) => { fileName: string; byteLength: number };
  setStatus: (message: string, tone?: StatusTone) => void;
  setBusy: (isBusy: boolean) => void;
};

/** Создаёт обработчик экспорта сцены в PDF с единым управлением busy/status состоянием. */
export const createExportScenePdfHandler = (deps: ExportScenePdfDeps): (() => Promise<void>) => {
  return async () => {
    deps.setBusy(true);
    deps.setStatus('Экспортируем сцену в PDF...', 'info');
    try {
      const exported = deps.exportSceneToPdf(
        deps.canvasKit,
        deps.sceneRoot,
        deps.viewportWidth,
        deps.viewportHeight,
      );
      deps.setStatus(`PDF готов: ${exported.fileName} (${Math.ceil(exported.byteLength / 1024)} KB)`, 'success');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Ошибка экспорта PDF';
      deps.setStatus(message, 'error');
    } finally {
      deps.setBusy(false);
    }
  };
};
