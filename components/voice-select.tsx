'use client';

import { useEffect, useState } from 'react';
import { japaneseVoices, saveVoice, savedVoiceId, speakJapanese, voiceId } from '../lib/speech';

// Browser voice picker used by the grammar page and the mistake game. Picking a voice plays a short sample.
export default function VoiceSelect({ id, help }: { id: string; help: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState('');

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => {
      const available = japaneseVoices(), saved = savedVoiceId();
      setVoices(available);
      setVoice(current => available.some(v => voiceId(v) === current) ? current : available.some(v => voiceId(v) === saved) ? saved : available[0] ? voiceId(available[0]) : '');
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  function choose(key: string) {
    setVoice(key);
    saveVoice(key);
    speakJapanese('こんにちは。一緒に日本語を勉強しましょう。');
  }

  return <>
    <div className="audio-controls voice-controls">
      <label htmlFor={id}>Browser voice</label>
      <select id={id} value={voice} disabled={!voices.length} aria-describedby={`${id}-help`} onChange={e => choose(e.target.value)}>
        {!voices.length && <option value="">No Japanese voices available</option>}
        {voices.map(v => <option key={voiceId(v)} value={voiceId(v)}>{v.name}{v.localService ? '' : ' · Online'}</option>)}
      </select>
    </div>
    <p id={`${id}-help`} className="voice-select-help">{help}</p>
  </>;
}
