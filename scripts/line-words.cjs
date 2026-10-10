// Splits every conversation / story line into words (a word plus its endings; particles and punctuation
// stay with their own chunk) so the live transcript highlights and plays 明日 as one word, not 明 + 日.
// Output: public/line-words.json — { [line text]: [chunk lengths] }. Part of npm run levels:build.
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

const dataDir = path.join(__dirname, '..', 'data');
const lines = new Set();
for (const f of fs.readdirSync(dataDir).filter(f => /^kaishi-1-\d+\.json$|^daily-life\.json$|^solo-stories\.json$/.test(f))) {
  const d = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
  for (const test of Array.isArray(d) ? d : [d]) for (const q of test.questions) for (const l of q.lines) lines.add(l.text);
}

kuromoji.builder({ dicPath: path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict') }).build((err, tokenizer) => {
  if (err) throw err;
  const out = {};
  for (const text of lines) {
    const chunks = [];
    for (const t of tokenizer.tokenize(text)) {
      const prev = chunks[chunks.length - 1];
      // Endings join the word before them: 来 + ます, 食べ + ませ + ん, 学生 + さん, punctuation.
      const attach = prev && (t.pos === '助動詞' || t.pos === '記号' || (t.pos === '助詞' && t.pos_detail_1 === '接続助詞' && ['て', 'で'].includes(t.surface_form))
        || (t.pos === '動詞' && ['非自立', '接尾'].includes(t.pos_detail_1)) || (t.pos === '名詞' && t.pos_detail_1 === '接尾') || prev.prefix);
      if (attach) { prev.text += t.surface_form; prev.prefix = t.pos === '接頭詞'; }
      else chunks.push({ text: t.surface_form, prefix: t.pos === '接頭詞' });
    }
    if (chunks.map(c => c.text).join('') !== text) continue; // tokenizer normalized something; fall back to characters
    out[text] = chunks.map(c => c.text.length);
  }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'line-words.json'), JSON.stringify(out));
  console.log(`${Object.keys(out).length} of ${lines.size} transcript lines split into words`);
});
