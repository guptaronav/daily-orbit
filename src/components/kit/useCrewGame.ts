import { useEffect, useState } from 'react'
import type { GameEvent } from '../../contract/types'
import { listEvents } from '../../db/repo'
import { coinsFor, doneToday, levelFor, type LevelState } from '../../lib/levels'
import { checkInDays, currentStreak } from '../../lib/streak'

export type CrewGame = {
  events: GameEvent[]
  coins: number
  level: LevelState
  streak: number
  done: boolean
  /** False until the first read finishes, so nothing shows a confident zero while loading. */
  ready: boolean
}

const EMPTY: CrewGame = { events: [], coins: 0, level: levelFor(0), streak: 0, done: false, ready: false }

/**
 * One read of a crew member's reward state for the chrome (wallet, dock, rewards).
 *
 * Everything here is derived from the events Ronav's scoring already credits; this hook adds no
 * scoring of its own. `dataVersion` from useApp() is the refresh signal, so earning a point
 * anywhere in the app updates the wallet.
 */
export function useCrewGame(crewId: string, dataVersion: number): CrewGame {
  const [game, setGame] = useState<CrewGame>(EMPTY)

  useEffect(() => {
    let cancelled = false
    void listEvents(crewId).then((events) => {
      if (cancelled) return
      const now = new Date()
      setGame({
        events,
        coins: coinsFor(events),
        level: levelFor(coinsFor(events)),
        streak: currentStreak(checkInDays(events, crewId), now.toISOString().slice(0, 10)),
        done: doneToday(events, now),
        ready: true,
      })
    })
    return () => {
      cancelled = true
    }
  }, [crewId, dataVersion])

  return game
}
