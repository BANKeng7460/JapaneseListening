'use client';

import { useRef, useState } from 'react';
import { listeningTests, type ListeningTest } from '../data/tests';
import { useDialogueSpeech } from '../hooks/use-dialogue-speech';

export default function ListeningPractice() {
  const [test, setTest] = useState<ListeningTest>(listeningTests[0] as ListeningTest);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [responses, setResponses] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const speech = useDialogueSpeech();
  const questionHeading = useRef<HTMLLegendElement>(null);
  const q = test.questions[current];
  const checked = responses.length > current;
  const score = responses.filter((answer, i) => answer === test.questions[i].answer).length;
  function restart(nextTest = test) {
    speech.reset(); setTest(nextTest); setCurrent(0); setSelected(null); setResponses([]); setFinished(false);
  }
  function next() {
    speech.reset();
    if (current + 1 === test.questions.length) setFinished(true);
    else { setCurrent(current + 1); setSelected(null); requestAnimationFrame(() => questionHeading.current?.focus()); }
  }
  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">A little listening, every day.</span></header>
    <main>
      <div className="eyebrow">Japanese listening · Kaishi 1.5k</div>
      <h1>Listen closely. Learn naturally.</h1>
      <p className="intro">Choose a listening test for the words you’ve learned. Earlier tests stay available as your vocabulary grows.</p>
      <div className="tip"><label htmlFor="test-set"><strong>Listening test </strong></label>
        <select id="test-set" value={test.id} aria-describedby="test-help" onChange={event => {
          const entry = listeningTests.find(item => item.id === event.target.value);
          if (entry?.questions) restart(entry);
        }}>{listeningTests.map(entry => <option key={entry.id} value={entry.id} disabled={!entry.questions}>{entry.label} · {entry.questions ? `${entry.questions.length} conversations` : 'Planned'}</option>)}</select>
        <p id="test-help">Each test is separate and cumulative: 1–80 includes vocabulary from words 1 through 80. Changing tests starts a fresh attempt.</p>
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
            <div className="card-top"><span className="small">Question {current + 1} of {test.questions.length}</span><span className="badge">Kaishi · {test.label}</span></div>
            <progress value={responses.length} max={test.questions.length} aria-label="Questions completed" />
            <div className="content">
              <div className={`audio-box${speech.playing ? ' playing' : ''}`}>
                <p id="situation">{q.situation}</p>
                <div className="wave" aria-hidden="true">{[12,23,32,19,38,27,16,30,21,11].map((height,i) => <span key={i} style={{height, animationDelay:`${i * .08}s`}} />)}</div>
                <button className="primary" id="play" disabled={!speech.selected.A || !speech.selected.B} onClick={() => speech.play(q.lines)}>{speech.playing ? '■ Stop audio' : '▶ Play audio'}</button>
                <div className="audio-controls"><label htmlFor="speed">Playback speed</label><select id="speed" value={speech.rate} onChange={e => speech.changeRate(Number(e.target.value))}><option value={.8}>Slow</option><option value={1}>Normal</option></select></div>
                {(['A','B'] as const).map(speaker => <div className="audio-controls voice-controls" key={speaker}>
                  <label htmlFor={`voice-${speaker}`}>Speaker {speaker}</label>
                  <select id={`voice-${speaker}`} value={speech.selected[speaker]} disabled={!speech.voices.length} aria-describedby="voice-help" onChange={e => speech.chooseVoice(speaker,e.target.value)}>
                    {!speech.voices.length && <option value="">No Japanese voices available</option>}
                    {speech.voices.map(voice => <option key={speech.voiceKey(voice)} value={speech.voiceKey(voice)}>{voice.name}{voice.localService ? '' : ' · Online'}</option>)}
                  </select>
                </div>)}
                <p className="voice-help" id="voice-help">For Microsoft voices, open this page in Edge. Available voices depend on your browser and device; Edge’s Read Aloud voice list may differ.</p>
                <p id="audio-status" role="status">{speech.status}</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); if (selected !== null && !checked) setResponses([...responses,selected]); }}>
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
                  <details><summary>Show transcript &amp; translation</summary>{q.lines.map((line,i) => <div key={i}><strong>Speaker {line.speaker}</strong><p className="transcript" lang="ja">{line.text}</p><p>{line.translation}</p></div>)}</details>
                </div>}
                <div className="actions"><span className="small">{checked ? 'Replay the clip to hear the answer.' : 'Choose one answer.'}</span>
                  {checked ? <button className="primary" type="button" onClick={next}>{current + 1 === test.questions.length ? 'See results →' : 'Next question →'}</button> : <button className="primary" type="submit" disabled={selected === null}>Check answer →</button>}
                </div>
              </form>
            </div>
          </>}
        </section>
        <aside aria-label="Practice tips and score">
          <div className="tip"><h2>Vocabulary for this test</h2><p>Based on the first {test.wordCount} vocabulary entries in your Kaishi export, excluding the welcome card. Dialogues reuse a selection of these words, plus basic particles and verb forms.</p>
            <details key={test.id}><summary>See the {test.wordCount}-word study set</summary><ol className="small">{test.words.map(([word,reading,meaning],i) => <li key={i}>{word} ({reading}) — {meaning}</li>)}</ol></details>
          </div>
          <div className="topic"><span className="topic-icon" aria-hidden="true">☕</span><div><strong>{test.label}</strong><p>{test.questions.length} dialogues · 4 choices each</p></div></div>
          <div className="tip"><h2>Your session</h2><div className="score-row"><span id="live-score">{score} / {responses.length}</span><span className="small">correct</span></div><p>One small step toward better listening.</p></div>
          <div className="tip"><h2>Make the most of each clip</h2><p>Listen once for the main idea. Replay to catch details, or switch to slow playback.</p></div>
          <div className="tip"><h2>A little help, when you need it</h2><p>After answering, open the transcript to see the Japanese text and English translation.</p></div>
        </aside>
      </div>
    </main>
    <footer>Audio is generated by your browser. A Japanese text-to-speech voice is required.</footer>
  </div>;
}
