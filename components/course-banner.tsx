'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { courseLevel } from '../lib/course';

// Shown on practice pages opened from the course, so the learner can return to their level.
export default function CourseBanner({ step }: { step: string }) {
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => { setLevel(courseLevel()); }, []);
  if (!level) return null;
  return <div className="course-banner" role="note">
    <span><strong>Level {level}</strong> · {step}</span>
    <Link href={`/course?level=${level}`}>← Back to your level</Link>
  </div>;
}
