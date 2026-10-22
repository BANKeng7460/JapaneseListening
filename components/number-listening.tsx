'use client';

import { useState } from 'react';
import { useDialogueSpeech } from '../hooks/use-dialogue-speech';

const digit = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

function readNumber(value: number) {
  if (value === 0) return 'れい';
  const parts: string[] = [];
  const thousands = Math.floor(value / 1000);
  const hundreds = Math.floor(value / 100) % 10;
  const tens = Math.floor(value / 10) % 10;
  const ones = value % 10;
  if (thousands) parts.push(({ 1: 'せん', 3: 'さんぜん', 8: 'はっせん' } as Record<number, string>)[thousands] ?? `${digit[thousands]}せん`);
  if (hundreds) parts.push(({ 1: 'ひゃく', 3: 'さんびゃく', 6: 'ろっぴゃく', 8: 'はっぴゃく' } as Record<number, string>)[hundreds] ?? `${digit[hundreds]}ひゃく`);
  if (tens) parts.push(tens === 1 ? 'じゅう' : `${digit[tens]}じゅう`);
  if (ones) parts.push(digit[ones]);
  return parts.join('');
}

function newNumber() { return Math.floor(Math.random() * 10000); }

export default function NumberListening() {
  const [number, setNumber] = useState(newNumber);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const speech = useDialogueSpeech(true);
  const lines = [{ speaker: 'A' as const, text: readNumber(number), translation: '' }];

  function check(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim() || checked) return;
    const correct = Number(answer.replace(/,/g, '').trim()) === number;
    if (correct) setScore(value => value + 1);
    setChecked(true);
  }

  function next() {
    speech.reset();
    setNumber(newNumber()); setAnswer(''); setChecked(false);
    if (round === 10) { setRound(1); setScore(0); } else setRound(value => value + 1);
  }

  return <div className="shell">
    <header><div className="brand"><span className="brand-mark" lang="ja">き</span> kiku.</div><span className="header-note">A little listening, every day.</span></header>
    <main>
      <div className="eyebrow">Japanese listening · Numbers</div>
      <h1>Listen to the number.</h1>
      <p className="intro">Hear a number in Japanese, then type the digits you heard. Numbers are from 0 to 9,999.</p>
      <div className="layout">
        <section className="card" aria-label="Number listening exercise">
          <div className="card-top"><span className="small">Question {round} of 10</span><span className="badge">{score} correct</span></div>
          <progress value={round - 1} max={10} aria-label="Questions completed" />
          <div className="content">
            <div className={`audio-box${speech.playing && !speech.paused ? ' playing' : ''}`}>
              <p>Listen carefully. You can replay as often as you like.</p>
              <div className="wave" aria-hidden="true">{[12,23,32,19,38,27,16,30,21,11].map((height,i) => <span key={i} style={{ height, animationDelay: `${i * .08}s` }} />)}</div>
              <button className="primary" type="button" disabled={!speech.selected.A} onClick={() => speech.play(lines)}>{speech.playing ? (speech.paused ? '▶ Resume audio' : 'Ⅱ Pause audio') : '▶ Play number'}</button>
              {speech.playing && <button className="primary" type="button" style={{ marginLeft: 8 }} onClick={speech.stopPlayback}>■ Stop</button>}
              <div className="audio-controls voice-controls">
                <label htmlFor="number-voice">Japanese voice</label>
                <select id="number-voice" value={speech.selected.A} disabled={!speech.voices.length} onChange={event => speech.chooseVoice('A', event.target.value)}>
                  {!speech.voices.length && <option value="">No Japanese voices available</option>}
                  {speech.voices.map(voice => <option key={speech.voiceKey(voice)} value={speech.voiceKey(voice)}>{voice.name}{voice.localService ? '' : ' · Online'}</option>)}
                </select>
              </div>
              <p id="number-audio-status" role="status">{speech.status}</p>
            </div>
            <form onSubmit={check}>
              <label htmlFor="number-answer"><strong>Your answer</strong></label>
              <input id="number-answer" className="number-answer" type="text" inputMode="numeric" autoComplete="off" placeholder="Type the digits" value={answer} disabled={checked} onChange={event => setAnswer(event.target.value)} aria-describedby="answer-help" />
              <p id="answer-help" className="small">Enter digits, for example 42.</p>
              {checked && <div className={`feedback${Number(answer.replace(/,/g, '').trim()) === number ? '' : ' wrong'}`} role="status">
                <strong>{Number(answer.replace(/,/g, '').trim()) === number ? 'Correct!' : 'Not quite.'}</strong>
                <p>The number was <strong>{number.toLocaleString('en-US')}</strong>.</p>
                <p lang="ja">Japanese: {readNumber(number)}</p>
              </div>}
              <div className="actions">
                <span className="small">{checked ? 'Ready for another number?' : 'Type your answer, then check it.'}</span>
                {checked ? <button className="primary" type="button" onClick={next}>{round === 10 ? 'Start a new round' : 'Next number →'}</button> : <button className="primary" type="submit" disabled={!answer.trim()}>Check answer →</button>}
              </div>
            </form>
          </div>
        </section>
        <aside>
          <div className="tip"><h2>Your session</h2><div className="score-row"><span id="live-score">{score} / {round - 1 + (checked ? 1 : 0)}</span><span className="small">correct</span></div><p>Ten numbers per round.</p></div>
          <div className="tip"><h2>Listen for the groups</h2><p>Japanese numbers build from thousands, hundreds, tens, and ones. Replay slowly and listen for each part.</p></div>
        </aside>
      </div>
    </main>
    <footer>Audio is generated by your browser. A Japanese text-to-speech voice is required.</footer>
  </div>;
}
