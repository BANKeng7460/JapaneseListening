// Question builder for the grammar course (pure, so it can be tested outside React).
import grammar from '../data/grammar.json';
import mistakes from '../data/mistakes.json';
import { grammarLessons } from '../data/grammar-lessons';

export type Point = (typeof grammar)[number];
export type Sentence = { ja: string; en: string; audio: string | null; points: string[] };
export type Question =
  | { kind: 'which'; point: Point; options: Sentence[]; answer: number }
  | { kind: 'meaning'; point: Point; options: string[]; answer: number }
  | { kind: 'fix'; point: Point; chunks: string[]; wrong: number; options: string[]; answer: number; en: string; why: string };
export type MistakeItem = { chunks: string[]; wrong: number | null; fix?: string; mistake?: string; options?: string[]; grammar?: string | null; why?: string; en: string };

export const byId = new Map(grammar.map(p => [p.id, p]));
const n5 = grammar.filter(p => p.level === 'N5');
export const progressKey = 'kiku-grammar-course';
export const PASS = 0.8, QUESTIONS = 10;
const shuffle = <T,>(items: T[]) => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const keyWords = (meaning: string) => new Set(meaning.toLowerCase().match(/[a-z’]{4,}/g) || []);
const allMistakes = Object.values(mistakes as unknown as Record<string, MistakeItem[]>).flat().filter(i => i.wrong !== null);

// Questions for one lesson, plus a couple of review questions from earlier lessons.
export function makeQuestions(lessonIndex: number, pool: Sentence[]): Question[] {
  const pointsHere = grammarLessons[lessonIndex].points.map(id => byId.get(id)!).filter(Boolean);
  const earlier = grammarLessons.slice(0, lessonIndex).flatMap(l => l.points).map(id => byId.get(id)!).filter(Boolean);
  const meaning = (point: Point): Question => {
    const words = keyWords(point.meaning);
    const others = shuffle(n5.filter(p => p.id !== point.id && ![...keyWords(p.meaning)].some(w => words.has(w)))).slice(0, 3).map(p => p.meaning);
    const options = shuffle([point.meaning, ...others]);
    return { kind: 'meaning', point, options, answer: options.indexOf(point.meaning) };
  };
  const which = (point: Point): Question | null => {
    // Example sentences from the grammar entry always contain the pattern; Kaishi sentences add variety.
    const yes = shuffle([...point.examples.map(e => ({ ja: e.ja, en: e.en, audio: null, points: [point.id] })), ...pool.filter(s => s.points.includes(point.id))]);
    // Wrong options must not contain the pattern's characters at all, so detection misses can't create two right answers.
    const surfaces = point.pattern.split(/[/・（(～〜s]/).map(p => p.replace(/[^ぁ-んァ-ヶ一-龯]/g, '')).filter(Boolean);
    const no = shuffle(pool.filter(s => !s.points.includes(point.id) && !surfaces.some(x => s.ja.includes(x))));
    if (!yes.length || no.length < 3) return null;
    const options = shuffle([yes[0], ...no.slice(0, 3)]);
    return { kind: 'which', point, options, answer: options.indexOf(yes[0]) };
  };
  const fixes = shuffle(allMistakes.filter(m => grammarLessons[lessonIndex].points.includes(m.grammar ?? ''))).slice(0, 3)
    .map((m): Question => {
      const options = shuffle(m.options!);
      return { kind: 'fix', point: byId.get(m.grammar!)!, chunks: m.chunks, wrong: m.wrong!, options, answer: options.indexOf(m.fix!), en: m.en, why: m.why! };
    });
  const main: Question[] = [...pointsHere.map(meaning), ...fixes];
  for (let i = 0; main.length < QUESTIONS - (earlier.length ? 2 : 0) && i < 40; i++) {
    const q = which(pointsHere[i % pointsHere.length]);
    if (q) main.push(q);
  }
  const review = shuffle(earlier).slice(0, 2).map(p => (Math.random() < 0.5 ? which(p) : null) ?? meaning(p));
  return shuffle([...main, ...review]).slice(0, QUESTIONS);
}

