'use client';

import { useEffect, useRef, useState } from 'react';
import KanjiHints from './kanji-hints';
import GrammarUsed from './grammar-used';
import CourseBanner from './course-banner';
import { courseParam, markCourse } from '../lib/course';
import readingBooks from '../data/reading-passages.json';
import { listeningTests, type ListeningTest } from '../data/tests';

const levels = listeningTests.filter((test): test is ListeningTest => test.questions !== null);

export default function ReadingPractice() {
  const [levelId, setLevelId] = useState(levels[0].id);
  const [mode, setMode] = useState<'passages' | 'cards'>('passages');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const level = levels.find(test => test.id === levelId)!;
  const latest = level.words.slice(-20);
  const passages = readingBooks.find(book => book.id === levelId)!.passages;
  const question = passages[index];
  const checked = responses[index] !== undefined;
  const answeredCount = Object.keys(responses).length;
  const score = passages.filter((question,i) => responses[i] === question.answer).length;
  const [word, reading, meaning] = latest[cardIndex];

  // Opened from the course: start on that level (?level=kaishi-1-240).
  useEffect(() => { const wanted = courseParam('level'); if (wanted && levels.some(l => l.id === wanted)) reset(wanted); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function reset(id = levelId) {
    setLevelId(id); setIndex(0); setChoice(null); setResponses({}); setFinished(false);
    setCardIndex(0); setRevealed(false);
  }
  function jump(target: number) {
    
    setIndex(target); setChoice(responses[target] ?? null); setFinished(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next() {
    if (answeredCount === passages.length) { setFinished(true); markCourse('reading', levelId, score); return; }
    const target = Array.from({length: passages.length}, (_,offset) => (index + offset + 1) % passages.length).find(i => responses[i] === undefined);
    if (target !== undefined) jump(target);
  }
  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">Read it. Recognize it. Remember it.</span></header>
    <main>
      <CourseBanner step="Reading" />
      <div className="eyebrow">Kaishi · Reading practice</div>
      <h1>Get familiar with kanji.</h1>
      <p className="intro">Read original short passages written for each level, or recall its latest 20 words. These readings are separate from the listening exercises.</p>
      <div className="tip">
        <label htmlFor="reading-level"><strong>Reading level </strong></label>
        <select id="reading-level" value={levelId} onChange={e => reset(e.target.value)}>{levels.map(test => <option key={test.id} value={test.id}>{test.label}</option>)}</select>
        <p>Changing levels starts a fresh reading attempt. Reading scores are separate from listening scores.</p>
        <div className="reading-controls" role="group" aria-label="Reading mode">
          <button className="primary" aria-pressed={mode === 'passages'} onClick={() => setMode('passages')}>Read passages</button>
          <button className="primary" aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>Latest 20 word cards</button>
        </div>
      </div>
      <div className="tip">
        <label htmlFor="question-jump"><strong>Choose a reading </strong></label>
        <select id="question-jump" value={index} onChange={event => { setMode('passages'); jump(Number(event.target.value)); }}>
          {passages.map((question,i) => <option key={i} value={i}>{i + 1}. {question.title} · {responses[i] === undefined ? 'Not answered' : responses[i] === question.answer ? 'Correct' : 'Review'}</option>)}
        </select>
        <p>{answeredCount} / {passages.length} answered. Checked answers are kept when you switch questions. Changing levels or sets resets the attempt.</p>
        {mode === 'cards' && <p>Selecting a reading opens passage mode.</p>}
        {finished && <button className="primary" onClick={() => jump(index)}>Review selected question</button>}
      </div>
      <div className="layout">
        <section className="card" aria-label="Reading exercise">
          {mode === 'cards' ? <div className="content">
            <span className="eyebrow">Word {cardIndex + 1} of 20 · Entry {level.wordCount - 19 + cardIndex}</span>
            <h2 className="kanji-card" lang="ja">{word}</h2>
            <p className="small">Say the reading and meaning, then reveal the answer. Kana-only entries are included too.</p>
            <button className="primary" aria-expanded={revealed} aria-controls="word-answer" onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide reading & meaning' : 'Reveal reading & meaning'}</button>
            <div id="word-answer" hidden={!revealed} className="tip">
              <p className="reading-kana" lang="ja">{reading}</p><p>{meaning.replace(/&nbsp;/g,' ')}</p>
            </div>
            <div className="reading-controls">
              <button className="primary" disabled={cardIndex === 0} onClick={() => {setCardIndex(cardIndex - 1); setRevealed(false);}}>← Previous word</button>
              <button className="primary" onClick={() => {setCardIndex((cardIndex + 1) % 20); setRevealed(false);}}>{cardIndex === 19 ? 'Review from the start ↻' : 'Next word →'}</button>
            </div>
            <p className="small">If two entries share a spelling, check their separate readings and meanings—for example, 人 can be ひと or じん.</p>
          </div> : finished ? <div className="results">
            <h2 ref={heading} tabIndex={-1}>Reading complete</h2>
            <div className="result-score" role="status">{score} / {passages.length}</div>
            <ol className="review">{passages.map((q,i) => <li key={i}><strong>{i + 1}. {q.question}</strong><p>Your answer: {q.choices[responses[i]]}</p><p>Correct answer: {q.choices[q.answer]}</p><p>{q.explanation}</p></li>)}</ol>
            <button className="primary" onClick={() => reset()}>Read again ↻</button>
          </div> : <>
            <div className="card-top"><span className="small">Reading {index + 1} of {passages.length}</span><span className="badge">{level.label}</span></div>
            <progress max={passages.length} value={answeredCount} aria-label="Readings completed" />
            <div className="content">
              <h2 ref={heading} tabIndex={-1}>{question.title}</h2>
              <p className="small">Point at an underlined word for kana and meaning. You can also tap it or focus it with Tab. Hints cover matching Kaishi vocabulary, not every kanji or inflection.</p>
              <article className="reading-dialogue"><p className="reading-line" lang="ja"><KanjiHints key={levelId + '-' + index} text={question.text} /></p></article>
              <details key={levelId + '-' + index}><summary>Show English translation</summary><p>{question.translation}</p></details>
              <GrammarUsed kind="reading" setId={levelId} index={index} />
              <form onSubmit={e => {e.preventDefault(); if (choice !== null && !checked) setResponses(previous => ({ ...previous, [index]: choice }));}}>
                <fieldset><legend>{question.question}</legend><div className="choices">{question.choices.map((answer,i) => <div className="choice" key={i}>
                  <input type="radio" id={'read-answer-' + i} name="reading-answer" checked={choice === i} disabled={checked} onChange={() => setChoice(i)} />
                  <label htmlFor={'read-answer-' + i} className={checked && i === question.answer ? 'correct' : checked && i === choice ? 'incorrect' : ''}><span className="letter" aria-hidden="true">{'ABCD'[i]}</span><span>{answer}</span>{checked && (i === question.answer || i === choice) && <span className="answer-mark">{i === question.answer ? '✓ Correct' : '✕ Your answer'}</span>}</label>
                </div>)}</div></fieldset>
                {checked && <div className="feedback" role="status"><strong>{choice === question.answer ? 'Correct!' : 'Read the passage again and look for the clue.'}</strong><p>{question.explanation}</p></div>}
                {checked ? <button type="button" className="primary" onClick={next}>{answeredCount === passages.length ? 'See reading results →' : 'Next unanswered →'}</button> : <button className="primary" disabled={choice === null}>Check answer →</button>}
              </form>
            </div>
          </>}
        </section>
        <aside>
          <div className="tip"><h2>Your newest 20 words</h2><p>Entries {level.wordCount - 19}–{level.wordCount}. Try recalling the reading before opening a word.</p>
            <details key={levelId}><summary>Show / hide vocabulary help</summary><ol start={level.wordCount - 19} className="small">{latest.map(([text,kana,definition],i) => <li key={i}><details><summary lang="ja">{text}</summary><span lang="ja">{kana}</span> — {definition.replace(/&nbsp;/g,' ')}</details></li>)}</ol></details>
          </div>
          <div className="tip"><h2>How to practice</h2><p>Read the Japanese without English first. Say each line aloud, then check the words you could not read. Use the vocabulary cards to check kanji readings, then reread the passage without help.</p></div>
          <div className="tip"><h2>Reading and meaning</h2><p>Some kanji have several readings. Learn each word in its sentence, and notice changes such as 見る → 見て. Word-card kana shows the vocabulary entry’s reading, not a full sentence transcription.</p></div>
        </aside>
      </div>
    </main>
  </div>;
}
