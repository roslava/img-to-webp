# Image → WebP

A small, browser-only image converter for JPG, JPEG and PNG files. Drop one or more images or add a folder, choose quality and dimensions, then download individual WebP files or a ZIP archive.

## Privacy

Images are processed locally in your browser and are never uploaded. The app has no backend or image-processing API.

## Requirements

- Node.js 18+ and npm
- A modern browser with Canvas/WebP support

Regular image uploads work in modern browsers. Folder selection uses a directory file input (`webkitdirectory`), with the best support in Chromium-based browsers. If a browser does not support folder selection, ordinary image upload continues to work.

## Folder ZIP exports

Adding a folder preserves its nested structure in the ZIP while changing each supported image to WebP. The selected root folder itself is omitted from the ZIP entries.

```text
Input folder:

hero.jpg
thumbnail.jpg
gallery/
  01.jpg
  02.jpg

Output ZIP:

hero.webp
thumbnail.webp
gallery/
  01.webp
  02.webp
```

Only JPG, JPEG, and PNG files are included. Folder structure is preserved only in the ZIP; downloading one result uses the normal browser download and saves just that file's name.

## Run locally

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Project structure

```text
src/
  image/       # decoding, geometry and Canvas → WebP conversion
  download/    # individual and ZIP downloads
  ui/          # DOM templates and rendering helpers
  main.ts      # application state and event wiring
  styles.css   # interface styling
  types.ts     # shared types
```

## Processing pipeline

The app validates selected files, creates a local preview URL, and reads source dimensions. At conversion time it decodes each file with `createImageBitmap` (falling back to `Image`), calculates one shared crop/resize geometry, draws it to a Canvas, and exports with `canvas.toBlob('image/webp', quality)`. Square mode uses a centered `cover` crop without distortion. Decoded bitmaps and preview/download object URLs are released when no longer needed.

`fflate` is the only runtime dependency and is used to create the optional ZIP download.
