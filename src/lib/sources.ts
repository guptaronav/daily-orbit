import rawSources from '../content/sources.json'
import type { Channel } from './dataCoverage'

export type SourceKind = 'page' | 'standard' | 'dataset'

/** One NASA page, standard or dataset the app is built on, and what it drives. */
export type Source = { id: string; kind: SourceKind; title: string; url: string; usedFor: string[] }

export const SOURCES = rawSources as Source[]

export const sourcesOfKind = (kind: SourceKind): Source[] => SOURCES.filter((s) => s.kind === kind)

export const getSource = (id: string): Source | undefined => SOURCES.find((s) => s.id === id)

export const CHANNEL_LABEL: Record<Channel, string> = {
  mirrorCamera: 'Mirror check (camera)',
  mirrorVision: 'Mirror check (vision tests)',
  mirrorCheckIn: 'Mirror check (questions)',
  manualEntry: 'Manual entry',
  radiationReplay: 'Radiation replay',
  nasaBedrest: 'NASA bed-rest data (Crew 3)',
}

/** NASA Standard Measures categories the app does not collect (docs/DATA_COVERAGE.md). */
export const UNCOVERED_STANDARD_MEASURES: readonly string[] = [
  'Cognition tests (10 computer tests)',
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
    why: 'Both are open and we downloaded their processed tables, but they are microbe counts from stool samples. The app collects no samples, so no indicator can be compared with them. The reference panel was a stretch task we did not reach.',
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
    what: 'Symptoms to watch for after a radiation event, and what prevents bowel problems in space',
    why: 'Not sourced from a NASA page yet, so the app shows a placeholder instead of guessing.',
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
