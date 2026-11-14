import { getThreshold } from '../../config/thresholds'
import type { CrewMember, GameEvent, Indicator, Measurement } from '../../contract/types'
import { gaussian, mulberry32 } from './rng'

const DAYS = 30
const DAY_MS = 86_400_000
const MISSED_CHECKIN_PROB = 0.08
const REST_DAY_PROB = 0.15

export type SeedData = { crew: CrewMember[]; measurements: Measurement[]; events: GameEvent[] }

type Profile = {
  sleepHours: number
  sleepQuality: number
  mood: number
  stress: number
  heartRate: number
  blinkRate: number
  exerciseMinutes: number
  bloodPressureSys: number
  bloodPressureDia: number
  temperature: number
  bloodSugar: number
  nearAcuity: number
  eyelidClosure: number
  appetite: number
  digestiveComfort: number
  bodyMass: number
}

// ponytail: invented simulation profiles, labeled "Simulated data" everywhere they surface.
const PROFILES: Record<string, Profile> = {
  'crew-1': { sleepHours: 7.1, sleepQuality: 7, mood: 7, stress: 3, heartRate: 62, blinkRate: 15, exerciseMinutes: 45, bloodPressureSys: 116, bloodPressureDia: 74, temperature: 36.6, bloodSugar: 90, nearAcuity: 0, eyelidClosure: 3, appetite: 7, digestiveComfort: 8, bodyMass: 76 },
  'crew-2': { sleepHours: 6.6, sleepQuality: 6, mood: 6.5, stress: 4, heartRate: 68, blinkRate: 17, exerciseMinutes: 40, bloodPressureSys: 120, bloodPressureDia: 78, temperature: 36.7, bloodSugar: 94, nearAcuity: 0.05, eyelidClosure: 3.5, appetite: 6.5, digestiveComfort: 7.5, bodyMass: 68 },
  'crew-3': { sleepHours: 7.4, sleepQuality: 7.5, mood: 7.5, stress: 2.5, heartRate: 58, blinkRate: 14, exerciseMinutes: 50, bloodPressureSys: 112, bloodPressureDia: 72, temperature: 36.5, bloodSugar: 88, nearAcuity: -0.05, eyelidClosure: 2.5, appetite: 7.5, digestiveComfort: 8.5, bodyMass: 82 },
}

const SPREAD: Record<keyof Profile, number> = {
  sleepHours: 0.6, sleepQuality: 0.8, mood: 0.8, stress: 0.8, heartRate: 3, blinkRate: 1.5, exerciseMinutes: 8,
  bloodPressureSys: 4, bloodPressureDia: 3, temperature: 0.2, bloodSugar: 5, nearAcuity: 0.05,
  eyelidClosure: 1, appetite: 0.8, digestiveComfort: 0.8, bodyMass: 0.4,
}
const DECIMALS: Partial<Record<keyof Profile, number>> = { nearAcuity: 2 }
// The most recent day is damped toward each person's typical value so seeded crew start healthy.
const LATEST_DAY_NOISE = 0.2
const CLAMP: Record<keyof Profile, [number, number]> = {
  sleepHours: [3, 10], sleepQuality: [0, 10], mood: [0, 10], stress: [0, 10], heartRate: [40, 120], blinkRate: [4, 30], exerciseMinutes: [0, 120],
  bloodPressureSys: [90, 150], bloodPressureDia: [55, 95], temperature: [35.5, 38], bloodSugar: [65, 140], nearAcuity: [-0.2, 0.6],
  eyelidClosure: [0, 40], appetite: [0, 10], digestiveComfort: [0, 10], bodyMass: [40, 150],
}

export const CREW: CrewMember[] = [
  { id: 'crew-1', name: 'Crew 1', role: 'Commander', dataLabel: 'Simulated data' },
  { id: 'crew-2', name: 'Crew 2', role: 'Flight engineer', dataLabel: 'Simulated data' },
  { id: 'crew-3', name: 'Crew 3', role: 'Mission specialist', dataLabel: 'Simulated data' },
  { id: 'guest', name: 'You (guest crew member)', role: 'Guest', dataLabel: 'Simulated data' },
]

export function generateCrew(seed: number, now: Date = new Date()): SeedData {
  const rand = mulberry32(seed)
  const measurements: Measurement[] = []
  const events: GameEvent[] = []

  // The guest (the person using the demo) starts empty and builds their own baseline from real check-ins.
  for (const crew of CREW.filter((c) => c.id !== 'guest')) {
    const profile = PROFILES[crew.id]
    for (let i = 0; i < DAYS; i++) {
      const timestamp = new Date(now.getTime() - (DAYS - 1 - i) * DAY_MS).toISOString()
      for (const key of Object.keys(profile) as (keyof Profile)[]) {
        const [lo, hi] = CLAMP[key]
        const isLatest = i === DAYS - 1
        let value = profile[key] + gaussian(rand) * SPREAD[key] * (isLatest ? LATEST_DAY_NOISE : 1)
        if (key === 'exerciseMinutes' && !isLatest && rand() < REST_DAY_PROB) value = 0
        const scale = 10 ** (DECIMALS[key] ?? 1)
        value = Math.round(Math.min(hi, Math.max(lo, value)) * scale) / scale
        const indicator: Indicator = key
        measurements.push({
          id: `${crew.id}-${indicator}-${i}`,
          crewId: crew.id,
          timestamp,
          indicator,
          value,
          unit: getThreshold(indicator).unit,
          quality: { score: 1, passed: true },
          source: 'simulated',
        })
        if (key === 'exerciseMinutes' && value > 0) {
          events.push({ id: `${crew.id}-ex-${i}`, crewId: crew.id, timestamp, kind: 'exerciseComplete' })
        }
      }
      if (i % 7 === 1) {
        measurements.push({
          id: `${crew.id}-amslerDistortion-${i}`,
          crewId: crew.id,
          timestamp,
          indicator: 'amslerDistortion',
          value: { distortion: false, distortedCells: 0 },
          quality: { score: 1, passed: true },
          source: 'simulated',
        })
      }
      if (rand() >= MISSED_CHECKIN_PROB) {
        events.push({ id: `${crew.id}-ci-${i}`, crewId: crew.id, timestamp, kind: 'checkInComplete' })
      }
    }
  }
  return { crew: CREW, measurements, events }
}
