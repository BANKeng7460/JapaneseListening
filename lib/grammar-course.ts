// Question builder for the grammar course (pure, so it can be tested outside React).
// Question types: minimal pairs (generated from the verb/adjective tables below), fill the gap and situations
// (hand-written in data/grammar-practice.ts), and fix-the-mistake items from data/mistakes.json.
import grammar from '../data/grammar.json';
import mistakes from '../data/mistakes.json';
import { grammarLessons } from '../data/grammar-lessons';
import { lessonPractice } from '../data/grammar-practice';

export type Point = (typeof grammar)[number];
export type Sentence = { ja: string; en: string; audio: string | null; points: string[] };
export type Question =
  | { kind: 'pair'; direction: 'en-ja' | 'ja-en'; prompt: string; options: string[]; answer: number; ja: string; why: string }
  | { kind: 'gap'; ja: string; en: string; options: string[]; answer: number; full: string; why: string }
  | { kind: 'situation'; prompt: string; options: string[]; answer: number; why: string }
  | { kind: 'fix'; chunks: string[]; wrong: number; options: string[]; answer: number; en: string; why: string; full: string };
type MistakeItem = { chunks: string[]; wrong: number | null; fix?: string; options?: string[]; grammar?: string | null; why?: string; en: string };

export const byId = new Map(grammar.map(p => [p.id, p]));
export const progressKey = 'kiku-grammar-course';
export const PASS = 0.8, QUESTIONS = 10;
const shuffle = <T,>(items: T[]) => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const allMistakes = Object.values(mistakes as unknown as Record<string, MistakeItem[]>).flat().filter(i => i.wrong !== null);

// Verbs with their forms written out (no conjugation guessing), English forms, and objects that read naturally.
type Verb = { stem: string; dict: string; te: string; ta: string; nai: string; en: [string, string, string, string]; objects: [string, string, boolean][]; invite?: boolean; offer?: boolean; experience?: boolean };
const verbs: Verb[] = [
  { dict: '食べる', stem: '食べ', te: '食べて', ta: '食べた', nai: '食べない', en: ['eat', 'ate', 'eating', 'eaten'], objects: [['すし', 'sushi', true], ['ケーキ', 'cake', true]], invite: true, experience: true },
  { dict: '飲む', stem: '飲み', te: '飲んで', ta: '飲んだ', nai: '飲まない', en: ['drink', 'drank', 'drinking', 'drunk'], objects: [['コーヒー', 'coffee', true], ['お茶', 'tea', true]], invite: true, experience: true },
  { dict: '読む', stem: '読み', te: '読んで', ta: '読んだ', nai: '読まない', en: ['read', 'read', 'reading', 'read'], objects: [['この本', 'this book', false], ['新聞', 'the newspaper', true]], experience: true },
  { dict: '書く', stem: '書き', te: '書いて', ta: '書いた', nai: '書かない', en: ['write', 'wrote', 'writing', 'written'], objects: [['手紙', 'a letter', true], ['レポート', 'the report', false]], offer: true },
  { dict: '買う', stem: '買い', te: '買って', ta: '買った', nai: '買わない', en: ['buy', 'bought', 'buying', 'bought'], objects: [['傘', 'an umbrella', true], ['切符', 'the tickets', true]], offer: true },
  { dict: '見る', stem: '見', te: '見て', ta: '見た', nai: '見ない', en: ['watch', 'watched', 'watching', 'watched'], objects: [['この映画', 'this movie', false], ['テレビ', 'TV', false]], invite: true, experience: true },
  { dict: '聞く', stem: '聞き', te: '聞いて', ta: '聞いた', nai: '聞かない', en: ['listen to', 'listened to', 'listening to', 'listened to'], objects: [['音楽', 'music', false], ['ラジオ', 'the radio', false]], invite: true },
  { dict: '作る', stem: '作り', te: '作って', ta: '作った', nai: '作らない', en: ['make', 'made', 'making', 'made'], objects: [['カレー', 'curry', true], ['晩ご飯', 'dinner', false]], invite: true, offer: true, experience: true },
  { dict: '使う', stem: '使い', te: '使って', ta: '使った', nai: '使わない', en: ['use', 'used', 'using', 'used'], objects: [['このパソコン', 'this computer', false], ['この部屋', 'this room', false]] },
  { dict: '開ける', stem: '開け', te: '開けて', ta: '開けた', nai: '開けない', en: ['open', 'opened', 'opening', 'opened'], objects: [['窓', 'the window', false], ['ドア', 'the door', false]], offer: true },
  { dict: '待つ', stem: '待ち', te: '待って', ta: '待った', nai: '待たない', en: ['wait for', 'waited for', 'waiting for', 'waited for'], objects: [['バス', 'the bus', false], ['友達', 'my friend', false]] },
  { dict: '話す', stem: '話し', te: '話して', ta: '話した', nai: '話さない', en: ['speak', 'spoke', 'speaking', 'spoken'], objects: [['日本語', 'Japanese', false], ['英語', 'English', false]] },
];

// One template per form: Japanese and English built from the same verb and object, so only the grammar differs.
type Template = { label: string; ok?: (v: Verb, thing: boolean) => boolean; ja: (v: Verb, o: string) => string; en: (v: Verb, o: string) => string };
const t: Record<string, Template> = {
  past: { label: 'polite past (ました)', ja: (v, o) => `${o}を${v.stem}ました。`, en: (v, o) => `I ${v.en[1]} ${o}.` },
  tai: { label: 'want to (たい)', ja: (v, o) => `${o}を${v.stem}たいです。`, en: (v, o) => `I want to ${v.en[0]} ${o}.` },
  hoshii: { label: 'want a thing (がほしい)', ok: (_, thing) => thing, ja: (_, o) => `${o}がほしいです。`, en: (_, o) => `I want ${o}.` },
  teiru: { label: 'doing now (ている)', ja: (v, o) => `今、${o}を${v.te}います。`, en: (v, o) => `I’m ${v.en[2]} ${o} now.` },
  tekudasai: { label: 'please do (てください)', ja: (v, o) => `${o}を${v.te}ください。`, en: (v, o) => `Please ${v.en[0]} ${o}.` },
  temoii: { label: 'may I (てもいいですか)', ja: (v, o) => `${o}を${v.te}もいいですか。`, en: (v, o) => `May I ${v.en[0]} ${o}?` },
  tewaikenai: { label: 'must not (てはいけません)', ja: (v, o) => `${o}を${v.te}はいけません。`, en: (v, o) => `You must not ${v.en[0]} ${o}.` },
  naidekudasai: { label: 'please don’t (ないでください)', ja: (v, o) => `${o}を${v.nai}でください。`, en: (v, o) => `Please don’t ${v.en[0]} ${o}.` },
  nakutemoii: { label: 'don’t have to (なくてもいい)', ja: (v, o) => `${o}を${v.nai.slice(0, -1)}くてもいいです。`, en: (v, o) => `You don’t have to ${v.en[0]} ${o}.` },
  mashou: { label: 'let’s (ましょう)', ok: v => !!v.invite, ja: (v, o) => `一緒に${o}を${v.stem}ましょう。`, en: (v, o) => `Let’s ${v.en[0]} ${o} together.` },
  masenka: { label: 'invitation (ませんか)', ok: v => !!v.invite, ja: (v, o) => `一緒に${o}を${v.stem}ませんか。`, en: (v, o) => `Would you like to ${v.en[0]} ${o} together?` },
  mashouka: { label: 'offer (ましょうか)', ok: v => !!v.offer, ja: (v, o) => `${o}を${v.stem}ましょうか。`, en: (v, o) => `Shall I ${v.en[0]} ${o} for you?` },
  mou: { label: 'already (もう + past)', ja: (v, o) => `もう${o}を${v.stem}ました。`, en: (v, o) => `I already ${v.en[1]} ${o}.` },
  madate: { label: 'not yet (まだ…ていません)', ja: (v, o) => `まだ${o}を${v.te}いません。`, en: (v, o) => `I haven’t ${v.en[3]} ${o} yet.` },
  madateiru: { label: 'still doing (まだ…ています)', ja: (v, o) => `まだ${o}を${v.te}います。`, en: (v, o) => `I’m still ${v.en[2]} ${o}.` },
  takotogaaru: { label: 'have done before (たことがある)', ok: v => !!v.experience, ja: (v, o) => `${o}を${v.ta}ことがあります。`, en: (v, o) => `I have ${v.en[3]} ${o} before.` },
  tsumori: { label: 'plan to (つもり)', ja: (v, o) => `${o}を${v.dict}つもりです。`, en: (v, o) => `I’m planning to ${v.en[0]} ${o}.` },
  hougaii: { label: 'should (たほうがいい)', ja: (v, o) => `${o}を${v.ta}ほうがいいですよ。`, en: (v, o) => `You should ${v.en[0]} ${o}.` },
};

// Adjectives: present / negative / past / past negative, with a subject that works in every tense.
type Adjective = { word: string; en: string; subject: [string, string] };
const iAdjectives: Adjective[] = [
  { word: '難しい', en: 'difficult', subject: ['テストは', 'The test'] }, { word: '面白い', en: 'interesting', subject: ['この本は', 'This book'] },
  { word: '楽しい', en: 'fun', subject: ['パーティーは', 'The party'] }, { word: 'おいしい', en: 'delicious', subject: ['この店のラーメンは', 'This shop’s ramen'] },
  { word: '高い', en: 'expensive', subject: ['このかばんは', 'This bag'] }, { word: '寒い', en: 'cold', subject: ['この部屋は', 'This room'] },
];
const naAdjectives: Adjective[] = [
  { word: '静か', en: 'quiet', subject: ['この部屋は', 'This room'] }, { word: '有名', en: 'famous', subject: ['この店は', 'This shop'] },
  { word: '便利', en: 'convenient', subject: ['この駅は', 'This station'] }, { word: '簡単', en: 'easy', subject: ['テストは', 'The test'] },
  { word: 'きれい', en: 'clean', subject: ['この部屋は', 'This room'] }, { word: '元気', en: 'well', subject: ['母は', 'My mother'] },
];
function adjectiveForms(a: Adjective, kind: 'i-adj' | 'na-adj'): Record<string, [string, string, string]> {
  const [s, S] = a.subject, stem = a.word.slice(0, -1);
  return kind === 'i-adj' ? {
    'adj-pres': [`${s}${a.word}です。`, `${S} is ${a.en}.`, 'present: 〜いです'],
    'adj-neg': [`${s}${stem}くないです。`, `${S} isn’t ${a.en}.`, 'negative: い → くないです'],
    'adj-past': [`${s}${stem}かったです。`, `${S} was ${a.en}.`, 'past: い → かったです'],
    'adj-pastneg': [`${s}${stem}くなかったです。`, `${S} wasn’t ${a.en}.`, 'past negative: い → くなかったです'],
  } : {
    'adj-pres': [`${s}${a.word}です。`, `${S} is ${a.en}.`, 'present: 〜です'],
    'adj-neg': [`${s}${a.word}じゃないです。`, `${S} isn’t ${a.en}.`, 'negative: 〜じゃないです'],
    'adj-past': [`${s}${a.word}でした。`, `${S} was ${a.en}.`, 'past: 〜でした'],
    'adj-pastneg': [`${s}${a.word}じゃなかったです。`, `${S} wasn’t ${a.en}.`, 'past negative: 〜じゃなかったです'],
  };
}

/** A minimal pair: four sentences that differ only in the lesson's grammar. */
function pairQuestion(lesson: number): Question | null {
  const forms = lessonPractice[lesson]?.forms;
  if (!forms) return null;
  const direction = Math.random() < 0.5 ? 'en-ja' : 'ja-en';
  let variants: [string, string, string][];
  let correct: [string, string, string];
  if (forms.kind) {
    const all = adjectiveForms(pick(forms.kind === 'i-adj' ? iAdjectives : naAdjectives), forms.kind);
    const target = pick(forms.targets);
    correct = all[target];
    variants = shuffle([correct, ...shuffle(Object.keys(all).filter(k => k !== target)).slice(0, 3).map(k => all[k])]);
  } else {
    const target = pick(forms.targets);
    const fits = (k: string, v: Verb, thing: boolean) => !t[k].ok || t[k].ok!(v, thing);
    const v = pick(verbs.filter(v => v.objects.some(([, , thing]) => fits(target, v, thing))));
    const [ja, en, thing] = pick(v.objects.filter(([, , thing]) => fits(target, v, thing)));
    const make = (k: string): [string, string, string] => [t[k].ja(v, ja), t[k].en(v, en), t[k].label];
    correct = make(target);
    variants = shuffle([correct, ...shuffle([...forms.targets, ...forms.extras].filter(k => k !== target && fits(k, v, thing))).slice(0, 3).map(make)]);
  }
  const answer = variants.indexOf(correct);
  return direction === 'en-ja'
    ? { kind: 'pair', direction, prompt: correct[1], options: variants.map(x => x[0]), answer, ja: correct[0], why: `The ${correct[2]} form matches “${correct[1]}”.` }
    : { kind: 'pair', direction, prompt: correct[0], options: variants.map(x => x[1]), answer, ja: correct[0], why: `${correct[0]} uses the ${correct[2]} form.` };
}

function practiceFor(lesson: number, count: { situations: number; gaps: number; fixes: number }): Question[] {
  const p = lessonPractice[lesson];
  const situations = shuffle(p.situations).slice(0, count.situations).map((x): Question => {
    const options = shuffle(x.options);
    return { kind: 'situation', prompt: x.prompt, options, answer: options.indexOf(x.answer), why: x.why };
  });
  const gaps = shuffle(p.gaps).slice(0, count.gaps).map((x): Question => {
    const options = shuffle(x.options);
    return { kind: 'gap', ja: x.ja, en: x.en, options, answer: options.indexOf(x.answer), full: x.ja.replace('＿＿', x.answer), why: x.why };
  });
  const fixes = shuffle(allMistakes.filter(m => grammarLessons[lesson].points.includes(m.grammar ?? ''))).slice(0, count.fixes).map((m): Question => {
    const options = shuffle(m.options!);
    return { kind: 'fix', chunks: m.chunks, wrong: m.wrong!, options, answer: options.indexOf(m.fix!), en: m.en, why: m.why!, full: m.chunks.map((c, i) => i === m.wrong ? m.fix! : c).join('') };
  });
  return [...situations, ...gaps, ...fixes];
}

/** Ten questions: the lesson's situations, gaps and fixes, minimal pairs to fill up, and two review questions. */
export function makeQuestions(lesson: number): Question[] {
  const review = lesson > 0 ? shuffle(Array.from({ length: lesson }, (_, i) => i)).slice(0, 2).flatMap(i => {
    const q = Math.random() < 0.5 ? pairQuestion(i) : null;
    return q ? [q] : shuffle(practiceFor(i, { situations: 1, gaps: 1, fixes: 0 })).slice(0, 1);
  }) : [];
  const main = practiceFor(lesson, { situations: 3, gaps: 3, fixes: 2 });
  const want = QUESTIONS - review.length;
  const seen = new Set(main.map(q => (q.kind === 'pair' ? q.ja : q.kind === 'gap' ? q.ja : q.kind === 'situation' ? q.prompt : q.full)));
  for (let tries = 0; main.length < want && tries < 60; tries++) {
    const q = pairQuestion(lesson);
    if (q && q.kind === 'pair' && !seen.has(q.ja)) { seen.add(q.ja); main.push(q); }
  }
  // Lessons without generated pairs top up with more of their hand-written items.
  if (main.length < want) {
    for (const q of shuffle(practiceFor(lesson, { situations: 9, gaps: 9, fixes: 4 }))) {
      const key = q.kind === 'gap' ? q.ja : q.kind === 'situation' ? q.prompt : q.kind === 'fix' ? q.full : q.ja;
      if (main.length < want && !seen.has(key)) { seen.add(key); main.push(q); }
    }
  }
  return shuffle([...main, ...review]).slice(0, QUESTIONS);
}
