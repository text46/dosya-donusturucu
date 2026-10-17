import React, { useEffect } from 'react';
import { CheckCircle2, X, FileCheck, Share2 } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message?: string;
  duration?: number;
  onShare?: () => void;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-50 max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900/95 text-white p-3.5 pr-4 shadow-2xl backdrop-blur-md border border-slate-700/70 text-xs">
        {/* Animated checkmark icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in-50 duration-200" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-slate-300 text-[11px] mt-0.5 truncate flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-emerald-400 shrink-0 inline" />
              <span className="truncate">{toast.message}</span>
            </p>
          )}
        </div>

        {/* Share Button if available */}
        {toast.onShare && (
          <button
            type="button"
            onClick={() => {
              toast.onShare?.();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95 shrink-0 cursor-pointer"
            title="Cihazın Paylaşım Menüsünü Aç"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Paylaş</span>
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 cursor-pointer"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
