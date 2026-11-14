export type Level = { sizePx: number; logMar: number }
export type Trial = { level: number; correct: boolean }

// Approximate, UNCALIBRATED ladder: real optotype size depends on screen pixel density and viewing
// distance, which a browser cannot know. Use it to track change over time, not as a clinical score.
export const LADDER: readonly Level[] = [
  { sizePx: 80, logMar: 1.0 },
  { sizePx: 56, logMar: 0.85 },
  { sizePx: 40, logMar: 0.7 },
  { sizePx: 28, logMar: 0.55 },
  { sizePx: 20, logMar: 0.4 },
  { sizePx: 14, logMar: 0.3 },
  { sizePx: 10, logMar: 0.2 },
  { sizePx: 7, logMar: 0.1 },
]

const NEEDED_CORRECT = 2
const ALLOWED_WRONG = 2

/**
 * Staircase: stay at a size until 2 correct (then step smaller) or 2 wrong (then stop).
 * Reaching 2 correct at the smallest size also stops.
 */
export function nextStep(history: readonly Trial[]): { done: boolean; level: number } {
  if (history.length === 0) return { done: false, level: 0 }
  const level = history[history.length - 1].level
  const here = history.filter((t) => t.level === level)
  const correct = here.filter((t) => t.correct).length
  const wrong = here.length - correct
  if (wrong >= ALLOWED_WRONG) return { done: true, level }
  if (correct >= NEEDED_CORRECT) {
    return level >= LADDER.length - 1 ? { done: true, level } : { done: false, level: level + 1 }
  }
  return { done: false, level }
}

/** Smallest size answered correctly at least 2 times and at least 2 of every 3. Null if none. */
export function acuityResult(history: readonly Trial[]): (Level & { level: number }) | null {
  let best = -1
  for (let level = 0; level < LADDER.length; level++) {
    const here = history.filter((t) => t.level === level)
    const correct = here.filter((t) => t.correct).length
    if (correct >= NEEDED_CORRECT && correct / here.length >= 2 / 3) best = level
  }
  return best < 0 ? null : { level: best, ...LADDER[best] }
}
