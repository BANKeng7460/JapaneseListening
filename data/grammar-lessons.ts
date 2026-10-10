// N5 grammar course: grammar.json points in teaching order, a few related points per lesson.
// Practice questions are generated from Kaishi sentences (public/kaishi/card-grammar.json) and data/mistakes.json.
export type GrammarLesson = { title: string; points: string[] };

export const grammarLessons: GrammarLesson[] = [
  { title: 'です, は and か', points: ['n5-2', 'n5-79', 'n5-21'] },
  { title: 'の and も', points: ['n5-52', 'n5-34'] },
  { title: 'が, ある and いる', points: ['n5-11', 'n5-12', 'n5-14'] },
  { title: 'を: the object', points: ['n5-60'] },
  { title: 'に and へ: time and destination', points: ['n5-48', 'n5-51'] },
  { title: 'で: where and how', points: ['n5-5'] },
  { title: 'と and や: and, with', points: ['n5-75', 'n5-82'] },
  { title: 'い-adjectives', points: ['n5-16'] },
  { title: 'な-adjectives', points: ['n5-36'] },
  { title: 'ている: doing now, states', points: ['n5-70'] },
  { title: 'てください, てもいい, てはいけない', points: ['n5-72', 'n5-74', 'n5-73'] },
  { title: 'たい and ほしい: wanting', points: ['n5-67', 'n5-13'] },
  { title: 'ましょう and ませんか: inviting', points: ['n5-32', 'n5-33', 'n5-31'] },
  { title: 'ない-forms: without, please don’t', points: ['n5-38', 'n5-39', 'n5-41'] },
  { title: 'から, ので and けど: reasons and “but”', points: ['n5-23', 'n5-58', 'n5-25'] },
  { title: 'とき, 前に and てから: time order', points: ['n5-76', 'n5-30', 'n5-71'] },
  { title: 'もう and まだ', points: ['n5-35', 'n5-27', 'n5-28'] },
  { title: 'Comparing: より, ほうが, 一番', points: ['n5-80', 'n5-84', 'n5-17'] },
  { title: 'Experience and plans: たことがある, つもり, ほうがいい', points: ['n5-66', 'n5-78', 'n5-15'] },
  { title: 'Tone: ね, よ and んです', points: ['n5-47', 'n5-83', 'n5-46'] },
];
