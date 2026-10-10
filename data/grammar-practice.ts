// Hand-written practice for the grammar course, one entry per lesson in data/grammar-lessons.ts.
// gap: ＿＿ marks the blank; options are confusable on purpose, and the English hint leaves one right answer.
// situation: what would you say? Options are Japanese sentences, one right for the situation.
// forms: keys of generated minimal-pair templates (lib/grammar-course.ts) — the first group are the lesson's targets.
export type Gap = { ja: string; en: string; answer: string; options: string[]; why: string };
export type Situation = { prompt: string; answer: string; options: string[]; why: string };
export type LessonPractice = { gaps: Gap[]; situations: Situation[]; forms?: { targets: string[]; extras: string[]; kind?: 'i-adj' | 'na-adj' } };

const g = (ja: string, en: string, answer: string, options: string[], why: string): Gap => ({ ja, en, answer, options, why });
const s = (prompt: string, answer: string, options: string[], why: string): Situation => ({ prompt, answer, options, why });

export const lessonPractice: LessonPractice[] = [
  // 1. です, は and か
  { gaps: [
    g('私＿＿学生です。', 'I am a student.', 'は', ['は', 'を', 'に'], 'は marks the topic: “as for me, (I) am a student”.'),
    g('これは本＿＿。', 'This is a book.', 'です', ['です', 'ます', 'か'], 'Noun + です means “is”. ます only follows verbs.'),
    g('これは何です＿＿。', 'What is this?', 'か', ['か', 'よ', 'は'], 'か at the end turns a sentence into a question.'),
    g('明日は日曜日＿＿。', 'Tomorrow is Sunday. (casual)', 'だ', ['だ', 'か', 'を'], 'だ is the casual form of です.'),
    g('あの人は誰です＿＿。', 'Who is that person?', 'か', ['か', 'は', 'を'], 'Questions end with か.'),
    g('田中さん＿＿会社員です。', 'Mr. Tanaka is an office worker.', 'は', ['は', 'を', 'で'], 'The person you’re talking about is the topic: は.'),
  ], situations: [
    s('You want to check if the person in front of you is Mr. Yamada.', '山田さんですか。', ['山田さんですか。', '山田さんです。', '山田さんは。'], 'Add か to ask a question; without it, you’re stating it.'),
    s('You introduce yourself. Your name is Ann.', '私はアンです。', ['私はアンです。', '私をアンです。', '私はアンですか。'], 'は marks you as the topic; を is for objects of verbs.'),
    s('A friend asks if you’re a student. You’re a teacher.', 'いいえ、先生です。', ['いいえ、先生です。', 'はい、先生ですか。', 'いいえ、先生か。'], 'いいえ + the correct fact + です.'),
    s('You point at a dish and ask what it is.', 'これは何ですか。', ['これは何ですか。', 'これは何です。', 'これを何ですか。'], 'What is this? = これは何ですか.'),
    s('Someone asks if this is your bag. It is.', 'はい、私のです。', ['はい、私のです。', 'はい、私です。', 'いいえ、私のです。'], 'Mine = 私の; はい agrees.'),
  ] },
  // 2. の and も
  { gaps: [
    g('これは私＿＿本です。', 'This is my book.', 'の', ['の', 'は', 'も'], 'の links two nouns: 私の本 = my book.'),
    g('私＿＿学生です。', 'I’m a student too.', 'も', ['も', 'の', 'を'], 'も means “too, also” and replaces は.'),
    g('田中さんは日本語＿＿先生です。', 'Ms. Tanaka is a Japanese teacher.', 'の', ['の', 'が', 'も'], '日本語の先生: the noun before の describes the next one.'),
    g('赤い＿＿がほしいです。', 'I want the red one.', 'の', ['の', 'も', 'は'], 'の can stand for a thing: 赤いの = the red one.'),
    g('これ＿＿私のかばんです。', 'This is my bag too.', 'も', ['も', 'の', 'を'], 'も replaces は to add “too”.'),
    g('友達＿＿車で行きました。', 'We went in my friend’s car.', 'の', ['の', 'も', 'を'], 'Whose car: 友達の車.'),
  ], situations: [
    s('Your friend says she likes coffee. You like it too.', '私も好きです。', ['私も好きです。', '私の好きです。', '私は好きですか。'], 'も = “me too”.'),
    s('You find an umbrella and want to ask whose it is.', 'これは誰の傘ですか。', ['これは誰の傘ですか。', 'これは誰も傘ですか。', 'これは誰を傘ですか。'], '誰の = whose.'),
    s('You’ve said your father is Japanese. Your mother is Japanese as well.', '母も日本人です。', ['母も日本人です。', '母の日本人です。', '母を日本人です。'], 'も adds “also”.'),
    s('A friend says she’s going to the party. You’re going too.', '私も行きます。', ['私も行きます。', '私の行きます。', '私を行きます。'], 'Me too: 私も.'),
    s('You ask what kind of book it is: a Japanese book?', '日本語の本ですか。', ['日本語の本ですか。', '日本語も本ですか。', '日本語を本ですか。'], 'A Japanese-language book: 日本語の本.'),
  ] },
  // 3. が, ある and いる
  { gaps: [
    g('机の上に本＿＿あります。', 'There is a book on the desk.', 'が', ['が', 'を', 'で'], 'ある / いる take が for the thing that exists.'),
    g('公園に子供が＿＿。', 'There are children in the park.', 'います', ['います', 'あります', 'です'], 'いる is for people and animals.'),
    g('冷蔵庫に牛乳が＿＿。', 'There is milk in the fridge.', 'あります', ['あります', 'います', 'です'], 'ある is for things.'),
    g('誰＿＿来ましたか。', 'Who came?', 'が', ['が', 'は', 'を'], 'Question words like 誰 and 何 take が, not は, as the subject.'),
  ], situations: [
    s('In a shop, you want to ask if they have a smaller size.', '小さいサイズはありますか。', ['小さいサイズはありますか。', '小さいサイズはいますか。', '小さいサイズをありますか。'], 'Things use ある, and ある never takes を.'),
    s('You tell a new friend that you have a cat.', '猫がいます。', ['猫がいます。', '猫があります。', '猫をいます。'], 'Animals use いる.'),
    s('You want to ask who is in the room.', '部屋に誰がいますか。', ['部屋に誰がいますか。', '部屋に誰がありますか。', '部屋に誰をいますか。'], 'People use いる.'),
  ] },
  // 4. を
  { gaps: [
    g('毎朝コーヒー＿＿飲みます。', 'I drink coffee every morning.', 'を', ['を', 'が', 'に'], 'を marks what the action is done to.'),
    g('日本語＿＿勉強しています。', 'I’m studying Japanese.', 'を', ['を', 'が', 'に'], 'The thing you study takes を.'),
    g('七時に家＿＿出ます。', 'I leave home at seven.', 'を', ['を', 'が', 'で'], 'Leaving a place: 〜を出る.'),
    g('この道＿＿渡ってください。', 'Please cross this road.', 'を', ['を', 'が', 'で'], 'A place you move through or across takes を.'),
  ], situations: [
    s('You order a coffee at a café.', 'コーヒーをください。', ['コーヒーをください。', 'コーヒーがください。', 'コーヒーにください。'], 'Noun + をください = please give me.'),
    s('You ask a friend to close the door.', 'ドアを閉めてください。', ['ドアを閉めてください。', 'ドアが閉めてください。', 'ドアで閉めてください。'], 'The door is the object of 閉める, so を.'),
    s('You tell someone you read a book every night.', '毎晩、本を読みます。', ['毎晩、本を読みます。', '毎晩、本が読みます。', '毎晩、本に読みます。'], 'With が, the book would be doing the reading.'),
  ] },
  // 5. に and へ
  { gaps: [
    g('七時＿＿起きます。', 'I get up at seven.', 'に', ['に', 'で', 'を'], 'Clock times take に.'),
    g('来週、京都＿＿行きます。', 'I’m going to Kyoto next week.', 'に', ['に', 'で', 'を'], 'Destinations take に (or へ).'),
    g('駅で友達＿＿会います。', 'I’ll meet a friend at the station.', 'に', ['に', 'を', 'で'], 'Meeting someone: 〜に会う.'),
    g('部屋＿＿猫がいます。', 'There is a cat in the room.', 'に', ['に', 'で', 'を'], 'Where something exists takes に.'),
  ], situations: [
    s('You want to ask what time you’re meeting.', '何時に会いますか。', ['何時に会いますか。', '何時で会いますか。', '何時を会いますか。'], 'Time + に.'),
    s('You tell a coworker you’re going to Tokyo tomorrow.', '明日、東京に行きます。', ['明日、東京に行きます。', '明日、東京で行きます。', '明日、東京を行きます。'], 'Destination + に.'),
    s('You explain there’s a convenience store near the station.', '駅の近くにコンビニがあります。', ['駅の近くにコンビニがあります。', '駅の近くでコンビニがあります。', '駅の近くをコンビニがあります。'], 'Existence (ある / いる) uses に for the place.'),
  ] },
  // 6. で
  { gaps: [
    g('図書館＿＿勉強します。', 'I study at the library.', 'で', ['で', 'に', 'を'], 'The place where an action happens takes で.'),
    g('バス＿＿学校に行きます。', 'I go to school by bus.', 'で', ['で', 'に', 'を'], 'Means of transport takes で.'),
    g('日本語＿＿話してください。', 'Please speak in Japanese.', 'で', ['で', 'に', 'が'], 'The language you use takes で.'),
    g('はし＿＿食べます。', 'I eat with chopsticks.', 'で', ['で', 'を', 'に'], 'Tools take で. はしを食べる would mean eating the chopsticks!'),
  ], situations: [
    s('You want to ask if you can pay by card.', 'カードで払えますか。', ['カードで払えますか。', 'カードに払えますか。', 'カードが払えますか。'], 'The way you pay takes で.'),
    s('You ask how to say something in Japanese.', '日本語で何と言いますか。', ['日本語で何と言いますか。', '日本語に何と言いますか。', '日本語を何と言いますか。'], 'In (a language) = 〜で.'),
    s('You tell a friend you’ll have lunch at the café.', 'カフェで昼ご飯を食べます。', ['カフェで昼ご飯を食べます。', 'カフェに昼ご飯を食べます。', 'カフェを昼ご飯を食べます。'], 'Eating is an action, so the place takes で.'),
  ] },
  // 7. と and や
  { gaps: [
    g('友達＿＿映画を見ました。', 'I watched a movie with a friend.', 'と', ['と', 'や', 'を'], 'と = with (a person).'),
    g('田中さん＿＿結婚します。', 'I’m getting married to Tanaka.', 'と', ['と', 'や', 'に'], 'Marrying someone: 〜と結婚する.'),
    g('母＿＿電話で話しました。', 'I talked with my mom on the phone.', 'と', ['と', 'や', 'を'], 'Talking with someone: 〜と話す.'),
    g('机の上に本＿＿ペンなどがあります。', 'There are books, pens and so on on the desk.', 'や', ['や', 'を', 'で'], 'や…など lists examples.'),
    g('姉＿＿一緒に買い物に行きました。', 'I went shopping together with my older sister.', 'と', ['と', 'を', 'や'], 'With (a person): と一緒に.'),
  ], situations: [
    s('You say you went to Kyoto with your family.', '家族と京都に行きました。', ['家族と京都に行きました。', '家族を京都に行きました。', '家族や京都に行きました。'], 'と = together with.'),
    s('You say you like sports such as soccer and tennis.', 'サッカーやテニスなどが好きです。', ['サッカーやテニスなどが好きです。', 'サッカーをテニスなどが好きです。', 'サッカーにテニスなどが好きです。'], 'や…など lists examples: “things like”.'),
    s('You ask who someone went with.', '誰と行きましたか。', ['誰と行きましたか。', '誰を行きましたか。', '誰や行きましたか。'], 'With whom = 誰と.'),
    s('You say you bought things like apples and bananas.', 'りんごやバナナなどを買いました。', ['りんごやバナナなどを買いました。', 'りんごをバナナなどを買いました。', 'りんごにバナナなどを買いました。'], 'Examples from a longer list: や…など.'),
    s('You tell a coworker you had lunch with Ms. Sato.', '佐藤さんと昼ご飯を食べました。', ['佐藤さんと昼ご飯を食べました。', '佐藤さんを昼ご飯を食べました。', '佐藤さんや昼ご飯を食べました。'], 'With someone: と.'),
  ] },
  // 8. い-adjectives
  { forms: { targets: ['adj-pres', 'adj-neg', 'adj-past', 'adj-pastneg'], extras: [], kind: 'i-adj' }, gaps: [
    g('このケーキはとても＿＿。', 'This cake is very delicious.', 'おいしいです', ['おいしいです', 'おいしいだです', 'おいしいなです'], 'い-adjective + です. No な, no だ.'),
    g('昨日は＿＿です。', 'It was cold yesterday.', '寒かった', ['寒かった', '寒いでした', '寒くなかった'], 'Past: い → かった + です. 寒いでした is a common mistake.'),
    g('＿＿本を読みました。', 'I read an interesting book.', '面白い', ['面白い', '面白いな', '面白くて'], 'い-adjectives go straight before a noun.'),
  ], situations: [
    s('You tell the restaurant staff the meal was delicious.', 'とてもおいしかったです。', ['とてもおいしかったです。', 'とてもおいしいでした。', 'とてもおいしくなかったです。'], 'Polite past of an い-adjective: 〜かったです.'),
    s('You say this room isn’t big.', 'この部屋は大きくないです。', ['この部屋は大きくないです。', 'この部屋は大きいじゃないです。', 'この部屋は大きくです。'], 'Negative: い → くない. じゃない is for な-adjectives.'),
  ] },
  // 9. な-adjectives
  { forms: { targets: ['adj-pres', 'adj-neg', 'adj-past', 'adj-pastneg'], extras: [], kind: 'na-adj' }, gaps: [
    g('＿＿町ですね。', 'It’s a quiet town, isn’t it?', '静かな', ['静かな', '静かの', '静かい'], 'な-adjectives take な before a noun.'),
    g('この部屋はあまり＿＿。', 'This room isn’t very clean.', 'きれいじゃないです', ['きれいじゃないです', 'きれいくないです', 'きれいです'], 'きれい looks like an い-adjective but is a な-adjective: きれいじゃない.'),
    g('昨日は＿＿。', 'I was free yesterday.', '暇でした', ['暇でした', '暇かったです', '暇なでした'], 'Past of a な-adjective: 〜でした.'),
  ], situations: [
    s('You tell a visitor this shop is famous.', 'この店は有名です。', ['この店は有名です。', 'この店は有名いです。', 'この店は有名なです。'], 'な-adjective + です, no な at the end.'),
    s('You compliment someone’s town.', 'きれいな町ですね。', ['きれいな町ですね。', 'きれいい町ですね。', 'きれいの町ですね。'], 'きれい + な + noun.'),
  ] },
  // 10. ている
  { forms: { targets: ['teiru'], extras: ['past', 'tai', 'tekudasai'] }, gaps: [
    g('今、雨が＿＿。', 'It’s raining now.', '降っています', ['降っています', '降りたいです', '降ってください'], 'Happening now: て-form + いる.'),
    g('姉は結婚＿＿。', 'My older sister is married.', 'しています', ['しています', 'したいです', 'してください'], 'A state that continues (being married): ている.'),
  ], situations: [
    s('A friend calls while you’re having dinner. Tell them what you’re doing.', '今、晩ご飯を食べています。', ['今、晩ご飯を食べています。', '今、晩ご飯を食べました。', '今、晩ご飯を食べたいです。'], 'Right now = ている.'),
    s('You ask someone if they know Mr. Tanaka.', '田中さんを知っていますか。', ['田中さんを知っていますか。', '田中さんを知りましたか。', '田中さんを知りたいですか。'], 'Knowing is a state: 知っている.'),
    s('You tell someone where you live: Tokyo.', '東京に住んでいます。', ['東京に住んでいます。', '東京に住みました。', '東京に住みたいです。'], 'Living somewhere is a continuing state: 住んでいる.'),
  ] },
  // 11. てください, てもいい, てはいけない
  { forms: { targets: ['tekudasai', 'temoii', 'tewaikenai'], extras: ['past'] }, gaps: [], situations: [
    s('You’re at a friend’s house and want to use the bathroom.', 'トイレを使ってもいいですか。', ['トイレを使ってもいいですか。', 'トイレを使ってください。', 'トイレを使ってはいけません。'], 'Asking permission: てもいいですか.'),
    s('You’re a teacher. Tell the children not to run in the hallway.', '廊下を走ってはいけません。', ['廊下を走ってはいけません。', '廊下を走ってもいいです。', '廊下を走ってください。'], 'Forbidding: てはいけません.'),
    s('You ask the shop assistant to wait a moment.', 'ちょっと待ってください。', ['ちょっと待ってください。', 'ちょっと待ってもいいですか。', 'ちょっと待ってはいけません。'], 'Requesting: てください.'),
    s('A guest asks if they can sit down. Say yes.', 'はい、座ってもいいですよ。', ['はい、座ってもいいですよ。', 'はい、座ってはいけません。', 'はい、座りましたよ。'], 'Giving permission: てもいいです.'),
  ] },
  // 12. たい and ほしい
  { forms: { targets: ['tai', 'hoshii'], extras: ['past', 'teiru'] }, gaps: [
    g('新しいかばんが＿＿。', 'I want a new bag.', 'ほしいです', ['ほしいです', 'ほしたいです', 'たいです'], 'Wanting a thing: noun + がほしいです. たい only attaches to verbs.'),
  ], situations: [
    s('You’re thirsty. Tell your friend you want to drink water.', '水が飲みたいです。', ['水が飲みたいです。', '水を飲みました。', '水を飲んでいます。'], 'Want to do: ます-stem + たい.'),
    s('You ask a friend where they want to go this weekend.', '週末、どこに行きたいですか。', ['週末、どこに行きたいですか。', '週末、どこに行きましたか。', '週末、どこに行ってください。'], 'Asking about wishes: 〜たいですか.'),
    s('You tell your parents you want a new phone for your birthday.', '誕生日に新しいスマホがほしいです。', ['誕生日に新しいスマホがほしいです。', '誕生日に新しいスマホを買いました。', '誕生日に新しいスマホがありません。'], 'A thing you want: 〜がほしい.'),
  ] },
  // 13. ましょう, ませんか, ましょうか
  { forms: { targets: ['mashou', 'masenka', 'mashouka'], extras: ['tai', 'past'] }, gaps: [], situations: [
    s('You politely invite a coworker to lunch.', '一緒に昼ご飯を食べませんか。', ['一緒に昼ご飯を食べませんか。', '一緒に昼ご飯を食べましたか。', '一緒に昼ご飯を食べてはいけませんか。'], 'A polite invitation: ませんか.'),
    s('An older woman has a heavy bag. Offer to carry it.', '荷物を持ちましょうか。', ['荷物を持ちましょうか。', '荷物を持ちませんか。', '荷物を持ちました。'], 'Offering help: ましょうか. 持ちませんか would invite her to hold it.'),
    s('Everyone is here. Suggest starting the meeting.', 'じゃあ、始めましょう。', ['じゃあ、始めましょう。', 'じゃあ、始めませんでした。', 'じゃあ、始めてはいけません。'], 'Let’s: ましょう.'),
  ] },
  // 14. ない-forms
  { forms: { targets: ['naidekudasai', 'nakutemoii'], extras: ['tekudasai', 'tewaikenai'] }, gaps: [
    g('朝ご飯を＿＿学校に行きました。', 'I went to school without eating breakfast.', '食べないで', ['食べないで', '食べて', '食べたいで'], 'Without doing: ない-form + で.'),
  ], situations: [
    s('Tell a friend they don’t need to come early.', '早く来なくてもいいですよ。', ['早く来なくてもいいですよ。', '早く来てください。', '早く来ないでください。'], 'Don’t have to: なくてもいい. 来ないでください would tell them not to come early at all.'),
    s('You ask visitors not to take photos here.', 'ここで写真を撮らないでください。', ['ここで写真を撮らないでください。', 'ここで写真を撮ってください。', 'ここで写真を撮らなくてもいいです。'], 'Please don’t: ないでください.'),
    s('You explain you went out without an umbrella.', '傘を持たないで出かけました。', ['傘を持たないで出かけました。', '傘を持って出かけました。', '傘を持ちたいで出かけました。'], 'Without doing: ないで.'),
  ] },
  // 15. から, ので and けど
  { gaps: [
    g('雨が降っている＿＿、傘を持っていきます。', 'It’s raining, so I’ll take an umbrella.', 'から', ['から', 'けど', 'のに'], 'Reason → result: から.'),
    g('高い＿＿、買います。', 'It’s expensive, but I’ll buy it.', 'けど', ['けど', 'から', 'ので'], 'Contrast: けど.'),
    g('疲れた＿＿、早く寝ます。', 'I’m tired, so I’ll go to bed early.', 'ので', ['ので', 'けど', 'のに'], 'Reason (softer): ので.'),
    g('日本語は難しい＿＿、面白いです。', 'Japanese is difficult, but interesting.', 'けど', ['けど', 'ので', 'から'], 'Contrast: けど.'),
    g('お金がない＿＿、旅行に行けません。', 'I don’t have money, so I can’t go on a trip.', 'から', ['から', 'けど', 'のに'], 'Reason → result: から.'),
    g('何度も電話した＿＿、出ませんでした。', 'I called many times, but they didn’t answer.', 'けど', ['けど', 'から', 'ので'], 'Contrast: けど.'),
  ], situations: [
    s('You’re late. Politely explain the train was delayed.', '電車が遅れたので、遅くなりました。', ['電車が遅れたので、遅くなりました。', '電車が遅れたけど、遅くなりました。', '電車が遅れたのに、遅くなりました。'], 'Polite reason: ので.'),
    s('You want to go, but you don’t have time.', '行きたいけど、時間がありません。', ['行きたいけど、時間がありません。', '行きたいから、時間がありません。', '行きたいので、時間がありません。'], 'Contrast: けど.'),
    s('It’s cold, so you tell a friend you’ll stay home.', '寒いから、家にいます。', ['寒いから、家にいます。', '寒いけど、家にいます。', '寒いのに、家にいます。'], 'Reason: から.'),
    s('You decline a drink politely because you’re driving.', '車で来たので、お酒は飲めません。', ['車で来たので、お酒は飲めません。', '車で来たけど、お酒は飲めません。', '車で来たのに、お酒は飲めません。'], 'Polite reason: ので.'),
    s('The food was cheap, but delicious.', '安かったけど、おいしかったです。', ['安かったけど、おいしかったです。', '安かったから、おいしかったです。', '安かったので、おいしかったです。'], 'Unexpected contrast: けど.'),
  ] },
  // 16. とき, 前に and てから
  { gaps: [
    g('寝る＿＿、歯をみがきます。', 'I brush my teeth before going to bed.', '前に', ['前に', 'てから', 'とき'], 'Before doing: dictionary form + 前に.'),
    g('手を洗って＿＿、食べましょう。', 'Let’s eat after washing our hands.', 'から', ['から', '前に', 'とき'], 'After doing: て-form + から.'),
    g('子どもの＿＿、よく海で泳ぎました。', 'When I was a child, I often swam in the sea.', 'とき', ['とき', '前に', 'から'], 'When: noun + の + とき.'),
    g('日本に来た＿＿、日本語を勉強し始めました。', 'I started studying Japanese when I came to Japan.', 'とき', ['とき', '前に', 'から'], 'When (something happened): た-form + とき.'),
    g('出かける＿＿、電気を消してください。', 'Please turn off the lights before you go out.', '前に', ['前に', 'とき', 'てから'], 'Before: dictionary form + 前に.'),
  ], situations: [
    s('Ask a friend to call you after they arrive.', '着いてから、電話してください。', ['着いてから、電話してください。', '着く前に、電話してください。', '着くから、電話してください。'], 'After arriving: 着いてから.'),
    s('You say you studied before the test.', 'テストの前に勉強しました。', ['テストの前に勉強しました。', 'テストの後で勉強しました。', 'テストのとき勉強しませんでした。'], 'Before (a noun): noun + の前に.'),
    s('You say you were happy when you met her.', '彼女に会ったとき、嬉しかったです。', ['彼女に会ったとき、嬉しかったです。', '彼女に会う前に、嬉しかったです。', '彼女に会わないで、嬉しかったです。'], 'When (something happened): た-form + とき.'),
    s('You tell a friend you’ll eat after taking a shower.', 'シャワーを浴びてから、食べます。', ['シャワーを浴びてから、食べます。', 'シャワーを浴びる前に、食べます。', 'シャワーを浴びないで、食べます。'], 'After doing: てから.'),
    s('You say you read books when you’re free.', '暇なとき、本を読みます。', ['暇なとき、本を読みます。', '暇な前に、本を読みます。', '暇てから、本を読みます。'], 'When (a state): な-adjective + な + とき.'),
  ] },
  // 17. もう and まだ
  { forms: { targets: ['mou', 'madate', 'madateiru'], extras: [] }, gaps: [], situations: [
    s('A friend asks if you’ve eaten. You have.', 'はい、もう食べました。', ['はい、もう食べました。', 'いいえ、まだ食べていません。', 'はい、まだ食べています。'], 'Already done: もう + past.'),
    s('Your boss asks if the report is finished. It isn’t yet.', 'いいえ、まだです。', ['いいえ、まだです。', 'はい、もうです。', 'いいえ、もう終わりました。'], 'Not yet: まだです.'),
    s('You tell someone it’s still raining.', 'まだ雨が降っています。', ['まだ雨が降っています。', 'もう雨はやみました。', 'まだ雨は降っていません。'], 'Still happening: まだ + ている.'),
  ] },
  // 18. Comparing
  { gaps: [
    g('東京は大阪＿＿大きいです。', 'Tokyo is bigger than Osaka.', 'より', ['より', 'ほう', '一番'], 'A は B より … = A is more … than B.'),
    g('夏より冬の＿＿が好きです。', 'I like winter more than summer.', 'ほう', ['ほう', 'より', '一番'], 'B のほうが … = B is more ….'),
    g('家族の中で、父が＿＿背が高いです。', 'My father is the tallest in my family.', '一番', ['一番', 'より', 'ほう'], 'The most: 一番.'),
    g('バス＿＿電車のほうが速いです。', 'The train is faster than the bus.', 'より', ['より', 'ほう', '一番'], 'A より B のほうが = B is more than A.'),
    g('果物の中で、りんごが＿＿好きです。', 'Of all fruit, I like apples best.', '一番', ['一番', 'より', 'ほう'], 'Best among a group: 〜の中で…一番.'),
  ], situations: [
    s('You say you like tea more than coffee.', 'コーヒーより紅茶のほうが好きです。', ['コーヒーより紅茶のほうが好きです。', '紅茶よりコーヒーのほうが好きです。', 'コーヒーの一番紅茶が好きです。'], 'A より B のほうが = B more than A.'),
    s('You ask a friend which season they like best.', 'どの季節が一番好きですか。', ['どの季節が一番好きですか。', 'どの季節のほうが好きですか。', 'どの季節より好きですか。'], 'Best among many: 一番.'),
    s('You say today is colder than yesterday.', '今日は昨日より寒いです。', ['今日は昨日より寒いです。', '昨日は今日より寒いです。', '今日は昨日のほう寒いです。'], 'Today は yesterday より colder.'),
    s('A shop clerk asks which is cheaper. You point: this one is cheaper than that one.', 'これはあれより安いです。', ['これはあれより安いです。', 'あれはこれより安いです。', 'これはあれのほう安いです。'], 'A は B より … = A is more … than B.'),
    s('You say your brother is taller than you.', '兄は私より背が高いです。', ['兄は私より背が高いです。', '私は兄より背が高いです。', '兄は私の一番背が高いです。'], 'Brother は me より taller.'),
  ] },
  // 19. Experience and plans
  { forms: { targets: ['takotogaaru', 'tsumori', 'hougaii'], extras: ['past'] }, gaps: [], situations: [
    s('You say you’ve been to Kyoto before.', '京都に行ったことがあります。', ['京都に行ったことがあります。', '京都に行くつもりです。', '京都に行ったほうがいいです。'], 'Experience: た-form + ことがある.'),
    s('Your friend has a cold. Advise them to rest today.', '今日は休んだほうがいいですよ。', ['今日は休んだほうがいいですよ。', '今日は休んだことがありますよ。', '今日は休むつもりですよ。'], 'Advice: た-form + ほうがいい.'),
    s('You say you plan to study abroad next year.', '来年、留学するつもりです。', ['来年、留学するつもりです。', '来年、留学したことがあります。', '来年、留学したほうがいいです。'], 'Plan: dictionary form + つもり.'),
  ] },
  // 20. ね, よ and んです
  { gaps: [
    g('今日は暑いです＿＿。', 'It’s hot today, isn’t it? (agreeing)', 'ね', ['ね', 'よ', 'か'], 'Seeking agreement: ね.'),
    g('頭が痛い＿＿。', 'The thing is, I have a headache. (explaining)', 'んです', ['んです', 'ですね', 'ですか'], 'Explaining a reason or situation: んです.'),
    g('もう九時です＿＿。急いで！', 'It’s already nine, you know. Hurry!', 'よ', ['よ', 'ね', 'か'], 'Telling someone something they need to know: よ.'),
    g('いい天気です＿＿。', 'Nice weather, isn’t it? (agreeing)', 'ね', ['ね', 'よ', 'か'], 'Sharing a feeling: ね.'),
    g('どうして遅れた＿＿か。', 'Why were you late? (asking for an explanation)', 'んです', ['んです', 'です', 'ます'], 'Asking for an explanation: 〜んですか.'),
  ], situations: [
    s('A friend shows you a photo of their dog. You agree it’s cute.', 'かわいいですね。', ['かわいいですね。', 'かわいいですよ。', 'かわいいですか。'], 'Sharing a feeling: ね. よ would sound like you’re telling them about their own dog.'),
    s('Warn someone that the pot is hot.', '熱いですよ。気をつけて。', ['熱いですよ。気をつけて。', '熱いですね。気をつけて。', '熱いですか。気をつけて。'], 'Telling new, important information: よ.'),
    s('Your teacher asks why you were absent. Explain you had a fever.', '熱があったんです。', ['熱があったんです。', '熱がありますよ。', '熱がありましたね。'], 'Explaining: んです.'),
    s('A friend didn’t know the shop closed. Tell them it’s closed today.', '今日は休みですよ。', ['今日は休みですよ。', '今日は休みですね。', '今日は休みですか。'], 'New information for the listener: よ.'),
    s('You and a friend both just finished a hard test. Say it was difficult.', '難しかったですね。', ['難しかったですね。', '難しかったですよ。', '難しかったですか。'], 'You both know it, so: ね.'),
  ] },
];
