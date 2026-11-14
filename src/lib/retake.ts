import type { Indicator, Quality } from '../contract/types'

// One specific, fixable instruction per failure reason, never a generic "try again".
const ADVICE: Record<NonNullable<Quality['reason']>, string> = {
  lighting: 'Put even, moderate light on your face. Avoid a dark room, a bright window behind you, or glare.',
  motion: 'Hold still and rest your head against something. Look straight at the camera for the whole reading.',
  faceLost: 'Move closer and face the camera so your whole face stays inside the outline.',
  lowSignal: 'The pulse signal was too weak. Sit still in even light with your forehead and cheeks clearly visible.',
  other: 'Something went wrong with that reading. Check the camera is not covered, then try again.',
}

const ACUITY_ADVICE =
  "We could not tell what you saw at the largest size. Hold the screen at arm's length with both eyes open and pick which way the three arms of the letter point."

export function retakeAdvice(reason: Quality['reason'] | undefined, indicator?: Indicator): string {
  if (indicator === 'nearAcuity') return ACUITY_ADVICE
  return ADVICE[reason ?? 'other']
}
