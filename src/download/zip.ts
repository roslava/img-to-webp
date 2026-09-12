import { zipSync } from 'fflate';
import type { ConvertedImage } from '../types';
import { downloadBlob } from './download';

export async function downloadZip(images: ConvertedImage[]): Promise<void> {
  const files: Record<string, Uint8Array> = {};
  await Promise.all(images.map(async image => { files[image.name] = new Uint8Array(await image.blob.arrayBuffer()); }));
  const zip = zipSync(files, { level: 6 });
  downloadBlob(new Blob([zip], { type: 'application/zip' }), 'webp-images.zip');
}
