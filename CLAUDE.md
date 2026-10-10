@AGENTS.md

# Kiku — Japanese study site (project notes)

Personal Japanese study site for one learner, built with Next.js 16, React 19 and TypeScript. It deploys to Vercel from `main` (GitHub: BANKeng7460/JapaneseListening). The learner studies the **Kaishi 1.5k** Anki deck (FSRS scheduler + PassFail 2 add-on) and uses this site to practice the same words in context. Everything is static; progress lives in the browser (localStorage).

## Study flow
`/course` is the main entry point. Each Kaishi level = 20 new words, worked through in six steps:
1. **New words**: cards with furigana, meaning, picture, example sentence, native audio (inside the course page).
2. **Listening**: the level's conversations (`/?test=kaishi-1-<words>`).
3. **Reading**: two passages (`/reading?level=…`).
4. **Story**: the level's solo story (`/solo-stories?test=solo-kaishi-<a>-<b>&q=<n>`).
5. **Grammar**: the grammar used in the level's texts (inside the course page).
6. **Spot the mistake**: the grammar error game (`/mistakes?level=…`).

Links from the course add `&course=N`, which shows a "← Back to your level" banner (`components/course-banner.tsx`). After the six steps, the words are reviewed in `/flashcards`.

## Pages
| Route | What | Main files |
|---|---|---|
| `/course` | Six-step path per level, ✓ per step, 25 level tiles | `components/course.tsx`, `lib/course.ts` |
| `/` | Kaishi conversations: 6–10 listening questions per level, autoplay, answers saved | `components/listening-practice.tsx`, `data/kaishi-1-*.json`, `data/tests.ts` |
| `/reading` | 2 passages per level, tap-for-reading hints, latest-20 word cards | `components/reading-practice.tsx`, `data/reading-passages.json`, `components/kanji-hints.tsx`, `data/word-hints.json` |
| `/daily-life`, `/solo-stories` | Same listening component; solo stories has 2 original sets + one story per Kaishi level (sets of five levels) | `data/daily-life.json`, `data/solo-stories.json` |
| `/grammar` | JLPT N5–N1 (848 points): explanations, examples, quiz, learned marks, `#n5-72` deep links | `components/grammar-practice.tsx`, `data/grammar.json`, `data/grammar-kaishi.json` |
| `/flashcards` | Anki-style SRS (FSRS-5): Kaishi deck + grammar decks per JLPT level, Pass/Fail buttons, Anki progress import | `components/flashcards.tsx`, `lib/srs.ts` |
| `/mistakes` | Spot the mistake: tap the wrong word, choose the fix, or "No mistake"; 3 hearts, 10 per round | `components/mistake-game.tsx`, `data/mistakes.json` |
| `/stories` | Real-life stories (external recordings) | `components/story-practice.tsx` |

Shared pieces:
- `hooks/use-dialogue-speech.ts`: browser TTS for conversations, with a voice per speaker.
- `lib/speech.ts` + `components/voice-select.tsx`: one saved browser voice for grammar, flashcards and the mistake game.
- `components/grammar-used.tsx`: the "Grammar used here" box under passages and answered conversations.

## Data and where it comes from
| Data | Source / builder |
|---|---|
| `public/kaishi/` (cards.json + 4,354 audio/image files) | `npm run kaishi:extract` from `Kaishi.1.5k.apkg`. Committed so Vercel serves it. |
| `data/kaishi-1-20 … 1-200.json` (levels 1–10) | Hand-written earlier; keep as is |
| `data/kaishi-1-220 … 1-500.json`, reading for 11–25, Kaishi solo sets, `data/kaishi-extra-levels.ts` | `npm run levels:build` from `content/kaishi/level-NN.txt` |
| `data/grammar.json` | N5/N4 + N3–N1: point names/levels/URLs from JLPT Sensei lists; all text and examples original |
| `data/grammar-kaishi.json` | Kaishi sentences matched to N5/N4 grammar (one-off kuromoji build) |
| `data/grammar-usage.json` | `node scripts/grammar-usage.cjs` (kuromoji + `scripts/grammar-matchers.cjs`, N5/N4 only) |
| `data/word-hints.json` | Kaishi readings + conjugated forms; `node scripts/word-hint-forms.cjs` adds forms used in passages |
| `data/mistakes.json` | `node scripts/build-mistakes.cjs` (`--print` to review every item) |
| `kaishi-1.5k/anki-progress.json` (git-ignored, personal) | `npm run kaishi:progress` from a read-only copy of `%APPDATA%/Anki2/User 1/collection.anki2` |

## Commands
- `npm run dev` / `npm run build`: the build must pass before pushing (Vercel runs it).
- `npm run typecheck`, `npm test`: tests check that every Kaishi level speaks all 20 of its new words (`focusCoverage`).
- `npm run levels:build`: rebuild levels, reading, solo sets, hint forms, grammar usage and mistakes from `content/kaishi/`.
- `npm run levels:check`: list words beyond each level's vocabulary.
- `npm run kaishi:extract`, `npm run kaishi:progress`: Anki deck / progress exports. Needs Node 23+ (built-in zstd and SQLite).

## Adding the next batch of levels (e.g. 26–40)
1. Get the words: `public/kaishi/cards.json`, entries (N-1)·20+1 … N·20 for level N.
2. Write `content/kaishi/level-NN.txt` (format at the top of `scripts/build-kaishi-levels.cjs`): 6 conversations, 2 `@reading` passages and 1 `@story`. Use `@forms 201=忙しい時` when a word only appears conjugated, has two readings (時 とき/じ), or the automatic match is ambiguous.
3. Run `npm run levels:build`. It fails if a new word isn't spoken in any conversation. Then run `npm run levels:check` and either replace the out-of-level words it lists or name them as "Extra words" in the explanation.
4. Run `node scripts/build-mistakes.cjs --print` and read the new items. Tighten the rules if a "mistake" could still be correct Japanese.
5. `npm test`, `npm run build`, then update this file.

## Content rules
- Each level's texts use only words up to that level, plus basic function words; anything else is named as an extra word in the explanation. Every level uses all 20 new words.
- Japanese must sound natural, like real everyday scenes, not vocabulary drills. Put Kaishi's anime-style words (敵, 魔法, 殺す) where people would really say them (games, TV dramas, idioms).
- Explanation style: new words with readings first, then "Extra words: …". Vary answer positions across A–D.
- Grammar text is original. Never copy JLPT Sensei explanations (their terms forbid it); keep each point's link to its lesson.
- Mistake game: only plant errors that are clearly wrong. Skip particle swaps that can stay valid (people + が, position nouns + に, verbs that take に) and wrong forms that are real words (探って, 頼って).
- No native speaker has checked the Japanese yet. Treat corrections from the user as high priority.

## Browser storage keys
`kiku-course` (words/reading/grammar steps) · `kiku-progress-<genre>-<testId>` (listening/solo answers) · `kiku-last-test-<genre>` · `kiku-mistakes-best` · `kiku-srs-v1` (flashcards) · `kiku-grammar-learned`, `kiku-grammar-level` · `kiku-grammar-voice` (shared voice) · `kiku-voice-A/B`, `kiku-narrator-voice` (listening voices). Changing a key's format loses the user's progress, so migrate instead.

## Gotchas
- Next.js 16 differs from older versions; read `node_modules/next/dist/docs/` before using framework APIs (see AGENTS.md). Route params are Promises.
- Pages are static; read query params with `window.location` inside `useEffect` (no `useSearchParams` without Suspense).
- `kuromoji` is a dev dependency for build scripts only; never import it into the site.
- The user's machine is Windows. When patching files from shell heredocs, regex backslashes get lost (`\d` → `d`); use the Edit tool for regex changes.
- `lib/srs.ts` matches Anki's FSRS-5 (fsrs-rs 2.0.3) and was checked against the user's real review log. Don't change its formulas without re-checking.

## How the user likes to work
- Writes short requests; ask only when a choice really changes the result, otherwise pick a sensible default and say so.
- **After finishing each piece of work, commit and push to `main` automatically, without asking.** First run `npm run typecheck`, `npm test` and `npm run build`. If any of them fail, don't push; report the failure instead. Vercel deploys from `main`. End commits with the Co-Authored-By line. Only stage files from the work itself, and never personal data (`kaishi-1.5k/`). The user sometimes commits on their own too.
- Likes natural Japanese, autoplaying audio, native Kaishi recordings, Pass/Fail grading, and progress saved in the browser.
- Works in batches and wants to review quality before scaling up.

## History
- **Base site:** Kaishi conversations levels 1–10, daily-life and solo stories, reading page.
- **Listening:** autoplay; answers saved per test.
- **Reading:** passages rewritten as natural Japanese.
- **Grammar:** N5/N4 page (216 points) with Kaishi recordings and a voice selector, then N3–N1 (848 points in total).
- **Kaishi deck:** extracted from the .apkg.
- **Flashcards:** FSRS-5 matching Anki, Anki progress import, Pass/Fail mode. Media moved to `public/kaishi` for Vercel.
- **"Grammar used here":** boxes under passages and conversations.
- **Levels 11–25 (words 201–500):** 90 conversations, 30 passages and 15 stories, plus stories for levels 1–10. Built from `content/kaishi` with the vocabulary checker.
- **Spot the mistake:** 277 planted mistakes + 125 correct sentences, all reviewed.
- **Shared voice selector** (grammar, flashcards, game).
- **Course page:** combines every practice type into a six-step path per level.

## Next / ideas
- Levels 26+ (words 501–1,500) in batches of ~15, same format, once the user is happy with 11–25.
- Grammar detection, Kaishi example sentences and the mistake game cover N5/N4 grammar only; extending to N3–N1 needs new matchers.
- Possible: send missed mistake-game sentences to Flashcards; let the course's new-words step add cards to the SRS; stats page (reviews per day, forecast).
