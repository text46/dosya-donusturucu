import React from 'react';
import { X, RotateCw, Trash2, Check } from 'lucide-react';
import { ImageItem, ImageFilter } from '../types';
import { formatFileSize } from '../utils/imageProcessing';

interface ImagePreviewModalProps {
  image: ImageItem | null;
  pageIndex: number;
  total: number;
  onClose: () => void;
  onRotate: (id: string) => void;
  onFilterChange: (id: string, filter: ImageFilter) => void;
  onDelete: (id: string) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  pageIndex,
  total,
  onClose,
  onRotate,
  onFilterChange,
  onDelete,
}) => {
  if (!image) return null;

  const filterOptions: { key: ImageFilter; label: string; desc: string }[] = [
    { key: 'original', label: 'Orijinal', desc: 'Olduğu gibi' },
    { key: 'scanner', label: 'Tarayıcı', desc: 'Net metin & beyaz zemin' },
    { key: 'magic_color', label: 'Canlı Renk', desc: 'İmza ve mühürleri korur' },
    { key: 'document', label: 'Belge', desc: 'Yumuşak kontrast' },
    { key: 'bw', label: 'Fotokopi', desc: 'Keskin siyah-beyaz' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Sayfa {pageIndex + 1} / {total}
              </span>
              <h3 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">
                {image.name}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {image.width} × {image.height} px • {formatFileSize(image.size)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Canvas Area */}
        <div className="flex-1 bg-black/50 p-4 flex items-center justify-center overflow-auto min-h-[300px]">
          <img
            src={image.processedDataUrl || image.originalDataUrl}
            alt={image.name}
            className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Filter Selection Row */}
        <div className="p-3 bg-slate-800/90 border-t border-slate-700/50">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 px-1">
            Görsel Filtresi:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filterOptions.map((f) => {
              const isSelected = image.filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(image.id, f.key)}
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs">{f.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{f.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onRotate(image.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition active:scale-95"
          >
            <RotateCw className="w-4 h-4 text-blue-400" />
            <span>90° Döndür ({image.rotation}°)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete(image.id);
                onClose();
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-red-500/20 text-red-300 px-3 py-2 text-xs font-medium hover:bg-red-500/30 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sayfayı Sil</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
