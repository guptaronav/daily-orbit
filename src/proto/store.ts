import { useEffect, useState } from 'react'
import type { CrewMember, GameEvent, Measurement } from '../contract/types'
import { listEvents, listMeasurements } from '../db/repo'
import type { EnvId } from '../lib/environments'
import type { Screen } from '../state/AppContext'

/*
 * A synchronous snapshot of everything the ported prototype screens read.
 *
 * The prototypes were written against a synchronous data module; the real app reads IndexedDB
 * asynchronously. This store loads every crew member's measurements and events into memory
 * whenever the app's dataVersion changes, and the prototype logic reads from it synchronously.
 *
 * It is also the bridge for app state: the prototypes call getState/setState for crew,
 * environment and delay, and those calls are routed to the real AppContext through `bridge`.
 */

export type Snapshot = {
  crew: CrewMember[]
  measurements: Record<string, Measurement[]>
  events: Record<string, GameEvent[]>
  loadedAt: number
}

let snapshot: Snapshot = { crew: [], measurements: {}, events: {}, loadedAt: 0 }

export const getSnapshot = (): Snapshot => snapshot

export type Bridge = {
  crewId: string
  envId: EnvId
  delaySec: number
  setCrewId: (id: string) => void
  setEnvironmentId: (id: EnvId) => void
  setDelaySec: (sec: number) => void
  go: (screen: Screen) => void
  refresh: () => void
}

/** Filled by the shell on every render, so prototype logic always sees current app state. */
export const bridge: Bridge = {
  crewId: 'crew-1',
  envId: 'mars',
  delaySec: 1200,
  setCrewId: () => {},
  setEnvironmentId: () => {},
  setDelaySec: () => {},
  go: () => {},
  refresh: () => {},
}

const listeners = new Set<() => void>()

/** Prototype logic subscribes here (its D.onState) to re-render when data or app state changes. */
export function onChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function notify(): void {
  for (const cb of listeners) cb()
}

async function load(crew: CrewMember[]): Promise<Snapshot> {
  const rows = await Promise.all(crew.map(async (c) => [c.id, await listMeasurements(c.id), await listEvents(c.id)] as const))
  return {
    crew,
    measurements: Object.fromEntries(rows.map(([id, m]) => [id, m])),
    events: Object.fromEntries(rows.map(([id, , e]) => [id, e])),
    loadedAt: Date.now(),
  }
}

/** Keeps the snapshot current. Returns false until the first load finishes. */
export function useProtoStore(crew: CrewMember[], dataVersion: number): boolean {
  const [ready, setReady] = useState(snapshot.loadedAt > 0)

  useEffect(() => {
    if (crew.length === 0) return
    let cancelled = false
    void load(crew).then((next) => {
      if (cancelled) return
      snapshot = next
      setReady(true)
      notify()
    })
    return () => {
      cancelled = true
    }
  }, [crew, dataVersion])

  return ready
}
