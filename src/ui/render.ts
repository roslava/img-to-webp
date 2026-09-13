import type { ConvertedImage, Settings, SourceImage } from '../types';

export function template(): string {
  return `<main class="shell"><header><p class="eyebrow">PRIVATE IMAGE TOOL</p><h1>Image <span>→</span> WebP</h1><p class="intro">Convert images locally in your browser. Files are never uploaded.</p></header>
  <section class="dropzone" id="dropzone"><input id="file-input" type="file" accept="image/jpeg,image/png" multiple><div class="drop-icon">↓</div><h2>Drop JPG or PNG images here</h2><p>or <button class="link-button" id="choose-files" type="button">browse files</button> from your device</p><small>Multiple files supported · up to your browser's memory</small></section>
  <p id="notice" class="notice" aria-live="polite"></p>
  <section class="settings panel"><div class="section-heading"><div><p class="eyebrow">OUTPUT SETTINGS</p><h2>Fine-tune your conversion</h2></div></div>
  <div class="settings-grid"><label class="quality">Quality <output id="quality-value">85</output><input id="quality" type="range" min="1" max="100" value="85"></label>
  <fieldset><legend>Image size</legend><div class="segmented"><label><input type="radio" name="mode" value="original" checked>Original</label><label><input type="radio" name="mode" value="resize">Resize</label><label><input type="radio" name="mode" value="square">Square</label></div></fieldset>
  <div id="resize-fields" class="dimensions hidden"><label>Width <input id="width" inputmode="numeric" type="number" min="1" placeholder="Auto"></label><span>×</span><label>Height <input id="height" inputmode="numeric" type="number" min="1" placeholder="Auto"></label></div>
  <div id="square-fields" class="dimensions hidden"><label>Side <input id="square-size" inputmode="numeric" type="number" min="1" value="1000"></label><span class="cover">Cover · center crop</span></div>
  <div class="toggles"><label><input id="aspect" type="checkbox" checked> Keep proportions</label><label><input id="upscale" type="checkbox" checked> Don't enlarge images</label></div></div></section>
  <section class="files-section"><div class="list-header"><div><p class="eyebrow">YOUR IMAGES</p><h2 id="file-count">No images added</h2></div><button id="convert-all" class="button" disabled>Convert all</button></div><div id="files" class="files empty-state"><p>Your image queue will appear here.</p></div></section>
  <section id="results-section" class="results hidden"><div class="list-header"><div><p class="eyebrow">READY TO DOWNLOAD</p><h2>Converted images</h2></div><div class="results-actions"><div id="archive-name-control" class="archive-name-control"><button id="name-archive" class="archive-name-trigger" type="button">Name archive</button><input id="archive-name" class="archive-name-input" type="text" aria-label="ZIP archive name" autocomplete="off" spellcheck="false" placeholder="Archive name"></div><button id="download-all" class="button secondary">Download all <span>ZIP</span></button></div></div><div id="results" class="files"></div></section>
  <footer><span class="lock">⌁</span> Images are processed locally in your browser and are never uploaded.</footer></main>`;
}

const bytes = (value: number): string => value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);

export function renderFiles(container: HTMLElement, images: SourceImage[], processing: boolean): void {
  if (!images.length) { container.className = 'files empty-state'; container.innerHTML = '<p>Your image queue will appear here.</p>'; return; }
  container.className = 'files';
  container.innerHTML = images.map(image => `<article class="file-card"><img src="${image.previewUrl}" alt=""><div class="file-info"><strong title="${escapeHtml(image.file.name)}">${escapeHtml(image.file.name)}</strong><span>${image.width} × ${image.height} · ${bytes(image.file.size)}</span></div><button class="remove" data-remove="${image.id}" ${processing ? 'disabled' : ''} aria-label="Remove ${escapeHtml(image.file.name)}">×</button></article>`).join('');
}

export function renderResults(container: HTMLElement, images: ConvertedImage[], sourceImages: SourceImage[]): void {
  container.innerHTML = images.map(image => { const source = sourceImages.find(item => item.id === image.sourceId); const change = source ? Math.round((1 - image.blob.size / source.file.size) * 100) : 0; return `<article class="result-card"><div class="result-icon">WEBP</div><div class="file-info"><strong>${escapeHtml(image.name)}</strong><span>${image.width} × ${image.height} · ${bytes(image.blob.size)} <em class="${change >= 0 ? 'saving' : 'larger'}">${change >= 0 ? '−' : '+'}${Math.abs(change)}%</em></span></div><button class="download" data-download="${image.sourceId}">Download</button></article>`; }).join('');
}

export function readSettings(): Settings {
  const checked = document.querySelector<HTMLInputElement>('input[name="mode"]:checked');
  return { quality: Number((document.querySelector('#quality') as HTMLInputElement).value), mode: (checked?.value ?? 'original') as Settings['mode'], width: (document.querySelector('#width') as HTMLInputElement).value, height: (document.querySelector('#height') as HTMLInputElement).value, squareSize: (document.querySelector('#square-size') as HTMLInputElement).value, keepAspect: (document.querySelector('#aspect') as HTMLInputElement).checked, preventUpscale: (document.querySelector('#upscale') as HTMLInputElement).checked };
}
