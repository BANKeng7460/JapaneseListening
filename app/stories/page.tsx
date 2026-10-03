import type { Metadata } from 'next';
import StoryPractice from '../../components/story-practice';

export const metadata: Metadata = { title: 'Real-life stories · Kiku' };

export default function StoriesPage() {
  return <StoryPractice />;
}
