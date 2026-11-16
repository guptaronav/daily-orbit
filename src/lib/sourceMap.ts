import { DATASETS, SOURCES, type Dataset, type Source } from './sources'

/*
 * Where each source is used on the site, by page and section, the way a visitor meets them. Every
 * section that rests on a source shows a "Sources used here" strip from this map, and the Sources
 * page groups the full list the same way. A test checks that every id exists and that every source
 * in sources.json appears in at least one place.
 */

export type Area = {
  id: string
  /** Where it is on the site, as the visitor sees it. */
  page: string
  title: string
  /** One line: what the sources back in this section. */
  what: string
  sources: string[]
  datasets?: string[]
}

export const AREAS: Area[] = [
  {
    id: 'today',
    page: 'Today',
    title: "Goals and today's call",
    what: 'The daily water goal, the two hours of exercise, meals, and the risks behind the Go / No-go call.',
    sources: ['jsc-67378', 'astronaut-exercise', 'ochmo-food-nutrition', 'hrp-risks'],
  },
  {
    id: 'checkin',
    page: 'Check in',
    title: 'The mirror check',
    what: 'Blinking and eyelid closure as fatigue signs, the Amsler grid and near-vision tests, and the how-you-feel questions.',
    sources: ['nih-perclos-review', 'nih-blink-drowsiness', 'nih-blink-fatigue', 'nasa-fcl', 'nasa-ochmo-sans-brief', 'risk-sans', 'nasa-ochmo-sleep-brief', 'nasa-ochmo-bh-brief', 'risk-behavioral', 'risk-inflight-medical', 'risk-sensorimotor', 'risk-hypoxia'],
  },
  {
    id: 'log-readings',
    page: 'Log',
    title: 'Readings',
    what: 'Blood pressure, temperature, blood sugar, body mass, sleep and exercise: why each is checked in space and when to escalate.',
    sources: ['risk-cardio', 'csa-cardiobreath', 'csa-bio-monitor', 'nasa-iss-blog-2025-07-17', 'stahn-2017-cbt', 'risk-immune', 'risk-host-microbe', 'ochmo-sas', 'iss-blog-slammd', 'twins-study', 'risk-sleep', 'iss-blog-exercise-2025'],
  },
  {
    id: 'log-food',
    page: 'Log',
    title: 'Food and water',
    what: 'The fluid goal, why crews under-eat, menu fatigue, and water recycling on the ISS.',
    sources: ['jsc-67378', 'ochmo-food-nutrition', 'nutritional-biochemistry', 'space-food-systems', 'water-recovery', 'risk-nutrition', 'niddk-digestive'],
  },
  {
    id: 'log-alertness',
    page: 'Log',
    title: 'Alertness test (PVT-B)',
    what: 'How the reaction-time test works and how sleep loss slows it, on the ISS and in analogs.',
    sources: ['basner2011', 'jones2022', 'nasrini2020', 'standard-measures'],
  },
  {
    id: 'log-checks',
    page: 'Log',
    title: 'Body checks',
    what: 'The pain map, the stand-up test, the weekly NASA-TLX workload and PHQ-2 / GAD-2 mood check, and grip strength.',
    sources: ['pmc-spinal-health', 'hrr-disc', 'hrr-medical', 'nasa-muscle-risk', 'risk-fitness', 'hrp-cardio-evidence-2022', 'medline-orthostatic', 'nasa-tlx', 'phq2-kroenke-2003', 'gad2-kroenke-2007', 'uw-gad2'],
  },
  {
    id: 'body-tour',
    page: 'Body',
    title: 'Body tour and readings',
    what: 'What each region does in the body, and the NASA risk and Standard Measures category on every indicator.',
    sources: ['medline-brain', 'medline-sleep', 'nei-eyes', 'nhlbi-heart', 'medline-bone', 'medline-muscle', 'medline-immune', 'medline-temp', 'medline-digestive', 'hrp-risks', 'standard-measures'],
  },
  {
    id: 'body-patterns',
    page: 'Body',
    title: 'Patterns and care plans',
    what: 'Each pattern is tied to its NASA risk, and its care plan is built only from the indicators’ sourced text.',
    sources: ['hrp-risks', 'risk-immune', 'risk-sleep', 'risk-sans', 'risk-behavioral', 'risk-inflight-medical'],
  },
  {
    id: 'body-hazards',
    page: 'Body',
    title: 'Five hazards and the solar storm replay',
    what: 'The five hazards, cabin CO2 and noise limits, and the radiation numbers, with the NASA data behind the storm replay.',
    sources: ['hrp-hazards', 'nasa-hrp-hazards', 'hazard-gravity', 'hazard-closed-env', 'hazard-distance', 'hazard-isolation', 'hazard-radiation', 'ochmo-co2', 'ochmo-acoustics', 'risk-radiation-cancer', 'radiation-wont-stop', 'artemis2-space-weather', 'lsah-2023', 'ochmo-tb-020'],
    datasets: ['donki-sep', 'iswa-crater', 'iswa-goes'],
  },
  {
    id: 'body-forecast',
    page: 'Body',
    title: 'Mission forecast',
    what: 'The 1% to 1.5% a month bone loss, exercise as the countermeasure, the 600 mSv career limit and the daily dose rates.',
    sources: ['risk-bone', 'astronaut-exercise', 'ochmo-tb-020', 'lsah-2023', 'msl-rad'],
  },
  {
    id: 'crew',
    page: 'Crew',
    title: 'Alerts, who to tell, and the ground link',
    what: 'The crew medical officer, private medical conferences, the message delay, the solar-conjunction blackout, and emergency return.',
    sources: ['std-3001-training', 'std-3001-medops', 'space-comms-7', 'jpl-approx-pos', 'jpl-conjunction-2015', 'commercial-crew-escape'],
  },
  {
    id: 'missions',
    page: 'Mission menu',
    title: 'Missions',
    what: 'The ISS, the lunar surface, the pressurized rover, Mars transit and a Mars base: gravity, radiation, distance and day length.',
    sources: ['moon-facts', 'mars-facts', 'msl-rad', 'jpl-mars-time', 'space-comms-7', 'nasa-jaxa-rover', 'ntrs-rover-habitability', 'lsah-2023', 'hazard-distance', 'jpl-approx-pos'],
  },
  {
    id: 'schedule',
    page: 'Schedule',
    title: 'The mission day',
    what: 'The shape of a crew day, ground calls, roles, the 8.5-hour sleep period and the two hours of exercise.',
    sources: ['living-working-factsheet', 'podcast-day-in-space', 'expedition-74', 'std-3001-medops', 'astronaut-exercise', 'nasa-ochmo-sleep-brief'],
  },
  {
    id: 'metrics',
    page: 'Metrics',
    title: 'Tested on real NASA data',
    what: 'The flagging rules replayed day by day on a real NASA bed-rest participant.',
    sources: ['standard-measures'],
    datasets: ['nlsp-bedrest'],
  },
]

const byId = new Map(SOURCES.map((s) => [s.id, s]))
const dataById = new Map(DATASETS.map((d) => [d.id, d]))

export const area = (id: string): Area | undefined => AREAS.find((a) => a.id === id)
export const areaSources = (a: Area): Source[] => a.sources.map((id) => byId.get(id)).filter((s): s is Source => !!s)
export const areaDatasets = (a: Area): Dataset[] => (a.datasets ?? []).map((id) => dataById.get(id)).filter((d): d is Dataset => !!d)
/** The areas a source is used in, for the "used on" line of the full list. */
export const usedIn = (sourceId: string): Area[] => AREAS.filter((a) => a.sources.includes(sourceId))
