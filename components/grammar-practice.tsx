'use client';

import { useEffect, useMemo, useState } from 'react';
import grammar from '../data/grammar.json';
import kaishiExamples from '../data/grammar-kaishi.json';

type Level = 'N5' | 'N4';
type Point = (typeof grammar)[number];
const levels: Level[] = ['N5', 'N4'];
const learnedKey = 'kiku-grammar-learned';
const levelKey = 'kiku-grammar-level';
// Kaishi 1.5k sentences matched to each grammar point; audio lives in public/kaishi-audio.
const kaishi: Record<string, { ja: string; en: string; audio: string; word: string }[]> = kaishiExamples;

let recording: HTMLAudioElement | null = null;
function playRecording(file: string) {
  window.speechSynthesis?.cancel();
  recording?.pause();
  recording = new Audio(`/kaishi-audio/${encodeURIComponent(file)}`);
  recording.play().catch(() => {});
}

// Same key format as the listening pages, so a voice saved there is recognized here.
const voiceId = (voice: SpeechSynthesisVoice) => JSON.stringify([voice.voiceURI, voice.name, voice.lang]);
const grammarVoiceKey = 'kiku-grammar-voice';
let browserVoice: SpeechSynthesisVoice | null = null;

// Reads an example aloud with the voice picked in the grammar page's selector.
function speak(text: string) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  recording?.pause();
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.voice = browserVoice;
  synth.speak(utterance);
}

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
};
// Distractors must not share a key word with the answer, so two "must" patterns never compete.
const keyWords = (meaning: string) => new Set(meaning.toLowerCase().match(/[a-z’]{4,}/g) || []);

function Examples({ point, english }: { point: Point; english: boolean }) {
  const recorded = kaishi[point.id];
  return <>
    <ul className="grammar-examples">{point.examples.map((example, i) => <li key={i}>
      <button type="button" className="play-small" aria-label={`Play example: ${example.ja}`} onClick={() => speak(example.ja)}>▶</button>
      <div><p className="grammar-ja" lang="ja">{example.ja}</p>{english && <p className="small">{example.en}</p>}</div>
    </li>)}</ul>
    {recorded && <>
      <p className="grammar-source-label">From your Kaishi 1.5k deck · recorded voice</p>
      <ul className="grammar-examples">{recorded.map((example, i) => <li key={i}>
        <button type="button" className="play-small recorded" aria-label={`Play recording: ${example.ja}`} onClick={() => playRecording(example.audio)}>▶</button>
        <div><p className="grammar-ja" lang="ja">{example.ja}</p>{english && <p className="small">{example.en} · Kaishi word: <span lang="ja">{example.word}</span></p>}</div>
      </li>)}</ul>
    </>}
  </>;
}

export default function GrammarPractice() {
  const [level, setLevel] = useState<Level>('N5');
  const [mode, setMode] = useState<'browse' | 'quiz'>('browse');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'todo' | 'learned'>('all');
  const [english, setEnglish] = useState(true);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<{ id: string; choices: string[]; picked: string | null } | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState('');

  useEffect(() => {
    try {
      setLearned(new Set(JSON.parse(localStorage.getItem(learnedKey) || '[]')));
      const saved = localStorage.getItem(levelKey);
      if (saved === 'N5' || saved === 'N4') setLevel(saved);
    } catch {}
  }, []);

  // Japanese browser voices, Microsoft natural voices first; falls back to the listening pages' saved voice.
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    let saved = '';
    try { saved = localStorage.getItem(grammarVoiceKey) || localStorage.getItem('kiku-voice-A') || localStorage.getItem('kiku-narrator-voice') || ''; } catch {}
    const rank = (v: SpeechSynthesisVoice) => /Microsoft/i.test(v.name) ? (/Natural|Neural/i.test(v.name) ? 3 : 2) : v.default ? 1 : 0;
    const load = () => {
      const available = synth.getVoices().filter(v => /^ja(?:[-_]|$)/i.test(v.lang)).sort((a, b) => rank(b) - rank(a));
      setVoices(available);
      setVoice(current => available.some(v => voiceId(v) === current) ? current : available.find(v => voiceId(v) === saved) ? saved : available[0] ? voiceId(available[0]) : '');
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);
  useEffect(() => { browserVoice = voices.find(v => voiceId(v) === voice) ?? null; }, [voices, voice]);

  function chooseVoice(key: string) {
    setVoice(key);
    browserVoice = voices.find(v => voiceId(v) === key) ?? null;
    try { localStorage.setItem(grammarVoiceKey, key); } catch {}
    speak('こんにちは。一緒に文法を勉強しましょう。');
  }

  const points = useMemo(() => grammar.filter(point => point.level === level), [level]);
  const byId = useMemo(() => new Map(grammar.map(point => [point.id, point])), []);
  const learnedCount = points.filter(point => learned.has(point.id)).length;
  const search = query.trim().toLowerCase();
  const shown = points.filter(point =>
    (filter === 'all' || (filter === 'learned') === learned.has(point.id)) &&
    (!search || [point.pattern, point.romaji, point.meaning].some(text => text.toLowerCase().includes(search))));

  function toggleLearned(id: string) {
    const next = new Set(learned);
    if (next.has(id)) next.delete(id); else next.add(id);
    setLearned(next);
    try { localStorage.setItem(learnedKey, JSON.stringify([...next])); } catch {}
  }
  function nextQuestion(pool = points) {
    const unlearned = pool.filter(point => !learned.has(point.id));
    const answer = shuffle(unlearned.length ? unlearned : pool)[0];
    const words = keyWords(answer.meaning);
    const distractors = shuffle(pool.filter(point => point.id !== answer.id && ![...keyWords(point.meaning)].some(word => words.has(word)))).slice(0, 3);
    setQuiz({ id: answer.id, choices: shuffle([answer, ...distractors]).map(point => point.id), picked: null });
  }
  function chooseLevel(next: Level) {
    setLevel(next); setScore({ right: 0, total: 0 });
    try { localStorage.setItem(levelKey, next); } catch {}
    if (mode === 'quiz') nextQuestion(grammar.filter(point => point.level === next));
  }
  function pick(id: string) {
    if (!quiz || quiz.picked) return;
    setQuiz({ ...quiz, picked: id });
    setScore(previous => ({ right: previous.right + (id === quiz.id ? 1 : 0), total: previous.total + 1 }));
  }

  const current = quiz && byId.get(quiz.id);
  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">One pattern at a time.</span></header>
    <main>
      <div className="eyebrow">JLPT grammar · N5 &amp; N4</div>
      <h1>Learn the patterns behind the sentences.</h1>
      <p className="intro">Browse every N5 and N4 grammar point with a short explanation and two example sentences you can listen to. Mark points as learned, then quiz yourself.</p>
      <div className="tip">
        <div className="reading-controls" role="group" aria-label="JLPT level">
          {levels.map(item => <button key={item} className="primary" aria-pressed={level === item} onClick={() => chooseLevel(item)}>{item} · {grammar.filter(point => point.level === item).length} points</button>)}
        </div>
        <div className="reading-controls" role="group" aria-label="Mode">
          <button className="primary" aria-pressed={mode === 'browse'} onClick={() => setMode('browse')}>Browse grammar</button>
          <button className="primary" aria-pressed={mode === 'quiz'} onClick={() => { setMode('quiz'); if (!quiz || byId.get(quiz.id)?.level !== level) nextQuestion(); }}>Quiz me</button>
        </div>
        <div className="audio-controls voice-controls">
          <label htmlFor="grammar-voice">Browser voice</label>
          <select id="grammar-voice" value={voice} disabled={!voices.length} aria-describedby="grammar-voice-help" onChange={e => chooseVoice(e.target.value)}>
            {!voices.length && <option value="">No Japanese voices available</option>}
            {voices.map(v => <option key={voiceId(v)} value={voiceId(v)}>{v.name}{v.localService ? '' : ' · Online'}</option>)}
          </select>
        </div>
        <p id="grammar-voice-help">Used for the green ▶ buttons; picking a voice plays a short sample. Orange ▶ buttons play the original Kaishi recordings. For Microsoft natural voices, open this page in Edge.</p>
      </div>
      <div className="layout">
        <section className="card" aria-label={mode === 'quiz' ? 'Grammar quiz' : 'Grammar list'}>
          <div className="card-top"><span className="small">{mode === 'quiz' ? `Score ${score.right} / ${score.total}` : `${shown.length} of ${points.length} shown`}</span><span className="badge">JLPT {level}</span></div>
          <progress value={learnedCount} max={points.length} aria-label={`${level} points learned`} />
          {mode === 'quiz' && current ? <div className="content">
            <p className="small">What does this pattern mean?</p>
            <h2 className="grammar-quiz-pattern" lang="ja">{current.pattern}</h2>
            <div className="choices" role="group" aria-label="Meanings">{quiz.choices.map((id, i) => {
              const option = byId.get(id)!;
              const state = quiz.picked && (id === quiz.id ? 'correct' : id === quiz.picked ? 'incorrect' : '');
              return <div className="choice" key={id}><button type="button" className={`choice-button ${state || ''}`} disabled={!!quiz.picked} onClick={() => pick(id)}>
                <span className="letter" aria-hidden="true">{'ABCD'[i]}</span><span>{option.meaning}</span>
                {state && <span className="answer-mark">{state === 'correct' ? '✓ Correct' : '✕ Your answer'}</span>}
              </button></div>;
            })}</div>
            {quiz.picked && <div className={`feedback${quiz.picked === quiz.id ? '' : ' wrong'}`} role="status">
              <strong>{quiz.picked === quiz.id ? 'Right!' : `It means “${current.meaning}”.`}</strong>
              <p><strong>Form:</strong> <span lang="ja">{current.formation}</span></p>{current.note && <p>{current.note}</p>}
              <Examples point={current} english />
            </div>}
            <div className="actions">
              <button type="button" className="primary secondary" aria-pressed={learned.has(current.id)} onClick={() => toggleLearned(current.id)}>{learned.has(current.id) ? '✓ Learned' : 'Mark as learned'}</button>
              <button type="button" className="primary" onClick={() => nextQuestion()}>{quiz.picked ? 'Next question →' : 'Skip →'}</button>
            </div>
          </div> : <div className="content">
            <div className="grammar-toolbar">
              <label htmlFor="grammar-search" className="small">Search</label>
              <input id="grammar-search" type="search" value={query} placeholder="e.g. てもいい, must, tara" onChange={e => setQuery(e.target.value)} />
              <select aria-label="Show" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
                <option value="all">All points</option><option value="todo">Not learned yet</option><option value="learned">Learned</option>
              </select>
              <label className="small"><input type="checkbox" checked={english} onChange={e => setEnglish(e.target.checked)} /> Show English</label>
            </div>
            {!shown.length && <p className="small">No grammar points match. Try another search or filter.</p>}
            <ol className="grammar-list">{shown.map(point => <li key={point.id}><details className="grammar-item">
              <summary>
                <span className="grammar-pattern" lang="ja">{point.pattern}</span>
                <span className="grammar-meaning">{point.meaning}</span>
                {kaishi[point.id] && <span className="badge grammar-kaishi-badge" title="Has recorded sentences from your Kaishi deck">🎧 Kaishi ×{kaishi[point.id].length}</span>}
                {learned.has(point.id) && <span className="grammar-learned" aria-label="Learned">✓</span>}
              </summary>
              <p className="small">{point.romaji}</p>
              <p><strong>Form:</strong> <span lang="ja">{point.formation}</span></p>
              {point.note && <p className="small">{point.note}</p>}
              <Examples point={point} english={english} />
              <div className="actions">
                <a className="small" href={point.source} target="_blank" rel="noreferrer">More on JLPT Sensei ↗</a>
                <button type="button" className="primary secondary" aria-pressed={learned.has(point.id)} onClick={() => toggleLearned(point.id)}>{learned.has(point.id) ? '✓ Learned' : 'Mark as learned'}</button>
              </div>
            </details></li>)}</ol>
          </div>}
        </section>
        <aside aria-label="Grammar progress and tips">
          <div className="tip"><h2>Your progress</h2><div className="score-row"><span id="live-score">{learnedCount} / {points.length}</span><span className="small">{level} learned</span></div><p>Saved on this device.</p></div>
          <div className="tip"><h2>How to study</h2><p>Read the form, then press ▶ and repeat each example aloud. Hide the English and check whether you can still understand the sentence.</p></div>
          <div className="tip"><h2>Quiz</h2><p>The quiz asks for points you haven’t marked as learned first. Mark a point as learned when you can use it in your own sentence.</p></div>
          <div className="tip"><h2>About this list</h2><p>The JLPT has no official grammar list. Points and levels follow the <a href="https://jlptsensei.com/jlpt-n5-grammar-list/" target="_blank" rel="noreferrer">JLPT Sensei</a> lists; explanations and examples are written for Kiku. Points marked 🎧 also include matching sentences from your Kaishi 1.5k deck with their original recordings. Follow each point’s link for the full lesson.</p></div>
        </aside>
      </div>
    </main>
    <footer>Example audio is generated by your browser. A Japanese text-to-speech voice is required.</footer>
  </div>;
}
