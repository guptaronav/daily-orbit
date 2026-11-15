import type { Indicator, Measurement } from '../contract/types'
import { getThreshold } from '../config/thresholds'
import { addMeasurements, listMeasurements } from '../db/repo'
import { bridge } from './store'

/*
 * One-click demo scenarios. Like the demo panel's other stories, each one writes ordinary records
 * marked source "simulated" for the selected crew member, so the real status, pattern, alert and
 * assistant code reacts exactly as it would to real data. Values are set relative to the person's
 * own usual, so the story works for anyone with a history.
 */

export const CABIN_FAULT_KEY = 'chm-cabin-fault'

const PASSED = { score: 1, passed: true }

async function usual(crewId: string, indicator: Indicator, fallback: number): Promise<number> {
  const vals = (await listMeasurements(crewId, indicator)).filter((m) => m.quality.passed && typeof m.value === 'number').map((m) => m.value as number)
  if (!vals.length) return fallback
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function rec(crewId: string, indicator: Indicator, value: Measurement['value'], at: Date): Measurement {
  return { id: crypto.randomUUID(), crewId, timestamp: at.toISOString(), indicator, value, unit: getThreshold(indicator).unit, quality: PASSED, source: 'simulated' }
}

export type Scenario = { id: string; label: string; detail: string; run: (crewId: string) => Promise<string> }

export const SCENARIOS: Scenario[] = [
  {
    id: 'fever',
    label: 'Fever with symptoms',
    detail: 'A raised temperature plus a headache and unusual fatigue: the possible-infection pattern and an alert for the medical officer.',
    run: async (crewId) => {
      const now = new Date()
      const t = Math.round(((await usual(crewId, 'temperature', 36.7)) + 1.4) * 10) / 10
      await addMeasurements([rec(crewId, 'temperature', t, now), rec(crewId, 'symptomReport', { symptoms: ['Headache', 'Unusual fatigue'] }, now)])
      return `Temperature ${t} °C, headache and fatigue reported`
    },
  },
  {
    id: 'co2',
    label: 'Cabin CO₂ build-up',
    detail: 'The simulated cabin CO₂ climbs past NASA’s 3 mmHg limit today, and a headache is reported.',
    run: async (crewId) => {
      try {
        localStorage.setItem(CABIN_FAULT_KEY, new Date().toISOString().slice(0, 10))
      } catch {
        // Storage blocked: the headache still lands.
      }
      await addMeasurements([rec(crewId, 'symptomReport', { symptoms: ['Headache'] }, new Date())])
      return 'Cabin CO₂ over the limit today, headache reported'
    },
  },
  {
    id: 'says-fine',
    label: 'Says fine, measures tired',
    detail: 'Rates sleep as usual, but slept much less and the camera sees heavy eyelids: a self-report gap and the fatigue pattern.',
    run: async (crewId) => {
      const now = new Date()
      const q = Math.min(10, Math.round((await usual(crewId, 'sleepQuality', 7)) + 0.5))
      const h = Math.max(2.5, Math.round(((await usual(crewId, 'sleepHours', 7)) - 2.6) * 10) / 10)
      const e = Math.round((await usual(crewId, 'eyelidClosure', 5)) * 2.4 * 10) / 10
      await addMeasurements([rec(crewId, 'sleepQuality', q, now), rec(crewId, 'sleepHours', h, now), rec(crewId, 'eyelidClosure', e, now)])
      return `Sleep quality rated ${q}/10, but ${h} h of sleep and eyelids closed ${e}% of the time`
    },
  },
]

export async function runScenario(id: string, crewId: string): Promise<string> {
  const s = SCENARIOS.find((x) => x.id === id)
  if (!s) return ''
  const msg = await s.run(crewId)
  bridge.refresh?.()
  return msg
}

export function clearScenarios() {
  try {
    localStorage.removeItem(CABIN_FAULT_KEY)
  } catch {
    // Nothing to clear.
  }
}
