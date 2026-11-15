import { INDICATORS, type Indicator } from '../contract/types'

/** Where a measurement can come from. `live` channels exist in the app today; `planned` ones are assigned (docs/TEAM_TASKS.md). */
export type Channel = 'mirrorCamera' | 'mirrorVision' | 'mirrorCheckIn' | 'manualEntry' | 'radiationReplay' | 'nasaBedrest'

export type Coverage = { live: Channel[]; planned: Channel[]; nasaBasis: string }

const STD = 'NASA Spaceflight Standard Measures'
const HRP = 'NASA HRP risk'

/**
 * Every indicator the app defines, how it gets in, and the NASA practice it follows. A test keeps this
 * honest: an indicator with no channel at all fails the build, so no data we need can be silently missing.
 */
export const COVERAGE: Record<Indicator, Coverage> = {
  heartRate: { live: ['mirrorCamera', 'nasaBedrest'], planned: [], nasaBasis: `${STD}: sensorimotor tests record heart rate; ${HRP}: Cardiovascular Adaptations` },
  blinkRate: { live: ['mirrorCamera'], planned: [], nasaBasis: `${HRP}: Inadequate Sleep and Irregular Schedules (fatigue proxy; our mapping)` },
  eyelidClosure: { live: ['mirrorCamera'], planned: [], nasaBasis: `${HRP}: Inadequate Sleep and Irregular Schedules (fatigue proxy; our mapping)` },
  amslerDistortion: { live: ['mirrorVision'], planned: [], nasaBasis: `${HRP}: Spaceflight Associated Neuro-ocular Syndrome (SANS)` },
  nearAcuity: { live: ['mirrorVision'], planned: [], nasaBasis: `${HRP}: SANS (uncalibrated self-test)` },
  sleepQuality: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${STD}: sleep quality questionnaire after waking` },
  sleepHours: { live: ['mirrorCheckIn', 'manualEntry'], planned: [], nasaBasis: `${STD}: actigraphy and sleep questionnaire; ${HRP}: Inadequate Sleep` },
  mood: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${STD}: pre-sleep questionnaire covers mood; ${HRP}: Behavioral Changes and Psychiatric Disorders` },
  stress: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${HRP}: Behavioral Changes and Psychiatric Disorders` },
  symptomReport: { live: ['mirrorCheckIn', 'nasaBedrest'], planned: ['radiationReplay'], nasaBasis: 'Early-reporting design goal; radiation replay follow-up prompts' },
  digestiveComfort: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${HRP}: Host-Microorganism Interactions (gut microbiome); ${STD}: microbiome from fecal samples (we do not collect samples)` },
  appetite: { live: ['mirrorCheckIn'], planned: [], nasaBasis: `${HRP}: Inadequate Food and Nutrition` },
  bodyMass: { live: ['manualEntry', 'nasaBedrest'], planned: [], nasaBasis: `${HRP}: Inadequate Food and Nutrition; ISS crews measure body mass regularly (PubMed 25197887)` },
  bowelMovements: { live: ['nasaBedrest', 'manualEntry'], planned: [], nasaBasis: `NASA bed-rest Case Report Forms (daily bowel movement log, doi:10.83263/wjw1-ta27); ${HRP}: Host-Microorganism Interactions (our mapping)` },
  bloodSugar: { live: ['manualEntry'], planned: [], nasaBasis: `${HRP}: Inadequate Food and Nutrition (our mapping); ${STD}: biochemical markers from blood` },
  bloodPressureSys: { live: ['manualEntry', 'nasaBedrest'], planned: [], nasaBasis: `${STD}: sensorimotor tests record blood pressure; ${HRP}: Cardiovascular Adaptations` },
  bloodPressureDia: { live: ['manualEntry', 'nasaBedrest'], planned: [], nasaBasis: `${STD}: sensorimotor tests record blood pressure; ${HRP}: Cardiovascular Adaptations` },
  temperature: { live: ['manualEntry', 'nasaBedrest'], planned: [], nasaBasis: 'Named in the challenge; no Standard Measures or HRP page found that mentions it' },
  exerciseMinutes: { live: ['manualEntry', 'nasaBedrest'], planned: [], nasaBasis: `${STD}: actigraphy (activity); ${HRP}: Bone Changes, Cardiorespiratory and Musculoskeletal Fitness` },
  radiationDose: { live: ['radiationReplay'], planned: [], nasaBasis: `${HRP}: Radiation-Induced Cancers; NASA DONKI solar particle events and LRO CRaTER dose rates (simulated dose)` },
}

/** Indicators no screen collects yet: the live gap list. Shrinks as teammates' screens land. */
export const plannedOnly = (): Indicator[] => INDICATORS.filter((i) => COVERAGE[i].live.length === 0)
