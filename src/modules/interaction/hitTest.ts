import * as PIXI from 'pixi.js-legacy';

const containsInLocalBounds = (
  displayObject: PIXI.DisplayObject,
  localPoint: PIXI.Point,
): boolean => {
  const bounds = displayObject.getLocalBounds();

  return (
    localPoint.x >= bounds.x &&
    localPoint.x <= bounds.x + bounds.width &&
    localPoint.y >= bounds.y &&
    localPoint.y <= bounds.y + bounds.height
  );
};

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
    return displayObject.geometry.containsPoint(localPoint) ? displayObject : null;
  }

  if (displayObject instanceof PIXI.Sprite) {
    return containsInLocalBounds(displayObject, localPoint) ? displayObject : null;
  }

  return null;
};

export const hitTestDisplayTree = (
  root: PIXI.Container,
  globalX: number,
  globalY: number,
): PIXI.DisplayObject | null => {
  return hitTestSingle(root, new PIXI.Point(globalX, globalY));
};
