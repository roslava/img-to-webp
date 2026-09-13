import './styles.css';
import { convertToWebp } from './image/convert';
import { downloadBlob } from './download/download';
import { downloadZip } from './download/zip';
import { normalizeRelativePath } from './download/paths';
import type { ConvertedImage, SourceImage } from './types';
import { readSettings, renderFiles, renderResults, template } from './ui/render';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root is missing.');
app.innerHTML = template();
const $ = <T extends HTMLElement>(selector: string): T => { const item = document.querySelector<T>(selector); if (!item) throw new Error(`Missing element: ${selector}`); return item; };
const dropzone = $('#dropzone'); const input = $<HTMLInputElement>('#file-input'); const folderInput = $<HTMLInputElement>('#folder-input'); const filesContainer = $('#files'); const notice = $('#notice'); const count = $('#file-count'); const convertButton = $('#convert-all'); const resultsSection = $('#results-section'); const resultsContainer = $('#results');
const archiveNameControl = $('#archive-name-control'); const archiveNameButton = $('#name-archive'); const archiveNameInput = $<HTMLInputElement>('#archive-name');
let images: SourceImage[] = [];
let converted: ConvertedImage[] = [];
let processing = false;
let hasCompletedConversion = false;
let archiveName = '';

function showNotice(message = '', error = false): void { notice.textContent = message; notice.className = `notice ${message ? (error ? 'error' : 'success') : ''}`; }
function refresh(): void { renderFiles(filesContainer, images, processing); count.textContent = images.length ? `${images.length} image${images.length === 1 ? '' : 's'} ready` : 'No images added'; convertButton.toggleAttribute('disabled', !images.length || processing); convertButton.textContent = processing ? 'Converting…' : 'Convert all'; }
function valid(file: File): boolean { return ['image/jpeg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name); }
function relativePaths(files: File[], folderUpload: boolean): string[] {
  const paths = files.map(file => normalizeRelativePath(folderUpload ? file.webkitRelativePath : file.name) || normalizeRelativePath(file.name));
  if (!folderUpload) return paths;

  const root = paths[0]?.split('/')[0];
  return root && paths.every(path => path.startsWith(`${root}/`)) ? paths.map(path => path.slice(root.length + 1)) : paths;
}
function clearCompletedBatch(): void {
  images.forEach(image => URL.revokeObjectURL(image.previewUrl));
  images = [];
  converted = [];
  resultsContainer.replaceChildren();
  resultsSection.classList.add('hidden');
  hasCompletedConversion = false;
}
async function addFiles(list: FileList | File[], folderUpload = false): Promise<void> {
  const accepted = Array.from(list).filter(valid); const rejected = Array.from(list).length - accepted.length;
  if (rejected) showNotice(`${rejected} unsupported file${rejected === 1 ? ' was' : 's were'} skipped. Please use JPG or PNG.`, true);
  if (folderUpload && !accepted.length) { showNotice('No JPG or PNG images found in this folder.', true); return; }
  if (accepted.length && hasCompletedConversion) clearCompletedBatch();
  const paths = relativePaths(accepted, folderUpload);
  const added: SourceImage[] = [];
  for (const [index, file] of accepted.entries()) { let url: string | undefined; try { url = URL.createObjectURL(file); const dimensions = await imageDimensions(url); added.push({ id: crypto.randomUUID(), file, previewUrl: url, relativePath: paths[index], ...dimensions }); } catch { if (url) URL.revokeObjectURL(url); showNotice(`Could not read ${file.name}.`, true); } }
  images = [...images, ...added]; converted = []; resultsSection.classList.add('hidden'); refresh();
}
function imageDimensions(url: string): Promise<{ width: number; height: number }> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight }); image.onerror = () => reject(new Error('Image decode failed')); image.src = url; }); }
function setModeFields(): void { const mode = document.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value; $('#resize-fields').classList.toggle('hidden', mode !== 'resize'); $('#square-fields').classList.toggle('hidden', mode !== 'square'); }
input.addEventListener('change', () => { if (input.files) void addFiles(input.files); input.value = ''; });
$('#choose-files').addEventListener('click', () => input.click());
folderInput.addEventListener('change', () => { if (folderInput.files) void addFiles(folderInput.files, true); folderInput.value = ''; });
$('#choose-folder').addEventListener('click', () => folderInput.click());
['dragenter', 'dragover'].forEach(event => dropzone.addEventListener(event, event => { event.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(event => dropzone.addEventListener(event, event => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', event => { if (event.dataTransfer?.files) void addFiles(event.dataTransfer.files); });
$<HTMLInputElement>('#quality').addEventListener('input', event => { $<HTMLOutputElement>('#quality-value').value = (event.target as HTMLInputElement).value; });
document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach(element => element.addEventListener('change', setModeFields));
filesContainer.addEventListener('click', event => { const target = event.target as HTMLElement; const id = target.dataset.remove; if (!id || processing) return; const image = images.find(item => item.id === id); if (image) URL.revokeObjectURL(image.previewUrl); images = images.filter(item => item.id !== id); converted = converted.filter(item => item.sourceId !== id); refresh(); });
convertButton.addEventListener('click', async () => { processing = true; converted = []; showNotice(); refresh(); try { const settings = readSettings(); converted = await Promise.all(images.map(async image => { const result = await convertToWebp(image.file, settings); return { sourceId: image.id, name: image.file.name.replace(/\.[^.]+$/, '') + '.webp', relativePath: image.relativePath, ...result }; })); renderResults(resultsContainer, converted, images); resultsSection.classList.remove('hidden'); hasCompletedConversion = true; showNotice(`${converted.length} image${converted.length === 1 ? '' : 's'} converted successfully.`); } catch (error) { showNotice(error instanceof Error ? error.message : 'Conversion failed. Please try again.', true); } finally { processing = false; refresh(); } });
resultsContainer.addEventListener('click', event => { const id = (event.target as HTMLElement).dataset.download; const image = converted.find(item => item.sourceId === id); if (image) downloadBlob(image.blob, image.name); });
function closeArchiveNameEditor(save: boolean): void {
  if (save) archiveName = archiveNameInput.value;
  else archiveNameInput.value = archiveName;
  archiveNameControl.classList.remove('editing');
  if (document.activeElement === archiveNameInput) archiveNameInput.blur();
}
archiveNameButton.addEventListener('click', () => {
  archiveNameInput.value = archiveName;
  archiveNameControl.classList.add('editing');
  requestAnimationFrame(() => archiveNameInput.focus());
});
archiveNameInput.addEventListener('blur', () => closeArchiveNameEditor(true));
archiveNameInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); closeArchiveNameEditor(true); }
  if (event.key === 'Escape') { event.preventDefault(); closeArchiveNameEditor(false); }
});
$('#download-all').addEventListener('click', () => { if (converted.length) void downloadZip(converted, archiveName); });
refresh();
