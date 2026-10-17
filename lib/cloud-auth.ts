import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const cookieName = 'kiku-session';
export const lifetime = 60 * 60 * 24 * 30;
export function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Session is not configured');
  return createHmac('sha256', secret).update(value).digest('hex');
}
export function token() {
  const expires = String(Math.floor(Date.now() / 1000) + lifetime);
  return `${expires}.${sign(expires)}`;
}
export async function authenticated() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const [expires, signature] = value.split('.');
  return Number(expires) > Date.now() / 1000 && Number(expires) <= Date.now() / 1000 + lifetime && !!signature && equal(signature, sign(expires));
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
