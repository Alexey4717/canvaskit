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
  const { loadSkiaRuntime, PixiToSkiaRenderer, exportSceneToPdf, isPdfBackendAvailable } =
    await import('@/modules/skia');

  const workspace = createWorkspaceLayout();
  appRoot.appendChild(workspace.root);

  const pixiScene = createPixiSceneState(workspace.pixiCanvasHost, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  const skiaCanvas = document.createElement('canvas');
  skiaCanvas.width = VIEWPORT_WIDTH;
  skiaCanvas.height = VIEWPORT_HEIGHT;
  workspace.skiaCanvasHost.appendChild(skiaCanvas);

  const skiaRuntime = await loadSkiaRuntime(skiaCanvas, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  const skiaRenderer = new PixiToSkiaRenderer(skiaRuntime.canvasKit);
  const hasPdfBackend = isPdfBackendAvailable(skiaRuntime.canvasKit);
  let setStatus: (message: string, tone?: 'neutral' | 'success' | 'error' | 'info') => void = () => {};
  let setBusy: (isBusy: boolean) => void = () => {};

  // Рендер в Skia запускается тикером Pixi, чтобы обе сцены оставались синхронизированы.
  const drawSkia = (): void => {
    skiaRenderer.render(pixiScene.sceneRoot, skiaRuntime.canvas);
    skiaRuntime.surface.flush();
  };

  pixiScene.app.ticker.add(drawSkia);
  drawSkia();

  const unbindBridge = bindSkiaPointerBridge(skiaCanvas, pixiScene.sceneRoot);

  const controls = createControlPanel({
    onGenerateRandomShape: createGenerateRandomShapeHandler({
      addRandomShape: pixiScene.addRandomShape,
      drawSkia,
      setStatus: (message, tone) => setStatus(message, tone),
    }),
    onExportPdf: createExportScenePdfHandler({
      canvasKit: skiaRuntime.canvasKit,
      sceneRoot: pixiScene.sceneRoot,
      viewportWidth: VIEWPORT_WIDTH,
      viewportHeight: VIEWPORT_HEIGHT,
      exportSceneToPdf,
      setStatus: (message, tone) => setStatus(message, tone),
      setBusy: (isBusy) => setBusy(isBusy),
    }),
  });
  setStatus = controls.setStatus;
  setBusy = controls.setBusy;

  if (hasPdfBackend) {
    setStatus('PDF backend найден. Экспорт доступен.', 'success');
  } else {
    setStatus(
      'PDF backend не найден. Укажите VITE_CANVASKIT_WASM_URL на custom wasm-сборку.',
      'error',
    );
  }

  workspace.controlsHost.appendChild(controls.root);

  return () => {
    unbindBridge();
    pixiScene.app.ticker.remove(drawSkia);
    skiaRenderer.dispose();
    skiaRuntime.surface.dispose();
    pixiScene.destroy();
  };
};
