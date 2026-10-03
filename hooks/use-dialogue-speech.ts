'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DialogueLine, Speaker } from '../data/tests';

const voiceKey = (voice: SpeechSynthesisVoice) => JSON.stringify([voice.voiceURI, voice.name, voice.lang]);

export function useDialogueSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<Record<Speaker, string>>({ A: '', B: '' });
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('Loading Japanese voices…');
  const generation = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const preferences = useRef<Record<Speaker, string>>({ A: '', B: '' });

  const stop = useCallback(() => {
    generation.current++;
    window.speechSynthesis?.cancel();
    utterance.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) { setStatus('This browser does not support speech playback.'); return; }
    for (const speaker of ['A', 'B'] as const) {
      try { preferences.current[speaker] = localStorage.getItem(`kiku-voice-${speaker}`) || (speaker === 'A' ? localStorage.getItem('kiku-japanese-voice') : '') || ''; } catch {}
    }
    const load = () => {
      const rank = (v: SpeechSynthesisVoice) => /Microsoft/i.test(v.name) ? (/Natural|Neural/i.test(v.name) ? 3 : 2) : v.default ? 1 : 0;
      const available = synth.getVoices().filter(v => /^ja(?:[-_]|$)/i.test(v.lang)).sort((a,b) => rank(b)-rank(a));
      const a = available.find(v => voiceKey(v) === preferences.current.A) || available[0];
      const b = available.find(v => voiceKey(v) === preferences.current.B) || available.find(v => v !== a) || a;
      setVoices(available);
      setSelected({ A: a ? voiceKey(a) : '', B: b ? voiceKey(b) : '' });
      setStatus(!available.length ? 'No Japanese voices available. Enable a Japanese speech voice on your device, then reload.' : available.length === 1 ? 'Only one Japanese voice is available; both speakers will use it.' : 'Choose a voice for each speaker, then play.');
    };
    load();
    synth.addEventListener('voiceschanged', load);
    window.addEventListener('pagehide', stop);
    return () => { synth.removeEventListener('voiceschanged', load); window.removeEventListener('pagehide', stop); generation.current++; synth.cancel(); };
  }, [stop]);

  const play = (lines: DialogueLine[]) => {
    if (playing) { stop(); setStatus('Playback stopped. Press play to listen again.'); return; }
    if (!selected.A || !selected.B) return;
    stop();
    const id = generation.current;
    setPlaying(true);
    const speakLine = (index: number) => {
      if (id !== generation.current) return;
      if (index === lines.length) { stop(); setStatus('Conversation complete. Press play to listen again.'); return; }
      const line = lines[index];
      const speech = new SpeechSynthesisUtterance(line.text);
      utterance.current = speech;
      speech.lang = 'ja-JP'; speech.rate = rate;
      speech.voice = voices.find(v => voiceKey(v) === selected[line.speaker]) || null;
      speech.onstart = () => { if (id === generation.current) setStatus(`Speaker ${line.speaker} speaking · Line ${index + 1} of ${lines.length}`); };
      speech.onend = () => speakLine(index + 1);
      speech.onerror = () => { if (id === generation.current) { stop(); setStatus('Audio could not play. Try another voice or check your connection for online voices.'); } };
      setStatus(`Loading Speaker ${line.speaker}…`);
      window.speechSynthesis.speak(speech);
    };
    speakLine(0);
  };
  const chooseVoice = (speaker: Speaker, key: string) => {
    stop(); preferences.current[speaker] = key;
    setSelected(previous => ({ ...previous, [speaker]: key }));
    try { localStorage.setItem(`kiku-voice-${speaker}`, key); } catch {}
    setStatus(`Speaker ${speaker} updated. Press play to restart the conversation.`);
  };
  const changeRate = (value: number) => { stop(); setRate(value); setStatus('Speed updated. Press play to restart the conversation.'); };
  const reset = () => { stop(); setStatus(voices.length ? 'Press play to listen to the conversation.' : 'No Japanese voices available.'); };
  return { voices, selected, rate, playing, status, play, reset, chooseVoice, changeRate, voiceKey };
}
