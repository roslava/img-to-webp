import type { Settings } from '../types';

export interface DrawGeometry {
  canvasWidth: number;
  canvasHeight: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

const positiveInt = (value: string): number | undefined => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};

export function getGeometry(sourceWidth: number, sourceHeight: number, settings: Settings): DrawGeometry {
  if (settings.mode === 'square') return squareGeometry(sourceWidth, sourceHeight, positiveInt(settings.squareSize) ?? Math.min(sourceWidth, sourceHeight), settings.preventUpscale);
  if (settings.mode === 'original') return { canvasWidth: sourceWidth, canvasHeight: sourceHeight, sourceX: 0, sourceY: 0, sourceWidth, sourceHeight };

  const wantedWidth = positiveInt(settings.width);
  const wantedHeight = positiveInt(settings.height);
  let width = wantedWidth ?? sourceWidth;
  let height = wantedHeight ?? sourceHeight;
  if (settings.keepAspect) {
    const factor = wantedWidth ? wantedWidth / sourceWidth : wantedHeight ? wantedHeight / sourceHeight : 1;
    width = Math.round(sourceWidth * factor);
    height = Math.round(sourceHeight * factor);
  }
  if (settings.preventUpscale && (width > sourceWidth || height > sourceHeight)) {
    const factor = Math.min(sourceWidth / width, sourceHeight / height);
    width = Math.round(width * factor);
    height = Math.round(height * factor);
  }
  return { canvasWidth: Math.max(1, width), canvasHeight: Math.max(1, height), sourceX: 0, sourceY: 0, sourceWidth, sourceHeight };
}

function squareGeometry(width: number, height: number, wantedSize: number, preventUpscale: boolean): DrawGeometry {
  const size = preventUpscale ? Math.min(wantedSize, width, height) : wantedSize;
  const cropSize = Math.min(width, height);
  return { canvasWidth: size, canvasHeight: size, sourceX: (width - cropSize) / 2, sourceY: (height - cropSize) / 2, sourceWidth: cropSize, sourceHeight: cropSize };
}
