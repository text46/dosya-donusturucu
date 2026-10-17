import React from 'react';
import {
  Settings2,
  FileCheck,
  Maximize,
  Compass,
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { PdfSettings, PageFormat, PageOrientation, MarginSize, ImageQuality, ImageFilter } from '../types';

interface PdfSettingsPanelProps {
  settings: PdfSettings;
  onChange: (newSettings: PdfSettings) => void;
  onApplyGlobalFilter: (filter: ImageFilter) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const PdfSettingsPanel: React.FC<PdfSettingsPanelProps> = ({
  settings,
  onChange,
  onApplyGlobalFilter,
  isOpen,
  onToggle,
}) => {
  const updateSetting = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Header bar toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm text-slate-800">
            PDF & Sayfa Ayarları
          </span>
          <span className="text-[11px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full uppercase font-mono">
            {settings.format.toUpperCase()} • {settings.orientation === 'auto' ? 'Oto Yön' : settings.orientation}
          </span>
        </div>
        <span className="text-xs font-medium text-blue-600">
          {isOpen ? 'Gizle' : 'Düzenle'}
        </span>
      </button>

      {/* Expanded settings content */}
      {isOpen && (
        <div className="p-4 space-y-4 text-xs border-t border-slate-100 animate-in fade-in duration-150">
          {/* File Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-500" /> PDF Belge Adı
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.fileName}
                onChange={(e) => updateSetting('fileName', e.target.value)}
                placeholder="Orn: belgelerim"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-slate-400 font-mono">.pdf</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Page Format */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5 text-slate-500" /> Sayfa Boyutu
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { key: 'a4', label: 'A4' },
                    { key: 'letter', label: 'Letter' },
                    { key: 'auto', label: 'Otomatik' },
                  ] as { key: PageFormat; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => updateSetting('format', fmt.key)}
                    className={`py-1.5 px-2 rounded-lg font-medium transition ${
                      settings.format === fmt.key
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Orientation */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500" /> Sayfa Yönü
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { key: 'auto', label: 'Otomatik' },
                    { key: 'portrait', label: 'Dikey' },
                    { key: 'landscape', label: 'Yatay' },
                  ] as { key: PageOrientation; label: string }[]
                ).map((ori) => (
                  <button
                    key={ori.key}
                    type="button"
                    onClick={() => updateSetting('orientation', ori.key)}
                    className={`py-1.5 px-2 rounded-lg font-medium transition ${
                      settings.orientation === ori.key
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ori.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Size */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Kenar Boşluğu
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { key: 'none', label: 'Yok (0)' },
                    { key: 'small', label: 'Küçük' },
                    { key: 'standard', label: 'Normal' },
                  ] as { key: MarginSize; label: string }[]
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => updateSetting('margin', m.key)}
                    className={`py-1.5 px-2 rounded-lg font-medium transition ${
                      settings.margin === m.key
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Compression */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" /> Görüntü Kalitesi
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { key: 'high', label: 'Yüksek' },
                    { key: 'balanced', label: 'Dengeli' },
                    { key: 'low', label: 'Küçük MB' },
                  ] as { key: ImageQuality; label: string }[]
                ).map((q) => (
                  <button
                    key={q.key}
                    type="button"
                    onClick={() => updateSetting('quality', q.key)}
                    className={`py-1.5 px-2 rounded-lg font-medium transition ${
                      settings.quality === q.key
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle Page Numbers */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div>
              <span className="font-semibold text-slate-800">Sayfa Numarası Ekle</span>
              <p className="text-[11px] text-slate-500">
                Her sayfanın alt ortasına "Sayfa 1 / X" şeklinde numara yazar.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.addPageNumbers}
                onChange={(e) => updateSetting('addPageNumbers', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Apply filter to all images shortcut */}
          <div className="pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-800 block mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Tüm Sayfalara Toplu Filtre Uygula:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => onApplyGlobalFilter('original')}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-center"
              >
                Orijinal
              </button>
              <button
                type="button"
                onClick={() => onApplyGlobalFilter('document')}
                className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition text-center"
              >
                Belge Tara
              </button>
              <button
                type="button"
                onClick={() => onApplyGlobalFilter('grayscale')}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-center"
              >
                Gri Ton
              </button>
              <button
                type="button"
                onClick={() => onApplyGlobalFilter('bw')}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition text-center"
              >
                Siyah/Beyaz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
