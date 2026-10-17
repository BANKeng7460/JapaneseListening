import { authenticated, sameOrigin } from '../../../lib/cloud-auth';
import { database } from '../../../lib/cloud-db';

export const runtime = 'nodejs';
export async function GET() {
  if (!await authenticated()) return new Response(null, { status: 401 });
  try {
    const rows = await (await database()).collection('progress').find({ account: 'owner' }).toArray();
    return Response.json({ values: Object.fromEntries(rows.map(row => [row.key, row.value])) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Database unavailable' }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!await authenticated()) return new Response(null, { status: 401 });
  const body = await request.text();
  if (body.length > 4_000_000) return new Response(null, { status: 413 });
  let values: unknown;
  try { values = JSON.parse(body).values; } catch { return new Response(null, { status: 400 }); }
  if (!values || typeof values !== 'object' || Array.isArray(values)) return new Response(null, { status: 400 });
  const entries = Object.entries(values);
  if (entries.length > 2000 || entries.some(([key, value]) => !/^kiku-[a-zA-Z0-9_-]{1,150}$/.test(key) || key === 'kiku-cloud-pending' || typeof value !== 'string' || value.length > 2_000_000)) return new Response(null, { status: 400 });
  try {
    const collection = (await database()).collection('progress');
    await collection.createIndex({ account: 1, key: 1 }, { unique: true });
    if (entries.length) await collection.bulkWrite(entries.map(([key, value]) => ({ updateOne: { filter: { account: 'owner', key }, update: { $set: { value, updatedAt: new Date() } }, upsert: true } })));
    return Response.json({ saved: true });
  } catch { return Response.json({ error: 'Database unavailable' }, { status: 503 }); }
}
