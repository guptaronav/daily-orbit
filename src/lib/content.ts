import raw from '../content/indicators.json'
import type { Indicator, StandardMeasure } from '../contract/types'
import type { RegionId } from './regions'

export type IndicatorContent = {
  id: Indicator
  label: string
  unit: string
  region: RegionId
  standardMeasure: StandardMeasure
  hrpRisk: string
  canMeasureInSpace: string
  whyCheck: string
  hazardEffect: string
  whenToEscalate: string
  prevention: string
  recommendedAction: string
  /** Ids in src/content/sources.json for the NASA pages this text was written from. */
  sources?: string[]
}

const CONTENT = raw as IndicatorContent[]
const TODO = '[CONTENT TODO]'

export const isTodo = (text: string): boolean => text === TODO

export function getContent(indicator: Indicator): IndicatorContent {
  const found = CONTENT.find((c) => c.id === indicator)
  if (!found) throw new Error(`No content entry for indicator "${indicator}"`)
  return found
}
