// Adds tap-hint entries for conjugated forms used in reading passages (e.g. 落ち着き → 落ち着く),
// copying the dictionary-form entry. Existing entries are never changed. Run after editing passages.
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

const file = path.join(__dirname, '..', 'data', 'word-hints.json');
const hints = JSON.parse(fs.readFileSync(file, 'utf8'));
const books = require('../data/reading-passages.json');

kuromoji.builder({ dicPath: path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict') }).build((err, tokenizer) => {
  if (err) throw err;
  const added = [];
  for (const passage of books.flatMap(b => b.passages)) {
    const tokens = tokenizer.tokenize(passage.text);
    tokens.forEach((t, i) => {
      if (!['動詞', '形容詞'].includes(t.pos) || hints[t.surface_form] || !hints[t.basic_form] || t.surface_form === t.basic_form) return;
      // Include a following て/で so hints cover 戻って, 読んで as whole words.
      const next = tokens[i + 1];
      const form = next && ['て', 'で'].includes(next.surface_form) && next.pos === '助詞' ? t.surface_form + next.surface_form : t.surface_form;
      if (form.length < 2 || hints[form]) return;
      hints[form] = hints[t.basic_form];
      added.push(form);
    });
  }
  fs.writeFileSync(file, JSON.stringify(hints, null, 2) + '\n');
  console.log(`added ${added.length} hint forms: ${added.join(' ')}`);
});
