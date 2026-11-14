import { BLINK_CLOSE, BLINK_OPEN } from './constants'

export type EyeSeries = { left: number[]; right: number[] }
export type BlinkMetrics = { blinkRate: number; eyelidClosurePct: number }

/**
 * Blink rate (per minute) and share of frames with the eyes closed, from the MediaPipe
 * eyeBlinkLeft/Right blendshape scores. Hysteresis stops a score hovering at the threshold
 * from counting as many blinks.
 */
export function blinkMetrics({ left, right }: EyeSeries, fps: number): BlinkMetrics {
  const n = Math.min(left.length, right.length)
  if (n === 0 || fps <= 0) return { blinkRate: 0, eyelidClosurePct: 0 }

  let closed = false
  let blinks = 0
  let closedFrames = 0
  for (let i = 0; i < n; i++) {
    const v = (left[i] + right[i]) / 2
    if (!closed && v >= BLINK_CLOSE) {
      closed = true
      blinks++
    } else if (closed && v <= BLINK_OPEN) {
      closed = false
    }
    if (v >= BLINK_CLOSE) closedFrames++
  }
  const minutes = n / fps / 60
  return { blinkRate: blinks / minutes, eyelidClosurePct: (closedFrames / n) * 100 }
}
