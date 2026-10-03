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
- data/tests.ts: typed test registry with 1-60 and 1-80 available; 1-100 planned.
- tests/: migration preservation and exercise data checks.
- legacy/: standalone snapshot. Root HTML/JS files are also retained for compatibility; Next.js does not use them.
- Kaishi 1.5k.txt: original vocabulary source, not a public asset.

## Add a new test

Create a separate data file such as data/kaishi-1-80.json. Import it into data/tests.ts and replace only its planned registry entry. Preserve all earlier test files.

Each test needs id, label, wordCount, words (arrays of word, reading, meaning), and questions. Each question needs situation, lines (speaker A/B, text, translation), question, four choices, a zero-based answer, and explanation. Follow the existing JSON example and TypeScript types.

Milestones are cumulative: 1-80 draws from the first 80 vocabulary entries, excluding the welcome card. Basic grammar can be used and explained. The UI derives labels, word lists, counts, and results from the selected test.

Switching tests starts a fresh attempt. Scores are session-only. Voice preferences persist per browser origin when storage is available: choose voices once again after moving from the old file page to localhost.

Changing a voice or speed stops playback; press Play to restart. Japanese voices depend on the browser/device. Online voices need a network connection. No API key or paid speech service is required.
