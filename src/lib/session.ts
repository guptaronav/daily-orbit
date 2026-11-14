import { getThreshold } from '../config/thresholds'
import type { GameEvent, GameEventKind, Indicator, Measurement, Quality, Source } from '../contract/types'
import type { AmslerSummary } from './vision/amsler'

type CameraSource = Extract<Source, 'camera' | 'simulated'>

/** Everything one mirror check collects. Each part is optional because a check can be partial. */
export type MirrorSession = {
  sessionId: string
  heartRate?: { bpm: number | null; estimateBpm?: number | null; quality: Quality; source: CameraSource }
  blink?: { blinkRate: number; eyelidClosurePct: number; quality: Quality; source: CameraSource }
  /** Only questions the person actually answered; unanswered ones are absent, never defaulted. */
  selfReport?: Partial<Record<'sleepQuality' | 'mood' | 'stress' | 'sleepHours' | 'appetite' | 'digestiveComfort', number>>
  amsler?: { left: AmslerSummary; right: AmslerSummary }
  /** `readable: false` means the largest letter was never answered correctly: refuse to judge it. */
  acuity?: { logMar: number; readable?: boolean }
  symptoms?: { symptoms: string[]; note?: string }
  /** True when this session's reading was retaken after a quality failure. */
  retookAfterQualityFail?: boolean
}

const PASSED: Quality = { score: 1, passed: true }

/** The effort events a session earns. Depends only on what the person did, never on health values. */
export function sessionEventKinds(session: MirrorSession): GameEventKind[] {
  const kinds: GameEventKind[] = ['checkInComplete']
  const { symptoms } = session
  if (symptoms && (symptoms.symptoms.length > 0 || Boolean(symptoms.note))) kinds.push('symptomReported')
  if (session.retookAfterQualityFail) kinds.push('retakeAfterQualityFail')
  return kinds
}

/**
 * Turn a finished mirror check into storable records. Events depend only on what the person DID
 * (completed, reported, retook), never on any health value, so reporting a bad day earns exactly
 * what a good day does. Failed readings are saved too, flagged, so they stay visible and a retake
 * can be credited.
 */
export function buildSessionRecords(session: MirrorSession, crewId: string, now: Date): { measurements: Measurement[]; events: GameEvent[] } {
  const timestamp = now.toISOString()
  const measurements: Measurement[] = []

  const add = (indicator: Indicator, value: Measurement['value'], source: Source, quality: Quality = PASSED) =>
    measurements.push({
      id: crypto.randomUUID(),
      crewId,
      sessionId: session.sessionId,
      timestamp,
      indicator,
      value,
      unit: getThreshold(indicator).unit,
      quality,
      source,
    })

  const { heartRate, blink, selfReport, amsler, acuity, symptoms } = session
  if (heartRate) {
    // A weak-signal estimate is kept as the value of a FAILED reading (never trusted, colored or baselined).
    // Only when weak signal was the sole problem; for motion, light or a lost face the value stays 0.
    const estimate = heartRate.quality.reason === 'lowSignal' ? (heartRate.estimateBpm ?? 0) : 0
    add('heartRate', heartRate.bpm ?? estimate, heartRate.source, heartRate.quality)
  }
  if (blink) {
    add('blinkRate', blink.blinkRate, blink.source, blink.quality)
    add('eyelidClosure', blink.eyelidClosurePct, blink.source, blink.quality)
  }
  if (selfReport) {
    for (const indicator of ['sleepQuality', 'mood', 'stress', 'sleepHours', 'appetite', 'digestiveComfort'] as const) {
      const value = selfReport[indicator]
      if (value !== undefined) add(indicator, value, 'selfReport')
    }
  }
  if (amsler) {
    add(
      'amslerDistortion',
      {
        left: amsler.left,
        right: amsler.right,
        distortion: amsler.left.distortion || amsler.right.distortion,
        distortedCells: amsler.left.distortedCells + amsler.right.distortedCells,
        centralAffected: amsler.left.centralAffected || amsler.right.centralAffected,
      },
      'selfReport',
    )
  }
  if (acuity) add('nearAcuity', acuity.logMar, 'selfReport', acuity.readable === false ? { score: 0, passed: false, reason: 'other' } : PASSED)
  if (symptoms) add('symptomReport', { symptoms: symptoms.symptoms, ...(symptoms.note ? { note: symptoms.note } : {}) }, 'selfReport')

  const events = sessionEventKinds(session).map((kind): GameEvent => ({ id: crypto.randomUUID(), crewId, timestamp, kind }))

  return { measurements, events }
}
