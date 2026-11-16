import * as D from '../../proto/data'
import { summarizeAmsler, type AmslerSummary } from '../../lib/vision/amsler'

/*
 * The demo run (the sample recording, for judges and anyone without a webcam): the recording plays
 * at 3x for a few seconds so the face tracking is visible, then the check fills in a normal reading
 * instead of analysing a screen capture. Every value is the person's own usual (their baseline
 * mean) when they have one, otherwise a typical resting value, so a demo reads "within your usual".
 * All of it is stored as simulated, and the screens say so.
 */

export const DEMO_PLAYBACK_RATE = 3
export const DEMO_SECONDS = 6

const FALLBACK = { heartRate: 66, blinkRate: 15, eyelidClosure: 4, sleepQuality: 7, mood: 7, stress: 3, sleepHours: 7.5, nearAcuity: 0.1 }

type Reading = { baseline: { mean: number } | null }

export function demoValues(crewId: string): typeof FALLBACK {
  const readings = (D.crewData(crewId) as { readings: Record<string, Reading> }).readings
  const usual = (k: keyof typeof FALLBACK, dp = 0) => {
    const m = readings[k]?.baseline?.mean
    if (typeof m !== 'number' || !Number.isFinite(m)) return FALLBACK[k]
    const f = 10 ** dp
    return Math.round(m * f) / f
  }
  return {
    heartRate: usual('heartRate'),
    blinkRate: usual('blinkRate', 1),
    eyelidClosure: usual('eyelidClosure', 1),
    sleepQuality: usual('sleepQuality'),
    mood: usual('mood'),
    stress: usual('stress'),
    sleepHours: usual('sleepHours', 1),
    nearAcuity: usual('nearAcuity', 2),
  }
}

/** A normal vision result: no Amsler distortion in either eye, and the person's usual acuity. */
export function demoVision(crewId: string): { amsler: { left: AmslerSummary; right: AmslerSummary }; acuity: { logMar: number; readable: boolean } } {
  const normal = summarizeAmsler(new Set(), 10)
  return { amsler: { left: normal, right: normal }, acuity: { logMar: demoValues(crewId).nearAcuity, readable: true } }
}
