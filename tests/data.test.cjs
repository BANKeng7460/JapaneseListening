const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const migrated = require('../data/kaishi-1-60.json');

test('migration preserves the entire original 1–60 test', () => {
  const original = vm.runInNewContext(
    fs.readFileSync('legacy/kaishi-conversations.js', 'utf8') + '\n' +
    fs.readFileSync('legacy/listening-tests.js', 'utf8') + '\nJSON.stringify(listeningTests[0])'
  );
  assert.deepEqual(migrated, JSON.parse(original));
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
