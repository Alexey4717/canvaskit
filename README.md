# CanvasKit + Pixi.js (TypeScript)

Небольшое SPA-приложение для сравнения двух рендеров одной и той же сцены:

- сцена создается в `Pixi.js`;
- та же сцена рисуется в `Skia (CanvasKit)` через адаптер `PIXI.Container -> Skia`;
- pointer-события для Skia-канваса прокидываются обратно в объекты Pixi;
- сцена экспортируется в PDF через `Skia PDF backend` (если backend включен в wasm-сборку).

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Требования

- Node.js 20+
- npm 10+

## Скрипты

- `npm run dev` — локальная разработка (Vite dev server)
- `npm run build` — production-сборка
- `npm run preview` — локальный просмотр production-сборки
- `npm run typecheck` — строгая проверка TS-типов
- `npm run lint` — ESLint
- `npm run format` — форматирование Prettier
- `npm run format:check` — проверка форматирования

## Что реализовано

- Рендерер `PIXI.Container -> Skia` с учетом трансформаций и прозрачности.
- Поддержка `PIXI.Graphics` и `PIXI.Sprite` в Skia-рендере.
- Bridge pointer-событий между Skia canvas и деревом Pixi (`pointerdown`, `pointerup`, `pointerupoutside`, `pointercancel`).
- UI-панель для тестирования: генерация случайной фигуры, экспорт в PDF, статусы процесса.
- Экспорт в PDF через `MakePDFDocument` и проверка наличия PDF backend в рантайме.

## Архитектура (слои, модули, фичи)

### Слои

- `src/app` — композиция приложения и orchestration. Здесь связываются UI, Pixi-сцена, Skia-рантайм и фичи.
- `src/features` — прикладные пользовательские сценарии (use-cases).
- `src/modules` — технические модули/адаптеры (Pixi, Skia, interaction bridge), где лежит основная инфраструктурная логика.
- `src/shared` — переиспользуемые примитивы: UI-компоненты, утилиты, базовые стили.

### Ключевые модули

- `modules/pixi` — создание и хранение состояния сцены Pixi, добавление случайных фигур.
- `modules/skia` — загрузка `CanvasKit`, рендер Pixi-дерева в Skia, экспорт PDF.
- `modules/interaction` — hit-test и проброс pointer-событий с Skia canvas в объекты Pixi.

### Фичи

- `features/generate-random-shape` — сценарий "добавить случайный объект и обновить рендер".
- `features/export-scene-pdf` — сценарий "экспортировать сцену в PDF с обработкой busy/status/error".

### Правила архитектуры

- `app` знает о `features`, `modules`, `shared` и только координирует их.
- `features` не должны напрямую управлять DOM/CanvasKit/PIXI инстансами без зависимостей, переданных через аргументы.
- `modules` не импортируют `features`; они предоставляют API и остаются переиспользуемыми.
- `shared` не зависит от `features` и конкретной бизнес-логики.
- Все публичные точки входа модулей идут через publicApi `index.ts` в каталоге модуля.

## Vite и сборка

Проект использует `Vite 8` + `TypeScript`:

- **Dev-режим (`npm run dev`)**: Vite поднимает dev server c HMR и быстрым обновлением модулей.
- **Production (`npm run build`)**: Vite собирает приложение в `build/`, статику кладет в `build/static/`.
- **Минификация**: настроена через `esbuild` (`minify: 'esbuild'` в `config/vite.build.ts`).
- **Public assets**: `public/` копируется как есть (`copyPublicDir: true`) в итоговую сборку.
- **Bundler engine**: на текущей конфигурации Vite используется стандартный build pipeline Vite (Rollup-совместимый).

## Custom CanvasKit (`public/canvaskit/custom`)

### Что это за файлы и зачем они нужны

Для PDF-экспорта нужна совместимая пара файлов из одной и той же CanvasKit-сборки:

- `public/canvaskit/custom/canvaskit.js`
- `public/canvaskit/custom/canvaskit.wasm`

`canvaskit.js` подключается в `index.html`, а `canvaskit.wasm` подхватывается через `locateFile` в `loadSkiaRuntime`.

Важно: нельзя смешивать `canvaskit.js` и `canvaskit.wasm` из разных версий/сборок — может вызвать runtime-ошибки.

### Как менять путь к wasm через `.env`

Путь к wasm можно задать через переменную окружения:

```bash
VITE_CANVASKIT_WASM_URL=/canvaskit/custom/canvaskit.wasm
```

### Как проверить, что подключено корректно

- В UI должен появиться статус: `PDF backend найден. Экспорт доступен.`
- Кнопка `Экспорт в PDF` должна скачать файл без ошибки.
- Если backend не найден, UI подскажет, что нужно указать `VITE_CANVASKIT_WASM_URL` на корректную кастомную wasm-сборку.

## Деплой на Vercel

Проект деплоится как обычный Vite static app:

- Build Command: `npm run build`
- Output Directory: `build`
