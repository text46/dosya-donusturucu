import React, { useState } from 'react';
import { X, Download, Copy, Check, ExternalLink, Github, FolderArchive, ArrowRight } from 'lucide-react';
import { downloadProjectZip } from '../utils/downloadZip';

interface DownloadSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadSourceModal: React.FC<DownloadSourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadUrl = `${window.location.origin}/dosya-donusturucu-github.zip`;

  const handleDownload = async () => {
    setIsDownloading(true);
    setStatusMessage('ZIP dosyası hazırlanıyor ve indiriliyor...');
    await downloadProjectZip((msg) => setStatusMessage(msg));
    setTimeout(() => {
      setIsDownloading(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <FolderArchive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                GitHub Proje ZIP Paketi
              </h3>
              <p className="text-xs text-slate-500">
                Tüm kaynak kodlar & GitHub Actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <p className="font-semibold text-blue-950 mb-1 flex items-center gap-1.5">
              <Github className="w-4 h-4 text-blue-700" />
              Hazır Proje Arşivi (911 KB)
            </p>
            Bu ZIP dosyası projenin en güncel kaynak kodlarını, yeni premium logoyu ve GitHub Pages otomatik dağıtım dosyasını (`.github/workflows/deploy.yml`) eksiksiz içerir.
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'İndiriliyor...' : 'ZIP Dosyasını Doğrudan İndir'}</span>
          </button>

          {statusMessage && (
            <p className="text-center text-xs font-medium text-emerald-600 animate-in fade-in">
              ✓ {statusMessage}
            </p>
          )}

          {/* Fallback & Alternative options if browser sandbox blocks download */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Alternatif İndirme Yolları (Tarayıcı Engellerse)
            </span>

            {/* Option 1: Open in new tab */}
            <button
              onClick={handleOpenNewTab}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                Yeni Sekmede Doğrudan Aç & İndir
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Option 2: Copy direct URL */}
            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2 truncate pr-2">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="truncate">{copied ? 'Bağlantı Panoya Kopyalandı!' : 'Doğrudan İndirme Linkini Kopyala'}</span>
              </span>
              <span className="text-[11px] text-blue-600 font-bold shrink-0">
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </span>
            </button>
          </div>

          {/* Direct link preview */}
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] text-slate-600 break-all select-all font-mono">
            {downloadUrl}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
