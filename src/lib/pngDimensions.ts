/**
 * Read a PNG's real width/height from its IHDR chunk at build time, so
 * schema.org ImageObject entries never carry guessed or hardcoded
 * dimensions. Node-only (build-time / SSR); do not import from client code.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, { width: number; height: number } | null>();

/**
 * Accepts a URL-root path (`/images/x.png`), source-tree path
 * (`images/x.png`), or copied-public path (`public/images/x.png`).
 */
export function pngDimensions(publicPath: string): { width: number; height: number } | null {
  if (cache.has(publicPath)) return cache.get(publicPath)!;

  const rel = publicPath.replace(/^\/+/, '');
  const sourceRel = rel.replace(/^public\//, '');
  const candidates = rel.startsWith('public/')
    ? [join(process.cwd(), rel), join(process.cwd(), sourceRel)]
    : [join(process.cwd(), 'public', rel), join(process.cwd(), sourceRel)];

  for (const abs of [...new Set(candidates)]) {
    try {
      const buf = readFileSync(abs);
      if (
        buf.length < 24 ||
        buf.toString('ascii', 1, 4) !== 'PNG' ||
        buf.toString('ascii', 12, 16) !== 'IHDR'
      ) {
        continue;
      }
      const dims = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
      cache.set(publicPath, dims);
      return dims;
    } catch {
      // Try the next source-tree/copied-public candidate.
    }
  }
  cache.set(publicPath, null);
  return null;
}
