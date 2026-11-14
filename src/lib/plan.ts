import type { GameEvent, GameEventKind, Indicator, Measurement } from '../contract/types'
import type { IndicatorReading } from './bodyStatus'
import { regionStatus } from './bodyStatus'
import { getContent, isTodo } from './content'
import { REGIONS } from './regions'
import { POINTS, creditedEvents } from './scoring'

/** Where a step is done. Steps on these screens are recorded automatically; the rest are confirmed with a button. */
export type PlanScreen = 'mirror' | 'manual' | 'escalation'

export type PlanItem = {
  id: string
  title: string
  /** The data behind it, in plain words. Empty for plain daily habits. */
  why: string
  /** Sourced guidance when the content exists, otherwise a safe fallback that points to people, never invented advice. */
  guidance: string
  kind: GameEventKind
  detail?: string
  points: number
  done: boolean
  /** `go`: do it on another screen (it is recorded there). `confirm`: tap "I did this". */
  action: { type: 'go'; screen: PlanScreen } | { type: 'confirm'; link?: PlanScreen }
}

type Input = {
  crewId: string
  readings: Record<Indicator, IndicatorReading>
  events: readonly GameEvent[]
  measurements: readonly Measurement[]
  now: Date
}

const DAY_MS = 86_400_000
const flagged = (r: IndicatorReading) => r.status === 'yellow' || r.status === 'red'
const oneDecimal = (v: number) => String(Math.round(v * 10) / 10)

const SAFE_FALLBACK = 'Tell a crewmate or your crew medical officer, and pick one small change you can make today.'
const guidanceFor = (indicator: Indicator, fallback: string): string => {
  const sourced = getContent(indicator).recommendedAction
  return isTodo(sourced) ? fallback : sourced
}

/**
 * What to do today, driven by this person's own data. Two daily habits always appear. Care steps appear
 * only when their readings are off their own usual, and doing a step earns credit for the DOING, not for
 * any value. Worse data only ever adds chances to earn credit, never removes them.
 */
export function dailyPlan({ crewId, readings, events, measurements, now }: Input): PlanItem[] {
  const today = now.toISOString().slice(0, 10)
  const todays = creditedEvents(events).filter((e) => e.crewId === crewId && e.timestamp.slice(0, 10) === today)
  const done = (kind: GameEventKind, detail?: string) => todays.some((e) => e.kind === kind && (e.detail ?? '') === (detail ?? ''))
  const item = (i: Omit<PlanItem, 'points' | 'done'>): PlanItem => ({ ...i, points: POINTS[i.kind], done: done(i.kind, i.detail) })

  const items: PlanItem[] = []

  const redRegion = REGIONS.find((r) => regionStatus(r, readings) === 'red')
  if (redRegion) {
    items.push(
      item({
        id: 'escalate',
        title: 'Tell someone',
        why: `${redRegion.label} is flagged Act: at least one reading is far from your usual.`,
        guidance: 'Tell a crewmate or your crew medical officer now. Reporting early is what this system rewards most.',
        kind: 'countermeasureComplete',
        detail: 'escalate',
        action: { type: 'confirm', link: 'escalation' },
      }),
    )
  }

  const sleep = [readings.sleepHours, readings.sleepQuality].filter(flagged)
  if (sleep.length > 0) {
    const hours = readings.sleepHours
    const numbers =
      hours.latest && typeof hours.latest.value === 'number' && hours.baseline
        ? `Your last sleep was ${oneDecimal(hours.latest.value)} h; your usual is about ${oneDecimal(hours.baseline.mean)} h.`
        : 'Your sleep readings are away from your usual.'
    items.push(
      item({
        id: 'sleep',
        title: "Protect tonight's sleep",
        why: numbers,
        guidance: guidanceFor('sleepHours', SAFE_FALLBACK),
        kind: 'countermeasureComplete',
        detail: 'sleep',
        action: { type: 'confirm' },
      }),
    )
  }

  const gut = (['appetite', 'digestiveComfort', 'bodyMass'] as const).filter((i) => flagged(readings[i]))
  if (gut.length > 0) {
    const names = gut.map((i) => getContent(i).label.toLowerCase()).join(' and ')
    items.push(
      item({
        id: 'nutrition',
        title: 'Look after nutrition and digestion',
        why: `Your ${names} ${gut.length > 1 ? 'are' : 'is'} off your usual.`,
        guidance: guidanceFor(gut[0], SAFE_FALLBACK),
        kind: 'countermeasureComplete',
        detail: 'nutrition',
        action: { type: 'confirm' },
      }),
    )
  }

  const since = now.getTime() - DAY_MS
  const failed = measurements.find((m) => m.crewId === crewId && !m.quality.passed && Date.parse(m.timestamp) > since && Date.parse(m.timestamp) <= now.getTime())
  if (failed) {
    items.push(
      item({
        id: 'retake',
        title: 'Retake the reading we could not trust',
        why: `Your ${getContent(failed.indicator).label.toLowerCase()} reading from the last day could not be read cleanly.`,
        guidance: 'A retake with better light and a steady head gives a reading we can use.',
        kind: 'retakeAfterQualityFail',
        action: { type: 'go', screen: 'mirror' },
      }),
    )
  }

  items.push(
    item({
      id: 'checkin',
      title: 'Take your mirror check',
      why: '',
      guidance: 'A daily check keeps your baseline accurate so changes stand out early.',
      kind: 'checkInComplete',
      action: { type: 'go', screen: 'mirror' },
    }),
  )

  const usual = readings.exerciseMinutes.baseline
  items.push(
    item({
      id: 'exercise',
      title: 'Exercise',
      why: usual ? `Your usual is about ${Math.round(usual.mean)} min a day.` : '',
      guidance: 'NASA lists exercise as a way to counteract losses in bone density and muscle strength. Log it so it counts.',
      kind: 'exerciseComplete',
      action: { type: 'go', screen: 'manual' },
    }),
  )

  return items
}
