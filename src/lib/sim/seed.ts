import { getThreshold } from '../../config/thresholds'
import type { CrewMember, GameEvent, Indicator, Measurement } from '../../contract/types'

const DAYS = 30
const DAY_MS = 86_400_000
const MISSED_CHECKIN_PROB = 0.08
const REST_DAY_PROB = 0.15

export type SeedData = { crew: CrewMember[]; measurements: Measurement[]; events: GameEvent[] }

type Profile = { sleepHours: number; sleepQuality: number; mood: number; stress: number; heartRate: number; blinkRate: number; exerciseMinutes: number }

// ponytail: invented simulation profiles, labeled "Simulated data" everywhere they surface.
const PROFILES: Record<string, Profile> = {
  'crew-1': { sleepHours: 7.1, sleepQuality: 7, mood: 7, stress: 3, heartRate: 62, blinkRate: 15, exerciseMinutes: 45 },
  'crew-2': { sleepHours: 6.6, sleepQuality: 6, mood: 6.5, stress: 4, heartRate: 68, blinkRate: 17, exerciseMinutes: 40 },
  'crew-3': { sleepHours: 7.4, sleepQuality: 7.5, mood: 7.5, stress: 2.5, heartRate: 58, blinkRate: 14, exerciseMinutes: 50 },
  guest: { sleepHours: 7, sleepQuality: 6.5, mood: 6.5, stress: 3.5, heartRate: 66, blinkRate: 16, exerciseMinutes: 35 },
}

const SPREAD: Record<keyof Profile, number> = { sleepHours: 0.6, sleepQuality: 0.8, mood: 0.8, stress: 0.8, heartRate: 3, blinkRate: 1.5, exerciseMinutes: 8 }
const CLAMP: Record<keyof Profile, [number, number]> = {
  sleepHours: [3, 10], sleepQuality: [0, 10], mood: [0, 10], stress: [0, 10], heartRate: [40, 120], blinkRate: [4, 30], exerciseMinutes: [0, 120],
}

export const CREW: CrewMember[] = [
  { id: 'crew-1', name: 'Crew 1', role: 'Commander', dataLabel: 'Simulated data' },
  { id: 'crew-2', name: 'Crew 2', role: 'Flight engineer', dataLabel: 'Simulated data' },
  { id: 'crew-3', name: 'Crew 3', role: 'Mission specialist', dataLabel: 'Simulated data' },
  { id: 'guest', name: 'You (guest crew member)', role: 'Guest', dataLabel: 'Simulated data' },
]

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

export function generateCrew(seed: number, now: Date = new Date()): SeedData {
  const rand = mulberry32(seed)
  const measurements: Measurement[] = []
  const events: GameEvent[] = []

  for (const crew of CREW) {
    const profile = PROFILES[crew.id]
    for (let i = 0; i < DAYS; i++) {
      const timestamp = new Date(now.getTime() - (DAYS - 1 - i) * DAY_MS).toISOString()
      for (const key of Object.keys(profile) as (keyof Profile)[]) {
        const [lo, hi] = CLAMP[key]
        let value = profile[key] + gaussian(rand) * SPREAD[key]
        if (key === 'exerciseMinutes' && rand() < REST_DAY_PROB) value = 0
        value = Math.round(Math.min(hi, Math.max(lo, value)) * 10) / 10
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
      if (rand() >= MISSED_CHECKIN_PROB) {
        events.push({ id: `${crew.id}-ci-${i}`, crewId: crew.id, timestamp, kind: 'checkInComplete' })
      }
    }
  }
  return { crew: CREW, measurements, events }
}
