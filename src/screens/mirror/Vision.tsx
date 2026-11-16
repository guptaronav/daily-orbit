import { useState } from 'react'
import { summarizeAmsler, type AmslerSummary } from '../../lib/vision/amsler'
import { Acuity, type AcuityOutcome } from './Acuity'
import { AmslerGrid } from './AmslerGrid'
import { demoVision } from './demo'

const GRID_N = 10

/** Either part can be skipped: a skip on a real check records nothing; on the demo run it fills a normal result. */
export type VisionResult = { amsler?: { left: AmslerSummary; right: AmslerSummary }; acuity?: AcuityOutcome }

type Phase = 'right' | 'left' | 'acuity'

const EYE_COPY = {
  right: { test: 'RIGHT', cover: 'LEFT' },
  left: { test: 'LEFT', cover: 'RIGHT' },
} as const

/** Amsler grid one eye at a time, then a short near-acuity check. */
export function Vision({ onComplete, demo = false, crewId }: { onComplete: (result: VisionResult) => void; demo?: boolean; crewId: string }) {
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

  const amsler = rightEye && leftEye ? { right: rightEye, left: leftEye } : undefined
  const skipAll = () => onComplete(demo ? demoVision(crewId) : {})
  const skipAcuity = () => onComplete({ amsler, acuity: demo ? demoVision(crewId).acuity : undefined })

  const Skip = ({ acuityOnly }: { acuityOnly?: boolean }) => (
    <p className="mc-skip">
      <span>
        {demo
          ? 'Judging or demoing? Skip this and the demo fills in a normal result, saved as simulated.'
          : acuityOnly
            ? 'No time today? Skip the near-vision test. Nothing is recorded for it.'
            : 'No time today? Skip the vision tests. Nothing is recorded for them.'}
      </span>
      <button type="button" onClick={acuityOnly ? skipAcuity : skipAll}>
        {demo ? (acuityOnly ? 'Skip: normal result' : 'Skip both vision tests') : acuityOnly ? 'Skip this test' : 'Skip vision tests'}
      </button>
    </p>
  )

  if (phase === 'acuity') {
    return (
      <section aria-labelledby="acuity-heading" className="mc-stack">
        <div className="mc-stack-sm">
          <p className="mc-kicker">Step 2 · Vision · near-vision test</p>
          <h2 id="acuity-heading" className="mc-h2">
            Which way does the letter point?
          </h2>
        </div>
        <Acuity onComplete={(acuity) => onComplete({ amsler, acuity })} />
        <Skip acuityOnly />
      </section>
    )
  }

  const eye = EYE_COPY[phase]
  return (
    <section aria-labelledby="amsler-heading" className="mc-stack">
      <div className="mc-stack-sm">
        <p className="mc-kicker">Step 2 · Vision · Amsler grid, {phase === 'right' ? '1' : '2'} of 2</p>
        <h2 id="amsler-heading" className="mc-h2">
          Amsler grid, {eye.test.toLowerCase()} eye
        </h2>
        <p className="mc-lead">
          Hold the screen about an arm's length away (roughly 35 cm). Cover your <strong>{eye.cover}</strong> eye and look at the dot with your <strong>{eye.test}</strong> eye. Tap any squares where the lines look wavy, blurred or missing. (Keyboard: Tab into the grid, arrows to move, Space to mark.)
        </p>
      </div>
      <AmslerGrid n={GRID_N} marked={marked} onToggle={toggle} eyeLabel={`${eye.test.toLowerCase()} eye`} />
      <div className="mc-row">
        <button onClick={finishEye} className="mc-btn">
          {marked.size === 0 ? 'Looks normal, continue' : `Continue (${marked.size} marked)`}
        </button>
        {marked.size > 0 && (
          <button onClick={() => setMarked(new Set())} className="mc-link">
            Clear marks
          </button>
        )}
      </div>
      <Skip />
    </section>
  )
}
