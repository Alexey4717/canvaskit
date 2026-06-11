import * as PIXI from 'pixi.js-legacy';

import { toCanvasPoint } from './pointerBridge/toCanvasPoint';
import { hitTestDisplayTree } from './hitTest/hitTestDisplayTree';

type BridgedPointerEventType = 'pointerdown' | 'pointerup' | 'pointerupoutside' | 'pointercancel';

const emitPointerEvent = (
  target: PIXI.DisplayObject,
  type: BridgedPointerEventType,
  nativeEvent: PointerEvent,
  globalPoint: PIXI.Point,
): void => {
  const payload = {
    type,
    global: globalPoint,
    target,
    currentTarget: target,
    originalEvent: nativeEvent,
    nativeEvent,
    pointerType: nativeEvent.pointerType,
    pointerId: nativeEvent.pointerId,
    button: nativeEvent.button,
    buttons: nativeEvent.buttons,
    pressure: nativeEvent.pressure,
    altKey: nativeEvent.altKey,
    ctrlKey: nativeEvent.ctrlKey,
    metaKey: nativeEvent.metaKey,
    shiftKey: nativeEvent.shiftKey,
    clientX: nativeEvent.clientX,
    clientY: nativeEvent.clientY,
  } as unknown as PIXI.FederatedPointerEvent;

  target.emit(type, payload);
};

/**
 * Пробрасывает pointer-события со Skia canvas в дерево PIXI.
 * Возвращает функцию cleanup для корректного снятия подписок.
 */
export const bindSkiaPointerBridge = (
  skiaCanvas: HTMLCanvasElement,
  pixiRoot: PIXI.Container,
): (() => void) => {
  const activeTargetsByPointerId = new Map<number, PIXI.DisplayObject>();

  const onPointerDown = (event: PointerEvent): void => {
    const point = toCanvasPoint(skiaCanvas, event);
    const target = hitTestDisplayTree(pixiRoot, point.x, point.y);
    if (!target) {
      return;
    }

    const globalPoint = new PIXI.Point(point.x, point.y);
    activeTargetsByPointerId.set(event.pointerId, target);
    emitPointerEvent(target, 'pointerdown', event, globalPoint);
  };

  const onPointerUp = (event: PointerEvent): void => {
    const point = toCanvasPoint(skiaCanvas, event);
    const globalPoint = new PIXI.Point(point.x, point.y);
    const pointerDownTarget = activeTargetsByPointerId.get(event.pointerId) ?? null;
    const pointerUpTarget = hitTestDisplayTree(pixiRoot, point.x, point.y);

    if (pointerUpTarget) {
      emitPointerEvent(pointerUpTarget, 'pointerup', event, globalPoint);
    }

    if (pointerDownTarget && pointerDownTarget !== pointerUpTarget) {
      emitPointerEvent(pointerDownTarget, 'pointerupoutside', event, globalPoint);
    }

    activeTargetsByPointerId.delete(event.pointerId);
  };

  const onPointerCancel = (event: PointerEvent): void => {
    const point = toCanvasPoint(skiaCanvas, event);
    const globalPoint = new PIXI.Point(point.x, point.y);
    const pointerDownTarget = activeTargetsByPointerId.get(event.pointerId) ?? null;
    if (!pointerDownTarget) {
      return;
    }

    emitPointerEvent(pointerDownTarget, 'pointercancel', event, globalPoint);
    emitPointerEvent(pointerDownTarget, 'pointerupoutside', event, globalPoint);
    activeTargetsByPointerId.delete(event.pointerId);
  };

  skiaCanvas.addEventListener('pointerdown', onPointerDown);
  skiaCanvas.addEventListener('pointerup', onPointerUp);
  skiaCanvas.addEventListener('pointercancel', onPointerCancel);

  return () => {
    skiaCanvas.removeEventListener('pointerdown', onPointerDown);
    skiaCanvas.removeEventListener('pointerup', onPointerUp);
    skiaCanvas.removeEventListener('pointercancel', onPointerCancel);
    activeTargetsByPointerId.clear();
  };
};
