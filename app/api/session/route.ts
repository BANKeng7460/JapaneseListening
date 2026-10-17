import { NextResponse } from 'next/server';
import { authenticated, cookieName, equal, lifetime, sameOrigin, token } from '../../../lib/cloud-auth';

export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({ authenticated: await authenticated() }, { headers: { 'Cache-Control': 'no-store' } });
}
// A single shared account; throttle guesses in each server process.
let attempts = 0;
let resetAt = 0;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (Date.now() > resetAt) { attempts = 0; resetAt = Date.now() + 60_000; }
  if (++attempts > 15) return new Response(null, { status: 429 });
  if (!process.env.LOGIN_KEY || !process.env.SESSION_SECRET) return new Response(null, { status: 503 });
  if (Number(request.headers.get('content-length')) > 1024) return new Response(null, { status: 413 });
  let key: unknown;
  try { key = (await request.json()).key; } catch { return new Response(null, { status: 400 }); }
  if (typeof key !== 'string' || key.length > 256 || !equal(key, process.env.LOGIN_KEY)) return new Response(null, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(cookieName, token(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: lifetime });
  return response;
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
  return response;
}
