'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import grammar from '../data/grammar.json';
import usage from '../data/grammar-usage.json';
import mistakes from '../data/mistakes.json';
import soloSets from '../data/solo-stories.json';
import { listeningTests, type ListeningTest } from '../data/tests';
import { loadCourse, markCourse, type CourseProgress } from '../lib/course';

type Segment = [string, string?, 1?];
type Card = { id: string; pos: number; word: string; reading: string; meaning: string; wordFurigana: Segment[]; wordAudio: string | null;
  sentence: Segment[]; sentenceMeaning: string; sentenceAudio: string | null; notes: string; picture: string | null };
type StepId = 'words' | 'listening' | 'reading' | 'story' | 'grammar' | 'mistakes';

const levels = listeningTests.filter((t): t is ListeningTest => t.questions !== null);
const grammarById = new Map(grammar.map(p => [p.id, p]));
const found = usage as unknown as { basic: string[]; reading: Record<string, [string, string][][]>; listening: Record<string, [string, string][][]> };
const media = (name: string) => `/kaishi/media/${encodeURIComponent(name)}`;
const read = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } };

// Each level's solo story lives in a set of five levels: level 12 → set 11–15, question 2.
const storyFor = (level: number) => {
  const first = Math.floor((level - 1) / 5) * 5 + 1, id = `solo-kaishi-${first}-${first + 4}`;
  const set = soloSets.find(s => s.id === id);
  return set && set.questions[level - first] ? { setId: id, q: level - first } : null;
};

// Grammar used across a level's conversations and reading passages (basics left out), first example kept.
function grammarFor(id: string) {
  const items = [...(found.listening[id] ?? []), ...(found.reading[id] ?? [])].flat();
  const seen = new Map<string, string>();
  for (const [g, snippet] of items) if (!found.basic.includes(g) && !seen.has(g)) seen.set(g, snippet);
  return grammar.filter(p => seen.has(p.id)).map(p => ({ point: p, snippet: seen.get(p.id)! }));
}

function Ruby({ segments }: { segments: Segment[] }) {
  return <>{segments.map(([text, reading, bold], i) => {
    const inner = reading ? <ruby>{text}<rt>{reading}</rt></ruby> : text;
    return bold ? <b key={i}>{inner}</b> : <span key={i}>{inner}</span>;
  })}</>;
}

export default function Course() {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [course, setCourse] = useState<CourseProgress>({ words: {}, reading: {}, grammar: {} });
  const [stored, setStored] = useState<{ listening: Record<string, number>; story: Record<string, Record<string, number>>; best: Record<string, number>; srs: Record<string, { phase: string }> }>({ listening: {}, story: {}, best: {}, srs: {} });
  const [open, setOpen] = useState<'words' | 'grammar' | null>(null);
  const [card, setCard] = useState(0);

  // Progress comes from each practice page's own storage; re-read when returning to this tab.
  const refresh = useCallback(() => {
    setCourse(loadCourse());
    const listening: Record<string, number> = {}, story: Record<string, Record<string, number>> = {};
    for (const t of levels) listening[t.id] = Object.keys(read<Record<string, number>>(`kiku-progress-kaishi-${t.id}`, {})).length;
    for (const s of soloSets) story[s.id] = read<Record<string, number>>(`kiku-progress-solo-${s.id}`, {});
    // New-word progress comes from the Flashcards page (Kaishi deck, including imported Anki progress).
    const srs = read<{ cards: Record<string, { phase: string }> }>('kiku-srs-v1', { cards: {} }).cards ?? {};
    setStored({ listening, story, best: read<Record<string, number>>('kiku-mistakes-best', {}), srs });
  }, []);
  useEffect(() => {
    refresh();
    const n = Number(new URLSearchParams(location.search).get('level'));
    fetch('/kaishi/cards.json').then(r => r.ok ? r.json() : null).then((list: Card[] | null) => list && setCards([...list].sort((a, b) => a.pos - b.pos)));
    window.addEventListener('focus', refresh);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    if (n >= 1 && n <= levels.length) setLevel(n);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  // A word counts as learned once it has left the "new" state in Flashcards.
  const learned = useCallback((card: Card) => (stored.srs[`kaishi:${card.id}`]?.phase ?? 'new') !== 'new', [stored.srs]);
  const status = useCallback((n: number): Record<StepId, boolean> => {
    const t = levels[n - 1], story = storyFor(n);
    const levelWords = cards?.slice(t.wordCount - 20, t.wordCount) ?? [];
    return {
      words: levelWords.length > 0 && levelWords.every(learned),
      listening: (stored.listening[t.id] ?? 0) >= t.questions.length,
      reading: course.reading[t.id] !== undefined,
      story: !story || stored.story[story.setId]?.[story.q] !== undefined,
      grammar: !!course.grammar[t.id],
      mistakes: !(mistakes as Record<string, unknown[]>)[t.id] || stored.best[t.id] !== undefined,
    };
  }, [course, stored, cards, learned]);
  const doneCount = (n: number) => Object.values(status(n)).filter(Boolean).length;
  const levelsDone = levels.filter((_, i) => doneCount(i + 1) === 6).length;
  const nextLevel = (levels.findIndex((_, i) => doneCount(i + 1) < 6) + 1) || levels.length;

  const test = levels[level - 1];
  const first = test.wordCount - 19;
  const words = useMemo(() => cards?.slice(first - 1, test.wordCount) ?? [], [cards, first, test.wordCount]);
  const grammarUsed = useMemo(() => grammarFor(test.id), [test.id]);
  const story = storyFor(level);
  const learnedCount = words.filter(learned).length;
  const s = status(level);
  const back = `course=${level}`;

  function choose(n: number) {
    setLevel(n); setOpen(null); setCard(0);
    history.replaceState(null, '', `/course?level=${n}`);
  }
  function play(files: (string | null)[]) {
    const queue = files.filter((f): f is string => !!f);
    const next = () => { const f = queue.shift(); if (!f) return; const a = new Audio(media(f)); a.onended = next; a.play().catch(() => {}); };
    next();
  }
  function showCard(i: number) { setCard(i); const c = words[i]; if (c) play([c.wordAudio, c.sentenceAudio]); }
  function finishGrammar() { markCourse('grammar', test.id); setOpen(null); refresh(); }

  const steps: { id: StepId; title: string; about: string; action: React.ReactNode }[] = [
    { id: 'words', title: 'Learn the new words', about: `Words ${first}–${test.wordCount} in Flashcards: ${learnedCount} / ${words.length || 20} learned. Words you studied in Anki count once you import your progress.`,
      action: <div className="course-actions">
        <Link className="primary course-link" href={`/flashcards?from=${first}&to=${test.wordCount}&${back}`}>{s.words ? 'Review in Flashcards' : 'Learn in Flashcards'}</Link>
        <button className="primary secondary" onClick={() => { setOpen(open === 'words' ? null : 'words'); if (open !== 'words') showCard(0); }} disabled={!cards}>{open === 'words' ? 'Close' : 'Preview'}</button>
      </div> },
    { id: 'listening', title: 'Listen to the conversations', about: `${test.questions.length} short conversations that use every new word.`,
      action: <Link className="primary course-link" href={`/?test=${test.id}&${back}`}>{s.listening ? 'Review' : 'Start'}</Link> },
    { id: 'reading', title: 'Read two short passages', about: 'Tap any word for its reading. Answer a question about each passage.',
      action: <Link className="primary course-link" href={`/reading?level=${test.id}&${back}`}>{s.reading ? 'Review' : 'Start'}</Link> },
    { id: 'story', title: 'Listen to a story', about: 'One narrator tells a short story with this level’s words.',
      action: story ? <Link className="primary course-link" href={`/solo-stories?test=${story.setId}&q=${story.q}&${back}`}>{s.story ? 'Review' : 'Start'}</Link> : <span className="small">No story yet</span> },
    { id: 'grammar', title: 'Check the grammar', about: `${grammarUsed.length} grammar points appear in this level’s texts.`,
      action: <button className="primary" onClick={() => setOpen(open === 'grammar' ? null : 'grammar')}>{open === 'grammar' ? 'Close' : s.grammar ? 'Review' : 'Start'}</button> },
    { id: 'mistakes', title: 'Spot the mistake', about: 'A final check: find and fix grammar mistakes in this level’s sentences.',
      action: <Link className="primary course-link" href={`/mistakes?level=${test.id}&${back}`}>{s.mistakes ? 'Play again' : 'Start'}</Link> },
  ];
  const c = words[card];

  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">One level at a time.</span></header>
    <main>
      <div className="eyebrow">Kaishi course · {levelsDone} of {levels.length} levels complete</div>
      <h1>Learn the words, then use them.</h1>
      <p className="intro">Each level brings 20 new Kaishi words. Study them, hear them in conversations, read them, follow a story, check the grammar, and finish by spotting mistakes.</p>
      <nav className="course-levels" aria-label="Levels">
        {levels.map((t, i) => {
          const n = i + 1, done = doneCount(n);
          return <button key={t.id} className={`course-level${n === level ? ' current' : ''}${done === 6 ? ' complete' : ''}${n === nextLevel ? ' next' : ''}`} aria-pressed={n === level} onClick={() => choose(n)}
            title={`${t.label} · ${done}/6 steps`}><span>{n}</span><small>{done === 6 ? '✓' : `${done}/6`}</small></button>;
        })}
      </nav>
      <section className="card course-panel" aria-label={`Level ${level}`}>
        <div className="card-top"><span className="small">{test.label}</span><span className="badge">{doneCount(level)} / 6 steps</span></div>
        <progress value={doneCount(level)} max={6} aria-label="Steps complete" />
        <ol className="course-steps">{steps.map((step, i) => <li key={step.id} className={s[step.id] ? 'done' : ''}>
          <span className="course-mark" aria-hidden="true">{s[step.id] ? '✓' : i + 1}</span>
          <div className="course-step-text"><strong>{step.title}</strong><p className="small">{step.about}</p></div>
          <div className="course-step-action">{step.action}</div>

          {step.id === 'words' && words.length > 0 && <ul className="course-chips" aria-label="Word progress">{words.map((w, i) => {
            const phase = stored.srs[`kaishi:${w.id}`]?.phase ?? 'new';
            return <li key={w.id}><button type="button" className={`course-chip ${phase}`} title={`${w.reading} — ${w.meaning} · ${phase}`} onClick={() => { setOpen('words'); showCard(i); }} lang="ja">{w.word}</button></li>;
          })}<li className="course-legend">grey: new · amber: learning · green: in review</li></ul>}
          {step.id === 'words' && open === 'words' && c && <div className="course-word">
            <p className="small">Word {card + 1} of {words.length} · Kaishi entry {first + card}</p>
            <div className="srs-word" lang="ja"><Ruby segments={c.wordFurigana} /></div>
            <p className="srs-meaning">{c.meaning}</p>
            {c.picture && <img className="srs-picture" src={media(c.picture)} alt="" />}
            <p className="srs-sentence" lang="ja"><Ruby segments={c.sentence} /></p>
            <p className="small">{c.sentenceMeaning}</p>
            {c.notes && <p className="small srs-notes">{c.notes}</p>}
            <div className="reading-controls">
              <button className="primary secondary" onClick={() => play([c.wordAudio])} disabled={!c.wordAudio}>▶ Word</button>
              <button className="primary secondary" onClick={() => play([c.sentenceAudio])} disabled={!c.sentenceAudio}>▶ Sentence</button>
            </div>
            <div className="actions">
              <button className="primary secondary" disabled={card === 0} onClick={() => showCard(card - 1)}>← Previous</button>
              {card < words.length - 1 ? <button className="primary" onClick={() => showCard(card + 1)}>Next word →</button>
                : <button className="primary" onClick={() => setOpen(null)}>Done</button>}
            </div>
          </div>}

          {step.id === 'grammar' && open === 'grammar' && <div className="course-grammar">
            {grammarUsed.length ? <ul>{grammarUsed.map(({ point, snippet }) => <li key={point.id}>
              <Link href={`/grammar#${point.id}`} lang="ja" className="grammar-used-pattern">{point.pattern}</Link>
              <span className="grammar-used-level">{point.level}</span>
              <span className="small">{point.meaning}</span>
              <span className="grammar-used-snippet" lang="ja">「{snippet}」</span>
            </li>)}</ul> : <p className="small">Only basic particles in this level.</p>}
            <button className="primary" onClick={finishGrammar}>I’ve checked these ✓</button>
          </div>}
        </li>)}</ol>
        <div className="content course-footer">
          <p className="small">These words are cards {first}–{test.wordCount} in your Kaishi deck. Keep them fresh in <Link href="/flashcards">Flashcards</Link>.</p>
          {doneCount(level) === 6 && level < levels.length && <button className="primary" onClick={() => choose(level + 1)}>Go to Level {level + 1} →</button>}
        </div>
      </section>
    </main>
  </div>;
}
