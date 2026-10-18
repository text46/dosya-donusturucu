import React, { useState, useRef } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FolderArchive,
} from 'lucide-react';
import {
  getPdfInfo,
  mergePdfFiles,
  splitPdf,
  parsePageRangeString,
  MergePdfFile,
} from '../utils/pdfTools';
import { GeneratedPdfResult } from '../utils/pdfGenerator';
import { formatFileSize } from '../utils/imageProcessing';

interface PdfToolsProps {
  onPdfGenerated: (result: GeneratedPdfResult, thumbnailUrl: string) => void;
  onOpenConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onOpenDownloadZipModal?: () => void;
}

type ToolMode = 'merge' | 'split';

export const PdfTools: React.FC<PdfToolsProps> = ({
  onPdfGenerated,
  onOpenConfirm,
  onOpenDownloadZipModal,
}) => {
  const [toolMode, setToolMode] = useState<ToolMode>('merge');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<MergePdfFile[]>([]);
  const [mergeFileName, setMergeFileName] = useState('Birlestirilmis_Belge');
  const [isMerging, setIsMerging] = useState(false);

  // Split state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPageCount, setSplitPageCount] = useState<number>(0);
  const [pageRangeInput, setPageRangeInput] = useState('');
  const [splitFileName, setSplitFileName] = useState('Secilen_Sayfalar');
  const [isSplitting, setIsSplitting] = useState(false);

  const mergeInputRef = useRef<HTMLInputElement>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);

  // Merge: Add files
  const handleAddMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf')
    );
    if (files.length === 0) return;

    const newItems: MergePdfFile[] = [];
    for (const f of files) {
      try {
        const info = await getPdfInfo(f);
        newItems.push({
          id: `merge-${Date.now()}-${Math.random()}`,
          file: f,
          name: f.name,
          size: f.size,
          pageCount: info.pageCount,
        });
      } catch (err) {
        console.warn('PDF okunamadı:', f.name, err);
      }
    }

    setMergeFiles((prev) => [...prev, ...newItems]);
    if (mergeInputRef.current) mergeInputRef.current.value = '';
  };

  const removeMergeFile = (id: string) => {
    setMergeFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;

    setMergeFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      alert('Lütfen birleştirmek için en az 2 PDF dosyası ekleyin.');
      return;
    }

    setIsMerging(true);
    try {
      const rawFiles = mergeFiles.map((item) => item.file);
      const result = await mergePdfFiles(rawFiles, mergeFileName);
      onPdfGenerated(result, '');
    } catch (err) {
      console.error('Birleştirme hatası:', err);
      alert('PDF dosyaları birleştirilirken bir hata oluştu: ' + (err as Error).message);
    } finally {
      setIsMerging(false);
    }
  };

  // Split: Select file
  const handleSelectSplitFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const info = await getPdfInfo(file);
      setSplitFile(file);
      setSplitPageCount(info.pageCount);
      setPageRangeInput(`1-${Math.min(info.pageCount, 2)}`);
      setSplitFileName(`${file.name.replace(/\.pdf$/i, '')}_Sayfalar`);
    } catch (err) {
      console.error('PDF okuma hatası:', err);
      alert('PDF dosyası açılamadı.');
    }
    if (splitInputRef.current) splitInputRef.current.value = '';
  };

  const handleExecuteSplit = async () => {
    if (!splitFile) return;

    const parsedPages = parsePageRangeString(pageRangeInput, splitPageCount);
    if (parsedPages.length === 0) {
      alert(
        `Lütfen geçerli sayfa numaraları girin (1 ile ${splitPageCount} arasında, örn: 1-3 veya 1, 3).`
      );
      return;
    }

    setIsSplitting(true);
    try {
      const result = await splitPdf(splitFile, parsedPages, splitFileName);
      onPdfGenerated(result, '');
    } catch (err) {
      console.error('Bölme hatası:', err);
      alert('Sayfalar ayrılırken bir hata oluştu: ' + (err as Error).message);
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tool Segment Switcher */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-sm mx-auto w-full transition-colors">
        <button
          type="button"
          onClick={() => setToolMode('merge')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            toolMode === 'merge'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>PDF Birleştir</span>
        </button>

        <button
          type="button"
          onClick={() => setToolMode('split')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            toolMode === 'split'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Sayfa Çıkar / Böl</span>
        </button>
      </div>

      {/* MERGE VIEW */}
      {toolMode === 'merge' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>PDF Belgelerini Birleştir</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Birden fazla PDF dosyasını sıralayın ve tek bir belge yapın.
              </p>
            </div>

            {mergeFiles.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onOpenConfirm(
                    'Seçili Dosyaları Temizle',
                    'Eklenen tüm PDF belgeleri listeden çıkarılacak. Emin misiniz?',
                    () => setMergeFiles([])
                  )
                }
                className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
              >
                Tümünü Temizle
              </button>
            )}
          </div>

          {/* Add file button / Dropzone */}
          <input
            ref={mergeInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleAddMergeFiles}
            className="hidden"
          />

          <div
            onClick={() => mergeInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center group-hover:scale-105 transition shadow-xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                PDF Dosyaları Ekleyin
              </span>
              <span className="text-[11px] text-slate-500">
                Cihazınızdan iki veya daha fazla PDF seçin
              </span>
            </div>
          </div>

          {/* List of files */}
          {mergeFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-600 block">
                Sıralama ({mergeFiles.length} Dosya • Toplam{' '}
                {mergeFiles.reduce((acc, f) => acc + f.pageCount, 0)} Sayfa)
              </span>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mergeFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {item.pageCount} Sayfa • {formatFileSize(item.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveMergeFile(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMergeFile(idx, 'down')}
                        disabled={idx === mergeFiles.length - 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMergeFile(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Output name & submit */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={mergeFileName}
                  onChange={(e) => setMergeFileName(e.target.value)}
                  placeholder="Birleştirilmiş Belge Adı"
                  className="w-full sm:flex-1 text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-blue-600 font-medium"
                />

                <button
                  type="button"
                  onClick={handleExecuteMerge}
                  disabled={isMerging || mergeFiles.length < 2}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isMerging ? 'Birleştiriliyor...' : 'PDF Olarak Birleştir'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SPLIT VIEW */}
      {toolMode === 'split' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>PDF Sayfalarını Ayır & Çıkar</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bir PDF belgesinden istediğiniz sayfaları seçip yeni bir PDF olarak kaydedin.
            </p>
          </div>

          <input
            ref={splitInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleSelectSplitFile}
            className="hidden"
          />

          {!splitFile ? (
            <div
              onClick={() => splitInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center group-hover:scale-105 transition shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-900 block">
                Bölünecek PDF Belgesini Seçin
              </span>
              <span className="text-[11px] text-slate-500">
                Tek bir PDF dosyası yükleyin
              </span>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Selected File Card */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {splitFile.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Toplam <span className="font-bold text-blue-600">{splitPageCount}</span> Sayfa • {formatFileSize(splitFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSplitFile(null)}
                  className="text-xs text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Farklı Belge Seç"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Range Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Çıkarılacak Sayfa Numaraları:
                </label>
                <input
                  type="text"
                  value={pageRangeInput}
                  onChange={(e) => setPageRangeInput(e.target.value)}
                  placeholder="Örnek: 1-3 veya 1, 3, 5"
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-blue-600 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Tek tek sayfa (örn: <span className="font-mono">1, 4</span>) veya aralık (örn: <span className="font-mono">2-5</span>) belirtebilirsiniz.
                </p>
              </div>

              {/* Output name & Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={splitFileName}
                  onChange={(e) => setSplitFileName(e.target.value)}
                  placeholder="Yeni Dosya Adı"
                  className="w-full sm:flex-1 text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-blue-600 font-medium"
                />

                <button
                  type="button"
                  onClick={handleExecuteSplit}
                  disabled={isSplitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>
                    {isSplitting ? 'Ayrılıyor...' : 'Sayfaları Çıkar ve İndir'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Source Code / GitHub ZIP Download Card */}
      {onOpenDownloadZipModal && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                GELİŞTİRİCİ
              </span>
              <h4 className="font-bold text-sm sm:text-base text-white">
                GitHub Proje Kaynak Kod Paketi (ZIP)
              </h4>
            </div>
            <p className="text-xs text-slate-300 max-w-md">
              GitHub Pages otomatik yayınlama dosyası (.github/workflows/deploy.yml) ve tüm güncel dosyaları içeren hazır arşiv.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDownloadZipModal}
            className="shrink-0 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 text-indigo-600" />
            <span>ZIP İndirme Seçenekleri</span>
          </button>
        </div>
      )}
    </div>
  );
};
