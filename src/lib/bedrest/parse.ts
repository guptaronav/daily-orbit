// Parsers for NASA bed-rest case report forms (CRF). Pure and dependency-free on purpose, so both the
// app tests and `node scripts/import-bedrest.ts` can run them.
//
// Rules this file enforces:
//  - Columns are found by MEANING (the real files use several header spellings), and a column that cannot
//    be found is an error, never a silent guess.
//  - Only structured fields are read. Free-text comment, action and description columns are never read,
//    because they contain people's names.
//  - Rows and dates are returned as plain values; nothing here knows which participant a file belongs to.

export type Row = Record<string, string>

/** RFC-4180-style CSV: BOM, CRLF, quoted commas and newlines, escaped quotes. Headers and values are trimmed. */
export function parseCsv(text: string): Row[] {
  const src = text.replace(/^﻿/, '')
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      record.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      record.push(field)
      field = ''
      records.push(record)
      record = []
    } else field += c
  }
  if (field !== '' || record.length > 0) {
    record.push(field)
    records.push(record)
  }
  const nonBlank = records.filter((r) => r.some((f) => f.trim() !== ''))
  if (nonBlank.length === 0) return []
  const header = nonBlank[0].map((h) => h.trim())
  return nonBlank.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

/** US month/day/year or ISO year-month-day to ISO. Anything else (including impossible dates) is null. */
export function parseDate(raw: string): string | null {
  const s = raw.trim()
  let y: number
  let m: number
  let d: number
  let match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (match) {
    m = Number(match[1])
    d = Number(match[2])
    y = Number(match[3])
  } else if ((match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) {
    y = Number(match[1])
    m = Number(match[2])
    d = Number(match[3])
  } else return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** First header matching any `include` pattern and none of the `exclude` patterns (case-insensitive). */
function findColumn(headers: string[], include: RegExp[], exclude: RegExp[] = []): string | undefined {
  return headers.find((h) => {
    const k = h.trim().toLowerCase()
    return include.some((p) => p.test(k)) && !exclude.some((p) => p.test(k))
  })
}

function requireColumn(log: string, name: string, headers: string[], include: RegExp[], exclude: RegExp[] = []): string {
  const found = findColumn(headers, include, exclude)
  if (!found) throw new Error(`${log}: could not find a ${name} column among: ${headers.join(', ')}`)
  return found
}

const number = (raw: string | undefined): number | undefined => {
  const s = (raw ?? '').trim()
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : undefined
}

/** Import sanity guards that drop obvious data-entry errors. These are NOT clinical thresholds. */
export const GUARDS = {
  heartRate: [30, 220],
  systolic: [60, 260],
  diastolic: [30, 160],
  bodyMassKg: [30, 250],
  temperatureC: [33, 42],
} as const

const within = (v: number | undefined, [lo, hi]: readonly [number, number]): number | undefined => (v !== undefined && v >= lo && v <= hi ? v : undefined)

export type VitalsDay = {
  /** ISO date. Used only to line up the other logs; the importer never writes it out. */
  date: string
  phase: string
  /** Study day relative to the start of bed rest. */
  brDay: number | null
  heartRate: number | undefined
  systolic: number | undefined
  diastolic: number | undefined
  bodyMassKg: number | undefined
  temperatureC: number | undefined
}

const DATE_COLUMN = [/^date$/, /^test_date$/, /^test date$/, /^occur date$/]

/** Daily vitals (pulse, blood pressure, weight, body temperature) from a Medical Status and Vitals form. */
export function parseVitals(csv: string): VitalsDay[] {
  const rows = parseCsv(csv)
  if (rows.length === 0) return []
  const h = Object.keys(rows[0])
  const log = 'bed-rest vitals'
  const cDate = requireColumn(log, 'date', h, DATE_COLUMN)
  const cPulse = requireColumn(log, 'pulse', h, [/^pulse/])
  const cSys = requireColumn(log, 'systolic blood pressure', h, [/sysbp/, /systolic/])
  const cDia = requireColumn(log, 'diastolic blood pressure', h, [/diabp/, /diastolic/])
  const cWeight = requireColumn(log, 'weight', h, [/^weight/])
  const cTemp = requireColumn(log, 'body temperature', h, [/body temp/, /temperature, body/], [/fahrenheit/, /ambient/])
  const cPhase = findColumn(h, [/^test_phase$/, /^test phase$/, /^phase$/])
  const cDay = findColumn(h, [/^br_day$/, /^day$/])

  const days = new Map<string, VitalsDay>()
  for (const r of rows) {
    const date = parseDate(r[cDate])
    if (!date) continue
    let temp = number(r[cTemp])
    // A plain "Body Temp" column has no unit. 90 to 110 can only be Fahrenheit, so convert it.
    if (temp !== undefined && temp >= 90 && temp <= 110) temp = ((temp - 32) * 5) / 9
    const day: VitalsDay = {
      date,
      phase: cPhase ? r[cPhase].trim().toUpperCase() : '',
      brDay: cDay && number(r[cDay]) !== undefined ? Number(r[cDay]) : null,
      heartRate: within(number(r[cPulse]), GUARDS.heartRate),
      systolic: within(number(r[cSys]), GUARDS.systolic),
      diastolic: within(number(r[cDia]), GUARDS.diastolic),
      bodyMassKg: within(number(r[cWeight]), GUARDS.bodyMassKg),
      temperatureC: within(temp, GUARDS.temperatureC),
    }
    const existing = days.get(date)
    if (!existing) days.set(date, day)
    else
      for (const k of ['heartRate', 'systolic', 'diastolic', 'bodyMassKg', 'temperatureC'] as const) existing[k] ??= day[k]
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Bowel movements per day: the recorded quantity, 1 for an unquantified yes, 0 for a no. */
export function parseBowel(csv: string): Map<string, number> {
  const rows = parseCsv(csv)
  const out = new Map<string, number>()
  if (rows.length === 0) return out
  const h = Object.keys(rows[0])
  const log = 'bed-rest bowel log'
  const cDate = requireColumn(log, 'date', h, DATE_COLUMN)
  const cBowel = requireColumn(log, 'bowel movement', h, [/^bowel movement$/])
  const cQty = findColumn(h, [/^quantity$/])
  for (const r of rows) {
    const date = parseDate(r[cDate])
    if (!date) continue
    const answer = r[cBowel].trim().toLowerCase()
    let count: number
    if (answer === 'yes') {
      const q = cQty ? number(r[cQty]) : undefined
      count = q !== undefined && q > 0 ? q : 1
    } else if (answer === 'no') count = 0
    else continue
    out.set(date, (out.get(date) ?? 0) + count)
  }
  return out
}

/** Unique lowercase symptom labels per day. Only the category column is read, never comments or actions. */
export function parseSymptoms(csv: string): Map<string, string[]> {
  const rows = parseCsv(csv)
  const out = new Map<string, string[]>()
  if (rows.length === 0) return out
  const h = Object.keys(rows[0])
  const log = 'bed-rest symptom log'
  const cDate = requireColumn(log, 'date', h, DATE_COLUMN)
  const cSymptom = requireColumn(log, 'symptom', h, [/^symptom$/, /^symptom\/complaint$/, /^symptom_complaint$/])
  for (const r of rows) {
    const date = parseDate(r[cDate])
    const label = r[cSymptom].trim().toLowerCase()
    if (!date || label === '' || label === 'na') continue
    const list = out.get(date) ?? []
    if (!list.includes(label)) list.push(label)
    out.set(date, list)
  }
  return out
}

const clockMinutes = (t: string | undefined): number | undefined => {
  const m = /^(\d{1,2}):(\d{2})/.exec((t ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined
}

/** Minutes of completed stretching per day. A session that was not completed adds nothing. */
export function parseStretchMinutes(csv: string): Map<string, number> {
  const rows = parseCsv(csv)
  const out = new Map<string, number>()
  if (rows.length === 0) return out
  const h = Object.keys(rows[0])
  const log = 'bed-rest stretch log'
  const cDate = requireColumn(log, 'date', h, DATE_COLUMN)
  const cDone = requireColumn(log, 'stretching completed', h, [/^stretching_completed/])
  const cDuration = findColumn(h, [/^duration$/])
  const cStart = findColumn(h, [/^start_time$/])
  const cFinish = findColumn(h, [/^finish_time$/])
  for (const r of rows) {
    const date = parseDate(r[cDate])
    if (!date || r[cDone].trim().toLowerCase() !== 'yes') continue
    let minutes = cDuration ? number(/(\d+(?:\.\d+)?)/.exec(r[cDuration])?.[1]) : undefined
    if (minutes === undefined && cStart && cFinish) {
      const a = clockMinutes(r[cStart])
      const b = clockMinutes(r[cFinish])
      if (a !== undefined && b !== undefined) minutes = b >= a ? b - a : b + 1440 - a
    }
    if (minutes === undefined || minutes < 0) continue
    out.set(date, (out.get(date) ?? 0) + minutes)
  }
  return out
}
