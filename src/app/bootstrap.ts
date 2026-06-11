import { bindSkiaPointerBridge } from '@/modules/interaction';
import { createPixiSceneState } from '@/modules/pixi';
import { createWorkspaceLayout } from '@/shared/ui/canvasWorkspace/canvasWorkspace';
import { createControlPanel } from '@/shared/ui/controlPanel/controlPanel';

const VIEWPORT_WIDTH = 300;
const VIEWPORT_HEIGHT = 180;

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

  const drawSkia = (): void => {
    skiaRenderer.render(pixiScene.sceneRoot, skiaRuntime.canvas);
    skiaRuntime.surface.flush();
  };

  pixiScene.app.ticker.add(drawSkia);
  drawSkia();

  const unbindBridge = bindSkiaPointerBridge(skiaCanvas, pixiScene.sceneRoot);

  const controls = createControlPanel({
    onGenerateRandomShape: () => {
      pixiScene.addRandomShape();
      drawSkia();
      setStatus('Случайный объект добавлен в сцену', 'info');
    },
    onExportPdf: async () => {
      setBusy(true);
      setStatus('Экспортируем сцену в PDF...', 'info');
      try {
        const exported = exportSceneToPdf(
          skiaRuntime.canvasKit,
          pixiScene.sceneRoot,
          VIEWPORT_WIDTH,
          VIEWPORT_HEIGHT,
        );
        setStatus(
          `PDF готов: ${exported.fileName} (${Math.ceil(exported.byteLength / 1024)} KB)`,
          'success',
        );
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Ошибка экспорта PDF';
        setStatus(message, 'error');
      } finally {
        setBusy(false);
      }
    },
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
