import { PDFDocument } from 'pdf-lib';

export interface MergePdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

/**
 * Loads a PDF file and returns its page count
 */
export async function getPdfInfo(file: File): Promise<{ pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return {
    pageCount: pdfDoc.getPageCount(),
  };
}

/**
 * Merges multiple PDF files into a single PDF document in the specified order
 */
export async function mergePdfFiles(
  files: File[],
  outputFileName = 'Birlestirilmis_Belge.pdf'
): Promise<{ blob: Blob; blobUrl: string; pageCount: number; sizeBytes: number; fileName: string }> {
  if (files.length === 0) {
    throw new Error('Birleştirilecek PDF dosyası seçilmedi.');
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    totalPages += copiedPages.length;
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    pageCount: totalPages,
    sizeBytes: blob.size,
    fileName: outputFileName.endsWith('.pdf') ? outputFileName : `${outputFileName}.pdf`,
  };
}

/**
 * Extracts specified pages from a PDF document
 * pageRange: e.g. "1-3" or "1, 3, 5" or "2-5, 8"
 */
export async function splitPdf(
  file: File,
  pageIndicesToKeep: number[],
  outputFileName = 'Ayrilmis_Sayfalar.pdf'
): Promise<{ blob: Blob; blobUrl: string; pageCount: number; sizeBytes: number; fileName: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalAvailable = sourcePdf.getPageCount();

  const validIndices = pageIndicesToKeep.filter((idx) => idx >= 0 && idx < totalAvailable);
  if (validIndices.length === 0) {
    throw new Error('Geçerli bir sayfa aralığı seçilmedi.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const newBytes = await newPdf.save();
  const blob = new Blob([newBytes as unknown as BlobPart], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    pageCount: copiedPages.length,
    sizeBytes: blob.size,
    fileName: outputFileName.endsWith('.pdf') ? outputFileName : `${outputFileName}.pdf`,
  };
}

/**
 * Parses user-friendly page range strings like "1-3, 5, 7-9" into zero-based indices
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const indicesSet = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => parseInt(s.trim(), 10));
      if (!isNaN(startStr) && !isNaN(endStr)) {
        const start = Math.max(1, Math.min(startStr, endStr));
        const end = Math.min(maxPages, Math.max(startStr, endStr));
        for (let i = start; i <= end; i++) {
          indicesSet.add(i - 1); // 0-indexed
        }
      }
    } else {
      const single = parseInt(part, 10);
      if (!isNaN(single) && single >= 1 && single <= maxPages) {
        indicesSet.add(single - 1);
      }
    }
  }

  return Array.from(indicesSet).sort((a, b) => a - b);
}
