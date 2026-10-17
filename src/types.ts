export type ImageFilter = 'original' | 'document' | 'grayscale' | 'bw';

export interface ImageItem {
  id: string;
  file: File;
  originalDataUrl: string;
  processedDataUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  filter: ImageFilter;
}

export type PageFormat = 'a4' | 'letter' | 'auto';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type MarginSize = 'none' | 'small' | 'standard';
export type ImageQuality = 'high' | 'balanced' | 'low';

export interface PdfSettings {
  fileName: string;
  format: PageFormat;
  orientation: PageOrientation;
  margin: MarginSize;
  quality: ImageQuality;
  addPageNumbers: boolean;
}
