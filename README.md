# CanvasKit + Pixi.js (TypeScript)

Проект на TypeScript для рендера сцены `PIXI.Container` через `Skia (CanvasKit)` с последующим экспортом результата в PDF (векторный формат для графики).

---

## Запуск проекта

```bash
npm install
npm run dev
```

### Требования

- Node.js 20+
- npm 10+

---

## Скрипты

- `npm run dev` - запуск локального dev-сервера (Vite)
- `npm run build` - production сборка
- `npm run preview` - локальный предпросмотр production сборки
- `npm run typecheck` - проверка TypeScript типов
- `npm run lint` - проверка кода ESLint
- `npm run format` - автоформатирование Prettier
- `npm run format:check` - проверка форматирования без изменений

---

## Цель проекта

Реализовать приложение, которое:

1. Принимает `PIXI.Container` и отрисовывает его через обертку над `Skia`.
2. Поддерживает базовые типы объектов:
   - `PIXI.Graphics` (`drawShape`, `moveTo`, `lineTo`, `drawRect`)
   - `PIXI.Sprite` (png)
3. Корректно учитывает трансформации (`translate`, `rotate`, `scale`) для дочерних `PIXI.DisplayObject`.
4. Позволяет экспортировать сцену в PDF через Skia PDF backend:
   - `Graphics` как вектор
   - `Sprite` как bitmap (допустимое исключение)
5. Поддерживает интерактивность (`pointerdown`/`pointerup`) на обоих канвасах.

---

## Планируемый UI

Минимальный интерфейс на HTML/CSS:

- область просмотра текущей сцены
- кнопки управления сценой
- кнопка экспорта в PDF

Для тестирования интерактива:

- генерация случайной фигуры/линии
- либо переключение между заранее подготовленными контейнерами

---

## Архитектура (базовый старт)

```text
src/
  app/
    styles/
      reset.css
      app.css
  config/
    vite.build.ts
    vite.resolve.ts
    vite.server.ts
  main.ts
  vite-env.d.ts
```

Принципы:

- модульная структура
- типобезопасность (`strict` TypeScript)
- единый стиль кода через ESLint + Prettier
- pre-commit проверки через `lint-staged` + Husky

---

## Качество кода

Перед коммитом рекомендуется запускать:

```bash
npm run typecheck
npm run lint
npm run build
```

Это гарантирует, что проект:

- компилируется
- проходит линтинг
- корректно собирается в production

---

## Статус

Сейчас в репозитории подготовлена инфраструктура:

- Vite + TypeScript baseline
- разделенные Vite-конфиги
- базовый UI каркас
- `reset.css` + `app.css`
- tooling для линтинга, форматирования и pre-commit

Следующий этап: реализация рендер-обертки Pixi -> Skia, интерактивности и PDF-экспорта.
