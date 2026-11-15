import { getThreshold } from '../config/thresholds'
import type { Indicator } from '../contract/types'

export type EntryKind = 'bloodPressure' | 'temperature' | 'bloodSugar' | 'bodyMass' | 'sleepHours' | 'exerciseMinutes' | 'bowelMovements'

export type EntryField = {
  /** Form field name, unique inside its form. */
  name: string
  label: string
  indicator: Indicator
  unit: string
  /**
   * INPUT GUARDS ONLY. These reject impossible typos (9000 mmHg, 400 hours of sleep).
   * They are not clinical thresholds and must never be read as "normal" or "abnormal".
   * Clinical thresholds live in src/config/thresholds.ts and are null until sourced.
   */
  min: number
  max: number
  step: number
  /** A count, so fractions are a typo too. */
  whole?: boolean
}

export type EntryForm = {
  kind: EntryKind
  title: string
  hint: string
  fields: readonly EntryField[]
}

export type EntryValue = { indicator: Indicator; value: number; unit: string }

export type ValidationResult = { ok: true; values: EntryValue[] } | { ok: false; error: string; field: string }

const field = (name: string, label: string, indicator: Indicator, min: number, max: number, step: number, whole = false): EntryField => ({
  name,
  label,
  indicator,
  unit: getThreshold(indicator).unit,
  min,
  max,
  step,
  ...(whole ? { whole } : {}),
})

export const ENTRY_FORMS: readonly EntryForm[] = [
  {
    kind: 'bloodPressure',
    title: 'Blood pressure',
    hint: 'From the cuff. Systolic is the larger number.',
    fields: [
      field('systolic', 'Systolic', 'bloodPressureSys', 40, 300, 1),
      field('diastolic', 'Diastolic', 'bloodPressureDia', 20, 200, 1),
    ],
  },
  {
    kind: 'temperature',
    title: 'Temperature',
    hint: 'Body temperature in degrees Celsius.',
    fields: [field('temperature', 'Temperature', 'temperature', 25, 45, 0.1)],
  },
  {
    kind: 'bloodSugar',
    title: 'Blood sugar',
    hint: 'From a glucose meter, in mg/dL.',
    fields: [field('bloodSugar', 'Blood sugar', 'bloodSugar', 10, 900, 1)],
  },
  {
    kind: 'bodyMass',
    title: 'Body mass',
    hint: 'From the body mass measurement device, in kilograms.',
    fields: [field('bodyMass', 'Body mass', 'bodyMass', 20, 300, 0.1)],
  },
  {
    kind: 'sleepHours',
    title: 'Sleep',
    hint: 'Hours actually asleep in the last sleep period.',
    fields: [field('sleepHours', 'Hours slept', 'sleepHours', 0, 24, 0.25)],
  },
  {
    kind: 'exerciseMinutes',
    title: 'Exercise',
    hint: 'Minutes of exercise today. Logging it earns points for the effort, never for the number.',
    fields: [field('exerciseMinutes', 'Minutes', 'exerciseMinutes', 0, 1440, 1)],
  },
  {
    kind: 'bowelMovements',
    title: 'Bowel movements',
    hint: 'How many today, as a whole number (0 is a real answer). A gut and nutrition signal.',
    fields: [field('bowelMovements', 'Movements today', 'bowelMovements', 0, 20, 1, true)],
  },
]

export function getForm(kind: EntryKind): EntryForm {
  const form = ENTRY_FORMS.find((f) => f.kind === kind)
  if (!form) throw new Error(`No manual-entry form for "${kind}"`)
  return form
}

/** Plain decimal only: no exponents, no thousands separators, no stray characters. */
const NUMERIC = /^-?(\d+(\.\d+)?|\.\d+)$/

const fail = (field: string, error: string): ValidationResult => ({ ok: false, error, field })

/**
 * Validate one form's raw text inputs.
 *
 * Returns the parsed values in field order, or the first error with the field it belongs to so the
 * screen can show it next to that input. Range checks are typo guards (see EntryField.min/max),
 * never a judgement about the person's health.
 */
export function validateEntry(kind: EntryKind, raw: Readonly<Record<string, string | undefined>>): ValidationResult {
  const form = getForm(kind)
  const values: EntryValue[] = []

  for (const f of form.fields) {
    const text = (raw[f.name] ?? '').trim()
    if (text === '') return fail(f.name, `Enter a value for ${f.label.toLowerCase()}.`)
    if (!NUMERIC.test(text)) return fail(f.name, `${f.label} must be a number, for example ${f.min + (f.max - f.min) / 2}.`)

    const value = Number(text)
    if (!Number.isFinite(value)) return fail(f.name, `${f.label} must be a number.`)
    if (f.whole && !Number.isInteger(value)) return fail(f.name, `${f.label} must be a whole number.`)
    if (value < f.min || value > f.max) {
      return fail(f.name, `${f.label} must be between ${f.min} and ${f.max} ${f.unit}. Check for a typo — this is an input guard, not a health limit.`)
    }
    values.push({ indicator: f.indicator, value, unit: f.unit })
  }

  // Cross-field guard: a cuff never reads systolic at or below diastolic, so this is a typo too.
  if (kind === 'bloodPressure') {
    const [sys, dia] = values
    if (sys.value <= dia.value) return fail('diastolic', 'Systolic must be higher than diastolic. Check the two numbers are not swapped.')
  }

  return { ok: true, values }
}
