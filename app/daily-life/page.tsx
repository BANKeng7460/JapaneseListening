import type { Metadata } from 'next';
import ListeningPractice from '../../components/listening-practice';
import dailySets from '../../data/daily-life.json';
import type { ListeningTest } from '../../data/tests';

export const metadata: Metadata = { title: 'Daily-life conversations · Kiku' };

export default function DailyLifePage() {
  return <ListeningPractice tests={dailySets as ListeningTest[]} genre="daily" />;
}
