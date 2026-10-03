'use client';

import { useRef, useState } from 'react';
import { walkingStory as story } from '../data/stories';

export default function StoryPractice() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const score = story.questions.filter((q,i) => answers[i] === q.answer).length;
  const complete = story.questions.every((_,i) => answers[i] !== undefined);
  function startQuiz() {
    setStarted(true);
    requestAnimationFrame(() => heading.current?.focus());
  }
  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">Listen to someone’s real day.</span></header>
    <main>
      <div className="eyebrow">Real-life stories · Personal audio blogs</div>
      <h1>A real voice. A little story.</h1>
      <p className="intro">Listen to the original recording, then check what you understood.</p>
      <div className="layout">
        <section className="card" aria-label="Original story and listening quiz">
          <div className="card-top"><span className="badge">Original human recording</span><span className="small">Episode {story.episode}</span></div>
          <div className="content">
            <h2 lang="ja">{story.title}</h2>
            <p className="small">{story.creator} · <time dateTime={story.published}>4 January 2021</time></p>
            <p>A short personal account of Mari’s walking routine. Listen for the place, the time, and what she enjoys about it.</p>
            <iframe className="story-player" src={story.embedUrl} title="SAKURA TIPS episode 69 — original audio by Mari" loading="lazy" allow="autoplay; encrypted-media" />
            <p className="small">If the player does not load, <a href={story.sourceUrl} target="_blank" rel="noreferrer">listen on Mari’s original episode page</a>, then return here for the quiz.</p>
            <p className="small">Story and recording: <a href={story.sourceUrl} target="_blank" rel="noreferrer">Mari / SAKURA TIPS</a>. The player streams the original episode. Practice questions are independently written for Kiku.</p>
            {!started ? <div className="tip"><p>Listen first—questions stay hidden until you’re ready. You can replay the episode as often as you like.</p><button className="primary" onClick={startQuiz}>I’ve listened · Start questions →</button></div> : <section aria-label="Comprehension questions">
              <h2 tabIndex={-1} ref={heading}>What did you hear?</h2>
              <form onSubmit={e => { e.preventDefault(); if (complete && !checked) setChecked(true); }}>
                {story.questions.map((q,i) => <fieldset key={i}>
                  <legend>{i + 1}. {q.question}</legend>
                  <div className="choices">{q.choices.map((choice,j) => <div className="choice" key={j}>
                    <input type="radio" name={`story-${i}`} id={`story-${i}-${j}`} checked={answers[i] === j} disabled={checked} onChange={() => setAnswers(previous => ({...previous, [i]:j}))} />
                    <label htmlFor={`story-${i}-${j}`} className={checked && j === q.answer ? 'correct' : checked && j === answers[i] ? 'incorrect' : ''}>
                      <span className="letter" aria-hidden="true">{'ABCD'[j]}</span><span>{choice}</span>
                      {checked && (j === q.answer || j === answers[i]) && <span className="answer-mark">{j === q.answer ? '✓ Correct' : '✕ Your answer'}</span>}
                    </label>
                  </div>)}</div>
                  {checked && <p className="small">{q.explanation}</p>}
                </fieldset>)}
                {!checked ? <div className="actions"><span className="small">{Object.keys(answers).length} / {story.questions.length} answered</span><button className="primary" disabled={!complete}>Check answers →</button></div> : <div className="feedback" role="status">
                  <strong>Your score: {score} / {story.questions.length}</strong>
                  <p>Replay the original audio and review the details you missed.</p>
                  <p><a href={story.sourceUrl} target="_blank" rel="noreferrer">Read Mari’s Japanese transcript and English translation</a></p>
                  <button type="button" className="primary" onClick={() => {setAnswers({}); setChecked(false); heading.current?.focus();}}>Try questions again ↻</button>
                </div>}
              </form>
            </section>}
          </div>
        </section>
        <aside>
          <div className="tip"><h2>About this genre</h2><p>Personal stories from Japanese creators, using their own recordings and delivery. This episode uses slow Japanese, but includes vocabulary and grammar beyond your first 80 Kaishi words.</p></div>
          <div className="tip"><h2>Before you listen</h2><p>Try one listen for the general idea. On your second listen, pay attention to numbers and reasons.</p><details><summary>Preview five useful words</summary><ul className="small">{story.vocabulary.map(([word,reading,meaning]) => <li key={word}><span lang="ja">{word} ({reading})</span> — {meaning}</li>)}</ul></details></div>
          <div className="tip"><h2>Original creator</h2><p><a href={story.sourceUrl} target="_blank" rel="noreferrer">Visit SAKURA TIPS</a> for the full episode and its Japanese/English transcript.</p></div>
        </aside>
      </div>
    </main>
    <footer>Original audio hosted by the creator’s podcast provider. Internet access is required.</footer>
  </div>;
}
