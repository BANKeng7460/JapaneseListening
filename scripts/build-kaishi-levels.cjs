// Builds Kaishi levels from content/kaishi/level-NN.txt:
//   conversations → data/kaishi-1-<words>.json (levels 11+), reading → data/reading-passages.json,
//   solo stories → data/solo-stories.json (sets of five levels), level list → data/kaishi-extra-levels.ts.
// Run: node scripts/build-kaishi-levels.cjs   (then npm test, node scripts/check-level-vocab.cjs)
//
// Source format (one block per item; "||" separates Japanese and English):
//   @conversation <situation>        @reading <title>              @story <situation>
//   A: 日本語 || English              TEXT: 日本語 || English        N: 日本語 || English  (repeatable)
//   B: …
//   Q: question  C: a ; b ; c ; d  ANS: 1-4  EXP: explanation
//   @forms 201=時は 202=時に          (optional: the exact spoken form for a word, when automatic matching is ambiguous)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cards = require('../public/kaishi/cards.json');
const words = cards.map(c => [c.word, c.reading, c.meaning]);
const dir = path.join(root, 'content', 'kaishi');
const levelFiles = fs.readdirSync(dir).filter(f => /^level-\d+\.txt$/.test(f)).sort();

function parse(file) {
  const items = [], forms = {};
  let item = null;
  for (const raw of fs.readFileSync(path.join(dir, file), 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const head = line.match(/^@(conversation|reading|story|forms)\s*(.*)$/);
    if (head) {
      if (head[1] === 'forms') { for (const pair of head[2].split(/\s+/)) { const [n, f] = pair.split('='); forms[n] = f; } item = null; continue; }
      item = { kind: head[1], title: head[2], lines: [] }; items.push(item); continue;
    }
    const m = line.match(/^(A|B|N|TEXT|Q|C|ANS|EXP):\s*(.*)$/);
    if (!m || !item) throw new Error(`${file}: cannot read line: ${line}`);
    const [, key, value] = m;
    if (['A', 'B', 'N', 'TEXT'].includes(key)) {
      const [text, translation] = value.split('||').map(s => s.trim());
      if (!text || !translation) throw new Error(`${file}: missing translation: ${line}`);
      item.lines.push({ speaker: key === 'B' ? 'B' : 'A', text, translation });
    } else if (key === 'C') item.choices = value.split(' ; ').map(s => s.trim());
    else if (key === 'ANS') item.answer = Number(value) - 1;
    else item[key === 'Q' ? 'question' : 'explanation'] = value;
  }
  for (const it of items) {
    if (it.choices?.length !== 4 || !(it.answer >= 0 && it.answer < 4) || !it.question || !it.explanation || !it.lines.length)
      throw new Error(`${file}: incomplete ${it.kind} "${it.title}"`);
  }
  return { items, forms };
}

// Where each new word is spoken: an explicit @forms entry, else the word, its reading, or its stem.
const particles = /[はがをにでともへやかよねのだ]/;
function findForm(entry, lines, override) {
  const [word, reading] = entry;
  // Short readings (e.g. さん for 三) would match unrelated words, so readings are only used when long or when the word is kana.
  const useReading = reading && (reading === word || reading.length >= 3);
  const candidates = override ? [override] : [...new Set([word, useReading && reading,
    // Stems only for verbs and い-adjectives, judged by the written word: 体 (からだ) never matches から, 期待 (きたい) never matches きた.
    ...[word, useReading && reading].filter(w => w && /[うくぐすつぬぶむるい]$/.test(word) && w.length > 1).map(w => w.slice(0, -1))])].filter(c => c && (c.length > 1 || /[一-龯]/.test(c)));
  for (const c of candidates) {
    for (let li = 0; li < lines.length; li++) {
      const at = lines[li].text.indexOf(c);
      if (at < 0) continue;
      let end = at + c.length;
      // A stem match grows to the spoken inflection (戻 → 戻ってきた); whole-word matches stay as they are.
      if (!override && c.length < word.length && c.length < (reading || '').length) while (end < lines[li].text.length && end - at < c.length + 4 && /[ぁ-ん]/.test(lines[li].text[end]) && !(end > at + c.length - 1 && particles.test(lines[li].text[end]) && end >= at + word.length)) { end++; if (/[てでただ]/.test(lines[li].text[end - 1])) break; }
      return { lineIndex: li, form: lines[li].text.slice(at, end) };
    }
  }
  return null;
}

const levels = [], reading = {}, stories = [], problems = [];
for (const file of levelFiles) {
  const level = Number(file.match(/\d+/)[0]), count = level * 20;
  const { items, forms } = parse(file);
  const conversations = items.filter(i => i.kind === 'conversation');
  if (conversations.length) {
    const focusCoverage = [];
    for (let n = count - 19; n <= count; n++) {
      let hit = null;
      for (let q = 0; q < conversations.length && !hit; q++) {
        const found = findForm(words[n - 1], conversations[q].lines, forms[n]);
        if (found) hit = { wordIndex: n, questionIndex: q, ...found };
      }
      if (hit) focusCoverage.push(hit); else problems.push(`level ${level}: word ${n} ${words[n - 1][0]} (${words[n - 1][1]}) is not used in any conversation`);
    }
    const lesson = { id: `kaishi-1-${count}`, label: `Level ${level} · Words 1–${count}`, wordCount: count, words: words.slice(0, count),
      questions: conversations.map(c => ({ situation: c.title, lines: c.lines, question: c.question, choices: c.choices, answer: c.answer, explanation: c.explanation })),
      focusCoverage };
    fs.writeFileSync(path.join(root, 'data', `kaishi-1-${count}.json`), JSON.stringify(lesson, null, 2) + '\n');
    levels.push(count);
  }
  const passages = items.filter(i => i.kind === 'reading').map(r => ({ title: r.title, text: r.lines[0].text, translation: r.lines[0].translation,
    question: r.question, choices: r.choices, answer: r.answer, explanation: r.explanation }));
  if (passages.length) reading[`kaishi-1-${count}`] = passages;
  for (const s of items.filter(i => i.kind === 'story'))
    stories.push({ level, story: { situation: `Level ${level} · ${s.title}`, lines: s.lines, question: s.question, choices: s.choices, answer: s.answer, explanation: s.explanation } });
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// Reading: replace books for built levels, keep the rest in order.
const readingFile = path.join(root, 'data', 'reading-passages.json');
const books = JSON.parse(fs.readFileSync(readingFile, 'utf8')).filter(b => !reading[b.id]);
for (const [id, passages] of Object.entries(reading)) books.push({ id, passages });
books.sort((a, b) => Number(a.id.split('-').pop()) - Number(b.id.split('-').pop()));
fs.writeFileSync(readingFile, JSON.stringify(books, null, 2) + '\n');

// Solo stories: hand-written sets stay first; Kaishi level stories are grouped five levels per set.
const soloFile = path.join(root, 'data', 'solo-stories.json');
const solo = JSON.parse(fs.readFileSync(soloFile, 'utf8')).filter(set => !set.id.startsWith('solo-kaishi-'));
const groups = new Map();
for (const { level, story } of stories.sort((a, b) => a.level - b.level)) {
  const first = Math.floor((level - 1) / 5) * 5 + 1;
  if (!groups.has(first)) groups.set(first, []);
  groups.get(first).push(story);
}
for (const [first, list] of groups) solo.push({ id: `solo-kaishi-${first}-${first + 4}`, label: `Kaishi levels ${first}–${first + 4}`, wordCount: 0, words: [], questions: list });
fs.writeFileSync(soloFile, JSON.stringify(solo, null, 2) + '\n');

// Level list imported by data/tests.ts.
const extra = levels.filter(n => n > 200);
fs.writeFileSync(path.join(root, 'data', 'kaishi-extra-levels.ts'),
  '// Generated by scripts/build-kaishi-levels.cjs — do not edit.\nimport type { ListeningTest } from \'./tests\';\n' +
  extra.map(n => `import level${n} from './kaishi-1-${n}.json';`).join('\n') +
  `\n\nexport const extraLevels = [${extra.map(n => `level${n}`).join(', ')}] as ListeningTest[];\n`);

console.log(`levels built: ${levels.join(', ') || 'none'}; reading books: ${Object.keys(reading).length}; solo stories: ${stories.length}`);
