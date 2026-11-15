import type { GameEvent, GameEventKind, Measurement } from '../contract/types'

/*
 * The daily mission schedule. Three layers, merged per crew member:
 *  - the shared crew day (BASE_DAY), modeled on a NASA-described ISS day (sources inline);
 *  - duties for one role only (ROLE_DUTIES), so a commander sees command tasks and nobody else does;
 *  - blocks the astronaut adds themselves (custom), saved for that person only.
 * A block linked to a real action (the mirror check, logging exercise) is done when that action
 * happened today. Other blocks are ticked by hand, which never pays coins: credit only ever comes
 * from doing the linked thing.
 */

export type BlockKind = 'routine' | 'check' | 'exercise' | 'meal' | 'sleep' | 'work' | 'conference' | 'personal' | 'role' | 'custom'

export type Block = {
  id: string
  /** Local time, "HH:MM". */
  start: string
  minutes: number
  title: string
  detail?: string
  kind: BlockKind
  /** Only these roles see it. Missing means everyone. */
  roles?: string[]
  /** The screen that does this block. */
  link?: string
  /** Done when one of these credited events happened today. */
  doneBy?: { kind: GameEventKind; detail?: string }
  /** Done when this meal is logged today (Food and water). */
  meal?: string
  source?: string
}

export type CustomBlock = Block & { repeat: 'daily' | 'once'; day?: string }

const FS = 'https://www.nasa.gov/wp-content/uploads/2015/05/167746main_fs_livingandworkinginspace508c.pdf'
const EXERCISE = 'https://www.nasa.gov/blogs/spacestation/2025/07/16/muscle-and-exercise-studies-to-maintain-crew-health-in-space/'
const MED_OPS = 'https://www.nasa.gov/reference/6-0-medical-operations/'
const FOOD = 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf'

/**
 * The shared crew day, in the order NASA describes an ISS day: wake, breakfast and the schedule,
 * a morning conference with Mission Control, work, lunch and a one-hour break, more work, two
 * hours of exercise, dinner, an evening planning conference, free time, and an 8.5-hour sleep
 * period. The order and the durations come from the sources; the exact clock times are this
 * app's example layout (an assumption, logged in NOTES.md).
 */
export const BASE_DAY: Block[] = [
  { id: 'wake', start: '06:00', minutes: 30, title: 'Wake up, hygiene, check the schedule', kind: 'routine', source: FS },
  { id: 'breakfast', start: '06:30', minutes: 30, title: 'Breakfast', kind: 'meal', meal: 'breakfast', link: 'manual', source: FOOD },
  { id: 'dpc-am', start: '07:00', minutes: 30, title: 'Morning conference with Mission Control', detail: 'Everyone hears the plan for the day.', kind: 'conference', source: FS },
  { id: 'mirror', start: '07:30', minutes: 15, title: 'Mirror check', detail: 'About a minute of camera, two vision checks, how you feel.', kind: 'check', link: 'mirror', doneBy: { kind: 'checkInComplete' } },
  { id: 'work-am', start: '08:00', minutes: 240, title: 'Maintenance, research and experiments', kind: 'work', source: FS },
  { id: 'lunch', start: '12:00', minutes: 30, title: 'Lunch', kind: 'meal', meal: 'lunch', link: 'manual', source: FOOD },
  { id: 'break', start: '12:30', minutes: 60, title: 'Break', kind: 'personal', source: FS },
  { id: 'work-pm', start: '13:30', minutes: 150, title: 'Maintenance, research and experiments', kind: 'work', source: FS },
  { id: 'exercise', start: '16:00', minutes: 120, title: 'Exercise: resistance and aerobic', detail: 'ISS crews exercise about two hours a day against bone and muscle loss.', kind: 'exercise', link: 'manual', doneBy: { kind: 'exerciseComplete' }, source: EXERCISE },
  { id: 'dinner', start: '18:00', minutes: 45, title: 'Dinner, together if you can', kind: 'meal', meal: 'dinner', link: 'manual', source: FOOD },
  { id: 'dpc-pm', start: '18:45', minutes: 30, title: "Evening planning conference for tomorrow", kind: 'conference', source: FS },
  { id: 'free', start: '19:15', minutes: 120, title: 'Free time', kind: 'personal', source: FS },
  { id: 'presleep', start: '21:15', minutes: 30, title: 'Wind down before sleep', kind: 'routine', source: MED_OPS },
  { id: 'sleep', start: '21:45', minutes: 510, title: 'Sleep period (8.5 hours)', kind: 'sleep', source: MED_OPS },
]

/**
 * Duties that only one role carries. These are this app's duties (they point at its screens),
 * not a claim about how NASA assigns work.
 */
export const ROLE_DUTIES: Record<string, Block[]> = {
  Commander: [
    { id: 'cdr-review', start: '08:30', minutes: 15, title: 'Crew status review', detail: 'Open the crew lobby and look at anyone on Watch or Act first.', kind: 'role', link: 'medical' },
    { id: 'cdr-escalate', start: '17:30', minutes: 10, title: 'Decide on ground calls', detail: 'If anyone is on Act, send the ground packet from Escalate.', kind: 'role', link: 'escalation' },
  ],
  'Flight engineer': [
    { id: 'fe-radiation', start: '09:00', minutes: 15, title: 'Radiation and space weather check', detail: 'Review the dose ledger and any solar particle event alerts.', kind: 'role', link: 'radiation' },
  ],
  'Mission specialist': [
    { id: 'ms-vision', start: '10:00', minutes: 10, title: 'Vision self-test', detail: 'Amsler grid and near-vision test, both eyes, as part of the mirror check.', kind: 'role', link: 'mirror' },
    { id: 'ms-mass', start: '07:30', minutes: 5, title: 'Body mass reading', detail: 'Log body mass before breakfast.', kind: 'role', link: 'manual' },
  ],
}

export const ROLES = Object.keys(ROLE_DUTIES)

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
const nowMinutes = (now: Date) => now.getHours() * 60 + now.getMinutes()
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Everything on one person's day: the crew day, their role's duties, and their own blocks. */
export function planFor(role: string, custom: readonly CustomBlock[], now: Date): Block[] {
  const day = localDay(now)
  const mine = custom.filter((b) => b.repeat === 'daily' || b.day === day)
  const duties = (ROLE_DUTIES[role] ?? []).map((b) => ({ ...b, roles: [role] }))
  return [...BASE_DAY.filter((b) => !b.roles || b.roles.includes(role)), ...duties, ...mine].sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || a.title.localeCompare(b.title))
}

/** Which events happened today (local day), as "kind" and "kind:detail" keys. */
export function doneToday(events: readonly GameEvent[], now: Date): Set<string> {
  const day = localDay(now)
  const out = new Set<string>()
  for (const e of events) {
    if (localDay(new Date(e.timestamp)) !== day) continue
    out.add(e.kind)
    if (e.detail) out.add(`${e.kind}:${e.detail}`)
  }
  return out
}

export type BlockState = 'done' | 'now' | 'missed' | 'upcoming'

export function blockState(b: Block, now: Date, isDone: boolean): BlockState {
  if (isDone) return 'done'
  const t = nowMinutes(now)
  const s = toMinutes(b.start)
  if (t < s) return 'upcoming'
  if (t < s + b.minutes) return 'now'
  return 'missed'
}

export function isBlockDone(b: Block, done: Set<string>, meals: readonly string[], ticked: readonly string[]): boolean {
  if (b.doneBy) return done.has(b.doneBy.detail ? `${b.doneBy.kind}:${b.doneBy.detail}` : b.doneBy.kind)
  if (b.meal) return meals.includes(b.meal)
  return ticked.includes(b.id)
}

/* ---- Due items (task A6): what is overdue right now, as a quiet prompt ----------------------- */

export type Due = { id: string; label: string; link: string; assumption?: string }

const DAY_MS = 86_400_000
/** How often each prompt comes round. The microbiome interval is a placeholder, not NASA's. */
export const INTERVALS = { mirror: 1, bodyMass: 7, microbiome: 30 }

/**
 * Overdue prompts: the next mirror check (daily), a body-mass reading (weekly), and a microbiome
 * sample (placeholder interval). Nothing is due for something that has never been done: a prompt
 * follows a routine, it does not start one.
 */
export function dueItems(measurements: readonly Measurement[], events: readonly GameEvent[], now: Date): Due[] {
  const t = now.getTime()
  const last = (times: number[]) => (times.length ? Math.max(...times) : null)
  const due: Due[] = []

  const checkIns = last(events.filter((e) => e.kind === 'checkInComplete').map((e) => Date.parse(e.timestamp)))
  if (checkIns !== null && t - checkIns >= INTERVALS.mirror * DAY_MS) due.push({ id: 'mirror', label: 'Mirror check', link: 'mirror' })

  const mass = last(measurements.filter((m) => m.indicator === 'bodyMass').map((m) => Date.parse(m.timestamp)))
  if (mass !== null && t - mass >= INTERVALS.bodyMass * DAY_MS) due.push({ id: 'bodyMass', label: 'Body mass reading', link: 'manual' })

  const sample = last(events.filter((e) => e.kind === 'readingLogged' && e.detail === 'microbiome').map((e) => Date.parse(e.timestamp)))
  if (sample !== null && t - sample >= INTERVALS.microbiome * DAY_MS) {
    due.push({ id: 'microbiome', label: 'Microbiome sample', link: 'manual', assumption: 'Placeholder interval of 30 days; not a NASA figure.' })
  }
  return due
}
