import { describe, expect, test } from 'vitest'
import { parseBowel, parseCsv, parseDate, parseStretchMinutes, parseSymptoms, parseVitals } from './parse'

// Synthetic fixtures that mirror the header families found in the real NASA case report forms.
// They contain no real participant data.

describe('parseCsv', () => {
  test('strips a byte-order mark, handles CRLF, and trims header whitespace', () => {
    const rows = parseCsv('﻿a , b\r\n1,2\r\n3,4\r\n')
    expect(rows).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })

  test('handles quoted commas, escaped quotes, and quoted newlines', () => {
    const rows = parseCsv('name,note\n"Smith, J","said ""hi"""\nx,"line1\nline2"\n')
    expect(rows[0]).toEqual({ name: 'Smith, J', note: 'said "hi"' })
    expect(rows[1]).toEqual({ name: 'x', note: 'line1\nline2' })
  })

  test('skips blank lines and tolerates a missing trailing newline', () => {
    expect(parseCsv('a,b\n\n1,2')).toEqual([{ a: '1', b: '2' }])
  })

  test('an empty file is no rows', () => {
    expect(parseCsv('')).toEqual([])
  })
})

describe('parseDate', () => {
  test('reads US month/day/year and ISO dates into ISO', () => {
    expect(parseDate('2/20/2008')).toBe('2008-02-20')
    expect(parseDate('02/05/2008')).toBe('2008-02-05')
    expect(parseDate('2008-02-20')).toBe('2008-02-20')
  })

  test('anything else is null, never a guess', () => {
    for (const bad of ['', 'NA', 'Not reported', '13/40/2008', 'tomorrow']) expect(parseDate(bad)).toBeNull()
  })
})

describe('parseVitals resolves columns by meaning across header variants', () => {
  const variantA = 'Record,Subject,Date,Test_Phase,BR_Day,Vitals Time,Pulse (bpm),SysBP (mmHg),DiaBP (mmHg),Resp Rate (rpm),Weight (Kg),Body Temp (Celsius),Comment\n19429,1,1/16/2008,PRE_TEST,13,9:00,81,124,82,22,80.75,36.5,NA\n19437,1,1/17/2008,PRE_TEST,12,6:00,72,128,86,20,79.85,35.9,NA\n'
  const variantB = 'Subject,Date,Test_Phase,BR_Day,Pulse,SysBP,DiaBP,Resp Rate,Weight,Body Temp,Comment\n1,2/24/2005,PRE_TEST,11,68,142,86,18,91.18,35.8,NA\n'
  const variantC = 'Subject,Date,Test_Phase,BR_Day,Pulse,"Blood Pressure, systolic","Blood Pressure, diastolic",Weight,"Temperature, body (Celsius)","Temperature, body (Fahrenheit)"\n1,2/24/2005,PRE_TEST,11,68,142,86,91.18,35.8,96.4\n'

  test.each([
    ['Pulse (bpm) / SysBP (mmHg) / Weight (Kg)', variantA],
    ['Pulse / SysBP / Body Temp', variantB],
    ['Blood Pressure, systolic / Temperature, body (Celsius)', variantC],
  ])('variant: %s', (_name, csv) => {
    const day = parseVitals(csv)[0]
    expect(day.heartRate).toBeGreaterThan(0)
    expect(day.systolic).toBeGreaterThan(day.diastolic!)
    expect(day.bodyMassKg).toBeGreaterThan(70)
    expect(day.temperatureC).toBeGreaterThan(35)
  })

  test('reads phase and study day, and sorts days by date', () => {
    const days = parseVitals(variantA)
    expect(days.map((d) => d.date)).toEqual(['2008-01-16', '2008-01-17'])
    expect(days[0]).toMatchObject({ phase: 'PRE_TEST', brDay: 13, heartRate: 81, systolic: 124, diastolic: 82, bodyMassKg: 80.75, temperatureC: 36.5 })
  })

  test('the Fahrenheit column is never used for the Celsius value', () => {
    expect(parseVitals(variantC)[0].temperatureC).toBe(35.8)
  })

  test('"NA" and "Not reported" become missing values, not zeros', () => {
    const csv = 'Subject,Date,Test_Phase,BR_Day,Pulse,SysBP,DiaBP,Weight,Body Temp\n1,1/1/2008,PRE_TEST,3,NA,Not reported,80,NA,36.5\n'
    const d = parseVitals(csv)[0]
    expect(d.heartRate).toBeUndefined()
    expect(d.systolic).toBeUndefined()
    expect(d.diastolic).toBe(80)
    expect(d.bodyMassKg).toBeUndefined()
  })

  test('obvious data-entry errors are dropped by sanity guards (not clinical thresholds)', () => {
    const csv = 'Subject,Date,Test_Phase,BR_Day,Pulse,SysBP,DiaBP,Weight,Body Temp\n1,1/1/2008,PRE_TEST,3,999,10,80,7,36.5\n'
    const d = parseVitals(csv)[0]
    expect(d.heartRate).toBeUndefined()
    expect(d.systolic).toBeUndefined()
    expect(d.bodyMassKg).toBeUndefined()
    expect(d.diastolic).toBe(80)
  })

  test('a plain "Body Temp" recorded in Fahrenheit is converted, because the value range is unambiguous', () => {
    const csv = 'Subject,Date,Test_Phase,BR_Day,Pulse,SysBP,DiaBP,Weight,Body Temp\n1,1/1/2008,PRE_TEST,3,60,120,80,70,98.6\n'
    expect(parseVitals(csv)[0].temperatureC).toBeCloseTo(37, 1)
  })

  test('a required column that cannot be found is an error naming it, never a silent guess', () => {
    expect(() => parseVitals('Subject,Date,Test_Phase,BR_Day,SysBP,DiaBP,Weight,Body Temp\n1,1/1/2008,PRE_TEST,3,120,80,70,36.5\n')).toThrow(/pulse/i)
  })

  test('rows without a readable date are skipped', () => {
    const csv = 'Subject,Date,Test_Phase,BR_Day,Pulse,SysBP,DiaBP,Weight,Body Temp\n1,NA,PRE_TEST,3,60,120,80,70,36.5\n1,1/2/2008,PRE_TEST,2,61,121,81,70,36.6\n'
    expect(parseVitals(csv)).toHaveLength(1)
  })

  test('comments and identifiers are never part of the output', () => {
    const day = parseVitals(variantA)[0] as Record<string, unknown>
    expect(Object.keys(day).sort()).toEqual(['bodyMassKg', 'brDay', 'date', 'diastolic', 'heartRate', 'phase', 'systolic', 'temperatureC'])
  })
})

describe('parseBowel', () => {
  const csv = 'Record,Subject,Campaign,Date,Test_Phase,BR_Day,Bowel Movement,Quantity,Description\n1,1,C3D,2/20/2008,PRE_TEST,12,Yes,1,NA\n2,1,C3D,2/21/2008,PRE_TEST,11,Yes,2,Dr. Someone said it was normal\n3,1,C3D,2/22/2008,PRE_TEST,10,No,0,NA\n4,1,C3D,2/23/2008,PRE_TEST,9,Yes,NA,NA\n'

  test('counts per day: quantity when given, 1 for an unquantified yes, 0 for no', () => {
    const m = parseBowel(csv)
    expect(m.get('2008-02-20')).toBe(1)
    expect(m.get('2008-02-21')).toBe(2)
    expect(m.get('2008-02-22')).toBe(0)
    expect(m.get('2008-02-23')).toBe(1)
  })

  test('several rows on the same day add up', () => {
    const two = csv + '5,1,C3D,2/20/2008,PRE_TEST,12,Yes,1,NA\n'
    expect(parseBowel(two).get('2008-02-20')).toBe(2)
  })

  test('a missing column is an error, not a guess', () => {
    expect(() => parseBowel('Subject,Date,Quantity\n1,2/20/2008,1\n')).toThrow(/bowel/i)
  })
})

describe('parseSymptoms (labels only, never comments)', () => {
  const csv = 'ID,Record,Campaign,Subject,Date,Time,Test_Phase,BR_Day,Symptom,Pain_Score,Comments,Action\n1,1,C3D,1,3/10/2008,10:15,IN_TEST,8,Headache,4,"Told Dr. Meck about it",none\n2,2,C3D,1,3/10/2008,12:00,IN_TEST,8,Headache,3,x,y\n3,3,C3D,1,3/11/2008,15:42,IN_TEST,9,Other,0,Nurse Jane gave cream,y\n'

  test('unique lowercase symptom labels per day', () => {
    const m = parseSymptoms(csv)
    expect(m.get('2008-03-10')).toEqual(['headache'])
    expect(m.get('2008-03-11')).toEqual(['other'])
  })

  test('no free text from comments or actions can appear in the output', () => {
    const all = JSON.stringify([...parseSymptoms(csv).entries()])
    expect(all).not.toMatch(/Meck|Jane|cream|Told/)
  })

  test('the older header family (Symptom/Complaint) is understood too', () => {
    const old = 'ID,Subject,Campaign,Date,Time,Symptom/Complaint,Action_Taken,BR_Day\n1,1,C3A,2/25/2005,17:10,HA (headache),took medicine,10\n'
    expect(parseSymptoms(old).get('2005-02-25')).toEqual(['ha (headache)'])
  })
})

describe('parseStretchMinutes', () => {
  const csv = 'Record,Subject,Campaign,Date,Test_Phase,BR_Day,Start_Time,Finish_Time,Duration,Stretching_Completed?,Comments\n1,1,C3D,3/4/2008,IN_TEST,2,9:24,9:43,19 minutes,Yes,NA\n2,1,C3D,3/4/2008,IN_TEST,2,15:56,16:11,15 minutes,Yes,NA\n3,1,C3D,3/5/2008,IN_TEST,3,9:29,9:43,14 minutes,No,Skipped\n'

  test('sums completed sessions per day and ignores sessions that were not completed', () => {
    const m = parseStretchMinutes(csv)
    expect(m.get('2008-03-04')).toBe(34)
    expect(m.has('2008-03-05')).toBe(false)
  })

  test('falls back to start and finish times when there is no duration column', () => {
    const noDuration = 'Subject,Date,Start_Time,Finish_Time,Stretching_Completed\n1,3/4/2008,9:24,9:43,Yes\n'
    expect(parseStretchMinutes(noDuration).get('2008-03-04')).toBe(19)
  })
})
