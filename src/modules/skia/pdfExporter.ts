import * as PIXI from 'pixi.js-legacy';
import type { CanvasKit } from 'canvaskit-wasm';

import { PixiToSkiaRenderer } from './pixiToSkiaRenderer';
import type { PdfBackendDocument } from './types';

type PdfDocumentMetadata = {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  language?: string;
  _rootTag?: number;
};

type MakePdfDocument = (metadata: PdfDocumentMetadata) => PdfBackendDocument;

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
): MakePdfDocument | null => {
  const dynamicKit = canvasKit as CanvasKit & {
    MakePDFDocument?: MakePdfDocument;
  };

  if (typeof dynamicKit.MakePDFDocument === 'function') {
    return dynamicKit.MakePDFDocument.bind(dynamicKit);
  }

  return null;
};

export const isPdfBackendAvailable = (canvasKit: CanvasKit): boolean => {
  return getPdfBackendFactory(canvasKit) !== null;
};

export const exportSceneToPdf = (
  canvasKit: CanvasKit,
  container: PIXI.Container,
  width: number,
  height: number,
): { fileName: string; byteLength: number } => {
  const createPdfDocument = getPdfBackendFactory(canvasKit);
  if (!createPdfDocument) {
    throw new Error(
      'PDF backend не найден в текущей CanvasKit сборке. Нужна custom wasm-сборка с MakePDFDocument.',
    );
  }

  const metadata: PdfDocumentMetadata = {
    title: 'Scene Export',
    creator: 'CanvasKit demo app',
    producer: 'CanvasKit PDF backend',
    _rootTag: 0,
  };

  const pdfDocument = createPdfDocument(metadata);

  const pdfCanvas = pdfDocument.beginPage(width, height);
  const renderer = new PixiToSkiaRenderer(canvasKit);

  renderer.render(container, pdfCanvas);
  pdfDocument.endPage();

  const bytes = pdfDocument.close();
  renderer.dispose();

  const fileName = `scene-export-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.pdf`;
  triggerDownload(bytes, fileName);

  return {
    fileName,
    byteLength: bytes.byteLength,
  };
};
