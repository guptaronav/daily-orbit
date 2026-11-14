import { MAX_MOTION } from './constants'
import { lightingOk } from './quality'

export type FrameFacts = {
  found: boolean
  /** Nose tip, normalized 0-1 across the frame. */
  noseX: number
  noseY: number
  /** Face width as a fraction of frame width. */
  faceW: number
  /** Mean face brightness, 0-255. */
  luma: number
  /** Recent head-motion score (see motionScore). */
  motion: number
}

export type PositionChecks = {
  found: boolean
  centered: boolean
  size: 'ok' | 'far' | 'close'
  light: 'ok' | 'dark' | 'bright'
  still: boolean
  ready: boolean
  /** The single most important thing to fix right now. */
  hint: string
}

// Tunable guesses (see NOTES.md): how off-center and how near/far a face may be.
const MAX_OFFSET_X = 0.12
const MAX_OFFSET_Y = 0.15
const MIN_FACE_W = 0.25
const MAX_FACE_W = 0.6

export function positionChecks(f: FrameFacts): PositionChecks {
  const centered = f.found && Math.abs(f.noseX - 0.5) <= MAX_OFFSET_X && Math.abs(f.noseY - 0.5) <= MAX_OFFSET_Y
  const size = !f.found || f.faceW >= MIN_FACE_W ? (f.faceW > MAX_FACE_W ? 'close' : 'ok') : 'far'
  const light = f.found ? lightingOk(f.luma) : 'ok'
  const still = f.motion <= MAX_MOTION
  const ready = f.found && centered && size === 'ok' && light === 'ok' && still

  const hint = !f.found
    ? 'Face the camera so your whole face is visible.'
    : light === 'dark'
      ? 'Add more light on your face.'
      : light === 'bright'
        ? 'Too bright. Reduce glare or turn away from the window.'
        : size === 'far'
          ? 'Move closer to the camera.'
          : size === 'close'
            ? 'Move back a little.'
            : !centered
              ? 'Center your face in the outline.'
              : !still
                ? 'Hold still.'
                : 'Good. Hold still and press Start.'
  return { found: f.found, centered, size, light, still, ready, hint }
}
