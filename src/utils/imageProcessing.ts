import { ImageFilter } from '../types';

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function processImage(
  dataUrl: string,
  rotation: 0 | 90 | 180 | 270 = 0,
  filter: ImageFilter = 'original',
  qualityRatio = 0.85
): Promise<{ processedUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl);

  const isRotated90or270 = rotation === 90 || rotation === 270;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas context could not be initialized');
  }

  // Set dimensions accounting for rotation
  canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  // Move origin to center for rotation
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  // Apply filters if needed
  if (filter !== 'original') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    if (filter === 'grayscale') {
      for (let i = 0; i < len; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
    } else if (filter === 'document') {
      // Document scan mode: increase contrast & push background towards white
      const contrast = 1.35; // 35% higher contrast
      const brightness = 15; // boost brightness slightly
      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Slight desaturation to remove color cast on paper
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r * 0.4 + gray * 0.6;
        g = g * 0.4 + gray * 0.6;
        b = b * 0.4 + gray * 0.6;

        // Contrast adjustment
        r = (r - 128) * contrast + 128 + brightness;
        g = (g - 128) * contrast + 128 + brightness;
        b = (b - 128) * contrast + 128 + brightness;

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
    } else if (filter === 'bw') {
      // Crisp black & white binary thresholding
      const threshold = 135;
      for (let i = 0; i < len; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = gray > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  const processedUrl = canvas.toDataURL('image/jpeg', qualityRatio);
  return {
    processedUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
