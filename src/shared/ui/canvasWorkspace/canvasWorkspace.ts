import styles from './canvasWorkspace.module.css';

interface CanvasPanelData {
  title: string;
  subtitle: string;
}

const createCanvasPanel = ({
  title,
  subtitle,
}: CanvasPanelData): {
  panelElement: HTMLElement;
  canvasHost: HTMLElement;
} => {
  const panelElement = document.createElement('section');
  panelElement.className = styles.panel ?? '';

  const titleElement = document.createElement('h2');
  titleElement.className = styles.panelTitle ?? '';
  titleElement.textContent = title;

  const subtitleElement = document.createElement('h3');
  subtitleElement.className = styles.panelSubtitle ?? '';
  subtitleElement.textContent = subtitle;

  const canvasHost = document.createElement('div');
  canvasHost.className = styles.canvasHost ?? '';

  panelElement.append(titleElement, subtitleElement, canvasHost);

  return { panelElement, canvasHost };
};

export interface WorkspaceDomRefs {
  root: HTMLElement;
  controlsHost: HTMLElement;
  pixiCanvasHost: HTMLElement;
  skiaCanvasHost: HTMLElement;
}

export const createWorkspaceLayout = (): WorkspaceDomRefs => {
  const root = document.createElement('div');
  root.className = styles.layout ?? '';

  const controlsHost = document.createElement('div');

  const panels = document.createElement('div');
  panels.className = styles.panels ?? '';

  const pixiPanel = createCanvasPanel({ title: 'Канвас1', subtitle: 'Pixi.js' });
  const skiaPanel = createCanvasPanel({ title: 'Канвас2', subtitle: 'Skia' });

  panels.append(pixiPanel.panelElement, skiaPanel.panelElement);
  root.append(controlsHost, panels);

  return {
    root,
    controlsHost,
    pixiCanvasHost: pixiPanel.canvasHost,
    skiaCanvasHost: skiaPanel.canvasHost,
  };
};
