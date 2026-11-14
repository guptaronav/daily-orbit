import { useEffect, useState } from 'react'
import { StatusDot } from '../../components/StatusDot'
import { btnPrimary, btnSecondary } from '../../components/ui'
import type { Indicator, Measurement } from '../../contract/types'
import { listMeasurements } from '../../db/repo'
import { readIndicator } from '../../lib/bodyStatus'
import { getContent } from '../../lib/content'
import { formatValue } from '../../lib/format'
import { retakeAdvice } from '../../lib/retake'

type Props = { crewId: string; sessionId: string; onRetake: () => void; onDone: () => void }

// Shown in this order; only indicators that were actually measured this session appear.
const ORDER: Indicator[] = ['heartRate', 'blinkRate', 'eyelidClosure', 'sleepQuality', 'mood', 'stress', 'amslerDistortion', 'nearAcuity', 'symptomReport']

export function Summary({ crewId, sessionId, onRetake, onDone }: Props) {
  const [all, setAll] = useState<Measurement[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void listMeasurements(crewId).then((rows) => !cancelled && setAll(rows))
    return () => {
      cancelled = true
    }
  }, [crewId])

  if (all === null) return <p className="text-muted">Loading results…</p>

  const mine = ORDER.flatMap((indicator) => {
    const m = all.find((x) => x.sessionId === sessionId && x.indicator === indicator)
    return m ? [{ indicator, m }] : []
  })
  const anyFailed = mine.some(({ m }) => !m.quality.passed)

  return (
    <section aria-labelledby="summary-heading" className="space-y-5">
      <h2 id="summary-heading" className="text-xl font-semibold tracking-tight">
        Check-in complete
      </h2>
      <ul className="divide-y divide-rule border-y border-rule">
        {mine.map(({ indicator, m }) => {
          const label = getContent(indicator).label
          if (!m.quality.passed) {
            return (
              <li key={indicator} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{label}</span>
                  <StatusDot status="gray" label="Couldn't get a clean reading" />
                </div>
                <p className="mt-1 text-sm text-muted">{retakeAdvice(m.quality.reason)}</p>
              </li>
            )
          }
          const reading = readIndicator(indicator, all)
          return (
            <li key={indicator} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span>
                <span className="font-medium">{label}</span>
                <span className="ml-3 text-muted">{formatValue(m)}</span>
              </span>
              <StatusDot status={reading.status} />
            </li>
          )
        })}
      </ul>
      <p className="max-w-xl text-sm text-muted">Colors compare each reading with your own baseline. A reading we could not trust is never colored.</p>
      <div className="flex flex-wrap gap-3">
        <button onClick={onDone} className={btnPrimary}>
          See body map
        </button>
        {anyFailed && (
          <button onClick={onRetake} className={btnSecondary}>
            Retake
          </button>
        )}
      </div>
    </section>
  )
}
