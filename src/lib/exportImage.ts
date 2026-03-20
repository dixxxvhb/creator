import type { FormationCanvasHandle } from '@/components/canvas';

/**
 * Export the current formation canvas as a PNG and trigger a download.
 */
export function exportPng(
  canvasHandle: FormationCanvasHandle,
  filename: string,
  pixelRatio = 2
): void {
  const dataUrl = canvasHandle.toDataURL(pixelRatio);
  if (!dataUrl) return;

  const link = document.createElement('a');
  link.download = `${sanitizeFilename(filename)}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
}
