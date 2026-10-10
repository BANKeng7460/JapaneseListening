'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DialogueLine, Speaker } from '../data/tests';

const voiceKey = (voice: SpeechSynthesisVoice) => JSON.stringify([voice.voiceURI, voice.name, voice.lang]);

export function useDialogueSpeech(solo = false) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selected, setSelected] = useState<Record<Speaker, string>>({ A: '', B: '' });
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const pendingLine = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState('Loading Japanese voices…');
  const generation = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const preferences = useRef<Record<Speaker, string>>({ A: '', B: '' });
  // What is being spoken right now, for highlighting the transcript: line index and character offset.
  const [position, setPosition] = useState<{ line: number; char: number; length: number } | null>(null);

  const stop = useCallback(() => {
    generation.current++;
    window.speechSynthesis?.cancel();
    if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
    pausedRef.current = false;
    pendingLine.current = null;
    setPaused(false);
    utterance.current = null;
    setPlaying(false);
    setPosition(null);
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) { setStatus('This browser does not support speech playback.'); return; }
    for (const speaker of ['A', 'B'] as const) {
      try { preferences.current[speaker] = localStorage.getItem(solo ? 'kiku-narrator-voice' : `kiku-voice-${speaker}`) || (speaker === 'A' ? localStorage.getItem('kiku-japanese-voice') : '') || ''; } catch {}
    }
    const load = () => {
      const rank = (v: SpeechSynthesisVoice) => /Microsoft/i.test(v.name) ? (/Natural|Neural/i.test(v.name) ? 3 : 2) : v.default ? 1 : 0;
      const available = synth.getVoices().filter(v => /^ja(?:[-_]|$)/i.test(v.lang)).sort((a,b) => rank(b)-rank(a));
      const a = available.find(v => voiceKey(v) === preferences.current.A) || available[0];
      const b = available.find(v => voiceKey(v) === preferences.current.B) || available.find(v => v !== a) || a;
      setVoices(available);
      setSelected({ A: a ? voiceKey(a) : '', B: b ? voiceKey(b) : '' });
      setStatus(!available.length ? 'No Japanese voices available. Enable a Japanese speech voice on your device, then reload.' : solo ? 'Choose a narrator voice, then play the story.' : available.length === 1 ? 'Only one Japanese voice is available; both speakers will use it.' : 'Choose a voice for each speaker, then play.');
    };
    load();
    synth.addEventListener('voiceschanged', load);
    window.addEventListener('pagehide', stop);
    return () => { synth.removeEventListener('voiceschanged', load); window.removeEventListener('pagehide', stop); generation.current++; synth.cancel(); if (synth.paused) synth.resume(); };
  }, [stop, solo]);

  const play = (lines: DialogueLine[]) => {
    if (playing) {
      if (pausedRef.current) {
        pausedRef.current = false;
        setPaused(false);
        window.speechSynthesis.resume();
        setStatus(solo ? 'Resuming story…' : 'Resuming conversation…');
        const next = pendingLine.current;
        pendingLine.current = null;
        next?.();
      } else {
        pausedRef.current = true;
        setPaused(true);
        window.speechSynthesis.pause();
        setStatus('Paused. Press Resume to continue.');
      }
      return;
    }
    start(lines, 0, 0);
  };

  /** Plays from a given line and character (clicking the transcript), then continues to the end. */
  const playFrom = (lines: DialogueLine[], line: number, char = 0) => start(lines, line, char);

  function start(lines: DialogueLine[], fromLine: number, fromChar: number) {
    if (lines.some(line => !selected[line.speaker])) return;
    stop();
    const id = generation.current;
    setPlaying(true);
    const speakLine = (index: number, offset = 0) => {
      if (id !== generation.current) return;
      if (pausedRef.current) { pendingLine.current = () => speakLine(index); return; }
      if (index === lines.length) { stop(); setStatus(solo ? 'Story complete. Press play to listen again.' : 'Conversation complete. Press play to listen again.'); return; }
      const line = lines[index];
      const speech = new SpeechSynthesisUtterance(line.text.slice(offset));
      utterance.current = speech;
      speech.lang = 'ja-JP'; speech.rate = rate;
      speech.voice = voices.find(v => voiceKey(v) === selected[line.speaker]) || null;
      // Word boundaries (Edge / Microsoft voices) move the highlight word by word; other voices highlight the line.
      speech.onboundary = event => { if (id === generation.current) setPosition({ line: index, char: offset + event.charIndex, length: event.charLength || 1 }); };
      speech.onstart = () => { if (id === generation.current) setPosition({ line: index, char: offset, length: 0 }); if (id === generation.current && !pausedRef.current) setStatus(solo ? 'Narrator speaking…' : `Speaker ${line.speaker} speaking · Line ${index + 1} of ${lines.length}`); };
      speech.onend = () => speakLine(index + 1);
      speech.onerror = event => {
        if (id !== generation.current) return;
        stop();
        // Browsers block speech until the visitor has interacted with the page (e.g. on first load).
        setStatus(event.error === 'not-allowed' ? 'Your browser blocked autoplay. Press Play audio to start.' : 'Audio could not play. Try another voice or check your connection for online voices.');
      };
      setStatus(solo ? 'Loading narrator…' : `Loading Speaker ${line.speaker}…`);
      window.speechSynthesis.speak(speech);
    };
    speakLine(fromLine, fromChar);
  }
  const chooseVoice = (speaker: Speaker, key: string) => {
    stop(); preferences.current[speaker] = key;
    setSelected(previous => ({ ...previous, [speaker]: key }));
    try { localStorage.setItem(solo ? 'kiku-narrator-voice' : `kiku-voice-${speaker}`, key); } catch {}
    setStatus(solo ? 'Narrator updated. Press play to restart the story.' : `Speaker ${speaker} updated. Press play to restart the conversation.`);
  };
  const changeRate = (value: number) => { stop(); setRate(value); setStatus('Speed updated. Press play to restart.'); };
  const reset = () => { stop(); setStatus(voices.length ? 'Press play to listen.' : 'No Japanese voices available.'); };
  const stopPlayback = () => { stop(); setStatus('Playback stopped. Press play to restart.'); };
  return { voices, selected, rate, playing, paused, status, position, play, playFrom, stopPlayback, reset, chooseVoice, changeRate, voiceKey };
}
