import firstTest from './kaishi-1-60.json';
import secondTest from './kaishi-1-80.json';

export type Speaker = 'A' | 'B';
export type DialogueLine = { speaker: Speaker; text: string; translation: string };
export type Question = { situation: string; lines: DialogueLine[]; question: string; choices: string[]; answer: number; explanation: string };
export type ListeningTest = { id: string; label: string; wordCount: number; questions: Question[]; words: string[][] };
export type TestEntry = ListeningTest | { id: string; label: string; wordCount: number; questions: null };

// Add each milestone as its own data file; preserve previously published tests.
export const listeningTests: TestEntry[] = [
  firstTest as ListeningTest,
  secondTest as ListeningTest,
  { id: 'kaishi-1-100', label: 'Words 1–100', wordCount: 100, questions: null },
];
