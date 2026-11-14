import type { CrewMember, GameEvent, Indicator, Measurement } from '../contract/types'
import { buildSessionRecords, type MirrorSession } from '../lib/session'
import { generateCrew } from '../lib/sim/seed'
import { db, safe } from './db'

const SEED = 42

export const addMeasurement = (m: Measurement): Promise<boolean> =>
  safe(async () => (await db.measurements.put(m), true), false)

export const addEvent = (e: GameEvent): Promise<boolean> =>
  safe(async () => (await db.events.put(e), true), false)

export const listCrew = (): Promise<CrewMember[]> => safe(() => db.crew.toArray(), [])

export function listMeasurements(crewId: string, indicator?: Indicator): Promise<Measurement[]> {
  return safe(async () => {
    const rows = indicator
      ? await db.measurements.where('[crewId+indicator]').equals([crewId, indicator]).toArray()
      : await db.measurements.where('crewId').equals(crewId).toArray()
    return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [])
}

export const listEvents = (crewId: string): Promise<GameEvent[]> =>
  safe(() => db.events.where('crewId').equals(crewId).toArray(), [])

export const resetAndReseed = (): Promise<void> =>
  safe(async () => {
    const { crew, measurements, events } = generateCrew(SEED)
    await db.transaction('rw', db.crew, db.measurements, db.events, async () => {
      await Promise.all([db.crew.clear(), db.measurements.clear(), db.events.clear()])
      await db.crew.bulkPut(crew)
      await db.measurements.bulkPut(measurements)
      await db.events.bulkPut(events)
    })
  }, undefined)

export async function ensureSeeded(): Promise<void> {
  const count = await safe(() => db.crew.count(), 0)
  if (count === 0) await resetAndReseed()
}

/** Persist a finished mirror check (measurements + effort events) in one transaction. */
export const saveSession = (session: MirrorSession, crewId: string): Promise<boolean> =>
  safe(async () => {
    const { measurements, events } = buildSessionRecords(session, crewId, new Date())
    await db.transaction('rw', db.measurements, db.events, async () => {
      await db.measurements.bulkPut(measurements)
      await db.events.bulkPut(events)
    })
    return true
  }, false)
