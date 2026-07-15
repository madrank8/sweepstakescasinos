/**
 * Read an SVG's declared width/height at build time so schema.org ImageObject
 * entries never lie about dimensions. Prefers the numeric `width`/`height`
 * root attributes, falls back to the third/fourth values of `viewBox`.
 * Node-only (build-time / SSR); do not import from client code.
 *
 * Companion of pngDimensions.ts. Both are used by the guide + state slug
 * renderers to resolve accurate dims from the file bytes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, { width: number; height: number } | null>();

/**
 * @param publicPath Absolute-from-root path as referenced in markup, e.g.
 *   "/images/states/ca-legality-status.svg" (must live under `public/`).
 */
export function svgDimensions(publicPath: string): { width: number; height: number } | null {
  if (cache.has(publicPath)) return cache.get(publicPath)!;
  try {
    const abs = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
    // SVG files are tiny (~5KB for ours); read the first 2KB which always
    // contains the root <svg ...> attribute block.
    const buf = readFileSync(abs, { encoding: 'utf-8' });
    const head = buf.slice(0, 4096);

    const numeric = (attr: string): number | null => {
      const m = head.match(new RegExp(`\\b${attr}=["']?([0-9.]+)`, 'i'));
      if (!m) return null;
      const v = Number.parseFloat(m[1]);
      return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
    };

    let width = numeric('width');
    let height = numeric('height');

    if (width == null || height == null) {
      const vb = head.match(/\bviewBox=["']?\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
      if (vb) {
        const vbW = Math.round(Number.parseFloat(vb[3]));
        const vbH = Math.round(Number.parseFloat(vb[4]));
        if (vbW > 0 && vbH > 0) {
          width = width ?? vbW;
          height = height ?? vbH;
        }
      }
    }

    if (width == null || height == null) {
      cache.set(publicPath, null);
      return null;
    }
    const dims = { width, height };
    cache.set(publicPath, dims);
    return dims;
  } catch {
    cache.set(publicPath, null);
    return null;
  }
}

/**
 * Extension-aware convenience: picks SVG or PNG dimension reader from the path.
 * For anything else (jpg/webp/etc.) returns null; callers fall back to any
 * frontmatter-declared dims or a legacy default.
 */
export async function imageDimensions(
  publicPath: string,
): Promise<{ width: number; height: number } | null> {
  if (/\.svg$/i.test(publicPath)) return svgDimensions(publicPath);
  if (/\.png$/i.test(publicPath)) {
    const { pngDimensions } = await import('./pngDimensions');
    return pngDimensions(publicPath);
  }
  return null;
}
