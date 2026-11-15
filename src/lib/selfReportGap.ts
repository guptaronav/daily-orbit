import type { Indicator } from '../contract/types'
import type { IndicatorReading } from './bodyStatus'

/*
 * Self-report gaps: when how someone rates themselves disagrees with what was measured. People
 * under-notice their own fatigue and decline; a gap is a gentle "your numbers say otherwise".
 * A gap needs the self-rating to sit at or better than the person's own usual AND the measured
 * sign to be yellow or red in the worrying direction, so one noisy reading cannot raise it.
 */

type Rated = { indicator: Indicator; label: string; better: 'up' | 'down' }
type Measured = { indicator: Indicator; label: string; worse: 'up' | 'down'; phrase: (pct: number, delta: number) => string }

const GAPS: { id: string; rated: Rated; measured: Measured[] }[] = [
  {
    id: 'sleep',
    rated: { indicator: 'sleepQuality', label: 'sleep quality', better: 'up' },
    measured: [
      { indicator: 'reactionTime', label: 'reaction time', worse: 'up', phrase: (p) => `your reaction time is ${p}% slower than your usual` },
      { indicator: 'eyelidClosure', label: 'eyelid closure', worse: 'up', phrase: (p) => `your eyes are closed ${p}% more of the time than usual on camera` },
      { indicator: 'sleepHours', label: 'sleep hours', worse: 'down', phrase: (_p, d) => `you slept ${Math.abs(d).toFixed(1)} h less than your usual` },
    ],
  },
  {
    id: 'appetite',
    rated: { indicator: 'appetite', label: 'appetite', better: 'up' },
    measured: [{ indicator: 'bodyMass', label: 'body mass', worse: 'down', phrase: (_p, d) => `your body mass is ${Math.abs(d).toFixed(1)} kg below your usual` }],
  },
]

const usual = (r: IndicatorReading) => r.reference ?? r.baseline
const latestValue = (r: IndicatorReading) => (typeof r.latest?.value === 'number' ? r.latest.value : null)

export type Gap = { id: string; rated: { label: string; value: number }; measured: { indicator: Indicator; label: string; text: string; status: 'yellow' | 'red' }[] }

export function selfReportGaps(readings: Record<Indicator, IndicatorReading>): Gap[] {
  const out: Gap[] = []
  for (const g of GAPS) {
    const r = readings[g.rated.indicator]
    const v = r && latestValue(r)
    const u = r && usual(r)
    if (v === null || v === undefined || !u) continue
    const feelsFine = g.rated.better === 'up' ? v >= u.mean : v <= u.mean
    if (!feelsFine) continue
    const measured: Gap['measured'] = []
    for (const m of g.measured) {
      const mr = readings[m.indicator]
      if (!mr || (mr.status !== 'yellow' && mr.status !== 'red')) continue
      const mv = latestValue(mr)
      const mu = usual(mr)
      if (mv === null || !mu) continue
      const delta = mv - mu.mean
      if ((m.worse === 'up' && delta <= 0) || (m.worse === 'down' && delta >= 0)) continue
      const pct = Math.round((Math.abs(delta) / Math.abs(mu.mean || 1)) * 100)
      measured.push({ indicator: m.indicator, label: m.label, text: m.phrase(pct, delta), status: mr.status })
    }
    if (measured.length) out.push({ id: g.id, rated: { label: g.rated.label, value: v }, measured })
  }
  return out
}
