import type { Metadata } from 'next';
import './globals.css';
import GenreNavigation from '../components/genre-navigation';

export const metadata: Metadata = {
  title: 'Kiku · Japanese Listening Practice',
  description: 'Japanese listening conversations based on your Kaishi vocabulary milestones.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><GenreNavigation />{children}</body></html>;
}
