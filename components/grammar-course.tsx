'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { grammarLessons } from '../data/grammar-lessons';
import { speakJapanese } from '../lib/speech';
import VoiceSelect from './voice-select';
import { PASS, byId, makeQuestions, progressKey, type Question, type Sentence } from '../lib/grammar-course';

const media = (name: string) => `/kaishi/media/${encodeURIComponent(name)}`;

function play(sentence: Sentence) {
  if (sentence.audio) { window.speechSynthesis?.cancel(); new Audio(media(sentence.audio)).play().catch(() => {}); }
  else speakJapanese(sentence.ja);
}

export default function GrammarCourse() {
  const [pool, setPool] = useState<Sentence[]>([]);
  const [best, setBest] = useState<Record<number, number>>({});
  const [lesson, setLesson] = useState<number | null>(null);
  const [mode, setMode] = useState<'learn' | 'practice' | 'done'>('learn');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    try { setBest(JSON.parse(localStorage.getItem(progressKey) || '{}')); } catch {}
    // Short, single-sentence Kaishi examples with their detected grammar.
    Promise.all([fetch('/kaishi/cards.json').then(r => r.json()), fetch('/kaishi/card-grammar.json').then(r => r.json())])
      .then(([cards, found]: [{ id: string; sentence: [string][]; sentenceMeaning: string; sentenceAudio: string | null }[], { cards: Record<string, [string, string][]> }]) => {
        setPool(cards.map(c => ({ ja: c.sentence.map(s => s[0]).join(''), en: c.sentenceMeaning, audio: c.sentenceAudio, points: (found.cards[c.id] ?? []).map(([id]) => id) }))
          .filter(s => s.ja.length <= 30 && !/[\n「」]/.test(s.ja)));
      }).catch(() => {});
  }, []);

  const next = useMemo(() => grammarLessons.findIndex((_, i) => (best[i] ?? 0) < PASS), [best]);
  function open(i: number) { setLesson(i); setMode('learn'); window.scrollTo({ top: 0 }); }
  function startPractice() { if (lesson === null) return; setQuestions(makeQuestions(lesson)); setIndex(0); setPicked(null); setScore(0); setMode('practice'); }
  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === questions[index].answer) setScore(s => s + 1);
  }
  function advance() {
    if (index + 1 < questions.length) { setIndex(index + 1); setPicked(null); return; }
    const result = score / questions.length;
    if (lesson !== null && result > (best[lesson] ?? -1)) {
      const updated = { ...best, [lesson]: result };
      setBest(updated);
      try { localStorage.setItem(progressKey, JSON.stringify(updated)); } catch {}
    }
    setMode('done');
  }

  const header = <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">One grammar topic at a time.</span></header>;

  if (lesson === null) return <div className="shell">{header}<main>
    <div className="eyebrow">Grammar course · N5 · {grammarLessons.filter((_, i) => (best[i] ?? 0) >= PASS).length} of {grammarLessons.length} lessons passed</div>
    <h1>Learn grammar step by step.</h1>
    <p className="intro">Each lesson teaches one topic. Read the explanation and examples, then practice: choose between forms that look almost the same, fill gaps, say the right thing in real situations, and fix mistakes. Score 80% to pass; earlier lessons come back for review.</p>
    <ol className="gc-lessons">{grammarLessons.map((l, i) => {
      const b = best[i];
      return <li key={i}><button className={`gc-lesson${b !== undefined && b >= PASS ? ' passed' : ''}${i === next ? ' next' : ''}`} onClick={() => open(i)}>
        <span className="gc-num">{i + 1}</span>
        <span className="gc-title"><strong lang="ja">{l.title}</strong><small>{l.points.map(id => byId.get(id)?.pattern).join(' · ')}</small></span>
        <span className="gc-score">{b === undefined ? (i === next ? 'Start →' : '') : b >= PASS ? `✓ ${Math.round(b * 100)}%` : `${Math.round(b * 100)}%`}</span>
      </button></li>;
    })}</ol>
  </main></div>;

  const l = grammarLessons[lesson];
  const points = l.points.map(id => byId.get(id)!).filter(Boolean);
  const q = questions[index];

  return <div className="shell">{header}<main>
    <div className="srs-topbar">
      <button className="primary secondary" onClick={() => setLesson(null)}>← Lessons</button>
      <strong>Lesson {lesson + 1}: <span lang="ja">{l.title}</span></strong>
      <div className="reading-controls gc-tabs" role="group" aria-label="Lesson step">
        <button className="primary" aria-pressed={mode === 'learn'} onClick={() => setMode('learn')}>1. Learn</button>
        <button className="primary" aria-pressed={mode !== 'learn'} onClick={startPractice}>2. Practice</button>
      </div>
    </div>

    {mode === 'learn' && <section className="card"><div className="content">
      {points.map(point => {
        const kaishi = pool.filter(s => s.points.includes(point.id)).slice(0, 2);
        return <article key={point.id} className="gc-point">
          <h2><span lang="ja">{point.pattern}</span> <span className="grammar-used-level">{point.level}</span></h2>
          <p className="srs-meaning">{point.meaning}</p>
          <p><strong>Form:</strong> <span lang="ja">{point.formation}</span></p>
          {point.note && <p className="small">{point.note}</p>}
          <ul className="grammar-examples">
            {point.examples.map((e, i) => <li key={i}><button type="button" className="play-small" aria-label={`Play: ${e.ja}`} onClick={() => speakJapanese(e.ja)}>▶</button>
              <div><p className="grammar-ja" lang="ja">{e.ja}</p><p className="small">{e.en}</p></div></li>)}
            {kaishi.map((s, i) => <li key={`k${i}`}><button type="button" className="play-small recorded" aria-label={`Play recording: ${s.ja}`} onClick={() => play(s)}>▶</button>
              <div><p className="grammar-ja" lang="ja">{s.ja}</p><p className="small">{s.en} · from Kaishi</p></div></li>)}
          </ul>
          <Link className="small" href={`/grammar#${point.id}`}>Full entry on the Grammar page →</Link>
        </article>;
      })}
      <div className="actions"><VoiceSelect id="gc-voice" help="Voice for the green ▶ examples. Orange ▶ plays the original Kaishi recording." /></div>
      <button className="primary" onClick={startPractice}>Start practice →</button>
    </div></section>}

    {mode === 'practice' && q && <section className="card">
      <div className="card-top"><span className="small">Question {index + 1} of {questions.length}</span><span className="badge">Score {score}</span></div>
      <progress value={index} max={questions.length} aria-label="Practice progress" />
      <div className="content">
        <p className="gc-kind">{q.kind === 'pair' ? (q.direction === 'en-ja' ? 'Choose the Japanese' : 'What does it mean?') : q.kind === 'gap' ? 'Fill the gap' : q.kind === 'situation' ? 'What would you say?' : 'Fix the mistake'}</p>
        {q.kind === 'pair' && <p className="gc-prompt" lang={q.direction === 'en-ja' ? 'en' : 'ja'}>{q.prompt}
          {q.direction === 'ja-en' && <button type="button" className="play-small gc-inline-play" aria-label="Play" onClick={() => speakJapanese(q.ja)}>▶</button>}</p>}
        {q.kind === 'gap' && <><p className="gc-prompt gc-gap" lang="ja">{q.ja.split('＿＿').map((part, i) => <span key={i}>{i > 0 && <span className="gc-blank">{picked !== null ? q.options[q.answer] : '＿＿'}</span>}{part}</span>)}</p><p className="small">{q.en}</p></>}
        {q.kind === 'situation' && <p className="gc-prompt">{q.prompt}</p>}
        {q.kind === 'fix' && <><p className="mistake-sentence" lang="ja">{q.chunks.map((c, i) => <span key={i} className={`mistake-chunk${i === q.wrong ? ' found' : ''}`}>{c}</span>)}</p><p className="small">The highlighted part is wrong. Choose the correct form.</p></>}
        <div className="choices" role="group" aria-label="Answers">{q.options.map((option, i) => {
          const state = picked === null ? '' : i === q.answer ? 'correct' : i === picked ? 'incorrect' : '';
          const ja = !(q.kind === 'pair' && q.direction === 'ja-en');
          return <div className="choice" key={i}><button type="button" className={`choice-button ${state}`} disabled={picked !== null} onClick={() => choose(i)}>
            <span className="letter" aria-hidden="true">{'ABCD'[i]}</span><span lang={ja ? 'ja' : 'en'}>{option}</span>
            {state && <span className="answer-mark">{state === 'correct' ? '✓' : '✕'}</span>}
          </button></div>;
        })}</div>
        {picked !== null && (() => {
          // The correct Japanese sentence, to hear after answering.
          const said = q.kind === 'pair' ? q.ja : q.kind === 'gap' ? q.full : q.kind === 'situation' ? q.options[q.answer] : q.full;
          return <div className={`feedback${picked === q.answer ? '' : ' wrong'}`} role="status">
            <strong>{picked === q.answer ? 'Correct!' : 'Not quite.'}</strong>
            <p><span lang="ja">{said}</span><button type="button" className="play-small gc-inline-play" aria-label="Play the correct sentence" onClick={() => speakJapanese(said)}>▶</button></p>
            <p>{q.why}{q.kind === 'fix' && <><br /><span className="small">{q.en}</span></>}</p>
            <div className="reading-controls"><button className="primary" onClick={advance}>{index + 1 < questions.length ? 'Next →' : 'See result →'}</button></div>
          </div>;
        })()}
      </div>
    </section>}

    {mode === 'done' && <section className="card"><div className="results">
      <div className="eyebrow">Lesson {lesson + 1}</div>
      <h2>{score / questions.length >= PASS ? 'Lesson passed!' : 'Almost there.'}</h2>
      <div className="result-score">{score} / {questions.length}</div>
      <p className="small">{score / questions.length >= PASS ? 'Great work. Move on to the next topic, or practice again with new sentences.' : 'You need 80% to pass. Review the explanation, then try again — the questions change every time.'}</p>
      <div className="reading-controls">
        <button className="primary secondary" onClick={() => setMode('learn')}>Review lesson</button>
        <button className="primary secondary" onClick={startPractice}>Practice again ↻</button>
        {lesson + 1 < grammarLessons.length && score / questions.length >= PASS && <button className="primary" onClick={() => open(lesson + 1)}>Next lesson →</button>}
      </div>
    </div></section>}
  </main></div>;
}
