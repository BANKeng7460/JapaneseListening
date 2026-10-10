# Kiku - Japanese listening practice

Next.js App Router, React, and TypeScript. Includes separate cumulative tests, A/B voice selection, questions, transcripts, explanations, and scoring.

## Run locally

Use Node.js 20.9+ (a supported LTS release is recommended).

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000 in Edge. On Windows, npm.cmd avoids PowerShell script restrictions. On other systems use npm.

## Checks and production

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

## Structure

- app/: App Router page, layout, and styles.
- components/listening-practice.tsx: practice interface and session state.
- hooks/use-dialogue-speech.ts: browser voice discovery, saved preferences, and cancellable A/B playback.
- data/kaishi-1-60.json: preserved eight conversations and 60-word list.
- data/kaishi-1-80.json: eight additional conversations and cumulative 80-word list.
- data/kaishi-1-100.json: ten conversations focused on entries 81-100, with the cumulative 100-word list.
- data/tests.ts: typed test registry with separate 1-60, 1-80, and 1-100 tests.
- tests/: migration preservation and exercise data checks.
- legacy/: standalone snapshot. Root HTML/JS files are also retained for compatibility; Next.js does not use them.
- Kaishi 1.5k.txt: original vocabulary source, not a public asset.

## Add a new test

Create a separate data file such as data/kaishi-1-80.json. Import it into data/tests.ts and replace only its planned registry entry. Preserve all earlier test files.

Each test needs id, label, wordCount, words (arrays of word, reading, meaning), and questions. Each question needs situation, lines (speaker A/B, text, translation), question, four choices, a zero-based answer, and explanation. Follow the existing JSON example and TypeScript types.

Milestones are cumulative: 1-80 draws from the first 80 vocabulary entries, excluding the welcome card. Basic grammar can be used and explained. The UI derives labels, word lists, counts, and results from the selected test.

Listening answers are saved per test in localStorage, so progress survives reloads and test switches; "Practice again" clears that test's saved answers. Voice preferences persist per browser origin when storage is available: choose voices once again after moving from the old file page to localhost.

Changing a voice or speed stops playback; press Play to restart. Japanese voices depend on the browser/device. Online voices need a network connection. No API key or paid speech service is required.

## Daily-life conversations

Visit /daily-life for 20 original practice conversations across four five-question sets: food and cafes, shopping and services, getting around, and friends and home. Data is in data/daily-life.json. These use the shared A/B browser voice player and are separate from the Kaishi milestones and recorded Real-life stories. Vocabulary is not limited to the Kaishi list.

Kaishi levels: Level 1 (1-20), Level 2 (1-40), Level 3 (1-60), Level 4 (1-80), Level 5 (1-100). The side panel has a collapsed latest-20 vocabulary list for the selected level, plus the complete cumulative list. Existing 1-60/80/100 data files are preserved.

Every Kaishi level covers all 20 new vocabulary entries. focusCoverage maps each entry to a spoken line and inflected form; repeated spellings are checked by their intended meaning. The sidebar shows example conversation numbers. When revising lessons, keep these anchors accurate and run npm.cmd test. Original standalone lessons remain in legacy.

Levels 6-10 add six conversations each: 1-120 (focus 101-120), 1-140 (121-140), 1-160 (141-160), 1-180 (161-180), and 1-200 (181-200). Each new entry has an explicit spoken example in focusCoverage. Notes explain extra vocabulary, grammar, and casual or potentially rude forms. Earlier levels remain unchanged.

## Reading practice

/reading provides all ten Kaishi levels: dialogue reading reuses the verified listening scripts and comprehension questions; a separate latest-20 word-card mode hides kana and meaning until revealed. The sidebar has individually expandable vocabulary hints. Reading attempts have independent session-only scores. Level changes reset reading progress and word-card reveal state. Full-sentence furigana is not provided; word readings come from the Anki export.

Reading update: /reading now uses data/reading-passages.json, with two independently written prose passages and new questions per level, written as natural Japanese (later levels use plain style for 俺/僕 narrators). Conjugated forms in passages need their own entries in data/word-hints.json for tap hints. It no longer reads listening dialogue scripts or uses their questions/examples. Word cards still use the shared Anki vocabulary.

## Solo stories

/solo-stories adds ten original fictional monologues across two sets. Each uses one narrator, a separate saved narrator voice, Pause/Resume/Stop, question selection, scoring, and a transcript after answering. Data: data/solo-stories.json. Browser speech is used; the human-recorded Real-life stories genre remains separate. Vocabulary is not limited to a Kaishi level.

## Grammar (N5–N1)

/grammar lists 848 grammar points from data/grammar.json: N5 84, N4 132, N3 182, N2 197, N1 253. Each point has an original meaning, formation, note and two example sentences (playable with the saved browser voice), plus a link to its JLPT Sensei lesson. Points can be marked as learned (saved in localStorage); "Quiz me" asks the meaning of unlearned points first. The JLPT publishes no official grammar list: only point names, levels and lesson URLs were taken from JLPT Sensei's N5–N1 lists, because its terms forbid republishing its explanations. Point ids (n5-1, n4-62, n1-235…) follow those lists' numbering. Flashcards has a deck per level; Kaishi example sentences and the "Grammar used here" detection cover N5/N4 only.

Kaishi examples: data/grammar-kaishi.json adds up to three sentences from the Kaishi 1.5k deck to 128 grammar points, playing the deck's own recordings from public/kaishi/media/. Sentences were matched automatically with a morphological tokenizer (kuromoji) and per-point rules, then spot-checked; the audio comes from the deck's sources (JLPT Tango and others), and is published with the site.

## Flashcards (Anki-style SRS)

/flashcards reviews three decks: Kaishi 1.5k (word + sentence audio, pictures, furigana) and the N5/N4 grammar points. lib/srs.ts implements Anki's v3 queue behaviour (learning steps 1m 10m, relearning 10m, 20 new / 200 reviews per day, 4am rollover, interval fuzz, Again/Hard/Good/Easy previews, undo) with FSRS-5 at 90% desired retention — the scheduler and settings found in the local Anki install (fsrs-rs 2.0.3) and the Kaishi deck options. Replaying the Anki review log through lib/srs.ts reproduces Anki's stored stability within ~1.4% and difficulty within 0.002. Progress is saved in localStorage.

Kaishi card data (Node 23+): `npm run kaishi:extract` reads Kaishi.1.5k.apkg into public/kaishi/ (cards.json plus ~4,350 media files, ~116 MB), which is committed and deployed as static files — re-run it and commit after updating the deck. `npm run kaishi:progress` copies your Anki progress for the Kaishi deck (read from a copy of %APPDATA%/Anki2/User 1/collection.anki2) into kaishi-1.5k/anki-progress.json, which stays git-ignored; pick that file with "Import my Anki progress…" in the deck options, locally or on the deployed site. The import is one-way and one-time.

Grammar used here: reading passages and conversations (shown after answering) list the N5/N4 grammar they use, linking to /grammar#<id>. data/grammar-usage.json is generated by `node scripts/grammar-usage.cjs` (kuromoji tokens + rules in scripts/grammar-matchers.cjs); re-run it after editing passages or dialogue scripts.

## Kaishi levels 11+ (content pipeline)

Levels 11–25 (words 201–500) are written as plain text in content/kaishi/level-NN.txt: six conversations, two reading passages and one solo story per level (levels 1–10 have a solo story only). `npm run levels:build` turns them into data/kaishi-1-<words>.json, data/reading-passages.json, data/solo-stories.json (one set per five levels), data/kaishi-extra-levels.ts, new tap-hint forms and grammar-usage data. The build fails if any of a level's 20 new words isn't spoken in a conversation; use `@forms 201=忙しい時` when a word only appears conjugated or has two readings. `npm run levels:check` lists words beyond each level's vocabulary so they can be replaced or named as "Extra words" in the explanation.

## Spot the mistake

/mistakes is a grammar error game per Kaishi level. data/mistakes.json is built by `node scripts/build-mistakes.cjs` (also part of `npm run levels:build`): it takes each level's conversation lines, splits them into tappable chunks with kuromoji, and plants one common learner error (particles で/に/を/が, て-form, ます/たい/ない forms, い/な-adjective forms), plus a few correct sentences. Rules skip cases where the swap could still be correct Japanese (people before を, position nouns before に, verbs that take に, real-word forms like 探って); review the output with `--print` after changing rules. A round is 10 sentences with 3 hearts; best scores are saved in localStorage.

## Course

/course combines everything into one path per Kaishi level: learn the 20 new words (cards with native audio), listen to the conversations, read the two passages, hear the level's solo story, check the grammar used, then spot the mistake. Each step shows ✓ when done. Steps 2–4 and 6 open the existing pages already set to the level (`/?test=kaishi-1-240`, `/reading?level=…`, `/solo-stories?test=…&q=…`, `/mistakes?level=…`) with `&course=N`, which adds a "Back to your level" banner. Completion is read from each page's own localStorage progress; new words, reading and grammar are recorded in `kiku-course` (lib/course.ts).
