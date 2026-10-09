import level10 from './kaishi-1-200.json';
import level9 from './kaishi-1-180.json';
import level8 from './kaishi-1-160.json';
import level7 from './kaishi-1-140.json';
import level6 from './kaishi-1-120.json';
import levelOne from './kaishi-1-20.json';
import levelTwo from './kaishi-1-40.json';
import firstTest from './kaishi-1-60.json';
import secondTest from './kaishi-1-80.json';
import thirdTest from './kaishi-1-100.json';

export type Speaker = 'A' | 'B';
export type DialogueLine = { speaker: Speaker; text: string; translation: string };
export type Question = { situation: string; lines: DialogueLine[]; question: string; choices: string[]; answer: number; explanation: string };
export type FocusCoverage = { wordIndex: number; questionIndex: number; lineIndex: number; form: string };
export type ListeningTest = { id: string; label: string; wordCount: number; questions: Question[]; words: string[][]; focusCoverage?: FocusCoverage[] };
export type TestEntry = ListeningTest | { id: string; label: string; wordCount: number; questions: null };

// Add each milestone as its own data file; preserve previously published tests.
export const listeningTests: TestEntry[] = [
  levelOne as ListeningTest,
  levelTwo as ListeningTest,
  { ...firstTest, label: 'Level 3 · Words 1–60' } as ListeningTest,
  { ...secondTest, label: 'Level 4 · Words 1–80' } as ListeningTest,
  { ...thirdTest, label: 'Level 5 · Words 1–100' } as ListeningTest,
  level6 as ListeningTest,
  level7 as ListeningTest,
  level8 as ListeningTest,
  level9 as ListeningTest,
  level10 as ListeningTest,
];
