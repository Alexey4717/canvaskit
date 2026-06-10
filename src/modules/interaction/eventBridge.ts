import * as PIXI from 'pixi.js-legacy';

import { hitTestDisplayTree } from './hitTest';

export const bindSkiaPointerBridge = (
  skiaCanvas: HTMLCanvasElement,
  pixiRoot: PIXI.Container,
): (() => void) => {
  const toCanvasPoint = (event: PointerEvent): { x: number; y: number } => {
    const rect = skiaCanvas.getBoundingClientRect();
    const scaleX = skiaCanvas.width / rect.width;
    const scaleY = skiaCanvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const emitPointerEvent =
    (type: 'pointerdown' | 'pointerup') =>
    (event: PointerEvent): void => {
      const point = toCanvasPoint(event);
      const target = hitTestDisplayTree(pixiRoot, point.x, point.y);
      if (!target) {
        return;
      }

      // Передаем минимальные данные, достаточные для тестовых подписчиков.
      target.emit(type, {
        ...event,
        global: new PIXI.Point(point.x, point.y),
        target,
        currentTarget: target,
        type,
      } as unknown as PIXI.FederatedPointerEvent);
    };

  const onPointerDown = emitPointerEvent('pointerdown');
  const onPointerUp = emitPointerEvent('pointerup');

  skiaCanvas.addEventListener('pointerdown', onPointerDown);
  skiaCanvas.addEventListener('pointerup', onPointerUp);

  return () => {
    skiaCanvas.removeEventListener('pointerdown', onPointerDown);
    skiaCanvas.removeEventListener('pointerup', onPointerUp);
  };
};
