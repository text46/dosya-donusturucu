import React, { useRef, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  UploadCloud,
  ArrowRight,
  Maximize2,
  Compass,
  FileCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import {
  OfficeFileInfo,
  parseOfficeFile,
  parseExcelSheet,
  convertHtmlToPdf,
} from '../utils/officeConverter';
import { GeneratedPdfResult } from '../utils/pdfGenerator';
import { formatFileSize } from '../utils/imageProcessing';

interface OfficeConverterProps {
  onPdfGenerated: (result: GeneratedPdfResult, thumbnailUrl: string) => void;
}

export const OfficeConverter: React.FC<OfficeConverterProps> = ({
  onPdfGenerated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<OfficeFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Conversion options
  const [fileName, setFileName] = useState('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [format, setFormat] = useState<'a4' | 'letter'>('a4');

  const handleSelectFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsLoading(true);
    try {
      const parsed = await parseOfficeFile(file);
      setFileInfo(parsed);

      // Default filename without original extension
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setFileName(`${baseName}_cevrilmis`);

      // Excel spreadsheets default to landscape for better column fit
      if (parsed.type === 'excel') {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Dosya okunamadı.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!fileInfo || fileInfo.type !== 'excel') return;
    setIsLoading(true);
    try {
      const html = await parseExcelSheet(fileInfo.file, sheetName);
      setFileInfo({
        ...fileInfo,
        activeSheet: sheetName,
        htmlContent: html,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!fileInfo) return;

    setIsConverting(true);
    try {
      const result = await convertHtmlToPdf(
        fileInfo.htmlContent,
        fileInfo.type === 'unknown' ? 'word' : fileInfo.type,
        {
          fileName,
          orientation,
          format,
        },
        (txt) => setProgressText(txt)
      );

      // Create dummy thumbnail icon representation for history
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 120, 160);
      ctx.fillStyle = fileInfo.type === 'excel' ? '#10b981' : '#2563eb';
      ctx.fillRect(15, 20, 90, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(fileInfo.type.toUpperCase(), 25, 36);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(15, 60, 90, 6);
      ctx.fillRect(15, 75, 90, 6);
      ctx.fillRect(15, 90, 70, 6);
      const thumbUrl = canvas.toDataURL('image/jpeg', 0.8);

      onPdfGenerated(result, thumbUrl);
    } catch (err) {
      console.error('Office PDF hatası:', err);
      alert('PDF oluşturulurken bir hata oluştu: ' + (err as Error).message);
    } finally {
      setIsConverting(false);
      setProgressText('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleSelectFile(e.target.files)}
        accept=".docx,.xlsx,.xls,.csv,.txt"
        className="hidden"
      />

      {/* Upload Box if no file selected */}
      {!fileInfo && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleSelectFile(e.dataTransfer.files);
          }}
          className={`relative rounded-3xl border-2 transition-all p-6 sm:p-9 text-center ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
              : 'border-dashed border-blue-300 bg-gradient-to-b from-blue-50/40 to-white shadow-xs'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            {/* File type badges */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-xl bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" /> Word (.docx)
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx, .xls, .csv)
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                <FileCode className="w-3.5 h-3.5" /> Metin (.txt)
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-7 py-3.5 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Office Dosyası Seç (.docx, .xlsx, .txt)</span>
            </button>

            <p className="text-xs text-slate-500 pt-1">
              Dosyanız tamamen telefonunuzda çevrimdışı işlenir, sunucuya yüklenmez.
            </p>
          </div>
        </div>
      )}

      {/* Document Loaded View */}
      {fileInfo && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* File Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  fileInfo.type === 'excel'
                    ? 'bg-emerald-600'
                    : fileInfo.type === 'word'
                    ? 'bg-blue-600'
                    : 'bg-slate-700'
                }`}
              >
                {fileInfo.type === 'excel' ? (
                  <FileSpreadsheet className="w-6 h-6" />
                ) : fileInfo.type === 'word' ? (
                  <FileText className="w-6 h-6" />
                ) : (
                  <FileCode className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {fileInfo.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {fileInfo.type.toUpperCase()} Belgesi • {formatFileSize(fileInfo.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFileInfo(null);
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Farklı Dosya Seç</span>
            </button>
          </div>

          {/* Excel Sheet selector if multiple sheets */}
          {fileInfo.type === 'excel' && fileInfo.sheets && fileInfo.sheets.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <span className="text-xs font-semibold text-slate-700 block mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Çalışma Sayfası Seçin:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fileInfo.sheets.map((sheet) => (
                  <button
                    key={sheet}
                    type="button"
                    onClick={() => handleSheetChange(sheet)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      fileInfo.activeSheet === sheet
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              PDF Çıktı Ayarları
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* File Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-slate-400" /> Dosya Adı
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono text-xs">
                    .pdf
                  </span>
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> Sayfa Yönü
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      orientation === 'portrait'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dikey
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      orientation === 'landscape'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yatay
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> Boyut
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormat('a4')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      format === 'a4'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('letter')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition ${
                      format === 'letter'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Letter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Document Preview Box */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-700">
                Belge Önizleme ({fileInfo.type.toUpperCase()})
              </span>
              <span className="text-[11px] text-slate-400">
                PDF'e dönüştürülecek görünüm
              </span>
            </div>
            <div className="p-4 max-h-96 overflow-auto bg-slate-50/50">
              <div
                className="prose prose-sm max-w-none bg-white p-5 rounded-xl border border-slate-200 shadow-xs overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: fileInfo.htmlContent }}
              />
            </div>
          </div>

          {/* Action Convert Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>Office Belgesini PDF'e Dönüştür</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Converting Progress Modal */}
      {isConverting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-spin">
              <RefreshCw className="w-7 h-7" />
            </div>

            <h3 className="font-bold text-slate-900 text-base">
              Office Belgesi PDF'e Dönüştürülüyor
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {progressText || 'Lütfen bekleyin, çevrimdışı işleniyor...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
