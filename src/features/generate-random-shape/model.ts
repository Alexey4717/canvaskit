type StatusTone = 'neutral' | 'success' | 'error' | 'info';

interface GenerateRandomShapeDeps {
  addRandomShape: () => void;
  drawSkia: () => void;
  setStatus: (message: string, tone?: StatusTone) => void;
}

/** Создаёт сценарий добавления случайного объекта и синхронного обновления Skia-представления. */
export const createGenerateRandomShapeHandler = (deps: GenerateRandomShapeDeps): (() => void) => {
  return () => {
    deps.addRandomShape();
    deps.drawSkia();
    deps.setStatus('Случайный объект добавлен в сцену', 'info');
  };
};
