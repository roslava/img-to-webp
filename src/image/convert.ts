import { decodeImage } from './decode';
import { getGeometry } from './geometry';
import type { Settings } from '../types';

export interface ConversionOutput { blob: Blob; width: number; height: number }

export async function convertToWebp(file: File, settings: Settings): Promise<ConversionOutput> {
  const decoded = await decodeImage(file);
  try {
    const geometry = getGeometry(decoded.width, decoded.height, settings);
    const canvas = document.createElement('canvas');
    canvas.width = geometry.canvasWidth;
    canvas.height = geometry.canvasHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable in this browser.');
    context.drawImage(decoded.source, geometry.sourceX, geometry.sourceY, geometry.sourceWidth, geometry.sourceHeight, 0, 0, geometry.canvasWidth, geometry.canvasHeight);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('WebP export is not supported by this browser.')), 'image/webp', settings.quality / 100));
    return { blob, width: geometry.canvasWidth, height: geometry.canvasHeight };
  } finally { decoded.close(); }
}
