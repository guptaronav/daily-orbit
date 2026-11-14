import type { Quality } from '../contract/types'

// One specific, fixable instruction per failure reason, never a generic "try again".
const ADVICE: Record<NonNullable<Quality['reason']>, string> = {
  lighting: 'Put even, moderate light on your face. Avoid a dark room, a bright window behind you, or glare.',
  motion: 'Hold still and rest your head against something. Look straight at the camera for the whole reading.',
  faceLost: 'Move closer and face the camera so your whole face stays inside the outline.',
  lowSignal: 'The pulse signal was too weak. Sit still in even light with your forehead and cheeks clearly visible.',
  other: 'Something went wrong with that reading. Check the camera is not covered, then try again.',
}

export function retakeAdvice(reason: Quality['reason'] | undefined): string {
  return ADVICE[reason ?? 'other']
}
