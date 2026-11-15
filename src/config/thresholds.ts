import { INDICATORS, type Indicator, type Threshold } from '../contract/types'

// Never invent clinical thresholds. Unsourced entries stay value:null and the UI
// shows "threshold not set" instead of a color.
// TODO: source from NASA HRP / NASA-STD-3001
const UNITS: Record<Indicator, string> = {
  heartRate: 'bpm',
  blinkRate: 'blinks/min',
  eyelidClosure: '%',
  amslerDistortion: 'cells',
  nearAcuity: 'logMAR',
  sleepQuality: '0-10',
  sleepHours: 'h',
  mood: '0-10',
  stress: '0-10',
  symptomReport: 'symptoms',
  bloodPressureSys: 'mmHg',
  bloodPressureDia: 'mmHg',
  temperature: '°C',
  bloodSugar: 'mg/dL',
  exerciseMinutes: 'min',
  radiationDose: 'mSv',
  appetite: '0-10',
  digestiveComfort: '0-10',
  bodyMass: 'kg',
  bowelMovements: 'per day',
  waterIntake: 'L',
  mealsEaten: 'meals',
}

export const THRESHOLDS: readonly Threshold[] = INDICATORS.map((indicator) => ({
  indicator,
  value: null,
  unit: UNITS[indicator],
  source: 'unsourced',
}))

export function getThreshold(indicator: Indicator): Threshold {
  return THRESHOLDS.find((t) => t.indicator === indicator)!
}
