import Dexie, { type Table } from 'dexie'
import type { CrewMember, GameEvent, Measurement } from '../contract/types'

class AppDb extends Dexie {
  measurements!: Table<Measurement, string>
  events!: Table<GameEvent, string>
  crew!: Table<CrewMember, string>

  constructor() {
    super('daily-orbit')
    this.version(1).stores({
      measurements: 'id, crewId, timestamp, [crewId+indicator]',
      events: 'id, crewId, timestamp',
      crew: 'id',
    })
  }
}

export const db = new AppDb()

/** Every IndexedDB access goes through here so a blocked/private-mode DB never crashes the UI. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error('[db]', error)
    return fallback
  }
}
