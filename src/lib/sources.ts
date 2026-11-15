import rawSources from '../content/sources.json'
import type { Channel } from './dataCoverage'

/** One page the indicator and environment text was written from, and what it supports. */
export type Source = { id: string; title: string; url: string; usedFor: string }

/** A dataset fetched at build time and bundled; the app makes no network calls at run time. */
export type Dataset = { id: string; title: string; url: string; usedFor: readonly string[] }

export const SOURCES = rawSources as Source[]

const NASA_HOST = /^https:\/\/([a-z0-9-]+\.)*nasa\.gov\//
export const isNasaSource = (s: Source): boolean => NASA_HOST.test(s.url)

const trimSlash = (url: string): string => url.replace(/\/$/, '')

/** Environments cite pages by URL, so look a page up by URL too (ignoring a trailing slash). */
export const getSourceByUrl = (url: string): Source | undefined => SOURCES.find((s) => trimSlash(s.url) === trimSlash(url))

export const DATASETS: readonly Dataset[] = [
  {
    id: 'nlsp-bedrest',
    title: 'NASA Life Sciences Data Archive: bed rest Case Report Forms, Campaign 3',
    url: 'https://doi.org/10.83263/wjw1-ta27',
    usedFor: ['Crew 3 history on the body map and trend charts: one de-identified bed-rest participant, 30 days', 'Bowel movements card (the daily log follows the bed-rest case report forms)'],
  },
  {
    id: 'donki-sep',
    title: 'NASA DONKI solar energetic particle (SEP) events',
    url: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP',
    usedFor: ['Radiation replay: events fetched at build time, a few offered for replay', 'Onset time of each replayed event (shelter prompt)'],
  },
  {
    id: 'iswa-crater',
    title: 'LRO CRaTER dose rates, detector pair D3/D4, via NASA CCMC iSWA',
    url: 'https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi/info?id=CRaTER',
    usedFor: ['Radiation replay: hourly measured dose rate behind the simulated dose ledger', 'Radiation dose readings written to the body map during a replay (simulated, labeled)'],
  },
  {
    id: 'iswa-goes',
    title: 'GOES primary >10 MeV proton flux, 5-minute, via NASA CCMC iSWA',
    url: 'https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi/info?id=goesp_part_flux_P5M',
    usedFor: ['Radiation replay: proton flux shown for context (not used in the dose)'],
  },
]

export const CHANNEL_LABEL: Record<Channel, string> = {
  mirrorCamera: 'Mirror check (camera)',
  mirrorVision: 'Mirror check (vision tests)',
  mirrorCheckIn: 'Mirror check (questions)',
  manualEntry: 'Manual entry',
  radiationReplay: 'Radiation replay',
  nasaBedrest: 'NASA bed-rest data (Crew 3)',
  reactionTest: 'Reaction test (Log screen)',
  bodyChecks: 'Body checks (Log screen)',
}

/** NASA Standard Measures categories the app does not collect (docs/DATA_COVERAGE.md). */
export const UNCOVERED_STANDARD_MEASURES: readonly string[] = [
  'Cognition tests (10 computer tests); we run one short reaction-time test only',
  'Carotid intima-media thickness (ultrasound)',
  'Cellular profile (blood and saliva)',
  'Biochemical markers beyond the single blood sugar entry (blood and urine)',
  'Microbiome samples (we only collect a self-reported digestive comfort score and a bowel movement count)',
  'Personality questionnaire',
  'Strength test',
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
    what: 'Mars rover radiation data (MSL RAD dose rates, via NASA CCMC iSWA)',
    why: 'The series starts after landing in August 2012, so it is surface data, not the cruise to Mars. We did not use it for the Mars transit environment.',
  },
  {
    what: 'Space station dose data (ALTEA, via NASA CCMC iSWA) and NASA OSDR RadLab dosimeter readings',
    why: 'ALTEA covers 2011 to 2012 only, and RadLab returns dose values without unit labels. The replay uses one lunar-orbit detector for every environment instead, and says so.',
  },
  {
    what: 'A dose that changes with the selected environment (station, Moon, Mars transit)',
    why: 'Vehicle shielding and location are not modeled. The same measured dose rate is applied in all three.',
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
    what: 'Clinical thresholds for any indicator',
    why: 'We found no cut-off numbers on the NASA pages we opened, so every threshold is unset and status comes from each person\'s own baseline.',
  },
  {
    what: 'api.nasa.gov as the DONKI host',
    why: 'It needs an API key. The build script tries it only when a key is set and otherwise uses the CCMC host, which returned the same events in our checks.',
  },
  {
    what: '10 report PDFs in the NASA bed-rest archive',
    why: 'The NASA server returned errors for them on every attempt. None is used by the app.',
  },
]
