'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import grammar from '../data/grammar.json';
import grammarKaishi from '../data/grammar-kaishi.json';
import { DEFAULT_SETTINGS, LEARN_AHEAD_MS, NEW_CARD, dayNumber, describeDue, previewAnswers, type CardState, type Rating, type Settings } from '../lib/srs';
import { speakJapanese } from '../lib/speech';
import CourseBanner from './course-banner';
import { courseParam } from '../lib/course';

type Segment = [string, string?, 1?];
type KaishiCard = { id: string; pos: number; word: string; reading: string; meaning: string; wordFurigana: Segment[]; wordAudio: string | null;
  sentence: Segment[]; sentenceMeaning: string; sentenceAudio: string | null; notes: string; picture: string | null };
type GrammarPoint = (typeof grammar)[number];
type DeckId = 'kaishi' | 'grammar-n5' | 'grammar-n4' | 'grammar-n3' | 'grammar-n2' | 'grammar-n1';
type DayCount = { day: number; newDone: number; reviewDone: number };
type Store = { passFail?: boolean; cards: Record<string, CardState>; days: Partial<Record<DeckId, DayCount>>; settings: Partial<Record<DeckId, Partial<Settings>>>;
  log: { c: string; t: number; r: Rating; p: CardState['phase'] }[] };
type Current = { id: string; shown: boolean; preview: Record<Rating, CardState> };
type Undo = { id: string; before: CardState | undefined; day: DayCount | undefined; deck: DeckId };

const storeKey = 'kiku-srs-v1';
const emptyStore: Store = { cards: {}, days: {}, settings: {}, log: [] };
const decks: { id: DeckId; name: string; about: string; defaults: Partial<Settings> }[] = [
  { id: 'kaishi', name: 'Kaishi 1.5k', about: 'Core vocabulary with native word and sentence audio.', defaults: {} },
  { id: 'grammar-n5', name: 'Grammar · N5', about: 'Recall the meaning of each N5 pattern.', defaults: { newPerDay: 5 } },
  { id: 'grammar-n4', name: 'Grammar · N4', about: 'Recall the meaning of each N4 pattern.', defaults: { newPerDay: 5 } },
  { id: 'grammar-n3', name: 'Grammar · N3', about: 'Recall the meaning of each N3 pattern.', defaults: { newPerDay: 5 } },
  { id: 'grammar-n2', name: 'Grammar · N2', about: 'Recall the meaning of each N2 pattern.', defaults: { newPerDay: 5 } },
  { id: 'grammar-n1', name: 'Grammar · N1', about: 'Recall the meaning of each N1 pattern.', defaults: { newPerDay: 5 } },
];
const ratings: { r: Rating; label: string; key: string }[] = [{ r: 1, label: 'Again', key: '1' }, { r: 2, label: 'Hard', key: '2' }, { r: 3, label: 'Good', key: '3' }, { r: 4, label: 'Easy', key: '4' }];
// Like Anki's PassFail 2 add-on: Fail answers Again, Pass answers Good, and any key but 1 passes.
const passFailRatings: typeof ratings = [{ r: 1, label: 'Fail', key: '1' }, { r: 3, label: 'Pass', key: '2' }];
const kaishiRecordings: Record<string, { ja: string; en: string; audio: string }[]> = grammarKaishi;
// Built by npm run kaishi:extract into public/kaishi, so it is deployed as static files.
const media = (name: string) => `/kaishi/media/${encodeURIComponent(name)}`;

function Ruby({ segments, furigana = true }: { segments: Segment[]; furigana?: boolean }) {
  return <>{segments.map(([text, reading, bold], i) => {
    const inner = reading && furigana ? <ruby>{text}<rt>{reading}</rt></ruby> : text;
    return bold ? <b key={i}>{inner}</b> : <span key={i}>{inner}</span>;
  })}</>;
}

export default function Flashcards() {
  const [store, setStore] = useState<Store>(emptyStore);
  const [loaded, setLoaded] = useState(false);
  const [kaishi, setKaishi] = useState<KaishiCard[] | null>(null);
  const [kaishiError, setKaishiError] = useState(false);
  const [deck, setDeck] = useState<DeckId | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [undo, setUndo] = useState<Undo[]>([]);
  const [now, setNow] = useState(0);
  const [message, setMessage] = useState('');
  const player = useRef<HTMLAudioElement | null>(null);
  const passFail = store.passFail !== false;
  const progressFile = useRef<HTMLInputElement>(null);
  // Opened from the course: study only one level's words (?from=221&to=240), without the daily new-card limit.
  const [focus, setFocus] = useState<{ from: number; to: number } | null>(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(storeKey); if (saved) setStore({ ...emptyStore, ...JSON.parse(saved) }); } catch {}
    setLoaded(true); setNow(Date.now());
    const from = Number(courseParam('from')), to = Number(courseParam('to'));
    if (from >= 1 && to >= from) setFocus({ from, to });
    fetch('/kaishi/cards.json').then(r => r.ok ? r.json() : Promise.reject()).then((cards: KaishiCard[]) => setKaishi([...cards].sort((a, b) => a.pos - b.pos))).catch(() => setKaishiError(true));
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(storeKey, JSON.stringify(store)); } catch {} }, [store, loaded]);

  const cardIds = useMemo(() => ({
    kaishi: (focus ? (kaishi ?? []).slice(focus.from - 1, focus.to) : kaishi ?? []).map(card => `kaishi:${card.id}`),
    'grammar-n5': grammar.filter(p => p.level === 'N5').map(p => `grammar:${p.id}`),
    'grammar-n4': grammar.filter(p => p.level === 'N4').map(p => `grammar:${p.id}`),
    'grammar-n3': grammar.filter(p => p.level === 'N3').map(p => `grammar:${p.id}`),
    'grammar-n2': grammar.filter(p => p.level === 'N2').map(p => `grammar:${p.id}`),
    'grammar-n1': grammar.filter(p => p.level === 'N1').map(p => `grammar:${p.id}`),
  }), [kaishi, focus]);
  const kaishiById = useMemo(() => new Map((kaishi ?? []).map(card => [`kaishi:${card.id}`, card])), [kaishi]);
  const grammarById = useMemo(() => new Map(grammar.map(point => [`grammar:${point.id}`, point])), []);

  const settingsFor = useCallback((id: DeckId): Settings => ({ ...DEFAULT_SETTINGS, ...decks.find(d => d.id === id)!.defaults, ...store.settings[id] }), [store.settings]);
  const dayCount = (s: Store, id: DeckId, today: number): DayCount => s.days[id]?.day === today ? s.days[id]! : { day: today, newDone: 0, reviewDone: 0 };

  // Anki-style queues: learning cards when due, then reviews mixed with new cards, within the daily limits.
  function queues(s: Store, id: DeckId, at: number) {
    const cfg = settingsFor(id), today = dayNumber(at), count = dayCount(s, id, today);
    const states = cardIds[id].map(cardId => [cardId, s.cards[cardId] ?? NEW_CARD] as const);
    const learning = states.filter(([, c]) => c.phase === 'learning' || c.phase === 'relearning').sort((a, b) => a[1].due - b[1].due);
    const reviews = states.filter(([, c]) => c.phase === 'review' && c.due <= today).sort((a, b) => a[1].due - b[1].due).slice(0, Math.max(0, cfg.reviewsPerDay - count.reviewDone));
    const fresh = states.filter(([, c]) => c.phase === 'new').slice(0, focus && id === 'kaishi' ? undefined : Math.max(0, cfg.newPerDay - count.newDone));
    return { learning, reviews, fresh, cfg };
  }
  function counts(id: DeckId) {
    const { learning, reviews, fresh } = queues(store, id, now);
    return { fresh: fresh.length, learning: learning.filter(([, c]) => c.due <= now + LEARN_AHEAD_MS).length, reviews: reviews.length, later: learning.length };
  }
  function pick(s: Store, id: DeckId): Current | null {
    const at = Date.now();
    const { learning, reviews, fresh, cfg } = queues(s, id, at);
    const dueLearning = learning.find(([, c]) => c.due <= at);
    const choice = dueLearning
      ?? (reviews.length && fresh.length ? (Math.random() < fresh.length / (fresh.length + reviews.length) ? fresh[0] : reviews[0]) : reviews[0] ?? fresh[0])
      ?? learning.find(([, c]) => c.due <= at + LEARN_AHEAD_MS);
    return choice ? { id: choice[0], shown: false, preview: previewAnswers(choice[1], at, cfg) } : null;
  }

  function study(id: DeckId) { setDeck(id); setUndo([]); setMessage(''); setCurrent(pick(store, id)); }
  function leave() { setDeck(null); setCurrent(null); if (focus) { setFocus(null); history.replaceState(null, '', '/flashcards'); } }
  // A focused session starts as soon as the card data has loaded.
  useEffect(() => { if (focus && kaishi && loaded && !deck) study('kaishi'); }, [focus, kaishi, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  function answer(r: Rating) {
    if (!deck || !current?.shown) return;
    const before = store.cards[current.id], phase = (before ?? NEW_CARD).phase, today = dayNumber(Date.now());
    const day = dayCount(store, deck, today);
    const next: Store = { ...store, cards: { ...store.cards, [current.id]: current.preview[r] },
      days: { ...store.days, [deck]: { day: today, newDone: day.newDone + (phase === 'new' ? 1 : 0), reviewDone: day.reviewDone + (phase === 'review' ? 1 : 0) } },
      log: [...store.log.slice(-4999), { c: current.id, t: Date.now(), r, p: phase }] };
    setUndo(stack => [...stack.slice(-19), { id: current.id, before, day: store.days[deck], deck }]);
    setStore(next); setNow(Date.now()); setCurrent(pick(next, deck));
  }
  function undoLast() {
    const last = undo[undo.length - 1];
    if (!last || !deck) return;
    const cards = { ...store.cards };
    if (last.before) cards[last.id] = last.before; else delete cards[last.id];
    const next = { ...store, cards, days: { ...store.days, [last.deck]: last.day }, log: store.log.slice(0, -1) };
    setUndo(undo.slice(0, -1)); setStore(next);
    setCurrent({ id: last.id, shown: false, preview: previewAnswers(last.before ?? NEW_CARD, Date.now(), settingsFor(last.deck)) });
  }

  // Plays the word, then the sentence, like the Kaishi card template.
  const playAudio = useCallback((files: (string | null)[]) => {
    player.current?.pause();
    const queue = files.filter((f): f is string => !!f);
    const playNext = () => {
      const file = queue.shift();
      if (!file) return;
      player.current = new Audio(media(file));
      player.current.onended = playNext;
      player.current.play().catch(() => {});
    };
    playNext();
  }, []);
  function reveal() {
    if (!current || current.shown) return;
    setCurrent({ ...current, shown: true });
    const card = kaishiById.get(current.id);
    if (card) playAudio([card.wordAudio, card.sentenceAudio]);
  }
  useEffect(() => () => player.current?.pause(), []);
  useEffect(() => { player.current?.pause(); window.speechSynthesis?.cancel(); }, [current?.id]);

  // Keyboard shortcuts as in Anki: Space/Enter show answer or Good, 1–4 rate, R replay, Ctrl+Z undo.
  useEffect(() => {
    if (!deck) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, select, textarea')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undoLast(); return; }
      if (!current) return;
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (current.shown) answer(3); else reveal(); }
      else if (current.shown && ['1', '2', '3', '4'].includes(event.key)) answer(passFail ? (event.key === '1' ? 1 : 3) : Number(event.key) as Rating);
      else if (event.key.toLowerCase() === 'r') { const card = kaishiById.get(current.id); if (card && current.shown) playAudio([card.wordAudio, card.sentenceAudio]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  // When only future learning cards remain, pick them up as soon as they fall due.
  useEffect(() => { if (deck && !current && now) { const next = pick(store, deck); if (next) setCurrent(next); } }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reads the anki-progress.json made by npm run kaishi:progress; the file stays on the user's computer.
  async function importAnki(file: File | undefined) {
    if (!file) return;
    try {
      const { cards, exportedAt } = JSON.parse(await file.text()) as { exportedAt: number; cards: Record<string, { phase: CardState['phase']; dueMs: number; ivl: number; step: number; memory: CardState['memory']; lastReview: number | null; reps: number; lapses: number }> };
      const known = Object.entries(cards).filter(([guid]) => kaishiById.has(`kaishi:${guid}`));
      if (!window.confirm(`Replace your Kaishi progress on this site with ${known.length} studied cards from Anki (exported ${new Date(exportedAt).toLocaleString()})?`)) return;
      const kept = Object.fromEntries(Object.entries(store.cards).filter(([id]) => !id.startsWith('kaishi:')));
      for (const [guid, c] of known) kept[`kaishi:${guid}`] = { phase: c.phase, due: c.phase === 'review' ? dayNumber(c.dueMs) : c.dueMs, step: c.step, ivl: c.ivl, memory: c.memory, lastReview: c.lastReview, reps: c.reps, lapses: c.lapses };
      setStore({ ...store, cards: kept }); setNow(Date.now());
      setMessage(`Imported ${known.length} cards from Anki.`);
    } catch {
      setMessage('That file is not an Anki progress export. Close Anki, run npm run kaishi:progress, and pick kaishi-1.5k/anki-progress.json.');
    } finally {
      if (progressFile.current) progressFile.current.value = '';
    }
  }
  function resetDeck(id: DeckId) {
    if (!window.confirm(`Reset all progress for ${decks.find(d => d.id === id)!.name}? This cannot be undone.`)) return;
    const prefix = id === 'kaishi' ? 'kaishi:' : `grammar:${id.slice(-2)}-`;
    setStore({ ...store, cards: Object.fromEntries(Object.entries(store.cards).filter(([cardId]) => !cardId.startsWith(prefix))), days: { ...store.days, [id]: undefined } });
  }
  function changeSetting(id: DeckId, key: keyof Settings, value: number) {
    setStore({ ...store, settings: { ...store.settings, [id]: { ...store.settings[id], [key]: value } } });
  }

  const today = now ? dayNumber(now) : 0;
  const studiedToday = store.log.filter(entry => now && dayNumber(entry.t) === today).length;
  const recent = store.log.filter(entry => entry.p === 'review' && now - entry.t < 30 * 86_400_000);
  const retention = recent.length ? Math.round(100 * recent.filter(entry => entry.r > 1).length / recent.length) : null;

  const header = <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">Remember it for good.</span></header>;
  if (deck) {
    const c = counts(deck), card = current && (kaishiById.get(current.id) ?? grammarById.get(current.id));
    const phase = current ? (store.cards[current.id] ?? NEW_CARD).phase : null;
    return <div className="shell">{header}<main>
      <CourseBanner step="Learn new words" />
      <div className="srs-topbar">
        <button className="primary secondary" onClick={leave}>← Decks</button>
        <strong>{decks.find(d => d.id === deck)!.name}{focus && deck === 'kaishi' ? ` · words ${focus.from}–${focus.to}` : ''}</strong>
        <span className="srs-counts" aria-label={`${c.fresh} new, ${c.learning} learning, ${c.reviews} to review`}>
          <span className={`srs-new${phase === 'new' ? ' srs-active' : ''}`}>{c.fresh}</span> + <span className={`srs-learn${phase === 'learning' || phase === 'relearning' ? ' srs-active' : ''}`}>{c.learning}</span> + <span className={`srs-review${phase === 'review' ? ' srs-active' : ''}`}>{c.reviews}</span>
        </span>
        <button className="primary secondary" disabled={!undo.length} onClick={undoLast} title="Ctrl+Z">↶ Undo</button>
      </div>
      <section className="card srs-card" aria-label="Flashcard">
        {!current || !card ? <div className="content srs-done">
          <h2>{focus && deck === 'kaishi' ? `All words ${focus.from}–${focus.to} are studied for now.` : 'Congratulations! You have finished this deck for now.'}</h2>
          <p className="small">{c.later ? `${c.later} learning card${c.later > 1 ? 's' : ''} will come back in a few minutes — this page will show ${c.later > 1 ? 'them' : 'it'} automatically.` : 'Come back tomorrow for new cards and reviews.'}</p>
          <button className="primary" onClick={leave}>Back to decks</button>
        </div> : <>
          <div className="content srs-face">
            {'word' in card ? <>
              <div className="srs-word" lang="ja">{current.shown ? <Ruby segments={card.wordFurigana} /> : card.word}</div>
              {current.shown && <div className="srs-back">
                <p className="srs-meaning">{card.meaning}</p>
                {card.picture && <img className="srs-picture" src={media(card.picture)} alt="" />}
                <p className="srs-sentence" lang="ja"><Ruby segments={card.sentence} /></p>
                <p className="small">{card.sentenceMeaning}</p>
                {card.notes && <p className="small srs-notes">{card.notes}</p>}
                <div className="reading-controls">
                  <button className="primary secondary" onClick={() => playAudio([card.wordAudio])} disabled={!card.wordAudio}>▶ Word</button>
                  <button className="primary secondary" onClick={() => playAudio([card.sentenceAudio])} disabled={!card.sentenceAudio}>▶ Sentence</button>
                </div>
              </div>}
            </> : <GrammarFace point={card} shown={current.shown} />}
          </div>
          <div className="srs-actions">
            {!current.shown ? <button className="primary srs-show" onClick={reveal}>Show answer <span className="srs-key">Space</span></button>
              : <div className={`srs-buttons${passFail ? ' srs-buttons-2' : ''}`}>{(passFail ? passFailRatings : ratings).map(({ r, label, key }) => <button key={r} className={`srs-rate srs-rate-${r}`} onClick={() => answer(r)}>
                  <span className="srs-ivl">{describeDue(current.preview[r], Date.now())}</span>{label}<span className="srs-key">{key}</span>
                </button>)}</div>}
          </div>
        </>}
      </section>
      <p className="small srs-help">{passFail ? 'Space or Enter: show answer, then Pass · 1: Fail · 2: Pass' : 'Space or Enter: show answer, then Good · 1–4: Again, Hard, Good, Easy'} · R: replay audio · Ctrl+Z: undo</p>
    </main></div>;
  }

  return <div className="shell">{header}<main>
    <CourseBanner step="Learn new words" />
    <div className="eyebrow">Spaced repetition · Anki-style</div>
    <h1>Review a little every day.</h1>
    <p className="intro">Cards come back just before you would forget them. Scheduling uses FSRS-5 with the same learning steps and limits as your Kaishi deck in Anki, so intervals match what Anki would give you.</p>
    <div className="layout">
      <section className="card" aria-label="Decks">
        <table className="srs-decks">
          <thead><tr><th>Deck</th><th className="srs-new">New</th><th className="srs-learn">Learn</th><th className="srs-review">Due</th><th /></tr></thead>
          <tbody>{decks.map(d => {
            const unavailable = d.id === 'kaishi' && !kaishi;
            const c = loaded && !unavailable ? counts(d.id) : null;
            const cfg = settingsFor(d.id);
            return <tr key={d.id}>
              <td><strong>{d.name}</strong><p className="small">{d.id === 'kaishi' && kaishiError ? 'Card data not found. Run npm run kaishi:extract and commit public/kaishi.' : d.about}</p>
                <details className="srs-options"><summary>Options</summary>
                  <label>New cards/day <input type="number" min={0} max={9999} value={cfg.newPerDay} onChange={e => changeSetting(d.id, 'newPerDay', Math.max(0, Number(e.target.value)))} /></label>
                  <label>Maximum reviews/day <input type="number" min={0} max={9999} value={cfg.reviewsPerDay} onChange={e => changeSetting(d.id, 'reviewsPerDay', Math.max(0, Number(e.target.value)))} /></label>
                  <label>Desired retention <select value={cfg.retention} onChange={e => changeSetting(d.id, 'retention', Number(e.target.value))}>{[0.8, 0.85, 0.9, 0.92, 0.95].map(v => <option key={v} value={v}>{Math.round(v * 100)}%</option>)}</select></label>
                  <p className="small">Learning steps {cfg.learnSteps.join('m ')}m · relearning {cfg.relearnSteps.join('m ')}m · maximum interval {cfg.maxInterval} days</p>
                  <div className="reading-controls">
                    {d.id === 'kaishi' && <>
                      <button className="primary secondary" disabled={!kaishi} onClick={() => progressFile.current?.click()}>Import my Anki progress…</button>
                      <input ref={progressFile} type="file" accept=".json,application/json" hidden onChange={e => importAnki(e.target.files?.[0])} />
                    </>}
                    <button className="primary secondary" onClick={() => resetDeck(d.id)}>Reset deck</button>
                  </div>
                </details>
              </td>
              <td className="srs-new">{c?.fresh ?? '–'}</td><td className="srs-learn">{c?.learning ?? '–'}</td><td className="srs-review">{c?.reviews ?? '–'}</td>
              <td><button className="primary" disabled={!c || (!c.fresh && !c.learning && !c.reviews && !c.later)} onClick={() => study(d.id)}>Study</button></td>
            </tr>;
          })}</tbody>
        </table>
        {message && <p className="small srs-message" role="status">{message}</p>}
      </section>
      <aside aria-label="Today">
        <div className="tip"><h2>Today</h2><div className="score-row"><span id="live-score">{studiedToday}</span><span className="small">cards studied</span></div>
          <p>{retention === null ? 'Your review retention appears after a few reviews.' : `${retention}% of reviews remembered in the last 30 days.`}</p></div>
        <div className="tip"><h2>Answer buttons</h2>
          <div className="reading-controls" role="group" aria-label="Answer buttons">
            <button className="primary" aria-pressed={passFail} onClick={() => setStore({ ...store, passFail: true })}>Pass / Fail</button>
            <button className="primary" aria-pressed={!passFail} onClick={() => setStore({ ...store, passFail: false })}>Again · Hard · Good · Easy</button>
          </div>
          <p>{passFail ? 'Like the PassFail 2 add-on in your Anki: Fail if you forgot, Pass if you remembered. FSRS works best with honest pass/fail grading.' : 'Again if you forgot, Hard if it was a struggle, Good if you remembered, Easy if it was effortless.'} New cards repeat after 1 and 10 minutes before their first day-long interval.</p></div>
        <div className="tip"><h2>Coming from Anki?</h2><p>Close Anki and run <code>npm run kaishi:progress</code> on your computer. Then choose “Import my Anki progress…” in the Kaishi options and pick <code>kaishi-1.5k/anki-progress.json</code>. Progress is copied once; this site and Anki don’t sync afterwards.</p></div>
        <div className="tip"><h2>Saved on this device</h2><p>Progress is stored in this browser. Clearing site data erases it.</p></div>
      </aside>
    </div>
  </main></div>;
}

function GrammarFace({ point, shown }: { point: GrammarPoint; shown: boolean }) {
  const recordings = kaishiRecordings[point.id] ?? [];
  const playRecording = (file: string) => { window.speechSynthesis?.cancel(); new Audio(media(file)).play().catch(() => {}); };
  return <>
    <div className="srs-word" lang="ja">{point.pattern}</div>
    {!shown ? <p className="small srs-prompt">What does it mean, and how is it formed?</p> : <div className="srs-back">
      <p className="srs-meaning">{point.meaning}</p>
      <p><strong>Form:</strong> <span lang="ja">{point.formation}</span></p>
      {point.note && <p className="small">{point.note}</p>}
      <ul className="grammar-examples">
        {point.examples.map((example, i) => <li key={i}><button type="button" className="play-small" aria-label={`Play: ${example.ja}`} onClick={() => speakJapanese(example.ja)}>▶</button>
          <div><p className="grammar-ja" lang="ja">{example.ja}</p><p className="small">{example.en}</p></div></li>)}
        {recordings.slice(0, 1).map((example, i) => <li key={`k${i}`}><button type="button" className="play-small recorded" aria-label={`Play recording: ${example.ja}`} onClick={() => playRecording(example.audio)}>▶</button>
          <div><p className="grammar-ja" lang="ja">{example.ja}</p><p className="small">{example.en} · from Kaishi</p></div></li>)}
      </ul>
    </div>}
  </>;
}
