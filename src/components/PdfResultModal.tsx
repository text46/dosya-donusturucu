import React, { useState } from 'react';
import {
  CheckCircle,
  Download,
  Share2,
  X,
  FileText,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react';
import { GeneratedPdfResult } from '../utils/pdfGenerator';
import { formatFileSize } from '../utils/imageProcessing';

interface PdfResultModalProps {
  result: GeneratedPdfResult | null;
  onClose: () => void;
  onReset: () => void;
}

export const PdfResultModal: React.FC<PdfResultModalProps> = ({
  result,
  onClose,
  onReset,
}) => {
  if (!result) return null;

  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Trigger download
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.blobUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Trigger native share sheet on mobile devices
  const handleShare = async () => {
    try {
      const file = new File([result.blob], result.fileName, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: result.fileName,
          text: `${result.pageCount} sayfalık PDF belgesi oluşturuldu.`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: result.fileName,
          url: result.blobUrl,
        });
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Paylaşım iptal edildi veya desteklenmiyor', err);
        handleDownload();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                PDF Başarıyla Hazırlandı!
              </h3>
              <p className="text-xs text-slate-500">
                {result.pageCount} sayfa • {formatFileSize(result.sizeBytes)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* File summary pill */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm truncate">
                {result.fileName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Belge hazırlandı • Güvenli ve yerel
              </p>
            </div>
          </div>

          {/* Action buttons on Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-98 transition"
            >
              <Download className="w-5 h-5" />
              <span>PDF'i İndir</span>
            </button>

            {/* Share via Native Web Share API */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 px-5 py-3.5 text-white font-bold text-sm shadow-md active:scale-98 transition cursor-pointer"
              title="Cihazın yerel paylaşım menüsünü aç (WhatsApp, AirDrop, vb.)"
            >
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span>Cihazda Paylaş</span>
            </button>
          </div>

          {/* Toggle PDF Preview */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>{showPreview ? 'Önizlemeyi Gizle' : 'PDF Önizlemesini Görüntüle'}</span>
            </button>

            {showPreview && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 h-80 sm:h-96">
                <iframe
                  src={result.blobUrl}
                  title="PDF Önizleme"
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yeni Belge Başlat</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
