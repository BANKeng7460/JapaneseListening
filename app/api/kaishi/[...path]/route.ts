import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Serves the git-ignored Kaishi export (cards.json, anki-progress.json, media/) built by scripts/kaishi-anki.mjs.
const root = path.join(process.cwd(), 'kaishi-1.5k');
const types: Record<string, string> = { '.json': 'application/json', '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' };

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = path.resolve(root, ...(await params).path);
  const type = types[path.extname(file).toLowerCase()];
  if (!file.startsWith(root + path.sep) || !type) return new Response('Not found', { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(body, { headers: { 'Content-Type': type, 'Cache-Control': type === 'application/json' ? 'no-store' : 'public, max-age=86400' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
