@AGENTS.md

# Kiku — Japanese listening practice (project notes)

Personal Japanese study site (Next.js 16, React 19, TypeScript), deployed on Vercel from `main` (repo BANKeng7460/JapaneseListening). The learner studies the **Kaishi 1.5k** Anki deck (FSRS + PassFail 2 add-on) and uses this site alongside it.

## Pages
| Route | What | Main files |
|---|---|---|
| `/` | Kaishi conversations: listening tests per Kaishi level (20 new words per level, cumulative; levels 1–25 = words 1–500) | `components/listening-practice.tsx`, `data/kaishi-1-*.json`, `data/tests.ts`, `content/kaishi/` |
| `/reading` | 2 prose passages per level + latest-20 word cards, tap-for-reading hints | `components/reading-practice.tsx`, `data/reading-passages.json`, `components/kanji-hints.tsx`, `data/word-hints.json` |
| `/daily-life`, `/solo-stories` | Same listening component, other content sets | `data/daily-life.json`, `data/solo-stories.json` |
| `/grammar` | JLPT N5–N1 grammar (848 points), learned marks, quiz, browser-voice selector, `#id` deep links | `components/grammar-practice.tsx`, `data/grammar.json`, `data/grammar-kaishi.json` |
| `/flashcards` | Anki-style SRS: Kaishi 1.5k deck + grammar decks per level | `components/flashcards.tsx`, `lib/srs.ts`, `public/kaishi/` |
| `/stories` | Real-life stories (external recordings) | `components/story-practice.tsx` |
| `/mistakes` | Spot the mistake: grammar error game per Kaishi level (tap the wrong word, pick the fix, or “No mistake”) | `components/mistake-game.tsx`, `data/mistakes.json`, `scripts/build-mistakes.cjs` |

Shared: `hooks/use-dialogue-speech.ts` (browser TTS, voice per speaker), `components/grammar-used.tsx` ("Grammar used here" box), `lib/speech.ts`.

## Data and scripts
- `npm run kaishi:extract` → reads `Kaishi.1.5k.apkg` into `public/kaishi/` (cards.json + 4,354 media files, committed so Vercel serves them).
- `npm run kaishi:progress` → copies the user's Anki progress (from `%APPDATA%/Anki2/User 1/collection.anki2`, read-only copy) to `kaishi-1.5k/anki-progress.json` (git-ignored); imported in the browser via "Import my Anki progress…".
- `node scripts/grammar-usage.cjs` → regenerates `data/grammar-usage.json` (N5/N4 grammar found in passages/conversations; kuromoji + `scripts/grammar-matchers.cjs`). Re-run after editing any passage or dialogue.
- `lib/srs.ts` reproduces Anki's FSRS-5 (fsrs-rs 2.0.3) and v3 queue rules; verified against the user's real review log. Deck defaults come from their Anki options (steps 1m 10m / 10m, 20 new, 200 reviews, 90% retention).
- New Kaishi levels: write content/kaishi/level-NN.txt, then `npm run levels:build` (builds level JSON, reading, solo sets, hint forms, grammar usage) and `npm run levels:check` (words beyond the level). Format is documented at the top of scripts/build-kaishi-levels.cjs.
- Checks: `npm run typecheck`, `npm test` (tests/data.test.cjs validates every level covers its 20 new words), `npm run build`.

## Content rules
- Conversations, passages and stories for a Kaishi level may only rely on words up to that level (plus basic function words); extra words are named in the explanation. Every level must use all 20 new words naturally (`focusCoverage`). Japanese should sound natural, not like vocabulary drills.
- Grammar text and examples are original. Only point names/levels/lesson URLs come from JLPT Sensei (their terms forbid copying explanations); keep linking each point to its lesson.
- Kaishi audio/images come from the deck's sources; the user chose to publish them on the site.

## How the user likes to work
- Commit and push to `main` when asked (Vercel deploys from it). End commits with the Co-Authored-By line.
- Answer buttons: Pass / Fail by default (mirrors their PassFail 2 add-on).
- Prefers natural Japanese, autoplaying audio, and progress saved in the browser.

## History (what's been done)
- Initial site: Kaishi conversations levels 1–10 (words 1–200), daily-life and solo stories, reading page.
- Audio autoplays on each question; answers saved per test in localStorage.
- Reading passages rewritten as natural Japanese; hint forms added.
- Grammar page: N5/N4 (216) → N5–N1 (848), Kaishi recordings as examples, voice selector, deep links.
- Kaishi deck extracted; Flashcards page with FSRS, Anki progress import, Pass/Fail mode; data moved to `public/kaishi` for Vercel.
- "Grammar used here" boxes under reading passages and (after answering) conversations.
- Spot the mistake game (/mistakes): ~280 planted mistakes + ~125 correct sentences over 25 levels, generated from the conversations and reviewed.
- Kaishi levels 11–25 (words 201–500): 6 conversations, 2 reading passages and 1 solo story each, plus solo stories for levels 1–10 (solo sets grouped by five levels). Built from content/kaishi with a vocabulary checker.

## In progress / next
- Next batches: Kaishi levels 26+ (words 501–1,500), same format, once the user is happy with levels 11–25.
- Grammar detection and Kaishi example sentences cover N5/N4 only; N3–N1 not yet.
