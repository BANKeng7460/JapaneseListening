// Builds the review page's Kaishi data from Anki files. Needs Node 23+ (built-in zstd and SQLite).
//   node scripts/kaishi-anki.mjs extract [Kaishi.1.5k.apkg]          → kaishi-1.5k/cards.json + kaishi-1.5k/media/
//   node scripts/kaishi-anki.mjs progress [path/to/collection.anki2] → kaishi-1.5k/anki-progress.json
// Output lives in kaishi-1.5k/ (git-ignored) and is served locally by app/api/kaishi.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'kaishi-1.5k');
const [command, input] = process.argv.slice(2);

// Minimal zip reader for .apkg files (stored or deflated entries).
function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('Not a zip file: ' + file);
  const entries = new Map();
  for (let i = 0, p = buf.readUInt32LE(eocd + 16); i < buf.readUInt16LE(eocd + 10); i++) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42), name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    entries.set(name, () => { const raw = buf.subarray(start, start + size); return method === 8 ? zlib.inflateRawSync(raw) : raw; });
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return entries;
}
const unzstd = data => data.subarray(0, 4).toString('hex') === '28b52ffd' ? zlib.zstdDecompressSync(data) : data;

// Protobuf wire decoding, enough for Anki's media index.
function varint(b, p) { let v = 0, s = 0, x; do { x = b[p++]; v += (x & 127) * 2 ** s; s += 7; } while (x & 128); return [v, p]; }
function fields(b) {
  const result = [];
  for (let p = 0; p < b.length;) {
    let key; [key, p] = varint(b, p);
    const type = key & 7;
    if (type === 0) { let v; [v, p] = varint(b, p); result.push([key >>> 3, v]); }
    else if (type === 2) { let len; [len, p] = varint(b, p); result.push([key >>> 3, b.subarray(p, p + len)]); p += len; }
    else p += type === 5 ? 4 : 8;
  }
  return result;
}

// Anki furigana ("日本語[にほんご]") plus <b> highlighting → [text, reading?, bold?] segments.
function segments(html) {
  const result = [];
  let bold = false;
  for (const part of html.replace(/<br\s*\/?>/gi, '\n').split(/(<[^>]+>)/)) {
    if (part.startsWith('<')) { if (/^<\/?(b|strong)\b/i.test(part)) bold = !part.startsWith('</'); continue; }
    const text = part.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    let last = 0;
    for (const m of text.matchAll(/ ?([^ >]+?)\[(.+?)\]/g)) {
      if (m.index > last) result.push([text.slice(last, m.index), '', bold ? 1 : 0]);
      result.push([m[1], m[2], bold ? 1 : 0]);
      last = m.index + m[0].length;
    }
    if (last < text.length) result.push([text.slice(last), '', bold ? 1 : 0]);
  }
  return result.filter(s => s[0]).map(([t, r, b]) => b ? [t, r, 1] : r ? [t, r] : [t]);
}
const plain = html => html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
const sound = field => field.match(/\[sound:([^\]]+)\]/)?.[1] ?? null;
const image = field => field.match(/src="([^"]+)"/)?.[1] ?? null;

function extract(apkg = path.join(root, 'Kaishi.1.5k.apkg')) {
  const zip = readZip(apkg);
  const tmp = path.join(os.tmpdir(), `kaishi-${process.pid}.sqlite`);
  fs.writeFileSync(tmp, unzstd(zip.get('collection.anki21b')()));
  fs.mkdirSync(path.join(out, 'media'), { recursive: true });

  const names = fields(unzstd(zip.get('media')())).filter(([f]) => f === 1).map(([, e]) => fields(e).find(([f]) => f === 1)[1].toString('utf8'));
  names.forEach((name, i) => {
    if (path.basename(name) !== name || name.startsWith('.')) throw new Error('Unsafe media name: ' + name);
    const target = path.join(out, 'media', name);
    if (!fs.existsSync(target)) fs.writeFileSync(target, unzstd(zip.get(String(i))()));
  });

  const db = new DatabaseSync(tmp, { readOnly: true });
  const rows = db.prepare('select n.guid, n.flds, c.due from notes n join cards c on c.nid = n.id order by c.due, n.id').all();
  db.close(); fs.rmSync(tmp);
  const cards = rows.map(row => ({ guid: row.guid, pos: row.due, f: row.flds.split('\x1f') }))
    .filter(({ f }) => plain(f[1])) // skips the deck's welcome card
    .map(({ guid, pos, f }) => ({ id: guid, pos, word: plain(f[0]), reading: plain(f[1]), meaning: plain(f[2]), wordFurigana: segments(f[3]),
      wordAudio: sound(f[4]), sentence: segments(f[7] || f[5]), sentenceMeaning: plain(f[6]), sentenceAudio: sound(f[8]), notes: plain(f[9]), picture: image(f[13]) }));
  fs.writeFileSync(path.join(out, 'cards.json'), JSON.stringify(cards));
  console.log(`${cards.length} cards and ${names.length} media files in ${out}`);
}

function progress(collection = path.join(process.env.APPDATA ?? '', 'Anki2', 'User 1', 'collection.anki2')) {
  // Read a copy so a running Anki is never touched.
  const tmp = path.join(os.tmpdir(), `anki-progress-${process.pid}.anki2`);
  fs.copyFileSync(collection, tmp);
  if (fs.existsSync(collection + '-wal')) fs.copyFileSync(collection + '-wal', tmp + '-wal');
  const db = new DatabaseSync(tmp, { readOnly: true });
  const { crt } = db.prepare('select crt from col').get();
  // decks.name uses Anki's custom "unicase" collation, so compare in JS rather than SQL.
  const deck = db.prepare('select id, name from decks').all().find(d => d.name === 'Kaishi 1.5k');
  if (!deck) throw new Error('No "Kaishi 1.5k" deck in ' + collection);
  const learnSteps = 2, relearnSteps = 1; // the deck's options: 1m 10m / 10m
  const rows = db.prepare(`select n.guid, c.type, c.queue, c.due, c.ivl, c.reps, c.lapses, c.left, c.data,
      (select max(r.id) from revlog r where r.cid = c.id) last
    from cards c join notes n on n.id = c.nid where c.did = ? and c.type > 0`).all(deck.id);
  db.close(); fs.rmSync(tmp); fs.rmSync(tmp + '-wal', { force: true });
  const phases = { 1: 'learning', 2: 'review', 3: 'relearning' };
  const cards = Object.fromEntries(rows.map(r => {
    const data = JSON.parse(r.data || '{}');
    const phase = phases[r.type];
    const dayMs = day => (crt + day * 86400 + 12 * 3600) * 1000; // midday of an Anki day number
    const steps = phase === 'relearning' ? relearnSteps : learnSteps;
    return [r.guid, { phase, dueMs: r.queue === 1 ? r.due * 1000 : dayMs(r.due), ivl: r.ivl, step: Math.max(0, steps - (r.left % 1000)),
      memory: data.s ? { s: data.s, d: data.d } : null, lastReview: r.last, reps: r.reps, lapses: r.lapses }];
  }));
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'anki-progress.json'), JSON.stringify({ exportedAt: Date.now(), cards }));
  console.log(`${rows.length} studied Kaishi cards exported to ${path.join(out, 'anki-progress.json')}`);
}

if (command === 'extract') extract(input);
else if (command === 'progress') progress(input);
else console.log('Usage: node scripts/kaishi-anki.mjs extract [apkg] | progress [collection.anki2]');
