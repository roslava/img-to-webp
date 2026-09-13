export type SizeMode = 'original' | 'resize' | 'square';

export interface SourceImage {
  id: string;
  file: File;
  previewUrl: string;
  relativePath: string;
  width: number;
  height: number;
}

export interface ConvertedImage {
  sourceId: string;
  name: string;
  relativePath: string;
  outputPath: string;
  blob: Blob;
  width: number;
  height: number;
}

export interface Settings {
  quality: number;
  mode: SizeMode;
  width: string;
  height: string;
  squareSize: string;
  keepAspect: boolean;
  preventUpscale: boolean;
}
