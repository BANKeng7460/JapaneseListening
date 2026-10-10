const test = require('node:test');
const assert = require('node:assert/strict');
const { toSpeech } = require('../lib/reading-fix.ts');

test('kanji that browser voices misread are spoken as kana', () => {
  const cases = {
    'はい、明日来ます。': 'はい、あしたきます。',
    '今日は誰も来ない。': 'きょうは誰もこない。',
    '出来ました。': '出来ました。',
    '来月、日本に来る。': '来月、日本にくる。',
    'この方法がいい。': 'この方法がいい。',
    'あの方は先生です。': 'あのかたは先生です。',
    '夏より冬の方が好き。': '夏より冬のほうが好き。',
    '十分くらい待った。': 'じゅっぷんくらい待った。',
    'もう十分です。': 'もうじゅうぶんです。',
    '何を食べますか。何時ですか。': 'なにを食べますか。なん時ですか。',
  };
  for (const [text, spoken] of Object.entries(cases)) assert.equal(toSpeech(text).spoken, spoken, text);
});

test('positions in the spoken text map back to the original text', () => {
  const { spoken, origin } = toSpeech('はい、明日来ます。');
  assert.equal(origin(spoken.indexOf('き')), 'はい、明日来ます。'.indexOf('来'));
  assert.equal(origin(spoken.length), 'はい、明日来ます。'.length);
});
