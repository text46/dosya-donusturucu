import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GeneratedPdfResult } from './pdfGenerator';

export interface OfficeFileInfo {
  file: File;
  name: string;
  size: number;
  type: 'word' | 'excel' | 'text' | 'unknown';
  htmlContent: string;
  sheets?: string[];
  activeSheet?: string;
}

export function detectOfficeFileType(file: File): 'word' | 'excel' | 'text' | 'unknown' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return 'word';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return 'excel';
  if (name.endsWith('.txt')) return 'text';
  return 'unknown';
}

export async function parseOfficeFile(file: File): Promise<OfficeFileInfo> {
  const type = detectOfficeFileType(file);
  const buffer = await file.arrayBuffer();

  if (type === 'word') {
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    return {
      file,
      name: file.name,
      size: file.size,
      type: 'word',
      htmlContent: result.value || '<p>Belge boş.</p>',
    };
  }

  if (type === 'excel') {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheets = workbook.SheetNames;
    const firstSheetName = sheets[0] || 'Sayfa1';
    const worksheet = workbook.Sheets[firstSheetName];
    const html = XLSX.utils.sheet_to_html(worksheet, {
      id: 'excel-table',
      editable: false,
    });

    return {
      file,
      name: file.name,
      size: file.size,
      type: 'excel',
      htmlContent: html,
      sheets,
      activeSheet: firstSheetName,
    };
  }

  if (type === 'text') {
    const text = await file.text();
    // Escape HTML & format newlines
    const safeHtml = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');

    return {
      file,
      name: file.name,
      size: file.size,
      type: 'text',
      htmlContent: `<div style="white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.6;">${safeHtml}</div>`,
    };
  }

  throw new Error('Desteklenmeyen dosya türü. Lütfen .docx, .xlsx, .xls, .csv veya .txt dosyası seçin.');
}

export async function parseExcelSheet(file: File, sheetName: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return '<p>Sayfa bulunamadı</p>';
  return XLSX.utils.sheet_to_html(worksheet, {
    id: 'excel-table',
    editable: false,
  });
}

export interface OfficePdfOptions {
  fileName: string;
  orientation: 'portrait' | 'landscape';
  format: 'a4' | 'letter';
}

export async function convertHtmlToPdf(
  htmlContent: string,
  docType: 'word' | 'excel' | 'text',
  options: OfficePdfOptions,
  onProgress?: (text: string) => void
): Promise<GeneratedPdfResult> {
  onProgress?.('Belge stillendiriliyor...');

  // Create temporary offscreen container with exact print styles
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = options.orientation === 'landscape' ? '1122px' : '794px'; // ~A4 at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  container.style.padding = '40px 48px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';

  // Inject tailored CSS for tables, headings, paragraphs
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
    h2 { font-size: 20px; font-weight: 600; margin-top: 20px; margin-bottom: 12px; color: #1e293b; }
    h3 { font-size: 16px; font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: #334155; }
    p { font-size: 14px; line-height: 1.7; margin-bottom: 12px; color: #334155; }
    ul, ol { margin-left: 24px; margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 600; color: #1e293b; }
    tr:nth-child(even) { background-color: #f8fafc; }
    b, strong { font-weight: 700; color: #0f172a; }
    img { max-width: 100%; height: auto; }
  `;
  container.appendChild(styleEl);

  const contentHolder = document.createElement('div');
  contentHolder.innerHTML = htmlContent;
  container.appendChild(contentHolder);

  document.body.appendChild(container);

  try {
    onProgress?.('Sayfalar taranıyor ve oluşturuluyor...');

    const canvas = await html2canvas(container, {
      scale: 2, // High resolution crisp rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    onProgress?.('PDF sayfaları dilimleniyor...');

    const isLandscape = options.orientation === 'landscape';
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: options.format,
      compress: true,
    });

    const pageWidthMm = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;

    // Canvas aspect ratio and dimensions
    const imgWidth = pageWidthMm;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    const pageImgData = canvas.toDataURL('image/jpeg', 0.95);

    // First page
    pdf.addImage(pageImgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeightMm;

    // Remaining pages if document overflows 1 page
    let pageCount = 1;
    while (heightLeft > 2) {
      position -= pageHeightMm;
      pdf.addPage(options.format, isLandscape ? 'landscape' : 'portrait');
      pdf.addImage(pageImgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeightMm;
      pageCount++;
    }

    onProgress?.('PDF kaydediliyor...');

    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    let cleanName = options.fileName.trim();
    if (!cleanName) {
      cleanName = `Office_Belge_${new Date().toISOString().slice(0, 10)}`;
    }
    if (!cleanName.toLowerCase().endsWith('.pdf')) {
      cleanName += '.pdf';
    }

    return {
      blob,
      blobUrl,
      fileName: cleanName,
      sizeBytes: blob.size,
      pageCount,
    };
  } finally {
    document.body.removeChild(container);
  }
}
