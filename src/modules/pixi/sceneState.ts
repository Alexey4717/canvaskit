import * as PIXI from 'pixi.js-legacy';

import { createRandomGraphics } from './randomShape';
import { createInitialScene } from './sceneFactory';

interface PixiSceneState {
  app: PIXI.Application;
  sceneRoot: PIXI.Container;
  addRandomShape: () => void;
  destroy: () => void;
}

/** Создаёт и владеет жизненным циклом PIXI-сцены для рабочей области. */
export const createPixiSceneState = (
  host: HTMLElement,
  width: number,
  height: number,
): PixiSceneState => {
  const app = new PIXI.Application({
    width,
    height,
    antialias: true,
    backgroundColor: 0xf0f0f0,
    forceCanvas: true,
    eventMode: 'static',
  });

  host.appendChild(app.view as HTMLCanvasElement);

  const sceneRoot = createInitialScene();
  app.stage.addChild(sceneRoot);

  const addRandomShape = (): void => {
    sceneRoot.addChild(createRandomGraphics());
  };

  const destroy = (): void => {
    app.destroy(true, { children: true, texture: true, baseTexture: true });
  };

  return { app, sceneRoot, addRandomShape, destroy };
};
