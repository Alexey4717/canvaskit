/**
 * Приводит координаты PointerEvent к внутренним координатам canvas
 * с учётом CSS-масштабирования элемента.
 */
export const toCanvasPoint = (
  canvasElement: HTMLCanvasElement,
  event: PointerEvent,
): { x: number; y: number } => {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width;
  const scaleY = canvasElement.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};
