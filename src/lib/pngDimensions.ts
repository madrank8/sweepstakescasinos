/**
 * Read a PNG's real width/height from its IHDR chunk at build time, so
 * schema.org ImageObject entries never carry guessed or hardcoded
 * dimensions. Node-only (build-time / SSR); do not import from client code.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, { width: number; height: number } | null>();

/**
 * @param publicPath Absolute-from-root path as referenced in markup, e.g.
 *   "/images/states/ca.png" (must live under the repo's `public/` dir).
 */
export function pngDimensions(publicPath: string): { width: number; height: number } | null {
  if (cache.has(publicPath)) return cache.get(publicPath)!;
  try {
    const abs = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
    const buf = readFileSync(abs);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const dims = { width, height };
    cache.set(publicPath, dims);
    return dims;
  } catch {
    cache.set(publicPath, null);
    return null;
  }
}
