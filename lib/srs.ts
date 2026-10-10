// Spaced repetition modeled on Anki's v3 scheduler with FSRS-5 (fsrs-rs 2.x, Anki 24.11–25.02).
// Pure functions only: the review page owns storage and UI.

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export type Memory = { s: number; d: number };
export type CardState = {
  phase: 'new' | 'learning' | 'review' | 'relearning';
  due: number;        // learning/relearning: epoch ms; review: day number; new: unused
  step: number;       // index into learning or relearning steps
  ivl: number;        // days, for review cards
  memory: Memory | null;
  lastReview: number | null; // epoch ms
  reps: number;
  lapses: number;
};
export type Settings = {
  learnSteps: number[];   // minutes
  relearnSteps: number[]; // minutes
  newPerDay: number;
  reviewsPerDay: number;
  retention: number;      // desired retention, 0.7–0.97
  maxInterval: number;    // days
  weights: number[];
};

// FSRS-5 default parameters, as shipped in fsrs-rs 2.x.
export const FSRS5_WEIGHTS = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
// Values from the Kaishi 1.5k deck's options in Anki.
export const DEFAULT_SETTINGS: Settings = { learnSteps: [1, 10], relearnSteps: [10], newPerDay: 20, reviewsPerDay: 200, retention: 0.9, maxInterval: 36500, weights: FSRS5_WEIGHTS };
export const NEW_CARD: CardState = { phase: 'new', due: 0, step: 0, ivl: 0, memory: null, lastReview: null, reps: 0, lapses: 0 };

const DECAY = -0.5, FACTOR = 19 / 81, S_MIN = 0.01, S_MAX = 36500;
const MINUTE = 60_000, ROLLOVER_HOURS = 4;
export const LEARN_AHEAD_MS = 20 * MINUTE;

export const retrievability = (elapsedDays: number, s: number) => (1 + FACTOR * elapsedDays / s) ** DECAY;
const clampD = (d: number) => Math.min(10, Math.max(1, d));
const initD = (w: number[], g: Rating) => w[4] - Math.exp(w[5] * (g - 1)) + 1;

/** One FSRS-5 step. elapsedDays is counted in scheduler days (0 = same day, which uses the short-term formula). */
export function nextMemory(memory: Memory | null, elapsedDays: number, g: Rating, w = FSRS5_WEIGHTS): Memory {
  if (!memory) return { s: Math.max(S_MIN, w[g - 1]), d: clampD(initD(w, g)) };
  const { s, d } = memory;
  let next: number;
  if (elapsedDays === 0) next = s * Math.exp(w[17] * (g - 3 + w[18]));
  else {
    const r = retrievability(elapsedDays, s);
    next = g === 1
      ? Math.min(w[11] * d ** -w[12] * ((s + 1) ** w[13] - 1) * Math.exp((1 - r) * w[14]), s / Math.exp(w[17] * w[18]))
      : s * (Math.exp(w[8]) * (11 - d) * s ** -w[9] * (Math.exp((1 - r) * w[10]) - 1) * (g === 2 ? w[15] : 1) * (g === 4 ? w[16] : 1) + 1);
  }
  const damped = d + -w[6] * (g - 3) * (10 - d) / 9;
  return { s: Math.min(S_MAX, Math.max(S_MIN, next)), d: clampD(w[7] * initD(w, 4) + (1 - w[7]) * damped) };
}

/** Scheduler day with Anki's default 4am rollover, in local time. */
export function dayNumber(ms: number) {
  const local = ms - new Date(ms).getTimezoneOffset() * MINUTE;
  return Math.floor((local - ROLLOVER_HOURS * 60 * MINUTE) / 86_400_000);
}

// Anki's interval fuzz: wider for longer intervals, none below 2.5 days.
function fuzz(ivl: number, random: () => number) {
  if (ivl < 2.5) return ivl;
  const delta = 1 + [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]]
    .reduce((sum, [start, end, factor]) => sum + factor * Math.max(0, Math.min(ivl, end) - start), 0);
  const lo = Math.round(ivl - delta), hi = Math.round(ivl + delta);
  return lo + Math.floor(random() * (hi - lo + 1));
}
const interval = (s: number, cfg: Settings) => s / FACTOR * (cfg.retention ** (1 / DECAY) - 1);

/** Next state for every button, so the page can show "Again 1m · Good 10m · …" like Anki. */
export function previewAnswers(card: CardState, now: number, cfg: Settings, random = Math.random): Record<Rating, CardState> {
  const today = dayNumber(now);
  const elapsed = card.lastReview === null ? 0 : Math.max(0, today - dayNumber(card.lastReview));
  const base = { reps: card.reps + 1, lastReview: now };
  const memoryFor = (g: Rating) => nextMemory(card.memory, elapsed, g, cfg.weights);
  const learnAt = (phase: 'learning' | 'relearning', step: number, minutes: number, g: Rating, lapses = card.lapses): CardState =>
    ({ ...card, ...base, phase, step, due: now + Math.round(minutes * MINUTE), memory: memoryFor(g), lapses });
  const reviewIn = (days: number, g: Rating, lapses = card.lapses): CardState =>
    ({ ...card, ...base, phase: 'review', step: 0, ivl: days, due: today + days, memory: memoryFor(g), lapses });
  const daysFor = (g: Rating, min = 1) => Math.min(cfg.maxInterval, Math.max(min, fuzz(Math.round(interval(memoryFor(g).s, cfg)), random)));

  if (card.phase === 'review') {
    const hard = daysFor(2), good = Math.max(daysFor(3), hard + 1), easy = Math.max(daysFor(4), good + 1);
    const again = cfg.relearnSteps.length
      ? learnAt('relearning', 0, cfg.relearnSteps[0], 1, card.lapses + 1)
      : reviewIn(daysFor(1), 1, card.lapses + 1);
    return { 1: again, 2: reviewIn(hard, 2), 3: reviewIn(good, 3), 4: reviewIn(easy, 4) };
  }

  // New, learning and relearning cards walk through their steps; finishing them graduates with an FSRS interval.
  const phase = card.phase === 'relearning' ? 'relearning' : 'learning';
  const steps = phase === 'relearning' ? cfg.relearnSteps : cfg.learnSteps;
  const step = card.phase === 'new' ? 0 : card.step;
  const goodDays = daysFor(3), easyDays = Math.max(daysFor(4), goodDays + 1);
  const hardDelay = step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : step === 0 ? Math.min(steps[0] * 1.5, steps[0] + 1440) : steps[step];
  return {
    1: steps.length ? learnAt(phase, 0, steps[0], 1) : reviewIn(daysFor(1), 1),
    2: steps.length ? learnAt(phase, step, hardDelay, 2) : reviewIn(daysFor(2), 2),
    3: step + 1 < steps.length ? learnAt(phase, step + 1, steps[step + 1], 3) : reviewIn(goodDays, 3),
    4: reviewIn(easyDays, 4),
  };
}

/** "<1m", "10m", "3h", "4d", "2.1mo", "1.3y" — the labels Anki shows above its buttons. */
export function describeDue(next: CardState, now: number) {
  if (next.phase === 'review') {
    const days = next.ivl;
    return days < 30 ? `${days}d` : days < 365 ? `${(days / 30).toFixed(1)}mo` : `${(days / 365).toFixed(1)}y`;
  }
  const minutes = Math.round((next.due - now) / MINUTE);
  return minutes < 1 ? '<1m' : minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.round(minutes / 60)}h` : `${Math.round(minutes / 1440)}d`;
}
