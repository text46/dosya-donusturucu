import { jsPDF } from 'jspdf';
import { ImageItem, PdfSettings } from '../types';
import { processImage } from './imageProcessing';

export interface GenerationProgress {
  currentPage: number;
  totalPages: number;
  statusText: string;
}

export interface GeneratedPdfResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  sizeBytes: number;
  pageCount: number;
}

export async function generatePdfFromImages(
  images: ImageItem[],
  settings: PdfSettings,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GeneratedPdfResult> {
  if (images.length === 0) {
    throw new Error('Dönüştürülecek fotoğraf bulunamadı.');
  }

  let qualityValue = 0.62;
  let maxDim = 1200;

  if (settings.quality === 'high') {
    qualityValue = 0.80;
    maxDim = 1600;
  } else if (settings.quality === 'balanced') {
    qualityValue = 0.68;
    maxDim = 1300;
  } else {
    // 'low' -> Mümkün olan en düşük boyut (Ultra Sıkıştırma)
    qualityValue = 0.52;
    maxDim = 1000;
  }

  // Margin in millimeters
  const marginMm =
    settings.margin === 'none' ? 0 : settings.margin === 'small' ? 5 : 12;

  let doc: jsPDF | null = null;
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const item = images[i];
    onProgress?.({
      currentPage: i + 1,
      totalPages: total,
      statusText: `${i + 1}/${total} sayfa işleniyor...`,
    });

    // Process image with its rotation, filter, aggressive compression and smart scaling
    const { processedUrl, width: imgW, height: imgH } = await processImage(
      item.originalDataUrl,
      item.rotation,
      item.filter,
      qualityValue,
      maxDim
    );

    // Determine orientation for this page
    let isLandscape = false;
    if (settings.orientation === 'landscape') {
      isLandscape = true;
    } else if (settings.orientation === 'portrait') {
      isLandscape = false;
    } else {
      // 'auto' matches the image orientation
      isLandscape = imgW > imgH;
    }

    const orientationStr = isLandscape ? 'landscape' : 'portrait';

    // Determine page dimensions
    let pageWidthMm = 210;
    let pageHeightMm = 297;

    if (settings.format === 'letter') {
      pageWidthMm = isLandscape ? 279.4 : 215.9;
      pageHeightMm = isLandscape ? 215.9 : 279.4;
    } else if (settings.format === 'a4') {
      pageWidthMm = isLandscape ? 297 : 210;
      pageHeightMm = isLandscape ? 210 : 297;
    } else {
      // 'auto' - fit exact image aspect ratio
      const mmPerPx = 0.264583;
      pageWidthMm = imgW * mmPerPx;
      pageHeightMm = imgH * mmPerPx;
    }

    if (i === 0) {
      if (settings.format === 'auto') {
        doc = new jsPDF({
          orientation: orientationStr,
          unit: 'mm',
          format: [pageWidthMm, pageHeightMm],
          compress: true,
        });
      } else {
        doc = new jsPDF({
          orientation: orientationStr,
          unit: 'mm',
          format: settings.format,
          compress: true,
        });
      }
    } else if (doc) {
      if (settings.format === 'auto') {
        doc.addPage([pageWidthMm, pageHeightMm], orientationStr);
      } else {
        doc.addPage(settings.format, orientationStr);
      }
    }

    if (!doc) continue;

    // Available drawable area
    const availableW = pageWidthMm - marginMm * 2;
    const availableH = pageHeightMm - marginMm * 2 - (settings.addPageNumbers ? 8 : 0);

    // Calculate aspect ratio fit (contain)
    const imgAspect = imgW / imgH;
    const boxAspect = availableW / availableH;

    let targetW = availableW;
    let targetH = availableH;
    let offsetX = marginMm;
    let offsetY = marginMm;

    if (imgAspect > boxAspect) {
      // Image is wider than available box
      targetW = availableW;
      targetH = availableW / imgAspect;
      offsetX = marginMm;
      offsetY = marginMm + (availableH - targetH) / 2;
    } else {
      // Image is taller than available box
      targetH = availableH;
      targetW = availableH * imgAspect;
      offsetX = marginMm + (availableW - targetW) / 2;
      offsetY = marginMm;
    }

    // Add image to page
    doc.addImage(processedUrl, 'JPEG', offsetX, offsetY, targetW, targetH, undefined, 'FAST');

    // Add page number if enabled
    if (settings.addPageNumbers) {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const text = `${i + 1} / ${total}`;
      const textX = pageWidthMm / 2;
      const textY = pageHeightMm - Math.max(marginMm, 5);
      doc.text(text, textX, textY, { align: 'center' });
    }
  }

  if (!doc) {
    throw new Error('PDF belgesi oluşturulamadı.');
  }

  onProgress?.({
    currentPage: total,
    totalPages: total,
    statusText: 'PDF dosyası paketleniyor...',
  });

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Normalize file name
  let cleanName = settings.fileName.trim();
  if (!cleanName) {
    cleanName = `Belge_${new Date().toISOString().slice(0, 10)}`;
  }
  if (!cleanName.toLowerCase().endsWith('.pdf')) {
    cleanName += '.pdf';
  }

  return {
    blob,
    blobUrl,
    fileName: cleanName,
    sizeBytes: blob.size,
    pageCount: total,
  };
}
