import styles from './controlPanel.module.css';

export interface ControlPanelActions {
  onGenerateRandomShape: () => void;
  onExportPdf: () => Promise<void> | void;
}

export const createControlPanel = (actions: ControlPanelActions): HTMLElement => {
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

  root.append(generateButton, exportButton);

  return root;
};
