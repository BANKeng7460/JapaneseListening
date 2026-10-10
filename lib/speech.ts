// Browser text-to-speech for single Japanese sentences, shared by the grammar page, flashcards and the mistake game.
// One saved voice is used everywhere; it falls back to the voice chosen on the listening pages.
import { toSpeech } from './reading-fix';
export const voiceKey = 'kiku-grammar-voice';
export const voiceId = (voice: SpeechSynthesisVoice) => JSON.stringify([voice.voiceURI, voice.name, voice.lang]);

/** Japanese voices, Microsoft natural voices first (same order as the listening pages). */
export function japaneseVoices() {
  const rank = (v: SpeechSynthesisVoice) => /Microsoft/i.test(v.name) ? (/Natural|Neural/i.test(v.name) ? 3 : 2) : v.default ? 1 : 0;
  return (window.speechSynthesis?.getVoices() ?? []).filter(v => /^ja(?:[-_]|$)/i.test(v.lang)).sort((a, b) => rank(b) - rank(a));
}

export function savedVoiceId() {
  try { return localStorage.getItem(voiceKey) || localStorage.getItem('kiku-voice-A') || localStorage.getItem('kiku-narrator-voice') || ''; } catch { return ''; }
}

export function saveVoice(id: string) {
  try { localStorage.setItem(voiceKey, id); } catch {}
}

export function speakJapanese(text: string) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const voices = japaneseVoices(), saved = savedVoiceId();
  const utterance = new SpeechSynthesisUtterance(toSpeech(text).spoken);
  utterance.lang = 'ja-JP';
  utterance.voice = voices.find(v => voiceId(v) === saved) || voices[0] || null;
  synth.cancel();
  synth.speak(utterance);
}
