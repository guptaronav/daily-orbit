import raw from '../content/environments.json'

export type EnvId = 'iss' | 'lunar' | 'mars'

export type Environment = {
  id: EnvId
  label: string
  oneWayDelaySec: number
  minDelaySec?: number
  maxDelaySec?: number
  equipment: string[]
  /** Ids in src/content/sources.json for the pages the equipment list was written from. */
  equipmentSources?: string[]
}

export const ENVIRONMENTS: readonly Environment[] = raw as Environment[]

export function formatDelay(sec: number): string {
  if (sec < 60) return `${sec} s`
  return `${Math.round((sec / 60) * 2) / 2} min`
}
