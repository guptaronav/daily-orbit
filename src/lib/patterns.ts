import type { Indicator, Status } from '../contract/types'
import type { IndicatorReading } from './bodyStatus'

/*
 * Flags that look across indicators. One reading off its usual is often noise; several related
 * readings moving the wrong way together are a pattern worth acting on. Each pattern names the NASA
 * Human Research Program risk its readings already belong to (the same risk titles the indicator
 * cards use) and the escalation rung to go to. A pattern is a prompt to look closer, not a diagnosis.
 *
 * Each pattern is a list of groups. A group counts when ANY of its indicators is yellow or red AND
 * moving in that group's worrying direction. The pattern fires when at least `minGroups` count.
 */

export type Direction = 'up' | 'down' | 'any'
type Part = { indicator: Indicator; want: Direction }
export type Pattern = {
  id: string
  title: string
  risk: string
  riskUrl: string
  groups: Part[][]
  minGroups: number
  /** Escalation rung when the pattern fires: 2 crewmate, 3 crew medical officer, 4 flight surgeon. */
  rung: 2 | 3 | 4
  summary: string
}

export const RUNG_NAME: Record<number, string> = { 1: 'Self-care', 2: 'Crewmate check', 3: 'Crew medical officer', 4: 'Flight surgeon' }

const one = (indicator: Indicator, want: Direction): Part[] => [{ indicator, want }]

export const PATTERNS: Pattern[] = [
  {
    id: 'fatigue',
    title: 'Signs of fatigue',
    risk: 'Risk of Inadequate Sleep and Irregular Schedules',
    riskUrl: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
    groups: [one('sleepHours', 'down'), one('sleepQuality', 'down'), one('eyelidClosure', 'up'), one('blinkRate', 'any'), one('reactionTime', 'up')],
    minGroups: 2,
    rung: 2,
    summary: 'Sleep and tiredness readings moving the wrong way together.',
  },
  {
    id: 'mood',
    title: 'Mood and stress strain',
    risk: 'Risk of Behavioral Changes and Psychiatric Disorders',
    riskUrl: 'https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/',
    groups: [one('mood', 'down'), one('stress', 'up'), one('sleepQuality', 'down')],
    minGroups: 2,
    rung: 3,
    summary: 'Lower mood, higher stress or worse sleep, together.',
  },
  {
    id: 'infection',
    title: 'Possible infection',
    risk: 'Risk of Altered Immune System Responses',
    riskUrl: 'https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/',
    groups: [one('temperature', 'up'), one('symptomReport', 'any')],
    minGroups: 2,
    rung: 3,
    summary: 'A raised temperature together with reported symptoms.',
  },
  {
    id: 'vision',
    title: 'Vision change',
    risk: 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    riskUrl: 'https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/',
    // Near acuity is logMAR: a higher number is worse vision.
    groups: [one('amslerDistortion', 'any'), one('nearAcuity', 'up')],
    minGroups: 2,
    rung: 4,
    summary: 'New Amsler grid distortion together with worse near vision.',
  },
  {
    id: 'cardio',
    title: 'Heart and blood pressure off together',
    risk: 'Risk of Cardiovascular Adaptations',
    riskUrl: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/',
    groups: [
      one('heartRate', 'any'),
      [
        { indicator: 'bloodPressureSys', want: 'any' },
        { indicator: 'bloodPressureDia', want: 'any' },
      ],
    ],
    minGroups: 2,
    rung: 3,
    summary: 'Heart rate and blood pressure both away from your usual.',
  },
  {
    id: 'fuel',
    title: 'Under-fueling',
    risk: 'Risk of Inadequate Food and Nutrition',
    riskUrl: 'https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/',
    groups: [
      one('bodyMass', 'down'),
      [
        { indicator: 'appetite', want: 'down' },
        { indicator: 'mealsEaten', want: 'down' },
        { indicator: 'waterIntake', want: 'down' },
      ],
    ],
    minGroups: 2,
    rung: 3,
    summary: 'Body mass falling while eating or drinking less.',
  },
  {
    id: 'gut',
    title: 'Gut upset',
    risk: 'Risk of Host-Microorganism Interactions',
    riskUrl: 'https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/',
    groups: [one('digestiveComfort', 'down'), one('bowelMovements', 'any')],
    minGroups: 2,
    rung: 3,
    summary: 'Less digestive comfort together with changed bowel movements.',
  },
]

/** Which way the latest reading sits, against the reference if there is one, else the recent baseline. */
export function directionOf(r: IndicatorReading): 'up' | 'down' | null {
  if (r.drift) return r.drift.direction
  const v = r.latest?.value
  const base = r.reference ?? r.baseline
  if (typeof v !== 'number' || !base) return null
  if (v > base.mean) return 'up'
  if (v < base.mean) return 'down'
  return null
}

const off = (s: Status) => s === 'yellow' || s === 'red'

export type PatternHit = {
  pattern: Pattern
  status: 'yellow' | 'red'
  rung: 2 | 3 | 4
  parts: { indicator: Indicator; status: Status; direction: 'up' | 'down' | null }[]
}

/** Every pattern that fires for one person, most serious first. */
export function patternFlags(readings: Record<Indicator, IndicatorReading>): PatternHit[] {
  const hits: PatternHit[] = []
  for (const p of PATTERNS) {
    const parts: PatternHit['parts'] = []
    let groups = 0
    for (const g of p.groups) {
      const matched = g.filter(({ indicator, want }) => {
        const r = readings[indicator]
        if (!r || !off(r.status)) return false
        if (want === 'any') return true
        return directionOf(r) === want
      })
      if (matched.length) groups++
      for (const m of matched) parts.push({ indicator: m.indicator, status: readings[m.indicator].status, direction: directionOf(readings[m.indicator]) })
    }
    if (groups < p.minGroups) continue
    const red = parts.some((x) => x.status === 'red') || groups >= 3
    hits.push({ pattern: p, parts, status: red ? 'red' : 'yellow', rung: (red ? Math.min(4, p.rung + 1) : p.rung) as 2 | 3 | 4 })
  }
  return hits.sort((a, b) => (a.status === b.status ? b.rung - a.rung : a.status === 'red' ? -1 : 1))
}
