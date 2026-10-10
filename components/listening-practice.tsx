'use client';

import { useEffect, useRef, useState } from 'react';
import { listeningTests, type ListeningTest, type TestEntry } from '../data/tests';
import { useDialogueSpeech } from '../hooks/use-dialogue-speech';
import GrammarUsed from './grammar-used';

export default function ListeningPractice({ tests = listeningTests, genre = 'kaishi' }: { tests?: TestEntry[]; genre?: 'kaishi' | 'daily' | 'solo' }) {
  const daily = genre === 'daily';
  const solo = genre === 'solo';
  const [test, setTest] = useState<ListeningTest>(tests[0] as ListeningTest);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const speech = useDialogueSpeech(solo);
  const questionHeading = useRef<HTMLLegendElement>(null);
  const q = test.questions[current];
  const checked = responses[current] !== undefined;
  const answeredCount = Object.keys(responses).length;
  const score = test.questions.filter((question,i) => responses[i] === question.answer).length;
  const voicesReady = Boolean(speech.selected.A && (solo || speech.selected.B));
  // Play each question's audio automatically as soon as it is shown and voices are loaded.
  useEffect(() => {
    if (!finished && voicesReady) speech.play(test.questions[current].lines);
  }, [test, current, finished, voicesReady]);
  // Answers are saved per test on this device so progress survives reloads and test switches.
  const progressKey = (id: string) => `kiku-progress-${genre}-${id}`;
  function saveResponses(id: string, saved: Record<number, number>) {
    try { localStorage.setItem(progressKey(id), JSON.stringify(saved)); } catch {}
  }
  function loadResponses(entry: ListeningTest): Record<number, number> {
    try {
      const saved: Record<string, unknown> = JSON.parse(localStorage.getItem(progressKey(entry.id)) || '{}');
      return Object.fromEntries(Object.entries(saved).filter(([i, choice]) => entry.questions[Number(i)] && typeof choice === 'number' && entry.questions[Number(i)].choices[choice] !== undefined)) as Record<number, number>;
    } catch { return {}; }
  }
  function openTest(entry: ListeningTest) {
    const saved = loadResponses(entry);
    const target = entry.questions.findIndex((_, i) => saved[i] === undefined);
    speech.reset(); setTest(entry); setResponses(saved);
    setCurrent(Math.max(0, target)); setSelected(target === -1 ? null : saved[target] ?? null); setFinished(target === -1);
    try { localStorage.setItem(`kiku-last-test-${genre}`, entry.id); } catch {}
  }
  useEffect(() => {
    let lastId: string | null = null;
    try { lastId = localStorage.getItem(`kiku-last-test-${genre}`); } catch {}
    const entry = tests.find(item => item.id === lastId && item.questions) ?? tests[0];
    openTest(entry as ListeningTest);
  }, []);
  function restart() {
    speech.reset(); saveResponses(test.id, {}); setCurrent(0); setSelected(null); setResponses({}); setFinished(false);
  }
  function jump(target: number) {
    speech.reset();
    setCurrent(target); setSelected(responses[target] ?? null); setFinished(false);
    requestAnimationFrame(() => questionHeading.current?.focus());
  }
  function next() {
    if (answeredCount === test.questions.length) { speech.reset(); setFinished(true); return; }
    const target = Array.from({length: test.questions.length}, (_,offset) => (current + offset + 1) % test.questions.length).find(i => responses[i] === undefined);
    if (target !== undefined) jump(target);
  }
  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">A little listening, every day.</span></header>
    <main>
      <div className="eyebrow">Japanese listening · {solo ? 'Solo stories' : daily ? 'Daily life' : 'Kaishi 1.5k'}</div>
      <h1>{solo ? 'One voice. A story to follow.' : daily ? 'Everyday moments. Everyday Japanese.' : 'Listen closely. Learn naturally.'}</h1>
      <p className="intro">{solo ? '10 original stories told by one narrator. Follow everyday experiences, then check the details you heard.' : daily ? '20 everyday conversations in four practice sets. Learn useful phrases for shops, travel, friends, and home.' : 'Choose a listening test for the words you’ve learned. Earlier tests stay available as your vocabulary grows.'}</p>
      <div className="tip"><label htmlFor="test-set"><strong>Listening test </strong></label>
        <select id="test-set" value={test.id} aria-describedby="test-help" onChange={event => {
          const entry = tests.find(item => item.id === event.target.value);
          if (entry?.questions) openTest(entry as ListeningTest);
        }}>{tests.map(entry => <option key={entry.id} value={entry.id} disabled={!entry.questions}>{entry.label} · {entry.questions ? `${entry.questions.length} ${solo ? 'stories' : 'conversations'}` : 'Planned'}</option>)}</select>
        <p id="test-help">{solo ? 'Choose a story set and a narrator voice. These fictional practice stories use browser-generated speech and include vocabulary beyond your Kaishi levels.' : daily ? 'Choose a situation set. These original practice scripts use browser voices and vocabulary beyond your Kaishi list. Your answers for each set are saved on this device.' : 'Each test is separate and cumulative: 1–80 includes vocabulary from words 1 through 80. Your answers for each test are saved on this device.'}</p>
      </div>
      <div className="tip">
        <label htmlFor="question-jump"><strong>Choose a question </strong></label>
        <select id="question-jump" value={current} onChange={event => { jump(Number(event.target.value)); }}>
          {test.questions.map((question,i) => <option key={i} value={i}>{i + 1}. {question.situation} · {responses[i] === undefined ? 'Not answered' : responses[i] === question.answer ? 'Correct' : 'Review'}</option>)}
        </select>
        <p>{answeredCount} / {test.questions.length} answered. Your answers are saved on this device, even if you reload or switch tests. Press Practice again on the results screen to start over.</p>
        
        {finished && <button className="primary" onClick={() => jump(current)}>Review selected question</button>}
      </div>
      <div className="layout">
        <section className="card" aria-label="Listening exercise">
          {finished ? <div className="results" aria-live="polite">
            <div className="eyebrow">{test.label} · Practice complete</div><h2>Nice work showing up.</h2>
            <div className="result-score">{score} / {test.questions.length}</div>
            <p>{score === test.questions.length ? 'You caught every detail. Keep listening!' : 'Review your answers, then try again to build your confidence.'}</p>
            <ol className="review">{test.questions.map((question, i) => <li key={i}>
              <strong>{i + 1}. {responses[i] === question.answer ? '✓' : '✕'} {question.question}</strong>
              <p>Your answer: {question.choices[responses[i]]} · Correct answer: {question.choices[question.answer]}</p><p>{question.explanation}</p>
            </li>)}</ol><button className="primary" onClick={() => restart()}>Practice again ↻</button>
          </div> : <>
            <div className="card-top"><span className="small">Question {current + 1} of {test.questions.length}</span><span className="badge">{solo ? 'Solo story' : daily ? 'Daily life' : 'Kaishi'} · {test.label}</span></div>
            <progress value={answeredCount} max={test.questions.length} aria-label="Questions completed" />
            <div className="content">
              <div className={`audio-box${speech.playing && !speech.paused ? ' playing' : ''}`}>
                <p id="situation">{q.situation}</p>
                <div className="wave" aria-hidden="true">{[12,23,32,19,38,27,16,30,21,11].map((height,i) => <span key={i} style={{height, animationDelay:`${i * .08}s`}} />)}</div>
                <button className="primary" id="play" disabled={!voicesReady} onClick={() => speech.play(q.lines)}>{speech.playing ? (speech.paused ? '▶ Resume audio' : 'Ⅱ Pause audio') : '▶ Play audio'}</button>
                {speech.playing && <button type="button" className="primary" style={{ marginLeft: 8 }} onClick={speech.stopPlayback}>■ Stop</button>}
                <div className="audio-controls"><label htmlFor="speed">Playback speed</label><select id="speed" value={speech.rate} onChange={e => speech.changeRate(Number(e.target.value))}><option value={.8}>Slow</option><option value={1}>Normal</option></select></div>
                {(solo ? (['A'] as const) : (['A','B'] as const)).map(speaker => <div className="audio-controls voice-controls" key={speaker}>
                  <label htmlFor={`voice-${speaker}`}>{solo ? 'Narrator voice' : `Speaker ${speaker}`}</label>
                  <select id={`voice-${speaker}`} value={speech.selected[speaker]} disabled={!speech.voices.length} aria-describedby="voice-help" onChange={e => speech.chooseVoice(speaker,e.target.value)}>
                    {!speech.voices.length && <option value="">No Japanese voices available</option>}
                    {speech.voices.map(voice => <option key={speech.voiceKey(voice)} value={speech.voiceKey(voice)}>{voice.name}{voice.localService ? '' : ' · Online'}</option>)}
                  </select>
                </div>)}
                <p className="voice-help" id="voice-help">For Microsoft voices, open this page in Edge. Available voices depend on your browser and device; Edge’s Read Aloud voice list may differ.</p>
                <p id="audio-status" role="status">{speech.status}</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); if (selected !== null && !checked) { const updated = { ...responses, [current]: selected }; setResponses(updated); saveResponses(test.id, updated); } }}>
                <fieldset><legend ref={questionHeading} tabIndex={-1}>{q.question}</legend><div className="choices">
                  {q.choices.map((choice,i) => <div className="choice" key={`${current}-${i}`}>
                    <input id={`answer-${i}`} name="answer" type="radio" checked={selected === i} disabled={checked} onChange={() => setSelected(i)} />
                    <label htmlFor={`answer-${i}`} className={checked && i === q.answer ? 'correct' : checked && i === selected ? 'incorrect' : ''}>
                      <span className="letter" aria-hidden="true">{'ABCD'[i]}</span><span>{choice}</span>
                      {checked && (i === q.answer || i === selected) && <span className="answer-mark">{i === q.answer ? '✓ Correct' : '✕ Your answer'}</span>}
                    </label>
                  </div>)}
                </div></fieldset>
                {checked && <div className={`feedback${selected === q.answer ? '' : ' wrong'}`} role="status">
                  <strong>{selected === q.answer ? 'Well done — that’s right!' : 'Keep going — here’s the answer.'}</strong><p>{q.explanation}</p>
                  <details><summary>Show transcript &amp; translation</summary>{q.lines.map((line,i) => <div key={i}><strong>{solo ? 'Narrator' : `Speaker ${line.speaker}`}</strong><p className="transcript" lang="ja">{line.text}</p><p>{line.translation}</p></div>)}</details>
                </div>}
                {checked && <GrammarUsed kind="listening" setId={test.id} index={current} />}
                <div className="actions"><span className="small">{checked ? 'Replay the clip to hear the answer.' : 'Choose one answer.'}</span>
                  {checked ? <button className="primary" type="button" onClick={next}>{answeredCount === test.questions.length ? 'See results →' : 'Next unanswered →'}</button> : <button className="primary" type="submit" disabled={selected === null}>Check answer →</button>}
                </div>
              </form>
            </div>
          </>}
        </section>
        <aside aria-label="Practice tips and score">
          <div className="tip">{solo ? <><h2>Follow one person’s story</h2><p>Listen for what happened first, what changed, and why. Each story has one narrator. After answering, open the transcript and its vocabulary explanation to check details.</p><p>These are original fictional practice scripts. For a creator’s own recording, choose Real-life stories.</p></> : daily ? <><h2>Practice for everyday life</h2><p>Listen for what each person wants and how the other person responds. Shop conversations use polite Japanese; friends sometimes speak casually. After answering, use the transcript to repeat each role aloud.</p></> : <><h2>Vocabulary for this test</h2><p>Based on the first {test.wordCount} vocabulary entries in your Kaishi export, excluding the welcome card. Dialogues reuse a selection of these words, plus basic particles and verb forms.</p>
            <details key={test.id + '-latest'}><summary>Latest 20 words · {Math.max(1, test.wordCount - 19)}–{test.wordCount}</summary><p className="small">All 20 new entries are practiced in this level. Each word shows a conversation where you can hear it.</p><ol className="small" start={Math.max(1, test.wordCount - 19)}>{test.words.slice(-20).map(([word,reading,meaning],i) => { const example = test.focusCoverage?.find(entry => entry.wordIndex === test.wordCount - 19 + i); return <li key={i}><span lang="ja">{word} ({reading})</span> — {meaning}{example && <span className="small"> · Conversation {example.questionIndex + 1}: <span lang="ja">{example.form}</span></span>}</li>; })}</ol></details>
            <details key={test.id}><summary>See the {test.wordCount}-word study set</summary><ol className="small">{test.words.map(([word,reading,meaning],i) => <li key={i}>{word} ({reading}) — {meaning}</li>)}</ol></details></>}
          </div>
          <div className="topic"><span className="topic-icon" aria-hidden="true">☕</span><div><strong>{test.label}</strong><p>{test.questions.length} {solo ? 'stories' : 'dialogues'} · 4 choices each</p></div></div>
          <div className="tip"><h2>Your session</h2><div className="score-row"><span id="live-score">{score} / {answeredCount}</span><span className="small">correct</span></div><p>One small step toward better listening.</p></div>
          <div className="tip"><h2>Make the most of each clip</h2><p>Listen once for the main idea. Replay to catch details, or switch to slow playback.</p></div>
          <div className="tip"><h2>A little help, when you need it</h2><p>After answering, open the transcript to see the Japanese text and English translation.</p></div>
        </aside>
      </div>
    </main>
    <footer>Audio is generated by your browser. A Japanese text-to-speech voice is required.</footer>
  </div>;
}
