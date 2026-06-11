import * as PIXI from 'pixi.js-legacy';

import { toCanvasPoint } from './pointerBridge/toCanvasPoint';
import { hitTestDisplayTree } from './hitTest/hitTestDisplayTree';

/**
 * Пробрасывает pointer-события со Skia canvas в дерево PIXI.
 * Возвращает функцию cleanup для корректного снятия подписок.
 */
export const bindSkiaPointerBridge = (
  skiaCanvas: HTMLCanvasElement,
  pixiRoot: PIXI.Container,
): (() => void) => {
  const emitPointerEvent =
    (type: 'pointerdown' | 'pointerup') =>
    (event: PointerEvent): void => {
      const point = toCanvasPoint(skiaCanvas, event);
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
