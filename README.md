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
   - для текущей кастомной CanvasKit-сборки используется metadata-формат (`title`, `_rootTag`) при создании PDF-документа.

## Кратко: что сделано в проекте

- Реализован рендерер `PIXI.Container -> Skia` с учетом трансформаций и прозрачности.
- Добавлен bridge событий `pointerdown/pointerup` для Skia-канваса.
- Настроен экспорт сцены в PDF через кастомный CanvasKit PDF backend.
- Добавлен UI-статус, показывающий доступность PDF backend и результат экспорта.

## Подключение custom CanvasKit wasm для PDF backend

Для корректного PDF экспорта нужна совместимая пара файлов из одной сборки:
- `canvaskit.js`
- `canvaskit.wasm`

В проекте используется `public/canvaskit/custom/canvaskit.js` + `public/canvaskit/custom/canvaskit.wasm`.
Их нельзя смешивать с runtime из другой версии (`npm canvaskit-wasm/full`), иначе возможны runtime-ошибки.

### 1) Подготовьте `canvaskit.js` и `canvaskit.wasm`

Получите оба файла, собранные с поддержкой PDF backend (`MakePDFDocument`).

### 2) Положите файлы в `public`

Пример:

```text
public/canvaskit/custom/canvaskit.js
public/canvaskit/custom/canvaskit.wasm
```

### 3) Укажите URL через env

Перед запуском dev/build укажите:

```bash
VITE_CANVASKIT_WASM_URL=/canvaskit/custom/canvaskit.wasm npm run dev
```

На Windows (PowerShell):

```powershell
$env:VITE_CANVASKIT_WASM_URL="/canvaskit/custom/canvaskit.wasm"
npm run dev
```

### 4) Проверка, что backend действительно подключен

- В UI появится статус `PDF backend найден. Экспорт доступен.`
- Кнопка `Экспорт в PDF` должна скачивать файл без ошибки.

## Как проверить, что PDF векторный

1. Сгенерируйте сцену и нажмите `Экспорт в PDF`.
2. Откройте PDF в viewer и сильно увеличьте масштаб.
3. Признак векторности:
   - линии/контуры `PIXI.Graphics` остаются четкими;
   - `PIXI.Sprite` остается растровым (это ожидаемое исключение по ТЗ).

## Деплой на Vercel

Проект деплоится как обычный Vite static app:

- Build Command: `npm run build`
- Output Directory: `build`

`canvaskit.wasm` автоматически бандлится в `build/static`.
