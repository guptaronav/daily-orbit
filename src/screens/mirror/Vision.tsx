import { useState } from 'react'
import { btnPrimary, linkBtn } from '../../components/ui'
import { summarizeAmsler, type AmslerSummary } from '../../lib/vision/amsler'
import { Acuity, type AcuityOutcome } from './Acuity'
import { AmslerGrid } from './AmslerGrid'

const GRID_N = 10

export type VisionResult = { amsler: { left: AmslerSummary; right: AmslerSummary }; acuity: AcuityOutcome }

type Phase = 'right' | 'left' | 'acuity'

const EYE_COPY = {
  right: { test: 'RIGHT', cover: 'LEFT' },
  left: { test: 'LEFT', cover: 'RIGHT' },
} as const

/** Amsler grid one eye at a time, then a short near-acuity check. */
export function Vision({ onComplete }: { onComplete: (result: VisionResult) => void }) {
  const [phase, setPhase] = useState<Phase>('right')
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set())
  const [rightEye, setRightEye] = useState<AmslerSummary | null>(null)
  const [leftEye, setLeftEye] = useState<AmslerSummary | null>(null)

  const toggle = (key: string) =>
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  function finishEye() {
    const summary = summarizeAmsler(marked, GRID_N)
    setMarked(new Set())
    if (phase === 'right') {
      setRightEye(summary)
      setPhase('left')
    } else {
      setLeftEye(summary)
      setPhase('acuity')
    }
  }

  if (phase === 'acuity') {
    return (
      <section aria-labelledby="acuity-heading" className="space-y-4">
        <h2 id="acuity-heading" className="text-xl font-semibold tracking-tight">
          Near-vision check
        </h2>
        <Acuity
          onComplete={(acuity) => onComplete({ amsler: { right: rightEye as AmslerSummary, left: leftEye as AmslerSummary }, acuity })}
        />
      </section>
    )
  }

  const eye = EYE_COPY[phase]
  return (
    <section aria-labelledby="amsler-heading" className="space-y-4">
      <h2 id="amsler-heading" className="text-xl font-semibold tracking-tight">
        Amsler grid, {eye.test.toLowerCase()} eye
      </h2>
      <p className="max-w-xl text-sm">
        Hold the screen about an arm's length away (roughly 35 cm). Cover your <strong>{eye.cover}</strong> eye. Look at the dot with your{' '}
        <strong>{eye.test}</strong> eye and keep looking at it. Mark any squares where the lines look wavy, blurred or missing. With a keyboard: Tab into the grid, move with the arrow keys, press Space to mark a square.
      </p>
      <AmslerGrid n={GRID_N} marked={marked} onToggle={toggle} eyeLabel={`${eye.test.toLowerCase()} eye`} />
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={finishEye} className={btnPrimary}>
          {marked.size === 0 ? 'Looks normal, continue' : `Continue (${marked.size} marked)`}
        </button>
        {marked.size > 0 && (
          <button onClick={() => setMarked(new Set())} className={linkBtn}>
            Clear marks
          </button>
        )}
      </div>
    </section>
  )
}
