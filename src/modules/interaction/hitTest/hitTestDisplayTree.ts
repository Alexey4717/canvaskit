import * as PIXI from 'pixi.js-legacy';

import { containsGraphicsStrokePoint } from './graphicsStrokeHit';

const containsInLocalBounds = (displayObject: PIXI.DisplayObject, localPoint: PIXI.Point): boolean => {
  const bounds = displayObject.getLocalBounds();

  return (
    localPoint.x >= bounds.x &&
    localPoint.x <= bounds.x + bounds.width &&
    localPoint.y >= bounds.y &&
    localPoint.y <= bounds.y + bounds.height
  );
};

/** Идёт с конца children, чтобы попадание соответствовало визуальному z-order (верхний объект первым). */
const hitTestSingle = (
  displayObject: PIXI.DisplayObject,
  globalPoint: PIXI.Point,
): PIXI.DisplayObject | null => {
  if (!displayObject.visible || displayObject.worldAlpha <= 0 || !displayObject.renderable) {
    return null;
  }

  if ('children' in displayObject && Array.isArray(displayObject.children)) {
    for (let i = displayObject.children.length - 1; i >= 0; i -= 1) {
      const child = displayObject.children[i];
      const childMatch = hitTestSingle(child, globalPoint);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  const localPoint = displayObject.worldTransform.applyInverse(globalPoint);

  if (displayObject.hitArea?.contains(localPoint.x, localPoint.y)) {
    return displayObject;
  }

  if (displayObject instanceof PIXI.Graphics) {
    if (displayObject.geometry.containsPoint(localPoint)) {
      return displayObject;
    }

    return containsGraphicsStrokePoint(displayObject, localPoint) ? displayObject : null;
  }

  if (displayObject instanceof PIXI.Sprite) {
    return containsInLocalBounds(displayObject, localPoint) ? displayObject : null;
  }

  return null;
};

/** Ищет верхний интерактивный DisplayObject по глобальным координатам сцены. */
export const hitTestDisplayTree = (
  root: PIXI.Container,
  globalX: number,
  globalY: number,
): PIXI.DisplayObject | null => {
  return hitTestSingle(root, new PIXI.Point(globalX, globalY));
};
