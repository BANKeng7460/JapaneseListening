// Lists words in content/kaishi/level-NN.txt that are beyond the level's vocabulary, so they can be
// replaced or named as "Extra words" in the explanation. Run: node scripts/check-level-vocab.cjs [level ...]
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

const cards = require('../public/kaishi/cards.json');
const dir = path.join(__dirname, '..', 'content', 'kaishi');
const only = process.argv.slice(2).map(Number);
// Function words and very basic forms that never need explaining.
const basic = new Set('する ある いる なる ない こと もの よう そう ん の 方 たち さん ちゃん くん 様 たい ます です だ 的 中 前 後 頃 ごろ 半 分 時 日 月 年 人 円 回 つ 個 杯 枚 本 歳 階 度 番 目 ここ そこ あそこ どこ これ それ あれ どれ この その あの どの こんな そんな あんな どんな こう そう ああ どう 何 なに なん いくつ いくら 誰 いつ みたい ため よ ね か な さ'.split(' '));

kuromoji.builder({ dicPath: path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict') }).build((err, tokenizer) => {
  if (err) throw err;
  for (const file of fs.readdirSync(dir).filter(f => /^level-\d+\.txt$/.test(f)).sort()) {
    const level = Number(file.match(/\d+/)[0]);
    if (only.length && !only.includes(level)) continue;
    const known = new Set(cards.slice(0, level * 20).flatMap(c => [c.word, c.reading]));
    const text = fs.readFileSync(path.join(dir, file), 'utf8').split(/\r?\n/)
      .filter(l => /^(A|B|N|TEXT):/.test(l.trim())).map(l => l.trim().replace(/^\w+:\s*/, '').split('||')[0]).join('\n');
    const extra = new Map();
    for (const t of tokenizer.tokenize(text)) {
      if (!['名詞', '動詞', '形容詞', '副詞'].includes(t.pos) || ['固有名詞', '数', '非自立', '接尾', '代名詞'].includes(t.pos_detail_1)) continue;
      const base = t.basic_form === '*' ? t.surface_form : t.basic_form;
      if (basic.has(base) || known.has(base) || known.has(t.surface_form) || /^[ァ-ヶー]+$/.test(base) && t.pos === '名詞' && base.length > 4) continue;
      extra.set(base, (extra.get(base) || 0) + 1);
    }
    const list = [...extra].sort((a, b) => b[1] - a[1]).map(([w, n]) => n > 1 ? `${w}×${n}` : w);
    console.log(`level ${level}: ${list.length} words beyond the level → ${list.join(' ')}`);
  }
});
