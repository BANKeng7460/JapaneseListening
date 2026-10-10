import type { Metadata } from 'next';
import Flashcards from '../../components/flashcards';
export const metadata: Metadata = { title: 'Flashcards · Kiku' };
export default function FlashcardsPage() { return <Flashcards />; }
