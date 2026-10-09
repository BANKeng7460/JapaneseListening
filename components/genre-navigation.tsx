'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GenreNavigation() {
  const pathname = usePathname();
  return <nav className="genre-nav" aria-label="Practice genre">
    <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Kaishi conversations</Link>
    <Link href="/reading" aria-current={pathname === '/reading' ? 'page' : undefined}>Reading practice</Link>
    <Link href="/daily-life" aria-current={pathname === '/daily-life' ? 'page' : undefined}>Daily-life conversations</Link>
    <Link href="/solo-stories" aria-current={pathname === '/solo-stories' ? 'page' : undefined}>Solo stories</Link>
    <Link href="/stories" aria-current={pathname === '/stories' ? 'page' : undefined}>Real-life stories</Link>
  </nav>;
}
