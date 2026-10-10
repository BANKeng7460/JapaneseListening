// Speaks Japanese with the voice saved on the grammar or listening pages, if any.
export function speakJapanese(text: string) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  let saved = '';
  try { saved = localStorage.getItem('kiku-grammar-voice') || localStorage.getItem('kiku-voice-A') || ''; } catch {}
  const voices = synth.getVoices().filter(v => /^ja(?:[-_]|$)/i.test(v.lang));
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.voice = voices.find(v => JSON.stringify([v.voiceURI, v.name, v.lang]) === saved) || voices[0] || null;
  synth.cancel();
  synth.speak(utterance);
}
