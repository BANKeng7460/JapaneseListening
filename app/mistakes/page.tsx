import type { Metadata } from 'next';
import MistakeGame from '../../components/mistake-game';
export const metadata: Metadata = { title: 'Spot the mistake · Kiku' };
export default function MistakesPage() { return <MistakeGame />; }
