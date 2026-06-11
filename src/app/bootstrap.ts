import { createExportScenePdfHandler } from '@/features/export-scene-pdf/model';
import { createGenerateRandomShapeHandler } from '@/features/generate-random-shape/model';
import { bindSkiaPointerBridge } from '@/modules/interaction';
import { createPixiSceneState } from '@/modules/pixi';
import { createWorkspaceLayout } from '@/shared/ui/canvasWorkspace/canvasWorkspace';
import { createControlPanel } from '@/shared/ui/controlPanel/controlPanel';

const VIEWPORT_WIDTH = 300;
const VIEWPORT_HEIGHT = 180;

/**
 * Точка входа приложения: инициализирует Pixi/Skia, связывает UI-экшены
 * и возвращает функцию полного teardown всех подписок и ресурсов.
 */
export const bootstrapApp = async (appRoot: HTMLElement): Promise<() => void> => {
  const workspace = createWorkspaceLayout();
  appRoot.appendChild(workspace.root);

  const pixiScene = createPixiSceneState(workspace.pixiCanvasHost, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  let setStatus: (message: string, tone?: 'neutral' | 'success' | 'error' | 'info') => void = () => {};
  let setBusy: (isBusy: boolean) => void = () => {};
  let drawSkia: (() => void) | null = null;
  let handleGenerateRandomShape = (): void => {
    setStatus('Идёт инициализация. Дождитесь завершения загрузки.', 'neutral');
  };
  let handleExportPdf = async (): Promise<void> => {
    setStatus('Идёт инициализация. Дождитесь завершения загрузки.', 'neutral');
  };

  const controls = createControlPanel({
    onGenerateRandomShape: () => handleGenerateRandomShape(),
    onExportPdf: () => handleExportPdf(),
  });
  setStatus = controls.setStatus;
  setBusy = controls.setBusy;
  controls.setControlsDisabled(true);
  setStatus('Инициализация сцены и CanvasKit...', 'neutral');
  workspace.controlsHost.appendChild(controls.root);

  const pixiCanvasView = pixiScene.app.view as HTMLCanvasElement;
  const skiaPreviewCanvas = document.createElement('canvas');
  skiaPreviewCanvas.width = VIEWPORT_WIDTH;
  skiaPreviewCanvas.height = VIEWPORT_HEIGHT;
  workspace.skiaCanvasHost.appendChild(skiaPreviewCanvas);
  const previewContext = skiaPreviewCanvas.getContext('2d');
  let previewAnimationId: number | null = null;
  let isPreviewRunning = true;

  const stopSkiaPreview = (): void => {
    isPreviewRunning = false;
    if (previewAnimationId !== null) {
      window.cancelAnimationFrame(previewAnimationId);
      previewAnimationId = null;
    }
    skiaPreviewCanvas.remove();
  };

  const drawSkiaPreview = (): void => {
    if (!isPreviewRunning) {
      return;
    }
    if (previewContext) {
      previewContext.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      previewContext.drawImage(pixiCanvasView, 0, 0);
    }
    previewAnimationId = window.requestAnimationFrame(drawSkiaPreview);
  };

  drawSkiaPreview();

  try {
    const { loadSkiaRuntime, PixiToSkiaRenderer, exportSceneToPdf, isPdfBackendAvailable } =
      await import('@/modules/skia');
    const skiaCanvas = document.createElement('canvas');
    skiaCanvas.width = VIEWPORT_WIDTH;
    skiaCanvas.height = VIEWPORT_HEIGHT;

    const skiaRuntime = await loadSkiaRuntime(skiaCanvas, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    const skiaRenderer = new PixiToSkiaRenderer(skiaRuntime.canvasKit);
    const hasPdfBackend = isPdfBackendAvailable(skiaRuntime.canvasKit);
    stopSkiaPreview();
    workspace.skiaCanvasHost.appendChild(skiaCanvas);

    // Рендер в Skia запускается тикером Pixi, чтобы обе сцены оставались синхронизированы.
    drawSkia = (): void => {
      skiaRenderer.render(pixiScene.sceneRoot, skiaRuntime.canvas);
      skiaRuntime.surface.flush();
    };

    pixiScene.app.ticker.add(drawSkia);
    drawSkia();

    const unbindBridge = bindSkiaPointerBridge(skiaCanvas, pixiScene.sceneRoot);

    handleGenerateRandomShape = createGenerateRandomShapeHandler({
      addRandomShape: pixiScene.addRandomShape,
      drawSkia,
      setStatus: (message, tone) => setStatus(message, tone),
    });
    handleExportPdf = createExportScenePdfHandler({
      canvasKit: skiaRuntime.canvasKit,
      sceneRoot: pixiScene.sceneRoot,
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
      exportSceneToPdf,
      setStatus: (message, tone) => setStatus(message, tone),
      setBusy: (isBusy) => setBusy(isBusy),
    });
    controls.setControlsDisabled(false);

    if (hasPdfBackend) {
      setStatus('PDF backend найден. Экспорт доступен.', 'success');
    } else {
      setStatus(
        'PDF backend не найден. Укажите VITE_CANVASKIT_WASM_URL на custom wasm-сборку.',
        'error',
      );
    }

    return () => {
      stopSkiaPreview();
      unbindBridge();
      if (drawSkia) {
        pixiScene.app.ticker.remove(drawSkia);
      }
      skiaRenderer.dispose();
      skiaRuntime.surface.dispose();
      pixiScene.destroy();
    };
  } catch (error) {
    stopSkiaPreview();
    if (drawSkia) {
      pixiScene.app.ticker.remove(drawSkia);
    }
    controls.setControlsDisabled(false);
    setBusy(false);
    setStatus('Не удалось инициализировать CanvasKit. Проверьте конфигурацию wasm.', 'error');
    throw error;
  }
};
