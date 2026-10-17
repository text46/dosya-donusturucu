import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Camera, UploadCloud } from 'lucide-react';
import { ImageItem } from '../types';
import { readFileAsDataURL, loadImage } from '../utils/imageProcessing';

interface ImageUploaderProps {
  onImagesAdded: (newImages: ImageItem[]) => void;
  hasImages: boolean;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesAdded,
  hasImages,
  isLoading,
  setIsLoading,
}) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Lütfen geçerli fotoğraf dosyaları (JPG, PNG, WebP) seçin.');
      setIsLoading(false);
      return;
    }

    try {
      const items: ImageItem[] = [];

      for (const file of validFiles) {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImage(dataUrl);

        items.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          originalDataUrl: dataUrl,
          processedDataUrl: dataUrl,
          name: file.name,
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          rotation: 0,
          filter: 'original',
        });
      }

      onImagesAdded(items);
    } catch (err) {
      console.error('Fotoğraf yükleme hatası:', err);
    } finally {
      setIsLoading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Main Buttons / Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-3xl border-2 transition-all p-5 sm:p-7 text-center ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
            : hasImages
            ? 'border-dashed border-slate-300 bg-white/70 hover:border-blue-400'
            : 'border-dashed border-blue-300 bg-gradient-to-b from-blue-50/50 to-white shadow-xs'
        }`}
      >
        <div className="max-w-md mx-auto">
          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {/* Gallery Button */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-5 py-3.5 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <ImageIcon className="w-5 h-5 shrink-0" />
              <span>Galeriden Fotoğraf Seç</span>
            </button>

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-white font-semibold text-sm sm:text-base shadow-md hover:bg-slate-800 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <Camera className="w-5 h-5 shrink-0" />
              <span>Kamera ile Çek</span>
            </button>
          </div>

          {/* Subtext info */}
          <p className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-slate-400 inline" />
            <span>Birden fazla fotoğraf seçebilirsiniz (JPG, PNG, HEIC, WebP)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
