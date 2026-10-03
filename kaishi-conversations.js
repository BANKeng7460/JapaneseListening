// Original practice dialogues using vocabulary from the first 60 entries of
// Kaishi 1.5k.txt (excluding the welcome card). Basic grammar is also used.
const kaishiQuestions = [
  { situation:'Choosing a book · Two friends', lines:[
    {speaker:'A', text:'これは何ですか。', translation:'What is this?'},
    {speaker:'B', text:'日本語の本です。', translation:'It’s a Japanese-language book.'},
    {speaker:'A', text:'その本は面白いですか。', translation:'Is that book interesting?'},
    {speaker:'B', text:'はい、面白いです。私はこの本が好きです。', translation:'Yes, it’s interesting. I like this book.'}
  ], question:'What does B think of the book?', choices:['It is not interesting at all.','It is interesting, and B likes it.','B does not know the book.','B does not like it very much.'], answer:1, explanation:'B says 面白い (interesting) and この本が好きです (I like this book).'},
  { situation:'Time to study · Two friends', lines:[
    {speaker:'A', text:'毎日、日本語を勉強しますか。', translation:'Do you study Japanese every day?'},
    {speaker:'B', text:'はい、毎日勉強します。', translation:'Yes, I study every day.'},
    {speaker:'A', text:'今、時間はありますか。', translation:'Do you have time now?'},
    {speaker:'B', text:'いいえ、今は時間がありません。明日、また勉強します。', translation:'No, I don’t have time now. I’ll study again tomorrow.'}
  ], question:'When will B study again?', choices:['Now','B will not study again.','Tomorrow','B has not decided.'], answer:2, explanation:'明日 means tomorrow; また means again. B has no time now: 今は時間がありません.'},
  { situation:'Talking about family · Two friends', lines:[
    {speaker:'A', text:'あの人は先生ですか。', translation:'Is that person over there a teacher?'},
    {speaker:'B', text:'はい、私の兄です。', translation:'Yes, he’s my older brother.'},
    {speaker:'A', text:'何を教えていますか。', translation:'What does he teach?'},
    {speaker:'B', text:'日本語を教えています。', translation:'He teaches Japanese.'}
  ], question:'Who teaches Japanese?', choices:['Speaker A','Speaker B','B’s girlfriend','B’s older brother'], answer:3, explanation:'私の兄 means my older brother. 教えています is a form of 教える (teach), used here for his ongoing work.'},
  { situation:'Finding a book · At home', lines:[
    {speaker:'A', text:'私の本はどこですか。', translation:'Where is my book?'},
    {speaker:'B', text:'ここにあります。この本ですか。', translation:'It’s here. Is it this book?'},
    {speaker:'A', text:'はい、その本です。ここに置いてください。', translation:'Yes, that’s the book. Please put it here.'},
    {speaker:'B', text:'はい。', translation:'Okay.'}
  ], question:'What does A ask B to do?', choices:['Put the book here','Go to school','Tell A a name','Look at a person'], answer:0, explanation:'ここ means here. 置いてください means please put/place it, using the て-form of 置く plus ください.'},
  { situation:'Plans for tomorrow · Two classmates', lines:[
    {speaker:'A', text:'明日、学校に来ますか。', translation:'Will you come to school tomorrow?'},
    {speaker:'B', text:'はい、来ます。', translation:'Yes, I will.'},
    {speaker:'A', text:'先生も来ますか。', translation:'Will the teacher come too?'},
    {speaker:'B', text:'いいえ、先生は来ません。', translation:'No, the teacher won’t come.'}
  ], question:'Who will come to school tomorrow?', choices:['Only the teacher','Both B and the teacher','B, but not the teacher','Neither B nor the teacher'], answer:2, explanation:'B says 来ます (will come), but 先生は来ません (the teacher won’t come). Listen for the negative ending ません.'},
  { situation:'A story · Two friends', lines:[
    {speaker:'A', text:'この話を知っていますか。', translation:'Do you know this story?'},
    {speaker:'B', text:'はい、知っています。', translation:'Yes, I do.'},
    {speaker:'A', text:'面白いと思いますか。', translation:'Do you think it’s interesting?'},
    {speaker:'B', text:'いいえ、あまり面白くないと思います。', translation:'No, I don’t think it’s very interesting.'}
  ], question:'What does B think of the story?', choices:['It is very interesting.','It is not very interesting.','B does not know the story.','B wants the teacher to tell it.'], answer:1, explanation:'あまり with a negative means not very. 面白くない is the negative form of 面白い; と思います means I think.'},
  { situation:'Choosing where to study · Two friends', lines:[
    {speaker:'A', text:'どこで日本語を勉強しますか。', translation:'Where do you study Japanese?'},
    {speaker:'B', text:'家で勉強します。', translation:'I study at home.'},
    {speaker:'A', text:'学校では勉強しませんか。', translation:'Don’t you study at school?'},
    {speaker:'B', text:'はい、学校ではあまり勉強しません。', translation:'That’s right. I don’t study much at school.'}
  ], question:'Where does B say they study Japanese?', choices:['At the teacher’s home','At their older brother’s home','Only at school','At home'], answer:3, explanation:'家で means at home. B confirms the negative question with はい: yes, that’s right, they do not study much at school.'},
  { situation:'Heading home · Two classmates', lines:[
    {speaker:'A', text:'いつ家に帰りますか。', translation:'When are you going home?'},
    {speaker:'B', text:'今、帰ります。', translation:'I’m going home now.'},
    {speaker:'A', text:'明日、またここに来ますか。', translation:'Will you come here again tomorrow?'},
    {speaker:'B', text:'はい、来ます。', translation:'Yes, I will.'}
  ], question:'What are B’s plans?', choices:['Go home now and return here tomorrow','Go home tomorrow','Stay here now and not return tomorrow','Go to the teacher’s home now'], answer:0, explanation:'今、帰ります means I’m going home now. B also agrees to come here again tomorrow: 明日、またここに来ます.'}
];
