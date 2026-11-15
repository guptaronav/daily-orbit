import rawSources from '../content/sources.json'
import rawBedrest from '../data/bedrest.json'
import rawDonki from '../data/donki-sep.json'
import { INDICATORS, type Indicator } from '../contract/types'
import type { Channel } from './dataCoverage'

/** One page, standard or paper the app's text is written from. `usedFor` names the indicators and fields it backs. */
export type Source = { id: string; title: string; url: string; usedFor: string }

/** A NASA dataset bundled with the app, and what it drives. */
export type Dataset = { id: string; title: string; url: string; usedFor: string[] }

export const SOURCES = rawSources as Source[]

const NASA_HOST = /^https:\/\/([a-z0-9-]+\.)*nasa\.gov\//

export const isNasa = (source: Pick<Source, 'url'>): boolean => NASA_HOST.test(source.url)

export const nasaSources = (): Source[] => SOURCES.filter(isNasa)
export const otherSources = (): Source[] => SOURCES.filter((s) => !isNasa(s))

/**
 * Some entries describe their use by topic ("SLAMMD body mass measurement") instead of naming the indicator id.
 * This maps those indicators to the entries that cover their topic, so the coverage table does not show them as unsourced.
 */
export const TOPIC_SOURCES: Partial<Record<Indicator, readonly string[]>> = {
  exerciseMinutes: ['risk-fitness', 'risk-bone', 'astronaut-exercise', 'iss-blog-exercise-2025'],
  bloodSugar: ['ochmo-sas', 'risk-nutrition'],
  digestiveComfort: ['ochmo-sas', 'risk-host-microbe', 'twins-study', 'niddk-digestive'],
  appetite: ['ochmo-sas', 'ochmo-food-nutrition', 'risk-nutrition', 'space-food-systems'],
  bodyMass: ['iss-blog-slammd', 'twins-study', 'risk-nutrition'],
  bowelMovements: ['ochmo-sas', 'niddk-digestive'],
  waterIntake: ['water-recovery', 'ochmo-sas'],
  mealsEaten: ['ochmo-food-nutrition', 'space-food-systems', 'twins-study'],
  reactionTime: ['basner2011', 'jones2022', 'nasrini2020'],
}

/** Sources for an indicator: entries whose `usedFor` names its id, plus the topic matches above. */
export function sourcesForIndicator(indicator: Indicator): Source[] {
  // Longer ids are blanked out first so an id never matches inside another one.
  const longer = INDICATORS.filter((i) => i !== indicator && i.includes(indicator))
  const named = new RegExp(`\\b${indicator}\\b`)
  const topic = TOPIC_SOURCES[indicator] ?? []
  return SOURCES.filter((s) => topic.includes(s.id) || named.test(longer.reduce((t, i) => t.split(i).join(' '), s.usedFor)))
}

export const DATASETS: readonly Dataset[] = [
  {
    id: 'donki-sep',
    title: rawDonki.sources.events.name,
    url: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP',
    usedFor: [
      `Radiation replay: ${rawDonki.eventCount} events fetched when the app is built, ${rawDonki.replays.length} offered for replay`,
      'Onset time of each replayed event, which triggers the shelter prompt',
    ],
  },
  {
    id: 'iswa-crater',
    title: rawDonki.sources.doseRate.name,
    url: 'https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi/info?id=CRaTER',
    usedFor: ['Radiation replay: the hourly measured dose rate behind the simulated dose ledger', 'Radiation dose readings written to the body map during a replay (simulated and labeled)'],
  },
  {
    id: 'iswa-goes',
    title: rawDonki.sources.protonFlux.name,
    url: 'https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi/info?id=goesp_part_flux_P5M',
    usedFor: ['Radiation replay: proton flux shown for context. It is not used in the dose.'],
  },
  {
    id: 'nlsp-bedrest',
    title: rawBedrest.source.name,
    url: `https://doi.org/${rawBedrest.source.doi}`,
    usedFor: ['Crew 3 history on the body map and trend charts: one de-identified bed-rest participant, 30 days', 'Ground analog data, not in-flight data, and labeled that way on screen'],
  },
]

export const CHANNEL_LABEL: Record<Channel, string> = {
  mirrorCamera: 'Mirror check (camera)',
  mirrorVision: 'Mirror check (vision tests)',
  mirrorCheckIn: 'Mirror check (questions)',
  manualEntry: 'Manual entry',
  radiationReplay: 'Radiation replay',
  nasaBedrest: 'NASA bed-rest data (Crew 3)',
  reactionTest: 'Reaction test',
  bodyChecks: 'Body checks',
}

/** NASA Standard Measures categories the app does not collect (docs/DATA_COVERAGE.md). */
export const UNCOVERED_STANDARD_MEASURES: readonly string[] = [
  'Cognition tests (NASA uses 10 computer tests; we run a reaction-time test and the 3-minute PVT-B)',
  'Carotid intima-media thickness (ultrasound)',
  'Cellular profile (blood and saliva)',
  'Biochemical markers beyond the single blood sugar entry (blood and urine)',
  'Microbiome samples (we only collect self-reported digestive comfort)',
  'Personality questionnaire',
  'Strength test (we log hand-grip strength only)',
  'Actigraphy as a wrist sensor (we only log exercise minutes)',
]

/** NASA data we opened but did not use, and things that did not work, with the reason. */
export const NOT_USED: readonly { what: string; why: string }[] = [
  {
    what: 'NASA OSDR gut microbiome datasets: OSD-630 (SpaceX Inspiration4 stool metagenome) and OSD-191 (MARS500, a 520-day ground confinement study)',
    why: 'Both are open and we downloaded their processed tables, but they are microbe counts from stool samples. The app collects no samples, so no indicator can be compared with them.',
  },
  {
    what: 'Intensity of each solar particle event from NASA DONKI',
    why: 'DONKI event records hold the time, instruments and linked events, but no intensity. The replay takes its dose rate from LRO CRaTER and shows GOES proton flux for context.',
  },
  {
    what: 'Mars rover radiation data (MSL RAD dose rates, via NASA CCMC iSWA) for the radiation replay',
    why: 'The series starts after landing in August 2012, so it is surface data, not the cruise to Mars.',
  },
  {
    what: 'Space station dose data (ALTEA, via NASA CCMC iSWA) and NASA OSDR RadLab dosimeter readings',
    why: 'ALTEA covers 2011 to 2012 only, and RadLab returns dose values without unit labels. The replay uses one lunar-orbit detector for every environment instead, and says so.',
  },
  {
    what: 'A replay dose that changes with the selected environment',
    why: 'Vehicle shielding and location are not modeled. The same measured dose rate is applied in every environment.',
  },
  {
    what: 'Bed-rest sleep data (Campaign 1 wrist actigraphy) and mood, stress and daily energy intake (70-day campaign)',
    why: 'These exist in the NASA archive for other participants. Crew 3 uses one Campaign 3 participant, whose records do not include them, and we did not mix people.',
  },
  {
    what: 'Daily blood sugar readings from a NASA dataset',
    why: 'We found none for bed-rest participants. Blood sugar is manual entry only.',
  },
  {
    what: 'api.nasa.gov as the DONKI host',
    why: 'It needs an API key. The build script tries it only when a key is set and otherwise uses the NASA CCMC host, which returned the same events in our checks.',
  },
  {
    what: '10 report PDFs in the NASA bed-rest archive',
    why: 'The NASA server returned errors for them on every attempt. None is used by the app.',
  },
]
