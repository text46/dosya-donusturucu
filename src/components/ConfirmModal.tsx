import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Evet, Sil',
  cancelText = 'Vazgeç',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            isDestructive
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}
        >
          {isDestructive ? (
            <Trash2 className="w-7 h-7 text-red-500 animate-in zoom-in-75 duration-200" />
          ) : (
            <AlertTriangle className="w-7 h-7 text-blue-500" />
          )}
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-slate-900 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed px-2">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs active:scale-95 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-3 rounded-xl text-white font-semibold text-xs active:scale-95 transition shadow-md cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
