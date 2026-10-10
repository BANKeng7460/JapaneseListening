// Builds the "Spot the mistake" game from each Kaishi level's conversation lines → data/mistakes.json.
// Each line is split into tappable chunks with kuromoji; one common learner error is planted per item.
// Rules are conservative so the planted version is clearly wrong; review output with: node scripts/build-mistakes.cjs --print
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');

const dataDir = path.join(__dirname, '..', 'data');
const levelFiles = fs.readdirSync(dataDir).filter(f => /^kaishi-1-\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/(\d+)\.json/)[1]) - Number(b.match(/(\d+)\.json/)[1]));
const PER_LEVEL = 15, CORRECT_PER_LEVEL = 5, MAX_LENGTH = 40;

// Small seeded random so the output is stable between builds.
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const shuffle = items => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Tappable chunks: a word plus its endings; particles stand alone; punctuation sticks to the previous chunk.
function chunk(tokens) {
  const chunks = [];
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    const attach = chunks.length && (t.pos === '助動詞' || t.pos === '記号' || (t.pos === '助詞' && t.pos_detail_1 === '接続助詞' && ['て', 'で'].includes(t.surface_form))
      || (t.pos === '動詞' && t.pos_detail_1 === '非自立') || (t.pos === '名詞' && t.pos_detail_1 === '接尾') || (t.pos === '形容詞' && t.pos_detail_1 === '非自立')
      || (prev && prev.pos === '接頭詞') || (t.pos === '動詞' && prev && prev.pos === '名詞' && prev.pos_detail_1 === 'サ変接続' && t.basic_form === 'する')
      || (t.pos === '動詞' && t.pos_detail_1 === '接尾') || (prev && prev.pos_detail_1 === '数' && t.pos === '名詞' && ['数', '接尾'].includes(t.pos_detail_1))
      || (prev && prev.pos_detail_1 === '数' && t.pos === '名詞' && /^[時分円人回年月日歳]|ページ/.test(t.surface_form)));
    if (attach) { chunks[chunks.length - 1].text += t.surface_form; chunks[chunks.length - 1].tokens.push(i); }
    else chunks.push({ text: t.surface_form, tokens: [i] });
  });
  return chunks;
}

const godan = { く: ['き', 'いて', 'か'], ぐ: ['ぎ', 'いで', 'が'], す: ['し', 'して', 'さ'], つ: ['ち', 'って', 'た'], う: ['い', 'って', 'わ'], る: ['り', 'って', 'ら'], む: ['み', 'んで', 'ま'], ぶ: ['び', 'んで', 'ば'], ぬ: ['に', 'んで', 'な'] };
const teRule = { く: 'く → いて', ぐ: 'ぐ → いで', す: 'す → して', つ: 'つ → って', う: 'う → って', る: 'る → って', む: 'む → んで', ぶ: 'ぶ → んで', ぬ: 'ぬ → んで' };
const isIchidan = t => t.conjugated_type === '一段';
const isGodan = t => t.conjugated_type.startsWith('五段') && t.basic_form !== '行く' && godan[t.basic_form.slice(-1)];
const movement = new Set(['行く', '来る', '帰る', '戻る', '入る', '着く', '向かう', '出かける']);
// Words where swapping the particle can still be correct Japanese, so they are never used.
const people = new Set(['友達', '先生', '母', '父', '兄', '姉', '弟', '妹', '彼', '彼女', '子', '人', '家族', '誰', '何', 'みんな', '先輩', '君', '私', '僕', '俺', 'あいつ', '奴', '子供', '男', '女', '少女', '仲間', '相手', '全員', '社長', '部長']);
const positions = new Set(['前', '後', '中', '上', '下', '間', '後ろ', '奥', '隣', '外', '先', '横']);
const notPlaces = new Set(['せい', 'ため', '風', '雨', '本気', 'シーン', '最後', '最初']);
const takesNi = new Set(['座る', '住む', '置く', '立つ', '入る', '着く', '残る', '泊まる', '止まる', '寝る', '乗る', '向かう', '生まれる', '書く', '出る', 'いる', 'ある']);
const isTime = t => ['数', '接尾', '副詞可能'].includes(t.pos_detail_1) || /[時分日月年]$/.test(t.surface_form);
// Plain nouns only: adverb-like nouns (絶対に) and な-adjective stems are skipped.
const plainNoun = t => t.pos === '名詞' && ['一般', '固有名詞', 'サ変接続'].includes(t.pos_detail_1);
// kuromoji sometimes reads kana as an unrelated kanji verb (もうしました → 申す); skip those.
const misread = v => /^[ぁ-ん]+$/.test(v.surface_form) && /[一-龯]/.test(v.basic_form);
// A planted form must not be another real word (探って = 探る, ないて = 泣いて), or the sentence could still be right.
let tokenizer;
const realWord = (text, basic) => {
  const t = tokenizer.tokenize(text);
  return t.every(x => x.word_type === 'KNOWN') && ['動詞', '形容詞'].includes(t[0].pos) && t[0].basic_form !== basic;
};
const notReal = (forms, basic) => forms.filter(f => !realWord(f, basic));

// Each rule returns { chunk index, wrong text, options, type, grammar id, explanation } or null.
const rules = [
  // で (place/means of action) → に
  (tk, ch) => { for (let i = 1; i < tk.length - 1; i++) {
    const t = tk[i], next = tk.slice(i + 1).find(x => x.pos === '動詞');
    if (t.surface_form === 'で' && t.pos === '助詞' && t.pos_detail_1 === '格助詞' && plainNoun(tk[i - 1]) && !isTime(tk[i - 1]) && !positions.has(tk[i - 1].surface_form) && !notPlaces.has(tk[i - 1].surface_form)
      && !['は', 'も'].includes(tk[i + 1].surface_form) && next && !['なる', '終わる', '始まる'].includes(next.basic_form) && !takesNi.has(next.basic_form))
      return { at: i, wrong: 'に', options: ['で', 'に', 'を'], type: 'particle', grammar: 'n5-5', why: 'で marks where an action happens or the means used. に marks a destination or where something exists, so it doesn’t fit here.' };
  } return null; },
  // を (object) → が
  (tk) => { for (let i = 1; i < tk.length - 1; i++) {
    const t = tk[i];
    if (t.surface_form !== 'を' || t.pos !== '助詞' || people.has(tk[i - 1].surface_form) || tk[i - 1].pos_detail_1 === '代名詞') continue;
    const vi = tk.findIndex((x, j) => j > i && x.pos === '動詞');
    if (vi < 0) continue;
    const tail = tk.slice(vi, vi + 4).map(x => x.basic_form).join(' ');
    if (/たい|れる|られる|できる|欲しい/.test(tail) || /[えけせてねへめれげべ]る$/.test(tk[vi].basic_form) && tk[vi].conjugated_type === '一段' && !['見せる', '食べる', '始める', '止める', '決める', '覚える', '教える', '考える', '伝える', '続ける', '受ける', '変える', '入れる', '開ける', '助ける', '見つける', '向ける', '掛ける', '付ける', '点ける', '与える', '求める', '認める', '任せる'].includes(tk[vi].basic_form)) continue;
    return { at: i, wrong: 'が', options: ['を', 'が', 'に'], type: 'particle', grammar: 'n5-60', why: 'を marks the object — the thing the verb acts on. With が it would become the subject, which makes no sense here.' };
  } return null; },
  // が with ある/いる/ない → を
  (tk) => { for (let i = 1; i < tk.length - 1; i++) {
    const t = tk[i], n = tk[i + 1];
    if (t.surface_form === 'が' && t.pos === '助詞' && t.pos_detail_1 === '格助詞' && (['ある', 'いる'].includes(n.basic_form) && n.pos === '動詞' || n.basic_form === 'ない' && n.pos === '形容詞'))
      return { at: i, wrong: 'を', options: ['が', 'を', 'で'], type: 'particle', grammar: n.basic_form === 'いる' ? 'n5-14' : 'n5-12', why: 'ある, いる and ない take が for the thing that exists (or doesn’t). They never take を.' };
  } return null; },
  // destination に + movement verb → で
  (tk) => { for (let i = 1; i < tk.length - 1; i++) {
    const t = tk[i], n = tk[i + 1];
    if (t.surface_form === 'に' && t.pos === '助詞' && t.pos_detail_1 === '格助詞' && plainNoun(tk[i - 1]) && !isTime(tk[i - 1]) && n.pos === '動詞' && movement.has(n.basic_form))
      return { at: i, wrong: 'で', options: ['に', 'で', 'を'], type: 'particle', grammar: 'n5-51', why: `Movement verbs like ${n.basic_form} take に (or へ) for where you go, or what you go for. で marks where an action happens, not your destination.` };
  } return null; },
  // て-form
  (tk, ch) => { for (let i = 0; i < tk.length - 1; i++) {
    const v = tk[i], te = tk[i + 1];
    if (v.pos !== '動詞' || v.pos_detail_1 !== '自立' || te.pos !== '助詞' || !['て', 'で'].includes(te.surface_form) || misread(v) || tk[i - 1]?.surface_form === 'どう') continue;
    const correct = v.surface_form + te.surface_form, stem = v.basic_form.slice(0, -1);
    let wrongs, rule;
    if (isIchidan(v)) { wrongs = [stem + 'って', stem + 'んで']; rule = 'For る-verbs, drop る and add て.'; }
    else if (isGodan(v)) { const end = v.basic_form.slice(-1); wrongs = ['って', 'いて', 'んで', 'して'].map(e => stem + e).filter(w => w !== correct); rule = `For verbs ending in ${end}: ${teRule[end]}.`; }
    else continue;
    if (!v.surface_form.startsWith(stem)) continue;
    wrongs = notReal(wrongs, v.basic_form).slice(0, 2);
    if (wrongs.length < 2 || v.basic_form === '行う') continue;
    return { at: i, span: 2, wrong: wrongs[0], options: [correct, ...wrongs], type: 'verb', grammar: 'n4-91', why: `The て-form of ${v.basic_form} is ${correct}. ${rule}` };
  } return null; },
  // ます / たい attached to the dictionary form
  (tk) => { for (let i = 0; i < tk.length - 1; i++) {
    const v = tk[i], a = tk[i + 1];
    if (v.pos !== '動詞' || v.pos_detail_1 !== '自立' || v.conjugated_form !== '連用形' || a.pos !== '助動詞' || !['ます', 'たい'].includes(a.basic_form) || v.basic_form === 'する' || v.basic_form === '来る' || misread(v)) continue;
    if (!isIchidan(v) && !isGodan(v)) continue;
    const stem = v.basic_form.slice(0, -1);
    const third = isIchidan(v) ? stem + 'ら' : stem + godan[v.basic_form.slice(-1)][2];
    if (realWord(third + a.surface_form, v.basic_form) || realWord(v.basic_form + a.surface_form, v.basic_form)) continue;
    const suffix = a.surface_form.startsWith('ま') ? 'ま' : 'た';
    const correct = v.surface_form + a.surface_form, wrong = v.basic_form + a.surface_form;
    return { at: i, span: 2, wrong, options: [correct, wrong, third + a.surface_form], type: 'verb', grammar: a.basic_form === 'たい' ? 'n5-67' : null,
      why: `${a.basic_form} attaches to the ます-stem: ${v.basic_form} → ${v.surface_form}${suffix === 'ま' ? 'ます' : 'たい'}, not the dictionary form.` };
  } return null; },
  // ない-form
  (tk) => { for (let i = 0; i < tk.length - 1; i++) {
    const v = tk[i], a = tk[i + 1];
    if (v.pos !== '動詞' || v.pos_detail_1 !== '自立' || v.conjugated_form !== '未然形' || a.surface_form !== 'ない' || a.pos !== '助動詞' || misread(v)) continue;
    const stem = v.basic_form.slice(0, -1);
    let wrongs, rule;
    if (isIchidan(v)) { wrongs = [stem + 'らない', v.basic_form + 'ない']; rule = 'For る-verbs, drop る and add ない.'; }
    else if (isGodan(v)) { const end = v.basic_form.slice(-1); wrongs = [stem + godan[end][0] + 'ない', v.basic_form + 'ない']; rule = `For verbs ending in ${end}, change it to ${godan[end][2]} and add ない.`; }
    else continue;
    wrongs = notReal(wrongs, v.basic_form);
    if (wrongs.length < 2) continue;
    return { at: i, span: 2, wrong: wrongs[0], options: [v.surface_form + 'ない', ...wrongs], type: 'verb', grammar: null, why: `The ない-form of ${v.basic_form} is ${v.surface_form}ない. ${rule}` };
  } return null; },
  // い-adjective negative くない → いじゃない
  (tk) => { for (let i = 0; i < tk.length - 1; i++) {
    const a = tk[i], n = tk[i + 1];
    if (a.pos === '形容詞' && a.pos_detail_1 === '自立' && a.conjugated_form === '連用テ接続' && n.basic_form === 'ない' && !['ない', 'いい', 'よい'].includes(a.basic_form) && ['です', 'と'].includes(tk[i + 2]?.surface_form))
      return { at: i, span: 2, wrong: a.basic_form + 'じゃない', options: [a.surface_form + 'ない', a.basic_form + 'じゃない', a.surface_form + 'じゃない'], type: 'adjective', grammar: 'n5-16',
        why: `い-adjectives make the negative with くない: ${a.basic_form} → ${a.surface_form}ない. じゃない is for な-adjectives and nouns.` };
  } return null; },
  // い-adjective past かったです → いでした
  (tk) => { for (let i = 0; i < tk.length - 2; i++) {
    const a = tk[i];
    if (a.pos === '形容詞' && a.pos_detail_1 === '自立' && a.conjugated_form === '連用タ接続' && tk[i + 1].surface_form === 'た' && tk[i + 2].surface_form === 'です' && !['いい', 'よい'].includes(a.basic_form))
      return { at: i, span: 3, wrong: a.basic_form + 'でした', options: [a.surface_form + 'たです', a.basic_form + 'でした', a.basic_form + 'かったです'], type: 'adjective', grammar: 'n5-16',
        why: `The polite past of an い-adjective is ${a.surface_form}たです. ${a.basic_form}でした is a common mistake — でした is for nouns and な-adjectives.` };
  } return null; },
  // な-adjective before a noun: な → の
  (tk) => { for (let i = 0; i < tk.length - 2; i++) {
    const a = tk[i], na = tk[i + 1], n = tk[i + 2];
    if (a.pos === '名詞' && a.pos_detail_1 === '形容動詞語幹' && na.surface_form === 'な' && na.pos === '助動詞' && n.pos === '名詞' && n.pos_detail_1 !== '非自立' && !['そう', 'よう', 'みたい'].includes(a.surface_form))
      return { at: i, span: 2, wrong: a.surface_form + 'の', options: [a.surface_form + 'な', a.surface_form + 'の', a.surface_form + 'い'], type: 'adjective', grammar: 'n5-36',
        why: `${a.surface_form} is a な-adjective, so it takes な before a noun: ${a.surface_form}な${n.surface_form}.` };
  } return null; },
  // い-adjective before a noun: add な
  (tk) => { for (let i = 0; i < tk.length - 1; i++) {
    const a = tk[i], n = tk[i + 1];
    if (a.pos === '形容詞' && a.pos_detail_1 === '自立' && a.conjugated_form === '基本形' && n.pos === '名詞' && n.pos_detail_1 === '一般')
      return { at: i, span: 1, wrong: a.surface_form + 'な', options: [a.surface_form, a.surface_form + 'な', a.surface_form + 'の'], type: 'adjective', grammar: 'n5-16',
        why: `い-adjectives go straight before a noun with no な: ${a.surface_form}${n.surface_form}.` };
  } return null; },
];

kuromoji.builder({ dicPath: path.join(path.dirname(require.resolve('kuromoji')), '..', 'dict') }).build((err, built) => {
  if (err) throw err;
  tokenizer = built;
  const out = {};
  for (const file of levelFiles) {
    const level = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const lines = level.questions.flatMap(q => q.lines.map(l => ({ ...l, situation: q.situation })))
      .filter(l => l.text.length <= MAX_LENGTH && !/[「」『』]/.test(l.text));
    const candidates = [], clean = [];
    for (const line of lines) {
      const tk = tokenizer.tokenize(line.text);
      const ch = chunk(tk);
      const hits = rules.map(rule => rule(tk, ch)).filter(Boolean)
        // The planted error must cover whole chunks so it can be tapped.
        .map(hit => {
          const first = ch.findIndex(c => c.tokens.includes(hit.at));
          const lastToken = hit.at + (hit.span || 1) - 1;
          const last = ch.findIndex(c => c.tokens.includes(lastToken));
          if (first < 0 || first !== last) return null;
          const c = ch[first];
          const covered = c.tokens.slice(0, c.tokens.indexOf(lastToken) + 1).map(j => tk[j].surface_form).join('');
          if (c.tokens[0] !== hit.at) return null;
          const rest = c.text.slice(covered.length);
          const options = [...new Set(hit.options.map(o => o + rest))];
          if (options.length < 3) return null;
          return { chunks: ch.map(x => x.text), wrong: first, fix: c.text, mistake: hit.wrong + rest, options, type: hit.type, grammar: hit.grammar, why: hit.why };
        }).filter(Boolean);
      if (hits.length) candidates.push({ line, hits: shuffle(hits) });
      else clean.push({ line, chunks: ch.map(x => x.text) });
    }
    // Spread error types: take one per line, cycling particle → verb → adjective.
    const picked = [], byType = { particle: [], verb: [], adjective: [] };
    for (const c of shuffle(candidates)) { const hit = c.hits[0]; byType[hit.type].push({ line: c.line, hit }); }
    for (let k = 0; picked.length < PER_LEVEL && Object.values(byType).some(l => l.length); k++) {
      const list = byType[['particle', 'verb', 'adjective'][k % 3]];
      if (list.length) picked.push(list.shift());
    }
    const items = [
      ...picked.map(({ line, hit }) => ({ ...hit, chunks: hit.chunks.map((c, i) => i === hit.wrong ? hit.mistake : c), en: line.translation, situation: line.situation })),
      ...shuffle(clean).slice(0, CORRECT_PER_LEVEL).map(c => ({ chunks: c.chunks, wrong: null, en: c.line.translation, situation: c.line.situation })),
    ];
    out[level.id] = items;
    if (process.argv.includes('--print')) {
      console.log(`== ${level.id}: ${picked.length} mistakes, ${Math.min(clean.length, CORRECT_PER_LEVEL)} correct`);
      for (const it of items.filter(i => i.wrong !== null)) console.log(`  [${it.type}] ${it.chunks.join('|')}  ✕${it.mistake} → ${it.fix}  (${it.options.join(' / ')})`);
    }
  }
  fs.writeFileSync(path.join(dataDir, 'mistakes.json'), JSON.stringify(out) + '\n');
  const all = Object.values(out).flat();
  console.log(`${Object.keys(out).length} levels, ${all.filter(i => i.wrong !== null).length} mistakes, ${all.filter(i => i.wrong === null).length} correct sentences`);
});
