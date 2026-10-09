const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const migrated = require('../data/kaishi-1-60.json');

test('the original 60-word vocabulary order stays intact', () => {
  const original = vm.runInNewContext(
    fs.readFileSync('legacy/kaishi-conversations.js', 'utf8') + '\n' +
    fs.readFileSync('legacy/listening-tests.js', 'utf8') + '\nJSON.stringify(listeningTests[0])'
  );
  assert.deepEqual(migrated.words, JSON.parse(original).words);
});

test('every exercise has valid choices, speaker turns and translations', () => {
  assert.equal(migrated.words.length, migrated.wordCount);
  for (const question of migrated.questions) {
    assert.equal(question.choices.length, 4);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
    assert.ok(question.lines.some(line => line.speaker === 'A'));
    assert.ok(question.lines.some(line => line.speaker === 'B'));
    for (const line of question.lines) {
      assert.ok(['A', 'B'].includes(line.speaker));
      assert.ok(line.text && line.translation);
    }
  }
});

for (const count of [20,40,60,80,100,120,140,160,180,200]) {
  test('level ' + count + ' covers every new entry in spoken dialogue', () => {
    const lesson = JSON.parse(fs.readFileSync('data/kaishi-1-' + count + '.json', 'utf8'));
    assert.equal(lesson.words.length, count);
    assert.deepEqual(lesson.focusCoverage.map(entry => entry.wordIndex), Array.from({length:20}, (_,i) => count-19+i));
    for (const entry of lesson.focusCoverage) {
      const line = lesson.questions[entry.questionIndex]?.lines[entry.lineIndex];
      assert.ok(entry.form && line?.text.includes(entry.form), 'Missing spoken example for entry ' + entry.wordIndex);
    }
    for (const question of lesson.questions) {
      assert.equal(question.choices.length, 4);
      assert.ok(question.choices[question.answer]);
      assert.ok(question.lines.every(line => ['A','B'].includes(line.speaker) && line.text && line.translation));
    }
  });
}
