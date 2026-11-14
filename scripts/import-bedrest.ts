// Build src/data/bedrest.json from NASA bed-rest case report forms.
//
//   node scripts/import-bedrest.ts            (Node 24 runs TypeScript directly)
//
// Reads ONE participant from Campaign 3 of the Case Report Forms in data-raw/nasa-bedrest/CRF
// (NASA Life Sciences Data Archive, doi:10.83263/wjw1-ta27), keeps the first 30 days, and writes only
// day offsets and values. Dates, subject numbers and every free-text comment are dropped, and the script
// refuses to write the file if its own output looks identifying.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseBowel, parseStretchMinutes, parseSymptoms, parseVitals } from '../src/lib/bedrest/parse.ts'

// A Campaign 3D participant chosen for the fullest daily logs (vitals, bowel, stretch, symptoms) and a clear
// bed-rest onset. This is a file key in the raw data, not written to the output.
const PARTICIPANT = process.argv[2] ?? 'C3D_8881'
const DAYS = 30
const ROOT = 'data-raw/nasa-bedrest/CRF'
const OUT = 'src/data/bedrest.json'
const DOI = '10.83263/wjw1-ta27'

const log = (name: string) => join(ROOT, `CRF_Campaign_3_${name}`, `CRF_Campaign_3_${name}_${PARTICIPANT}.csv`)
const read = (name: string): string => {
  const path = log(name)
  if (!existsSync(path)) throw new Error(`missing raw file: ${path}. Is data-raw/ checked out?`)
  return readFileSync(path, 'utf8')
}

const vitals = parseVitals(read('Daily_Vitals')).slice(0, DAYS)
if (vitals.length < DAYS) throw new Error(`expected ${DAYS} days of vitals, found ${vitals.length}`)
const bowel = parseBowel(read('Bowel_Movement'))
const symptoms = parseSymptoms(read('Symptom_Complaint'))
const stretch = parseStretchMinutes(read('Stretch_Log'))

type OutRecord = { day: number; indicator: string; value: number | { symptoms: string[] }; unit: string; dataset: string }
const records: OutRecord[] = []
const VITALS = 'Campaign 3 Daily Vitals'

vitals.forEach((v, day) => {
  const add = (indicator: string, value: number | undefined, unit: string, dataset: string) => {
    if (value !== undefined) records.push({ day, indicator, value: Math.round(value * 100) / 100, unit, dataset })
  }
  add('heartRate', v.heartRate, 'bpm', VITALS)
  add('bloodPressureSys', v.systolic, 'mmHg', VITALS)
  add('bloodPressureDia', v.diastolic, 'mmHg', VITALS)
  add('bodyMass', v.bodyMassKg, 'kg', VITALS)
  add('temperature', v.temperatureC, '°C', VITALS)
  add('bowelMovements', bowel.get(v.date), 'per day', 'Campaign 3 Bowel Movement')
  add('exerciseMinutes', stretch.get(v.date), 'min', 'Campaign 3 Stretch Log')
  const labels = symptoms.get(v.date)
  if (labels && labels.length > 0) records.push({ day, indicator: 'symptomReport', value: { symptoms: labels }, unit: 'symptoms', dataset: 'Campaign 3 Symptom Complaint' })
})

const out = {
  source: {
    name: 'NASA Life Sciences Data Archive: bed rest Case Report Forms, Campaign 3',
    doi: DOI,
    archiveStatus: 'Data preservation is complete. All datasets are publicly available. (NLSP metadata for this record)',
    participant: 'analog-1',
    note: 'One de-identified participant in a head-down-tilt bed-rest spaceflight analog. Dates, subject numbers and comments are removed. This is ground analog data, not in-flight data.',
    window: `first ${DAYS} days of the participant's record: the end of the pre-bed-rest baseline, then the start of head-down tilt`,
  },
  days: vitals.map((v, day) => ({ day, phase: v.phase, brDay: v.brDay })),
  records,
}

// De-identification self-check: refuse to write anything that still looks like a date, subject number or name.
const text = JSON.stringify(out, null, 1)
const ids = PARTICIPANT.split('_')
const leaks = [new RegExp(`\\b${ids[1]}\\b`), new RegExp(PARTICIPANT, 'i'), /\b(19|20)\d{2}-\d{2}-\d{2}\b/, /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, /\bDr\.?\s+[A-Z]/, /\bRN\b/].filter((re) => re.test(text))
if (leaks.length > 0) throw new Error(`output looks identifying (${leaks.map(String).join(', ')}); not writing ${OUT}`)

mkdirSync('src/data', { recursive: true })
writeFileSync(OUT, text + '\n')

const byIndicator = new Map<string, number>()
for (const r of records) byIndicator.set(r.indicator, (byIndicator.get(r.indicator) ?? 0) + 1)
console.log(`wrote ${OUT}: ${DAYS} days, ${records.length} records`)
for (const [k, n] of [...byIndicator].sort()) console.log(`  ${k.padEnd(18)} ${String(n).padStart(2)} of ${DAYS} days`)
console.log(`phases: ${[...new Set(out.days.map((d) => d.phase))].join(', ')}; study days ${out.days[0].brDay} .. ${out.days[DAYS - 1].brDay}`)
