import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit } from 'canvaskit-wasm';

import { PixiToSkiaRenderer } from './pixiToSkiaRenderer';
import type { PdfBackendDocument } from './types';

const triggerDownload = (bytes: Uint8Array, fileName: string): void => {
  const portableBytes = Uint8Array.from(bytes);
  const blob = new Blob([portableBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const getPdfBackendFactory = (
  canvasKit: CanvasKit,
): ((title: string) => PdfBackendDocument) | null => {
  const dynamicKit = canvasKit as CanvasKit & {
    MakePDFDocument?: (title: string) => PdfBackendDocument;
  };

  if (typeof dynamicKit.MakePDFDocument === 'function') {
    return dynamicKit.MakePDFDocument.bind(dynamicKit);
  }

  return null;
};

export const exportSceneToPdf = (
  canvasKit: CanvasKit,
  container: PIXI.Container,
  width: number,
  height: number,
): void => {
  const createPdfDocument = getPdfBackendFactory(canvasKit);
  if (!createPdfDocument) {
    throw new Error(
      'PDF backend не найден в текущей CanvasKit сборке. Нужна custom wasm-сборка с MakePDFDocument.',
    );
  }

  const document = createPdfDocument('Scene Export');
  const pdfCanvas = document.beginPage(width, height);
  const renderer = new PixiToSkiaRenderer(canvasKit);

  renderer.render(container, pdfCanvas);
  document.endPage();

  const bytes = document.close();
  renderer.dispose();

  triggerDownload(bytes, 'scene-export.pdf');
};
