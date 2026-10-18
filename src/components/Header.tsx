import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { downloadProjectZip } from '../utils/downloadZip';
import { Download, Loader2 } from 'lucide-react';

interface HeaderProps {
  onShowDownloadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowDownloadModal }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (onShowDownloadModal) {
      onShowDownloadModal();
      return;
    }
    setIsDownloading(true);
    await downloadProjectZip();
    setTimeout(() => setIsDownloading(false), 800);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-4 py-2.5 sm:py-3 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand with Ultra-Premium App Store Icon */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 shadow-md shadow-blue-600/25 flex items-center justify-center transition-transform active:scale-95">
              <img
                src="./icon.svg"
                alt="Dosya Dönüştürücü Logo"
                className="w-full h-full rounded-[14px] object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-lg leading-tight tracking-tight">
                Dosya <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dönüştürücü</span>
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                PRO
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden xs:block">
              Çevrimdışı Belge & Fotoğraf İşleme
            </span>
          </div>
        </div>

        {/* Right actions: Source Zip Download & PWA Install */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            title="GitHub'a yüklemek için tüm proje kodlarını ZIP olarak indir"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Download className="w-3.5 h-3.5 text-white" />
            )}
            <span className="hidden xs:inline">GitHub</span>
            <span>ZIP İndir</span>
          </button>
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
