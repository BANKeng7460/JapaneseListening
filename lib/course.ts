// Course progress for the steps that have no progress of their own (new words, reading, grammar).
// Listening, story and mistake steps are read from those pages' own saved progress.
export type CoursePart = 'words' | 'reading' | 'grammar';
export type CourseProgress = Record<CoursePart, Record<string, number>>;
const key = 'kiku-course';

export function loadCourse(): CourseProgress {
  const empty: CourseProgress = { words: {}, reading: {}, grammar: {} };
  try { return { ...empty, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return empty; }
}

export function markCourse(part: CoursePart, levelId: string, value = 1) {
  const progress = loadCourse();
  progress[part][levelId] = value;
  try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
}

/** The course level a practice page was opened from (?course=12), or null. */
export function courseLevel() {
  const n = Number(new URLSearchParams(window.location.search).get('course'));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** A query parameter set by the course page, e.g. ?test=kaishi-1-240. */
export const courseParam = (name: string) => new URLSearchParams(window.location.search).get(name);
