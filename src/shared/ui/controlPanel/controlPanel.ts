import styles from './controlPanel.module.css';

export interface ControlPanelActions {
  onGenerateRandomShape: () => void;
  onExportPdf: () => Promise<void> | void;
}

type StatusTone = 'neutral' | 'success' | 'error' | 'info';

const statusClassByTone: Record<StatusTone, string> = {
  neutral: styles.statusNeutral ?? '',
  success: styles.statusSuccess ?? '',
  error: styles.statusError ?? '',
  info: styles.statusInfo ?? '',
};

export interface ControlPanelView {
  root: HTMLElement;
  setStatus: (message: string, tone?: StatusTone) => void;
  setBusy: (isBusy: boolean) => void;
}

export const createControlPanel = (actions: ControlPanelActions): ControlPanelView => {
  const root = document.createElement('section');
  root.className = styles.root ?? '';

  const generateButton = document.createElement('button');
  generateButton.className = styles.button ?? '';
  generateButton.type = 'button';
  generateButton.textContent = 'Сгенерировать случайную линию/фигуру';
  generateButton.addEventListener('click', actions.onGenerateRandomShape);

  const exportButton = document.createElement('button');
  exportButton.className = styles.button ?? '';
  exportButton.type = 'button';
  exportButton.textContent = 'Экспорт в PDF';
  exportButton.addEventListener('click', () => {
    void actions.onExportPdf();
  });

  const status = document.createElement('p');
  status.className = [styles.status ?? '', statusClassByTone.neutral].join(' ').trim();
  status.textContent = 'Готово к тестированию';

  const setStatus = (message: string, tone: StatusTone = 'neutral'): void => {
    status.className = [styles.status ?? '', statusClassByTone[tone]].join(' ').trim();
    status.textContent = message;
  };

  const setBusy = (isBusy: boolean): void => {
    exportButton.disabled = isBusy;
  };

  root.append(generateButton, exportButton, status);

  return {
    root,
    setStatus,
    setBusy,
  };
};
