import type { Indicator, Status } from '../contract/types'

export type RegionId = 'head' | 'eyes' | 'heart' | 'skeleton' | 'body' | 'gut'

export type Region = { id: RegionId; label: string; indicators: readonly Indicator[] }

export const REGIONS: readonly Region[] = [
  { id: 'head', label: 'Head', indicators: ['sleepHours', 'sleepQuality', 'mood', 'stress', 'blinkRate', 'eyelidClosure', 'reactionTime'] },
  { id: 'eyes', label: 'Eyes', indicators: ['amslerDistortion', 'nearAcuity'] },
  { id: 'heart', label: 'Heart', indicators: ['heartRate', 'bloodPressureSys', 'bloodPressureDia'] },
  { id: 'skeleton', label: 'Skeleton', indicators: ['exerciseMinutes'] },
  { id: 'body', label: 'Whole body', indicators: ['radiationDose', 'temperature', 'symptomReport'] },
  { id: 'gut', label: 'Gut and nutrition', indicators: ['digestiveComfort', 'bowelMovements', 'appetite', 'bodyMass', 'bloodSugar', 'waterIntake', 'mealsEaten'] },
]

export const STATUS_LABEL: Record<Status, string> = {
  green: 'Within baseline',
  yellow: 'Watch',
  red: 'Act',
  gray: 'Not enough good data',
}
