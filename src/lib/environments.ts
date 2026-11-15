import raw from '../content/environments.json'

export type EnvId = 'iss' | 'lunar' | 'mars' | 'marsSurface'

export type Environment = {
  id: EnvId
  label: string
  oneWayDelaySec: number
  minDelaySec?: number
  maxDelaySec?: number
  equipment: string[]
  /** URLs of the pages the environment text and equipment list were written from. */
  sources?: string[]
}

export const ENVIRONMENTS: readonly Environment[] = raw as Environment[]

export function formatDelay(sec: number): string {
  if (sec < 60) return `${sec} s`
  return `${Math.round((sec / 60) * 2) / 2} min`
}
