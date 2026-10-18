import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  ArrowRight,
  Layers,
  Image as ImageIcon,
  FileSpreadsheet,
  FolderDown,
  Sparkles,
  SlidersHorizontal,
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
import { PdfTools } from './components/PdfTools';
import { BottomTabBar, AppTab } from './components/BottomTabBar';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast, ToastData } from './components/Toast';
import { DownloadSourceModal } from './components/DownloadSourceModal';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('photo');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);

  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [pdfResult, setPdfResult] = useState<GeneratedPdfResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Custom iOS Confirm Modal State (replaces browser confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirmModal = (title: string, message: string, onConfirmAction: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

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

  // Default settings for photos - default to 'low' for lowest possible PDF size
  const [settings, setSettings] = useState<PdfSettings>({
    fileName: `Belgelerim_${new Date().toISOString().slice(0, 10)}`,
    format: 'a4',
    orientation: 'auto',
    margin: 'small',
    quality: 'low',
    addPageNumbers: true,
  });

  // Clear any previous dark mode and load history from IndexedDB on initial mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('app_theme');
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

  const handleClearHistory = () => {
    openConfirmModal(
      'Geçmişi Temizle',
      'Tüm dönüştürme geçmişiniz cihazdan silinecek. Bu işlem geri alınamaz. Emin misiniz?',
      async () => {
        await clearAllHistory();
        await loadHistory();
      }
    );
  };

  // Office & Tools PDF generated handler
  const handleGenericPdfGenerated = async (
    result: GeneratedPdfResult,
    thumbnailUrl: string,
    prefix = 'belge'
  ) => {
    setPdfResult(result);

    const historyEntry: HistoryItem = {
      id: `${prefix}-${Date.now()}`,
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
      'Belge Başarıyla PDF Oldu!',
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
    try {
      const { processedUrl } = await processImage(
        target.originalDataUrl,
        nextRotation,
        target.filter
      );

      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, rotation: nextRotation, processedDataUrl: processedUrl }
            : img
        )
      );
    } catch (err) {
      console.error('Döndürme hatası:', err);
    }
  };

  // Change filter for single image
  const handleFilterChange = async (id: string, filter: ImageFilter) => {
    const target = images.find((img) => img.id === id);
    if (!target) return;

    try {
      const { processedUrl } = await processImage(
        target.originalDataUrl,
        target.rotation,
        filter
      );

      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, filter, processedDataUrl: processedUrl }
            : img
        )
      );
    } catch (err) {
      console.error('Filtre uygulama hatası:', err);
    }
  };

  // Apply filter to all images at once
  const handleApplyGlobalFilter = async (filter: ImageFilter) => {
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
      console.error('Toplu filtre uygulama hatası:', err);
    }
  };

  // Reorder images
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
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
    openConfirmModal(
      'Tüm Fotoğrafları Kaldır',
      'Eklenen tüm fotoğraflar listeden çıkarılacak. Emin misiniz?',
      () => setImages([])
    );
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 text-slate-800 transition-colors">
      {/* Top Header */}
      <Header onShowDownloadModal={() => setIsDownloadModalOpen(true)} />
      <OfflineIndicator />
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 py-4 flex-1 flex flex-col gap-4">
        {/* Tab 1: Photo & Scanner to PDF */}
        {activeTab === 'photo' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Uploader Card */}
            <ImageUploader
              hasImages={images.length > 0}
              onImagesAdded={handleImagesAdded}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* If images exist: Toolbar & List */}
            {images.length > 0 && (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Seçilen Sayfalar ({images.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sıralamak için oklara dokunun, tarayıcı ve fotokopi filtresi uygulayın.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Settings Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold active:scale-95 transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      <span>PDF Ayarları</span>
                    </button>

                    {/* Clear All */}
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold active:scale-95 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Temizle</span>
                    </button>
                  </div>
                </div>

                {/* Grid of Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {images.map((item, index) => (
                    <ImageItemCard
                      key={item.id}
                      image={item}
                      index={index}
                      total={images.length}
                      onRotate={handleRotate}
                      onFilterChange={handleFilterChange}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onDelete={handleDelete}
                      onPreview={(img) => setPreviewImageId(img.id)}
                    />
                  ))}
                </div>

                {/* Bottom Primary Generate Button */}
                <div className="pt-2 sticky bottom-20 z-20">
                  <button
                    type="button"
                    onClick={handleGeneratePdf}
                    disabled={isGenerating || images.length === 0}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-blue-200" />
                    <span>{images.length} Sayfadan PDF Oluştur</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Office to PDF Mode */}
        {activeTab === 'office' && (
          <div className="animate-in fade-in duration-150">
            <OfficeConverter
              onPdfGenerated={(res, thumb) => handleGenericPdfGenerated(res, thumb, 'office')}
            />
          </div>
        )}

        {/* Tab 3: PDF Tools (Merge, Split) */}
        {activeTab === 'tools' && (
          <div className="animate-in fade-in duration-150">
            <PdfTools
              onPdfGenerated={(res, thumb) => handleGenericPdfGenerated(res, thumb, 'tools')}
              onOpenConfirm={openConfirmModal}
              onOpenDownloadZipModal={() => setIsDownloadModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 4: History Mode */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-150">
            <ConversionHistory
              items={historyItems}
              onDelete={handleDeleteHistory}
              onClear={handleClearHistory}
            />
          </div>
        )}
      </main>

      {/* PDF Settings Modal */}
      <PdfSettingsPanel
        settings={settings}
        onChange={setSettings}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
        onApplyGlobalFilter={handleApplyGlobalFilter}
      />

      {/* Generating Overlay Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
              <FileText className="w-8 h-8 text-blue-600 animate-bounce" />
            </div>

            <h3 className="mt-4 font-bold text-slate-900 text-base">
              PDF Belgesi Oluşturuluyor
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {progress ? progress.statusText : 'Sayfalar işleniyor...'}
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

      {/* Custom iOS Confirm Modal (replaces browser confirm) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* GitHub Source Code Download Modal */}
      <DownloadSourceModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Native iOS Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={historyItems.length}
      />
    </div>
  );
}
