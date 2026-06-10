# CanvasKit + Pixi.js (TypeScript)

Легкое одностраничное приложение, которое:

- рендерит одну сцену одновременно в `Pixi.js` (canvas) и в `Skia (CanvasKit)`;
- использует собственную обертку `PIXI.Container -> Skia`;
- поддерживает `pointerdown`/`pointerup` на обоих канвасах;
- экспортирует сцену в PDF через Skia PDF backend (если backend доступен в wasm-сборке).

## Быстрый старт

```bash
npm install
npm run dev
```

Открой `http://localhost:3000`.

## Требования

- Node.js 20+
- npm 10+

## Скрипты

- `npm run dev` — локальная разработка (Vite dev server)
- `npm run build` — production сборка
- `npm run preview` — локальный просмотр production-сборки
- `npm run typecheck` — строгая проверка TS-типов
- `npm run lint` — ESLint
- `npm run format` — форматирование Prettier
- `npm run format:check` — проверка форматирования

## Что реализовано

1. **Pixi -> Skia renderer**
   - обход дерева `PIXI.Container`;
   - поддержка `PIXI.Graphics` (`drawRect`, `drawShape`, `moveTo/lineTo`) и `PIXI.Sprite`;
   - учет `translate/rotate/scale` на каждом узле.

2. **Интерактивность**
   - события `pointerdown/pointerup` работают в Pixi-канвасе нативно;
   - для Skia-канваса реализован hit-test bridge, который эмитит события в Pixi-объекты.

3. **UI для тестирования**
   - кнопка генерации случайной линии/фигуры;
   - кнопка экспорта в PDF;
   - одновременный просмотр сцены в двух канвасах.

4. **PDF экспорт**
   - реализован вызов Skia PDF backend через `MakePDFDocument` при наличии в wasm-сборке;
   - если backend отсутствует, показывается понятная ошибка о необходимости custom wasm сборки.

## Деплой на Vercel

Проект деплоится как обычный Vite static app:

- Build Command: `npm run build`
- Output Directory: `build`

`canvaskit.wasm` автоматически бандлится в `build/static`.
