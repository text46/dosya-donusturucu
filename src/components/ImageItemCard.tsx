import React from 'react';
import {
  RotateCw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { ImageItem, ImageFilter } from '../types';
import { formatFileSize } from '../utils/imageProcessing';

interface ImageItemCardProps {
  image: ImageItem;
  index: number;
  total: number;
  onRotate: (id: string) => void;
  onFilterChange: (id: string, filter: ImageFilter) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (id: string) => void;
  onPreview: (image: ImageItem) => void;
}

export const ImageItemCard: React.FC<ImageItemCardProps> = ({
  image,
  index,
  total,
  onRotate,
  onFilterChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onPreview,
}) => {
  const filterLabels: { key: ImageFilter; label: string }[] = [
    { key: 'original', label: 'Orijinal' },
    { key: 'document', label: 'Belge' },
    { key: 'grayscale', label: 'Gri' },
    { key: 'bw', label: 'S/B' },
  ];

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Top Header: Page Number & Move Order */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-blue-600 text-white font-bold text-xs">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-700">Sayfa {index + 1}</span>
        </div>

        {/* Reordering Up/Down */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition"
            title="Yukarı Taşı"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition"
            title="Aşağı Taşı"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail Area */}
      <div
        onClick={() => onPreview(image)}
        className="relative bg-slate-100 aspect-3/4 flex items-center justify-center overflow-hidden cursor-pointer"
      >
        <img
          src={image.processedDataUrl || image.originalDataUrl}
          alt={`Sayfa ${index + 1}`}
          className="w-full h-full object-contain transition-transform group-hover:scale-102"
        />

        {/* Hover / Tap overlay zoom button */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs text-white backdrop-blur-xs">
            <Maximize2 className="w-3.5 h-3.5" /> Büyüt
          </span>
        </div>

        {/* Rotation indicator if rotated */}
        {image.rotation > 0 && (
          <span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-white">
            {image.rotation}°
          </span>
        )}
      </div>

      {/* Meta Information */}
      <div className="px-3 pt-2 text-[11px] text-slate-500 truncate flex items-center justify-between">
        <span className="truncate max-w-[120px]" title={image.name}>
          {image.name}
        </span>
        <span className="font-mono shrink-0">{formatFileSize(image.size)}</span>
      </div>

      {/* Filter Selector */}
      <div className="px-3 py-1.5 flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5 w-full bg-slate-100 p-0.5 rounded-lg">
          {filterLabels.map((f) => {
            const isActive = image.filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onFilterChange(image.id, f.key)}
                className={`flex-1 py-1 text-[10px] font-medium rounded-md transition ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Tool Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => onRotate(image.id)}
          className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-600 py-1 px-2 rounded-lg hover:bg-blue-50 transition"
          title="90 Derece Döndür"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Döndür</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(image.id)}
          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 py-1 px-2 rounded-lg hover:bg-red-50 transition"
          title="Sayfayı Sil"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Sil</span>
        </button>
      </div>
    </div>
  );
};
