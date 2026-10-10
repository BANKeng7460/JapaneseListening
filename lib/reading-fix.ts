// Browser voices guess kanji readings and often get them wrong (明日来ます → “ashi raimasu”).
// toSpeech() swaps known trouble spots for kana before speaking; the on-screen text never changes.
// `origin(i)` maps a position in the spoken text back to the original, so transcript highlighting still lines up.

type Rule = [RegExp, string];
// Order matters: longer and more specific patterns first. All patterns are sticky (y) and tested at each position.
const rules: Rule[] = ([
  [/明後日/, 'あさって'], [/一昨日/, 'おととい'], [/明日/, 'あした'], [/今日/, 'きょう'], [/昨日/, 'きのう'], [/今朝/, 'けさ'],
  [/今年/, 'ことし'], [/大人/, 'おとな'], [/一人/, 'ひとり'], [/二人/, 'ふたり'], [/上手/, 'じょうず'], [/下手/, 'へた'],
  [/私/, 'わたし'], [/お土産/, 'おみやげ'], [/眼鏡/, 'めがね'], [/果物/, 'くだもの'], [/部屋/, 'へや'], [/時計/, 'とけい'],
  // Numbers + counters some voices misread.
  [/(?<=[一二三四五六七八九十0-9０-９])十分/, 'じゅっぷん'], [/十分(?=[くぐ]らい|後|前|間|以内|おき|ほど|待|遅)/, 'じゅっぷん'], [/十分/, 'じゅうぶん'],
  [/四時/, 'よじ'], [/九時/, 'くじ'], [/七時/, 'しちじ'], [/四人/, 'よにん'], [/(?<=月)一日/, 'ついたち'], [/一日/, 'いちにち'],
  // 来る: 来ます / 来て / 来た → き, 来ない / 来よう / 来させる → こ, 来る / 来れば → く. 来年・来週・来月 are left alone.
  [/(?<!出)来(?=ま|て|た)/, 'き'], [/(?<!出)来(?=な|よう|させ|られ)/, 'こ'], [/(?<!出)来(?=る|れ)/, 'く'],
  // 何: なん before counters and で・の・と・だ, なに before を・が・も・か・に.
  [/何(?=[でとのだ]|[人時回歳個年月日分枚本冊度曜])/, 'なん'], [/何(?=[をがもかに])/, 'なに'],
  // 方: あの方 (that person) → かた; ～の方が (comparison) → ほう.
  [/(?<=[こそあど]の)方(?![法向面角])/, 'かた'], [/(?<=の)方(?=[がはをに])/, 'ほう'],
] as [RegExp, string][]).map(([re, kana]) => [new RegExp(re.source, 'y'), kana]);

export function toSpeech(text: string) {
  let spoken = '';
  const origins: number[] = [];
  for (let i = 0; i < text.length;) {
    let matched = false;
    for (const [re, kana] of rules) {
      re.lastIndex = i;
      const m = re.exec(text);
      if (!m) continue;
      for (let k = 0; k < kana.length; k++) origins.push(i);
      spoken += kana;
      i += m[0].length;
      matched = true;
      break;
    }
    if (!matched) { origins.push(i); spoken += text[i]; i++; }
  }
  origins.push(text.length);
  return { spoken, origin: (index: number) => origins[Math.min(Math.max(index, 0), origins.length - 1)] };
}
