// Finds which N5/N4 grammar points each reading passage and conversation uses.
// Run after editing passages or scripts: node scripts/grammar-usage.cjs  → data/grammar-usage.json
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');
const matchers = require('./grammar-matchers.cjs');

const data = name => require(path.join(__dirname, '..', 'data', name));
const grammar = data('grammar.json');
// Particles and copula that appear in almost every text; the page lists them separately.
const basic = ['n5-2', 'n5-5', 'n5-11', 'n5-16', 'n5-21', 'n5-34', 'n5-36', 'n5-47', 'n5-48', 'n5-51', 'n5-52', 'n5-59', 'n5-60', 'n5-75', 'n5-79', 'n5-82', 'n5-83'];
const listening = [
  ...['1-20', '1-40', '1-60', '1-80', '1-100', '1-120', '1-140', '1-160', '1-180', '1-200'].map(n => data(`kaishi-${n}.json`)),
  ...data('daily-life.json'), ...data('solo-stories.json'),
];

kuromoji.builder({ dicPath: path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict') }).build((err, tokenizer) => {
  if (err) throw err;
  const sentences = text => text.split(/(?<=[。！？!?])/).map(s => s.replace(/\s+/g, '')).filter(Boolean);
  // Snippets get the word they attach to, e.g. 「てい」 → 「しています」, 「ませまし」 → 「休ませまし」.
  const trim = text => text.length > 18 ? text.slice(0, 17) + '…' : text;
  const kanji = /[一-龯々ァ-ヶー]/;
  function widen(sentence, match) {
    let start = match.index, end = start + match[0].length;
    if (/^[ぁ-ん]/.test(match[0])) {
      // One okurigana kana (not a particle) and then the kanji before it: 「てください」 → 「教えてください」.
      if (start > 1 && /[ぁ-ん]/.test(sentence[start - 1]) && !/[はがをにでともへや]/.test(sentence[start - 1]) && kanji.test(sentence[start - 2])) start--;
      while (start > 0 && match.index - start < 5 && kanji.test(sentence[start - 1])) start--;
    }
    // Finish a word cut off mid-stem: 「と思」 → 「と思いました」.
    if (/[一-龯ゃ]$/.test(match[0])) while (end < sentence.length && end - match.index < match[0].length + 5 && /[ぁ-ん]/.test(sentence[end])) end++;
    return sentence.slice(start, end);
  }
  function tokenSnippet(ts, match) {
    const tokens = ts.trim().split(' ').map(token => token.split('/'));
    const first = ts.slice(0, match.index).trim().split(' ').filter(Boolean).length;
    let last = first + match[0].trim().split(' ').length;
    const start = first > 0 && /^(動詞|形容詞|名詞|助動詞)$/.test(tokens[first - 1][1]) ? first - 1 : first;
    while (last < tokens.length && last - first < 6 && tokens[last][1] === '助動詞') last++;
    return tokens.slice(start, last).map(token => token[0]).join('');
  }
  // Returns [id, snippet] for every grammar point found, in grammar-list order (N5 first).
  function scan(texts) {
    const units = texts.flatMap(sentences).map(s => ({ s, ts: ' ' + tokenizer.tokenize(s).map(x => [x.surface_form, x.pos, x.pos_detail_1, x.pos_detail_2, x.basic_form, x.conjugated_form].join('/')).join(' ') }));
    const found = [];
    for (const point of grammar) {
      const m = matchers[point.id];
      if (!m) continue;
      const hit = units.find(u => (!m.r || m.r.test(u.s)) && (!m.t || m.t.test(u.ts)) && (!m.not || !m.not.test(u.s)));
      if (!hit) continue;
      found.push([point.id, trim(m.r ? widen(hit.s, hit.s.match(m.r)) : tokenSnippet(hit.ts, hit.ts.match(m.t)))]);
    }
    return found;
  }
  const usage = {
    basic,
    reading: Object.fromEntries(data('reading-passages.json').map(book => [book.id, book.passages.map(p => scan([p.text]))])),
    listening: Object.fromEntries(listening.map(test => [test.id, test.questions.map(q => scan(q.lines.map(line => line.text)))])),
  };
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'grammar-usage.json'), JSON.stringify(usage) + '\n');
  const all = [...Object.values(usage.reading), ...Object.values(usage.listening)].flat();
  console.log(`${all.length} texts scanned; average ${(all.reduce((n, f) => n + f.filter(([id]) => !basic.includes(id)).length, 0) / all.length).toFixed(1)} grammar points each (plus basics)`);
});
