import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  ArrowRight,
  Layers,
  Image as ImageIcon,
  FileSpreadsheet,
  FolderDown,
} from 'lucide-react';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ImageUploader } from './components/ImageUploader';
import { ImageItemCard } from './components/ImageItemCard';
import { PdfSettingsPanel } from './components/PdfSettingsPanel';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { PdfResultModal } from './components/PdfResultModal';
import { ConversionHistory } from './components/ConversionHistory';
import { OfficeConverter } from './components/OfficeConverter';
import { Toast, ToastData } from './components/Toast';
import { ImageItem, ImageFilter, PdfSettings } from './types';
import { processImage } from './utils/imageProcessing';
import {
  generatePdfFromImages,
  GeneratedPdfResult,
  GenerationProgress,
} from './utils/pdfGenerator';
import {
  getHistory,
  saveToHistory,
  deleteHistoryItem,
  clearAllHistory,
  HistoryItem,
} from './utils/historyDb';

type TabMode = 'photo' | 'office';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabMode>('photo');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);

  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [pdfResult, setPdfResult] = useState<GeneratedPdfResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);

  const triggerNativeShare = async (pdfRes: GeneratedPdfResult) => {
    try {
      const file = new File([pdfRes.blob], pdfRes.fileName, {
        type: 'application/pdf',
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: pdfRes.fileName,
          text: `${pdfRes.pageCount} sayfalık PDF belgesi oluşturuldu.`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: pdfRes.fileName,
          url: pdfRes.blobUrl,
        });
      } else {
        const a = document.createElement('a');
        a.href = pdfRes.blobUrl;
        a.download = pdfRes.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Paylaşım iptal edildi veya desteklenmiyor', err);
      }
    }
  };

  const showSuccessToast = (
    title: string,
    message?: string,
    onShare?: () => void
  ) => {
    setToast({
      id: String(Date.now()),
      title,
      message,
      duration: 6000,
      onShare,
    });
  };

  // Default settings for photos
  const [settings, setSettings] = useState<PdfSettings>({
    fileName: `Belgelerim_${new Date().toISOString().slice(0, 10)}`,
    format: 'a4',
    orientation: 'auto',
    margin: 'small',
    quality: 'balanced',
    addPageNumbers: true,
  });

  // Load history from IndexedDB on initial mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const items = await getHistory();
    setHistoryItems(items);
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteHistoryItem(id);
    await loadHistory();
  };

  const handleClearHistory = async () => {
    if (confirm('Tüm dönüştürme geçmişini silmek istediğinize emin misiniz?')) {
      await clearAllHistory();
      await loadHistory();
    }
  };

  // Office PDF generated handler
  const handleOfficePdfGenerated = async (
    result: GeneratedPdfResult,
    thumbnailUrl: string
  ) => {
    setPdfResult(result);

    const historyEntry: HistoryItem = {
      id: `office-${Date.now()}`,
      fileName: result.fileName,
      createdAt: new Date().toISOString(),
      pageCount: result.pageCount,
      sizeBytes: result.sizeBytes,
      thumbnailUrl,
      pdfBlob: result.blob,
    };
    await saveToHistory(historyEntry);
    await loadHistory();
    showSuccessToast(
      'Office Belgesi Başarıyla PDF Oldu!',
      `${result.fileName} • ${result.pageCount} Sayfa`,
      () => triggerNativeShare(result)
    );
  };

  // Adding images
  const handleImagesAdded = (newImages: ImageItem[]) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  // Rotate single image (0 -> 90 -> 180 -> 270)
  const handleRotate = async (id: string) => {
    const target = images.find((img) => img.id === id);
    if (!target) return;

    const nextRotation = ((target.rotation + 90) % 360) as 0 | 90 | 180 | 270;

    const { processedUrl, width, height } = await processImage(
      target.originalDataUrl,
      nextRotation,
      target.filter
    );

    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? {
              ...img,
              rotation: nextRotation,
              processedDataUrl: processedUrl,
              width,
              height,
            }
          : img
      )
    );
  };

  // Change filter for single image
  const handleFilterChange = async (id: string, filter: ImageFilter) => {
    const target = images.find((img) => img.id === id);
    if (!target) return;

    const { processedUrl } = await processImage(
      target.originalDataUrl,
      target.rotation,
      filter
    );

    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? {
              ...img,
              filter,
              processedDataUrl: processedUrl,
            }
          : img
      )
    );
  };

  // Apply filter to all images in batch
  const handleApplyGlobalFilter = async (filter: ImageFilter) => {
    setIsLoading(true);
    try {
      const updated = await Promise.all(
        images.map(async (img) => {
          const { processedUrl } = await processImage(
            img.originalDataUrl,
            img.rotation,
            filter
          );
          return {
            ...img,
            filter,
            processedDataUrl: processedUrl,
          };
        })
      );
      setImages(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder images
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Delete image
  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (previewImageId === id) {
      setPreviewImageId(null);
    }
  };

  // Clear all images
  const handleClearAll = () => {
    if (confirm('Eklenen tüm fotoğrafları silmek istediğinize emin misiniz?')) {
      setImages([]);
    }
  };

  // Generate PDF from photos
  const handleGeneratePdf = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    try {
      const result = await generatePdfFromImages(images, settings, (p) => {
        setProgress(p);
      });
      setPdfResult(result);

      // Save to local offline history in IndexedDB
      const historyEntry: HistoryItem = {
        id: `pdf-${Date.now()}`,
        fileName: result.fileName,
        createdAt: new Date().toISOString(),
        pageCount: result.pageCount,
        sizeBytes: result.sizeBytes,
        thumbnailUrl: images[0]?.processedDataUrl || images[0]?.originalDataUrl || '',
        pdfBlob: result.blob,
      };
      await saveToHistory(historyEntry);
      await loadHistory();
      showSuccessToast(
        'PDF Başarıyla Oluşturuldu!',
        `${result.fileName} • ${result.pageCount} Sayfa`,
        () => triggerNativeShare(result)
      );
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      alert('PDF oluşturulurken bir hata oluştu: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  // Reset all to create a new document
  const handleReset = () => {
    setImages([]);
    setPdfResult(null);
  };

  const activePreviewImage = images.find((img) => img.id === previewImageId) || null;
  const activePreviewIndex = images.findIndex((img) => img.id === previewImageId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-28 sm:pb-12 text-slate-800">
      {/* Top Header & PWA status */}
      <Header />
      <OfflineIndicator />
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-4 flex-1 flex flex-col gap-4">
        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto w-full shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Fotoğraftan PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('office')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'office'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Office'ten PDF</span>
          </button>
        </div>

        {/* Tab 1: Photo to PDF Mode */}
        {activeTab === 'photo' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Upload Zone */}
            <ImageUploader
              onImagesAdded={handleImagesAdded}
              hasImages={images.length > 0}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* Controls and Settings when images are actively added */}
            {images.length > 0 && (
              <div className="space-y-4">
                {/* Header controls above image grid */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">
                      Sayfalar ({images.length})
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      (PDF sayfa sıralamasını değiştirmek için yukarı/aşağı okları kullanın)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-medium px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Tümünü Temizle</span>
                    </button>
                  </div>
                </div>

                {/* PDF Settings Accordion */}
                <PdfSettingsPanel
                  settings={settings}
                  onChange={setSettings}
                  onApplyGlobalFilter={handleApplyGlobalFilter}
                  isOpen={isSettingsOpen}
                  onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
                />

                {/* Images Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {images.map((img, idx) => (
                    <ImageItemCard
                      key={img.id}
                      image={img}
                      index={idx}
                      total={images.length}
                      onRotate={handleRotate}
                      onFilterChange={handleFilterChange}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onDelete={handleDelete}
                      onPreview={(image) => setPreviewImageId(image.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Office to PDF Mode */}
        {activeTab === 'office' && (
          <div className="animate-in fade-in duration-150">
            <OfficeConverter onPdfGenerated={handleOfficePdfGenerated} />
          </div>
        )}

        {/* Conversion History or Empty Guide (shown when not editing images) */}
        {images.length === 0 && (
          <div className="space-y-4 pt-1">
            {historyItems.length > 0 ? (
              <ConversionHistory
                items={historyItems}
                onDelete={handleDeleteHistory}
                onClear={handleClearHistory}
              />
            ) : activeTab === 'photo' ? (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 text-center text-slate-600 shadow-xs max-w-lg mx-auto w-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Henüz Fotoğraf Eklenmedi
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Galerinizden veya kameranızdan dilediğiniz kadar fotoğraf seçin. Sayfa sıralarını düzenleyebilir, belge okunaklılığını artıran filtreler uygulayabilir ve tek tıkla PDF olarak indirebilirsiniz.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 text-left pt-5 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-800 text-[11px] block">1. Seç veya Çek</span>
                    <span className="text-[10px] text-slate-500">Kamera veya galeri</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-800 text-[11px] block">2. Düzenle</span>
                    <span className="text-[10px] text-slate-500">Sırala & filtrele</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-800 text-[11px] block">3. PDF Al</span>
                    <span className="text-[10px] text-slate-500">İndir veya paylaş</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Floating Bottom Conversion Bar (When in photo tab with images) */}
      {activeTab === 'photo' && images.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 sm:py-4 px-4 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-sm sm:text-base block">
                {images.length} Sayfa Hazır
              </span>
              <span className="text-xs text-slate-500 truncate block">
                {settings.format.toUpperCase()} • {settings.orientation === 'auto' ? 'Otomatik Yön' : settings.orientation}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-3 rounded-2xl transition cursor-pointer"
              >
                Ayarlar
              </button>

              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGenerating}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                <span>PDF'e Dönüştür</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overlay during Photo PDF Generation */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FileText className="w-7 h-7" />
            </div>

            <h3 className="font-bold text-slate-900 text-base">
              PDF Belgeniz Hazırlanıyor
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {progress?.statusText || 'Görseller işleniyor...'}
            </p>

            {/* Progress Bar */}
            <div className="mt-5 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${
                    progress
                      ? Math.round((progress.currentPage / progress.totalPages) * 100)
                      : 20
                  }%`,
                }}
              />
            </div>

            <p className="mt-2 text-[11px] text-slate-400 font-mono">
              {progress ? `${progress.currentPage} / ${progress.totalPages}` : ''}
            </p>

            <p className="mt-4 text-[11px] text-slate-400">
              Lütfen bekleyin, işlem cihazınızda çevrimdışı gerçekleştiriliyor...
            </p>
          </div>
        </div>
      )}

      {/* Footer with direct GitHub zip download link */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 mt-auto">
        <a
          href="/dosya-donusturucu-github.zip"
          download="dosya-donusturucu-github.zip"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
        >
          <FolderDown className="w-3.5 h-3.5" />
          <span>GitHub Yükleme Paketi (.zip) İndir</span>
        </a>
      </footer>

      {/* Modals */}
      <ImagePreviewModal
        image={activePreviewImage}
        pageIndex={activePreviewIndex}
        total={images.length}
        onClose={() => setPreviewImageId(null)}
        onRotate={handleRotate}
        onFilterChange={handleFilterChange}
        onDelete={handleDelete}
      />

      <PdfResultModal
        result={pdfResult}
        onClose={() => setPdfResult(null)}
        onReset={handleReset}
      />
    </div>
  );
}
