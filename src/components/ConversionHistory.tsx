import React, { useState } from 'react';
import {
  History,
  Download,
  Share2,
  Trash2,
  Eye,
  FileText,
  Clock,
  X,
} from 'lucide-react';
import { HistoryItem } from '../utils/historyDb';
import { formatFileSize } from '../utils/imageProcessing';

interface ConversionHistoryProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const ConversionHistory: React.FC<ConversionHistoryProps> = ({
  items,
  onDelete,
  onClear,
}) => {
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewName, setActivePreviewName] = useState<string>('');

  if (items.length === 0) {
    return null;
  }

  const handleDownload = (item: HistoryItem) => {
    const url = URL.createObjectURL(item.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleShare = async (item: HistoryItem) => {
    try {
      const file = new File([item.pdfBlob], item.fileName, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: item.fileName,
          text: `${item.pageCount} sayfalık PDF belgesi.`,
        });
      } else {
        handleDownload(item);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        handleDownload(item);
      }
    }
  };

  const handlePreview = (item: HistoryItem) => {
    const url = URL.createObjectURL(item.pdfBlob);
    setActivePreviewUrl(url);
    setActivePreviewName(item.fileName);
  };

  const closePreview = () => {
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      setActivePreviewUrl(null);
      setActivePreviewName('');
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Son Oluşturulan PDF'ler ({items.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-slate-400 hover:text-red-600 transition"
          >
            Geçmişi Temizle
          </button>
        </div>

        <div className="divide-y divide-slate-100 mt-1 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-2xl transition"
            >
              {/* Thumbnail + info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 bg-red-600 text-[8px] font-bold text-white px-1 rounded-tl">
                    PDF
                  </span>
                </div>

                <div className="min-w-0">
                  <h4
                    className="font-semibold text-slate-800 text-xs sm:text-sm truncate cursor-pointer hover:text-blue-600"
                    title={item.fileName}
                    onClick={() => handlePreview(item)}
                  >
                    {item.fileName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDate(item.createdAt)}
                    </span>
                    <span>•</span>
                    <span>{item.pageCount} Sayfa</span>
                    <span>•</span>
                    <span className="font-mono">{formatFileSize(item.sizeBytes)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePreview(item)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                  title="Önizle"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                  title="Tekrar İndir"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(item)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                  title="Paylaş"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Kayıttan Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Quick Preview Modal */}
      {activePreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">
                {activePreviewName}
              </h3>
              <button
                type="button"
                onClick={closePreview}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 min-h-[400px]">
              <iframe
                src={activePreviewUrl}
                title="Geçmiş PDF Önizleme"
                className="w-full h-full min-h-[450px] border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
