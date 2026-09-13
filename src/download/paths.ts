const WINDOWS_DRIVE_PATH = /^[a-zA-Z]:/;

/** Returns a ZIP-safe relative path, or an empty string when the path is unsafe. */
export function normalizeRelativePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || WINDOWS_DRIVE_PATH.test(normalized)) return '';

  const segments = normalized.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return '';
  return segments.join('/');
}

export function toWebpPath(relativePath: string): string {
  const safePath = normalizeRelativePath(relativePath);
  if (!safePath) return '';

  const slash = safePath.lastIndexOf('/');
  const directory = slash === -1 ? '' : safePath.slice(0, slash + 1);
  const filename = safePath.slice(slash + 1).replace(/\.[^.]+$/, '');
  return `${directory}${filename}.webp`;
}

/** Makes ZIP entry paths unique without flattening their directories. */
export function uniqueWebpPaths(relativePaths: string[]): string[] {
  const used = new Set<string>();

  return relativePaths.map(relativePath => {
    const outputPath = toWebpPath(relativePath);
    if (!outputPath) return '';

    const extensionIndex = outputPath.lastIndexOf('.webp');
    const stem = outputPath.slice(0, extensionIndex);
    let candidate = outputPath;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${stem}-${suffix++}.webp`;
    used.add(candidate);
    return candidate;
  });
}
