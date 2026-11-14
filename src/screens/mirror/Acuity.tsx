import { useState } from 'react'
import { btnSecondary } from '../../components/ui'
import { LADDER, acuityResult, nextStep, type Trial } from '../../lib/vision/acuity'

type Direction = 'Right' | 'Down' | 'Left' | 'Up'
const DIRECTIONS: readonly Direction[] = ['Right', 'Down', 'Left', 'Up'] // clockwise from "E opens right"

/** Couldn't read even the largest size: worse than the ladder covers. */
const UNREADABLE_LOGMAR = 1.1

const randomDirection = (): Direction => DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]

// Tumbling "E" drawn as SVG so it never depends on a font. Rotation 0 = arms point right.
function OptotypeE({ sizePx, direction }: { sizePx: number; direction: Direction }) {
  const rotation = DIRECTIONS.indexOf(direction) * 90
  return (
    <svg width={sizePx} height={sizePx} viewBox="0 0 5 5" role="img" aria-label="Test letter" style={{ transform: `rotate(${rotation}deg)` }}>
      <rect x="0" y="0" width="1" height="5" />
      <rect x="0" y="0" width="5" height="1" />
      <rect x="0" y="2" width="5" height="1" />
      <rect x="0" y="4" width="5" height="1" />
    </svg>
  )
}

export type AcuityOutcome = { logMar: number; readable: boolean }

export function Acuity({ onComplete }: { onComplete: (outcome: AcuityOutcome) => void }) {
  const [history, setHistory] = useState<Trial[]>([])
  const [direction, setDirection] = useState<Direction>(randomDirection)
  const { level } = nextStep(history)

  /** `null` means "I can't tell", which counts as a miss. */
  function answer(guess: Direction | null) {
    const next = [...history, { level, correct: guess === direction }]
    if (nextStep(next).done) {
      const result = acuityResult(next)
      onComplete({ logMar: result?.logMar ?? UNREADABLE_LOGMAR, readable: result !== null })
      return
    }
    setHistory(next)
    setDirection(randomDirection())
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">Hold the screen at arm's length with both eyes open. Which way do the three arms of the letter point?</p>
      <div className="flex h-36 items-center justify-center border border-rule bg-panel">
        <OptotypeE sizePx={LADDER[level].sizePx} direction={direction} />
      </div>
      <div className="flex flex-wrap gap-3">
        {(['Up', 'Right', 'Down', 'Left'] as const).map((d) => (
          <button key={d} onClick={() => answer(d)} className={btnSecondary}>
            {d}
          </button>
        ))}
        <button onClick={() => answer(null)} className="text-sm text-muted underline underline-offset-4">
          I can't tell
        </button>
      </div>
      <p className="text-xs text-muted">Step {level + 1} of {LADDER.length}. Approximate: screen size and distance are not calibrated.</p>
    </div>
  )
}
