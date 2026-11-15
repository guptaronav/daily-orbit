export const INDICATORS = [
  'heartRate',
  'blinkRate',
  'eyelidClosure',
  'amslerDistortion',
  'nearAcuity',
  'sleepQuality',
  'sleepHours',
  'mood',
  'stress',
  'symptomReport',
  'bloodPressureSys',
  'bloodPressureDia',
  'temperature',
  'bloodSugar',
  'exerciseMinutes',
  'radiationDose',
  'appetite',
  'digestiveComfort',
  'bodyMass',
  'bowelMovements',
  'waterIntake',
  'mealsEaten',
] as const

export type Indicator = (typeof INDICATORS)[number]

export type Quality = {
  score: number
  passed: boolean
  reason?: 'motion' | 'lighting' | 'faceLost' | 'lowSignal' | 'other'
}

export type Source =
  | 'camera'
  | 'selfReport'
  | 'manual'
  | 'simulated'
  | 'nasa-bedrest'
  | 'nasa-osdr'

export type StandardMeasure =
  | 'activityLight'
  | 'sleep'
  | 'cognition'
  | 'sensorimotor'
  | 'strength'
  | 'biosample'
  | 'none'

export type Measurement = {
  id: string // UUID
  crewId: string
  sessionId?: string // groups one mirror check
  timestamp: string // ISO 8601 UTC
  indicator: Indicator
  value: number | Record<string, unknown>
  unit?: string
  quality: Quality
  source: Source
  sourceDatasetId?: string // required when source starts with 'nasa-'
  standardMeasure?: StandardMeasure
}

export type GameEventKind =
  | 'checkInComplete'
  | 'symptomReported'
  | 'exerciseComplete'
  | 'retakeAfterQualityFail'
  | 'countermeasureComplete'
  // Reward-surface events. They pay for showing up and for keeping a streak, never for a health
  // value, so they cannot give anyone a reason to hide a symptom.
  | 'supplyDrop'
  | 'streakMilestone'
  | 'readingLogged'

export type GameEvent = {
  id: string
  crewId: string
  timestamp: string
  kind: GameEventKind
  /** Which care step, for countermeasureComplete (for example 'sleep'). Credit is once per step per day. */
  detail?: string
}

export type Threshold = {
  indicator: string
  value: number | null
  unit: string
  source: string
}

export type DataLabel = 'Simulated data' | 'NASA bed-rest analog data, de-identified' | 'NASA bed-rest analog data, de-identified (partly simulated)'

export type CrewMember = {
  id: string
  name: string
  role: string
  dataLabel: DataLabel
}

export type Status ='green' | 'yellow' | 'red' | 'gray'
