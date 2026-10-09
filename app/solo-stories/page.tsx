import type { Metadata } from 'next';
import ListeningPractice from '../../components/listening-practice';
import soloSets from '../../data/solo-stories.json';
import type { ListeningTest } from '../../data/tests';
export const metadata: Metadata = { title: 'Solo stories · Kiku' };
export default function SoloStoriesPage() { return <ListeningPractice genre="solo" tests={soloSets as ListeningTest[]} />; }
