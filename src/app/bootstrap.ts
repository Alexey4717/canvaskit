import { bindSkiaPointerBridge } from '@/modules/interaction/eventBridge';
import { createPixiSceneState } from '@/modules/pixi/sceneState';
import { loadSkiaRuntime } from '@/modules/skia/canvaskitLoader';
import { PixiToSkiaRenderer } from '@/modules/skia/pixiToSkiaRenderer';
import { exportSceneToPdf } from '@/modules/skia/pdfExporter';
import { createWorkspaceLayout } from '@/shared/ui/canvasWorkspace/canvasWorkspace';
import { createControlPanel } from '@/shared/ui/controlPanel/controlPanel';

const VIEWPORT_WIDTH = 300;
const VIEWPORT_HEIGHT = 180;

export const bootstrapApp = async (appRoot: HTMLElement): Promise<() => void> => {
  const workspace = createWorkspaceLayout();
  appRoot.appendChild(workspace.root);

  const pixiScene = createPixiSceneState(workspace.pixiCanvasHost, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  const skiaCanvas = document.createElement('canvas');
  skiaCanvas.width = VIEWPORT_WIDTH;
  skiaCanvas.height = VIEWPORT_HEIGHT;
  workspace.skiaCanvasHost.appendChild(skiaCanvas);

  const skiaRuntime = await loadSkiaRuntime(skiaCanvas, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  const skiaRenderer = new PixiToSkiaRenderer(skiaRuntime.canvasKit);

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
    },
    onExportPdf: async () => {
      try {
        exportSceneToPdf(
          skiaRuntime.canvasKit,
          pixiScene.sceneRoot,
          VIEWPORT_WIDTH,
          VIEWPORT_HEIGHT,
        );
      } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : 'Ошибка экспорта PDF');
      }
    },
  });

  workspace.controlsHost.appendChild(controls);

  return () => {
    unbindBridge();
    pixiScene.app.ticker.remove(drawSkia);
    skiaRenderer.dispose();
    skiaRuntime.surface.dispose();
    pixiScene.destroy();
  };
};
