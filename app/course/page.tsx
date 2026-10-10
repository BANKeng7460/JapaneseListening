import type { Metadata } from 'next';
import Course from '../../components/course';
export const metadata: Metadata = { title: 'Course · Kiku' };
export default function CoursePage() { return <Course />; }
