import { INDICATORS, type Indicator } from '../contract/types'

/** Where a measurement can come from. `live` channels exist in the app today; `planned` ones are assigned (docs/TEAM_TASKS.md). */
export type Channel = 'mirrorCamera' | 'mirrorVision' | 'mirrorCheckIn' | 'manualEntry' | 'radiationReplay'

export type Coverage = { live: Channel[]; planned: Channel[]; nasaBasis: string }

const STD = 'NASA Spaceflight Standard Measures'
const HRP = 'NASA HRP risk'

/**
 * Every indicator the app defines, how it gets in, and the NASA practice it follows. A test keeps this
 * honest: an indicator with no channel at all fails the build, so no data we need can be silently missing.
 */
export const COVERAGE: Record<Indicator, Coverage> = {
  heartRate: { live: ['mirrorCamera'], planned: [], nasaBasis: `${STD}: sensorimotor tests record heart rate; ${HRP}: Cardiovascular Adaptations` },
  blinkRate: { live: ['mirrorCamera'], planned: [], nasaBasis: `${HRP}: Inadequate Sleep and Irregular Schedules (fatigue proxy; our mapping)` },
  eyelidClosure: { live: ['mirrorCamera'], planned: [], nasaBasis: `${HRP}: Inadequate Sleep and Irregular Schedules (fatigue proxy; our mapping)` },
  amslerDistortion: { live: ['mirrorVision'], planned: [], nasaBasis: `${HRP}: Spaceflight Associated Neuro-ocular Syndrome (SANS)` },
  nearAcuity: { live: ['mirrorVision'], planned: [], nasaBasis: `${HRP}: SANS (uncalibrated self-test)` },
  sleepQuality: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${STD}: sleep quality questionnaire after waking` },
  sleepHours: { live: ['mirrorCheckIn'], planned: ['manualEntry'], nasaBasis: `${STD}: actigraphy and sleep questionnaire; ${HRP}: Inadequate Sleep` },
  mood: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${STD}: pre-sleep questionnaire covers mood; ${HRP}: Behavioral Changes and Psychiatric Disorders` },
  stress: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${HRP}: Behavioral Changes and Psychiatric Disorders` },
  symptomReport: { live: ['mirrorCheckIn'], planned: ['radiationReplay'], nasaBasis: 'Early-reporting design goal; radiation replay follow-up prompts' },
  digestiveComfort: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${HRP}: Host-Microorganism Interactions (gut microbiome); ${STD}: microbiome from fecal samples (we do not collect samples)` },
  appetite: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${HRP}: Inadequate Food and Nutrition` },
  bodyMass: { live: [], planned: ['manualEntry'], nasaBasis: `${HRP}: Inadequate Food and Nutrition; ISS crews measure body mass regularly (PubMed 25197887)` },
  bloodSugar: { live: [], planned: ['manualEntry'], nasaBasis: `${HRP}: Inadequate Food and Nutrition (our mapping); ${STD}: biochemical markers from blood` },
  bloodPressureSys: { live: [], planned: ['manualEntry'], nasaBasis: `${STD}: sensorimotor tests record blood pressure; ${HRP}: Cardiovascular Adaptations` },
  bloodPressureDia: { live: [], planned: ['manualEntry'], nasaBasis: `${STD}: sensorimotor tests record blood pressure; ${HRP}: Cardiovascular Adaptations` },
  temperature: { live: [], planned: ['manualEntry'], nasaBasis: 'Named in the challenge; no Standard Measures or HRP page found that mentions it' },
  exerciseMinutes: { live: [], planned: ['manualEntry'], nasaBasis: `${STD}: actigraphy (activity); ${HRP}: Bone Changes, Cardiorespiratory and Musculoskeletal Fitness` },
  radiationDose: { live: [], planned: ['radiationReplay'], nasaBasis: `${HRP}: Radiation-Induced Cancers; NASA DONKI solar particle events (simulated dose)` },
}

/** Indicators no screen collects yet: the live gap list. Shrinks as teammates' screens land. */
export const plannedOnly = (): Indicator[] => INDICATORS.filter((i) => COVERAGE[i].live.length === 0)
