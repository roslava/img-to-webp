import { zipSync } from 'fflate';
import type { ConvertedImage } from '../types';
import { downloadBlob } from './download';

export const DEFAULT_ARCHIVE_NAME = 'webp-images.zip';

export function normalizeArchiveName(name: string): string {
  const sanitized = name.trim().replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-');
  if (!sanitized) return DEFAULT_ARCHIVE_NAME;
  return /\.zip$/i.test(sanitized) ? sanitized : `${sanitized}.zip`;
}

export async function downloadZip(images: ConvertedImage[], archiveName = ''): Promise<void> {
  const files: Record<string, Uint8Array> = {};
  await Promise.all(images.map(async image => {
    if (image.outputPath) files[image.outputPath] = new Uint8Array(await image.blob.arrayBuffer());
  }));
  const zip = zipSync(files, { level: 6 });
  downloadBlob(new Blob([zip], { type: 'application/zip' }), normalizeArchiveName(archiveName));
}
