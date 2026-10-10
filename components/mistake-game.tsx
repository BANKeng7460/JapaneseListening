'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import mistakes from '../data/mistakes.json';
import grammar from '../data/grammar.json';
import { listeningTests } from '../data/tests';
import { speakJapanese } from '../lib/speech';
import VoiceSelect from './voice-select';
import CourseBanner from './course-banner';
import { courseParam } from '../lib/course';

type Item = { chunks: string[]; wrong: number | null; fix?: string; mistake?: string; options?: string[]; type?: 'particle' | 'verb' | 'adjective'; grammar?: string | null; why?: string; en: string; situation: string };
type Phase = 'find' | 'fix' | 'done';
type Kind = 'all' | 'particle' | 'verb' | 'adjective';

const bank = mistakes as unknown as Record<string, Item[]>;
const levels = listeningTests.filter(test => test.questions && bank[test.id]).map(test => ({ id: test.id, label: test.label }));
const grammarById = new Map(grammar.map(point => [point.id, point]));
const kinds: { id: Kind; label: string }[] = [{ id: 'all', label: 'All mistakes' }, { id: 'particle', label: 'Particles' }, { id: 'verb', label: 'Verb forms' }, { id: 'adjective', label: 'Adjectives' }];
const ROUND = 10, HEARTS = 3, bestKey = 'kiku-mistakes-best';
const shuffle = <T,>(items: T[]) => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// A round mixes planted mistakes with a few correct sentences, so "No mistake" is sometimes the answer.
function makeRound(levelId: string, kind: Kind) {
  const items = bank[levelId] ?? [];
  const wrong = shuffle(items.filter(i => i.wrong !== null && (kind === 'all' || i.type === kind)));
  const right = shuffle(items.filter(i => i.wrong === null));
  const correctCount = Math.min(right.length, kind === 'all' ? 3 : 2, Math.max(1, ROUND - wrong.length));
  return shuffle([...wrong.slice(0, ROUND - correctCount), ...right.slice(0, correctCount)]);
}

export default function MistakeGame() {
  const [levelId, setLevelId] = useState(levels[0].id);
  const [kind, setKind] = useState<Kind>('all');
  const [round, setRound] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('find');
  const [tapped, setTapped] = useState<number | null>(null);
  const [right, setRight] = useState<boolean | null>(null);
  const [hearts, setHearts] = useState(HEARTS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missed, setMissed] = useState<Item[]>([]);
  const [best, setBest] = useState<Record<string, number>>({});

  useEffect(() => {
    try { setBest(JSON.parse(localStorage.getItem(bestKey) || '{}')); } catch {}
    const wanted = courseParam('level');
    if (wanted && levels.some(l => l.id === wanted)) setLevelId(wanted);
  }, []);
  useEffect(() => { start(levelId, kind); }, [levelId, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  function start(id = levelId, k = kind) {
    setRound(makeRound(id, k)); setIndex(0); setPhase('find'); setTapped(null); setRight(null);
    setHearts(HEARTS); setScore(0); setStreak(0); setMissed([]);
  }
  const item = round[index];
  // The round ends after the last answer's explanation has been seen.
  const over = round.length > 0 && (index >= round.length || (hearts === 0 && phase === 'find'));
  const counts = useMemo(() => {
    const items = bank[levelId] ?? [];
    return Object.fromEntries(kinds.map(k => [k.id, items.filter(i => i.wrong !== null && (k.id === 'all' || i.type === k.id)).length]));
  }, [levelId]);

  function finish(ok: boolean) {
    setRight(ok); setPhase('done');
    if (ok) { setScore(s => s + 1); setStreak(s => s + 1); }
    else { setHearts(h => h - 1); setStreak(0); setMissed(list => [...list, item]); }
  }
  function tap(i: number) {
    if (phase !== 'find') return;
    setTapped(i);
    if (item.wrong === i) setPhase('fix'); else finish(false);
  }
  function noMistake() { if (phase === 'find') { setTapped(null); finish(item.wrong === null); } }
  function choose(option: string) { if (phase === 'fix') finish(option === item.fix); }
  function next() { setIndex(i => i + 1); setPhase('find'); setTapped(null); setRight(null); }

  // Save the best score per level when a round ends.
  useEffect(() => {
    if (!over || score <= (best[levelId] ?? -1)) return;
    const updated = { ...best, [levelId]: score };
    setBest(updated);
    try { localStorage.setItem(bestKey, JSON.stringify(updated)); } catch {}
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  const corrected = item ? item.chunks.map((c, i) => (i === item.wrong ? item.fix! : c)) : [];
  const point = item?.grammar ? grammarById.get(item.grammar) : null;
  const levelIndex = levels.findIndex(l => l.id === levelId);

  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">Find it. Fix it. Remember it.</span></header>
    <main>
      <CourseBanner step="Spot the mistake" />
      <div className="eyebrow">Grammar game · Kaishi levels</div>
      <h1>Spot the mistake.</h1>
      <p className="intro">Each sentence comes from your Kaishi conversations, so you know every word. Some have one grammar mistake — tap it and choose the fix. Some are already correct.</p>
      <div className="tip mistake-setup">
        <label htmlFor="mistake-level"><strong>Level </strong></label>
        <select id="mistake-level" value={levelId} onChange={e => setLevelId(e.target.value)}>
          {levels.map(l => <option key={l.id} value={l.id}>{l.label}{best[l.id] !== undefined ? ` · best ${best[l.id]}` : ''}</option>)}
        </select>
        <div className="reading-controls" role="group" aria-label="Mistake type">
          {kinds.map(k => <button key={k.id} className="primary" aria-pressed={kind === k.id} disabled={!counts[k.id]} onClick={() => setKind(k.id)}>{k.label} · {counts[k.id]}</button>)}
        </div>
        <VoiceSelect id="mistake-voice" help="Used when you press ▶ to hear the corrected sentence. It’s the same voice as on the Grammar page and in Flashcards." />
      </div>
      <div className="layout">
        <section className="card" aria-label="Spot the mistake">
          <div className="card-top">
            <span className="small">{over ? 'Round complete' : `Sentence ${Math.min(index + 1, round.length)} of ${round.length}`}</span>
            <span className="mistake-status" aria-label={`${hearts} hearts left, ${streak} in a row`}>{'♥'.repeat(hearts)}<span className="mistake-lost">{'♥'.repeat(HEARTS - hearts)}</span> · 🔥 {streak}</span>
          </div>
          <progress value={Math.min(index, round.length)} max={round.length || 1} aria-label="Round progress" />
          {over ? <div className="results">
            <div className="eyebrow">{levels[levelIndex].label}</div>
            <h2>{hearts === 0 ? 'Out of hearts.' : 'Nice work!'}</h2>
            <div className="result-score">{score} / {round.length}</div>
            <p className="small">Best for this level: {Math.max(score, best[levelId] ?? 0)}</p>
            {missed.length > 0 && <ol className="review">{missed.map((m, i) => <li key={i}>
              <p lang="ja">{m.wrong === null ? m.chunks.join('') : m.chunks.map((c, j) => j === m.wrong ? `【${m.fix}】` : c).join('')}</p>
              <p className="small">{m.wrong === null ? 'This sentence had no mistake.' : m.why}</p>
            </li>)}</ol>}
            <div className="reading-controls">
              <button className="primary" onClick={() => start()}>Play again ↻</button>
              {levelIndex < levels.length - 1 && <button className="primary secondary" onClick={() => setLevelId(levels[levelIndex + 1].id)}>Next level →</button>}
            </div>
          </div> : item && <div className="content">
            <p className="small">{item.situation}</p>
            <p className="mistake-sentence" lang="ja">{(phase === 'done' && item.wrong !== null ? corrected : item.chunks).map((c, i) => {
              const state = phase === 'done' && i === item.wrong ? 'fixed' : phase !== 'find' && i === tapped ? (i === item.wrong ? 'found' : 'missed') : '';
              return <button key={i} type="button" className={`mistake-chunk ${state}`} disabled={phase !== 'find'} onClick={() => tap(i)}>{c}</button>;
            })}</p>
            {phase === 'find' && <div className="actions"><span className="small">Tap the wrong word — or:</span><button className="primary secondary" onClick={noMistake}>No mistake ✓</button></div>}
            {phase === 'fix' && <div className="choices" role="group" aria-label="Choose the correct form">
              <p className="small">You found it! Which form is correct?</p>
              {item.options!.map((o, i) => <div className="choice" key={o}><button type="button" className="choice-button" onClick={() => choose(o)}>
                <span className="letter" aria-hidden="true">{'ABC'[i]}</span><span lang="ja">{o}</span></button></div>)}
            </div>}
            {phase === 'done' && <div className={`feedback${right ? '' : ' wrong'}`} role="status">
              <strong>{right ? (item.wrong === null ? 'Right — no mistake here.' : 'Correct!') : item.wrong === null ? 'This sentence was already correct.' : tapped !== null && tapped !== item.wrong ? 'Not that one.' : 'Not quite.'}</strong>
              {item.wrong !== null && <p><span lang="ja">✕ {item.mistake}</span> → <strong lang="ja">{item.fix}</strong>. {item.why}</p>}
              <p>{item.en}</p>
              <div className="reading-controls">
                <button type="button" className="play-small" aria-label="Play the correct sentence" onClick={() => speakJapanese(corrected.join(''))}>▶</button>
                {point && <Link className="small" href={`/grammar#${point.id}`}>Study: <span lang="ja">{point.pattern}</span> ({point.level}) →</Link>}
                <button className="primary" onClick={next}>{index + 1 < round.length && hearts > 0 ? 'Next →' : 'See results →'}</button>
              </div>
            </div>}
          </div>}
        </section>
        <aside aria-label="How to play">
          <div className="tip"><h2>How to play</h2><p>Read the sentence. If something is wrong, tap that word, then choose the correct form. If the sentence is fine, press “No mistake”. Three wrong answers end the round.</p></div>
          <div className="tip"><h2>What kind of mistakes?</h2><p>Common learner slips: particles (で / に / を / が), verb forms (て-form, ます, たい, ない) and adjectives (高くない, 静かな). Each answer links to its grammar point.</p></div>
          <div className="tip"><h2>Tip</h2><p>Say the corrected sentence out loud with ▶ — hearing the right form helps it stick.</p></div>
        </aside>
      </div>
    </main>
  </div>;
}
