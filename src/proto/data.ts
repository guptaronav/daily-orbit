// @ts-nocheck
/*
 * The overhaul prototype's data module (data.js), ported so its screens run unchanged.
 *
 * Presentation helpers (STATUS, ICONS, chart geometry, sparklines, SHOP, SLOTS, level, NAV...)
 * are the prototype's own, verbatim. Everything that touches DATA is rewired:
 *
 *  - Readings come from the real measurements in IndexedDB, and their status, baseline and
 *    z-score come from the app's own readIndicator, so a ported screen can never disagree with
 *    the rest of the app about whether something is outside baseline.
 *  - Coins are the real credited points from scoring.ts. The prototype's free-standing earn()
 *    is routed to real events (supply drop, streak milestone), so the anti-farming cap applies
 *    and nothing ever pays for a health value.
 *  - Spending coins on gear is cosmetic and kept in localStorage; it never touches a reading.
 *  - App state (crew, environment, delay) is the real AppContext, through the store's bridge.
 */
import { INDICATORS } from '../contract/types'
import { addEvent, addMeasurement } from '../db/repo'
import { getThreshold } from '../config/thresholds'
import { getContent } from '../lib/content'
import { REGIONS as APP_REGIONS } from '../lib/regions'
import { readAll as appReadAll, readIndicator } from '../lib/bodyStatus'
import { patternFlags, RUNG_NAME } from '../lib/patterns'
import { HAZARD_IDS, hazardIndicators, hazardStatus } from '../lib/hazards'
import { cabinSeries, CABIN } from '../lib/sim/cabin'
import HAZARDS_RAW from '../content/hazards.json'
import ENV_RAW from '../content/environments.json'
import REGION_RAW from '../content/regions.json'
import { formatDelay as appFormatDelay } from '../lib/environments'
import { ENTRY_FORMS as APP_FORMS, validateEntry as appValidate } from '../lib/manualEntry'
import { buildPacket as appBuildPacket } from '../lib/packet'
import { POINTS as APP_POINTS, SYSTEMS as APP_SYSTEMS, WEEKLY_GOAL_PER_CREW as APP_GOAL, creditableKinds, creditedEvents, pointsFor, pointsInWindow } from '../lib/scoring'
import {
  REPORTING_DEFAULTS as APP_REPORTING,
  TIME_DEFAULTS as APP_TIME,
  crewMinutesPerDay as appMinutes,
  reportingCompleteness as appReporting,
} from '../lib/sim/metrics'
import { checkInDays, currentStreak } from '../lib/streak'
import { bridge, getSnapshot, notify, onChange } from './store'

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const APP_NAME = 'Daily Orbit'
export const DISCLAIMER = 'Prototype. Not a medical device.'

const traits = (id) => {
  const r = mulberry32(hash(id))
  return { visor: Math.floor(r() * 3), stripes: 1 + Math.floor(r() * 3), antenna: r() > 0.45, tilt: -7 + r() * 14 }
}
const codeFor = (c) => {
  const d = c.name.match(/\d+/)
  return d ? `C${d[0]}` : c.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
}

/** The real crew, decorated the way the prototype expects. */
export const crewList = () => getSnapshot().crew.map((c) => ({ ...c, code: codeFor(c), traits: traits(c.id) }))
// Live view of the crew list for code that iterates CREW directly.
export const CREW = new Proxy([], {
  get(_t, prop) {
    const list = crewList()
    const v = list[prop]
    return typeof v === 'function' ? v.bind(list) : v
  },
})

export const ENVS = [
  { id: 'iss', label: 'ISS (low Earth orbit)', short: 'ISS', delay: 1 },
  { id: 'lunar', label: 'Lunar surface', short: 'Lunar', delay: 1.3 },
  { id: 'mars', label: 'Mars transit', short: 'Mars', delay: 1200, min: 180, max: 1320 },
  { id: 'marsSurface', label: 'Mars surface base', short: 'Mars base', delay: 1200, min: 180, max: 1320 },
]
export const formatDelay = (sec) => appFormatDelay(sec)

export const STATUS = {
  green: { swatch: 'var(--ok)', ink: 'var(--ok-ink)', label: 'Within baseline', short: 'nominal', sev: 1 },
  yellow: { swatch: 'var(--watch)', ink: 'var(--watch-ink)', label: 'Watch', short: 'watch', sev: 2 },
  red: { swatch: 'var(--act)', ink: 'var(--act-ink)', label: 'Act', short: 'act', sev: 3 },
  gray: { swatch: 'var(--nodata)', ink: 'var(--nodata-ink)', label: 'Not enough good data', short: 'no data', sev: 0 },
}
export const worst = (list) => list.reduce((w, s) => (STATUS[s].sev > STATUS[w].sev ? s : w), 'gray')

export const ICONS = {
  head: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  eye: 'M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  bone: 'M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z',
  body: 'M13 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0 M9 20l3-6 3 6 M6 8l6 2 6-2 M12 10v4',
  gut: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  send: 'M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.02.94l7.93 3.18a2 2 0 0 1 1.11 1.11z M21.85 2.15l-10.94 10.94',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  check: 'M20 6 9 17l-5-5',
  alert: 'M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3 M12 9v4 M12 17h.01',
  clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  spark: 'M18 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M15.48 12.89 17 22l-5-3-5 3 1.52-9.11',
  award: 'M18 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M15.48 12.89 17 22l-5-3-5 3 1.52-9.11',
  shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  target: 'M3 3v16a2 2 0 0 0 2 2h16 M18 17V9 M13 17V5 M8 17v-3',
  chart: 'M3 3v16a2 2 0 0 0 2 2h16 M18 17V9 M13 17V5 M8 17v-3',
  plus: 'M5 12h14 M12 5v14',
  chevron: 'M6 9l6 6 6-6',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  scan: 'M3 7V5a2 2 0 0 1 2-2h2 M17 3h2a2 2 0 0 1 2 2v2 M21 17v2a2 2 0 0 1-2 2h-2 M7 21H5a2 2 0 0 1-2-2v-2 M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  book: 'M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  pen: 'M12 20h9 M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z',
  activity: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2',
  minimize: 'M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7',
  maximize: 'M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7',
  x: 'M18 6 6 18 M6 6l12 12',
}

const PROTO_IND = {
  reactionTime: ['Reaction time', 'ms', 0],
  sleepHours: ['Sleep hours', 'h', 1], sleepQuality: ['Sleep quality', '0-10', 1], mood: ['Mood', '0-10', 1], stress: ['Stress', '0-10', 1],
  blinkRate: ['Blink rate', 'blinks/min', 2], eyelidClosure: ['Eyelid closure', '%', 2], amslerDistortion: ['Amsler grid distortion', '', 0],
  nearAcuity: ['Near acuity', 'logMAR', 2], heartRate: ['Heart rate', 'bpm', 0], bloodPressureSys: ['Blood pressure (systolic)', 'mmHg', 0],
  bloodPressureDia: ['Blood pressure (diastolic)', 'mmHg', 0], exerciseMinutes: ['Exercise minutes', 'min', 0], radiationDose: ['Radiation dose', 'mSv', 1],
  temperature: ['Temperature', '°C', 1], symptomReport: ['Symptom report', '', 0], digestiveComfort: ['Digestive comfort', '0-10', 1],
  appetite: ['Appetite', '0-10', 1], bodyMass: ['Body mass', 'kg', 1], bloodSugar: ['Blood sugar', 'mg/dL', 0],
}
/**
 * Every indicator the app has, so a new one (like bowelMovements) can never silently drop out of
 * a region. The prototype's wording and decimals are kept where it had them.
 */
const IND = Object.fromEntries(
  INDICATORS.map((i) => [i, PROTO_IND[i] ?? [getContent(i).label, getThreshold(i).unit, 1]]),
)
export const indicatorLabel = (i) => IND[i][0]
const SLEEP = 'Risk of Inadequate Sleep and Irregular Schedules', CV = 'Risk of Cardiovascular Adaptations', BEH = 'Risk of Behavioral Changes and Psychiatric Disorders', SANS = 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)', FOOD = 'Risk of Inadequate Food and Nutrition'
export const META = {
  heartRate: ['sensorimotor', CV], bloodPressureSys: ['sensorimotor', CV], bloodPressureDia: ['sensorimotor', CV], blinkRate: ['none', SLEEP], eyelidClosure: ['none', SLEEP],
  sleepHours: ['sleep', SLEEP], sleepQuality: ['sleep', SLEEP], mood: ['sleep', BEH], stress: ['none', BEH], amslerDistortion: ['none', SANS], nearAcuity: ['none', SANS],
  exerciseMinutes: ['activityLight', 'Risk of Spaceflight-Induced Bone Changes; Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness'],
  temperature: ['none', '[CONTENT TODO]'], radiationDose: ['none', 'Risk of Radiation-Induced Cancers'], symptomReport: ['none', '[CONTENT TODO]'],
  bloodSugar: ['biosample', FOOD], digestiveComfort: ['none', 'Risk of Host-Microorganism Interactions'], appetite: ['none', FOOD], bodyMass: ['none', FOOD],
}
for (const i of INDICATORS) if (META[i] && META[i][1] === '[CONTENT TODO]' && getContent(i).hrpRisk !== '[CONTENT TODO]') META[i] = [META[i][0], getContent(i).hrpRisk]
for (const i of INDICATORS) if (!META[i]) META[i] = [getContent(i).standardMeasure, getContent(i).hrpRisk]
export const QUESTIONS = ['Can it be measured in space?', 'Why check it?', 'How do spaceflight hazards affect it?', 'When does it need crew or flight-surgeon attention?', 'What prevents a critical condition?']

/** The answers to QUESTIONS for one indicator, from the app's content file (the prototype left them blank). */
export function faqAnswers(ind) {
  const c = getContent(ind)
  return [c.canMeasureInSpace, c.whyCheck, c.hazardEffect, c.whenToEscalate, c.prevention].map((a) =>
    !a || a === '[CONTENT TODO]' ? 'This answer has not been written yet.' : a,
  )
}

const REGION_ICON = { head: 'moon', eyes: 'eye', heart: 'heart', skeleton: 'bone', body: 'body', gut: 'gut' }
/** The app's regions and indicator lists, with the prototype's icons. */
export const REGIONS = APP_REGIONS.map((r) => ({ id: r.id, label: r.label, icon: REGION_ICON[r.id] ?? 'body', indicators: [...r.indicators] }))

const DAY = 86400000

/** A categorical reading (Amsler, symptoms) as one number, so it can sit in the same rows. */
const numeric = (m) => {
  if (typeof m.value === 'number') return m.value
  const v = m.value || {}
  if (Array.isArray(v.symptoms)) return v.symptoms.length
  if (typeof v.distortedCells === 'number') return v.distortedCells
  if (typeof v.distortion === 'boolean') return v.distortion ? 1 : 0
  return 0
}

/** One indicator, read from the real measurements and judged by the app's own readIndicator. */
function read(crewId, ind) {
  const [label, unit, dp] = IND[ind]
  const all = getSnapshot().measurements[crewId] ?? []
  const app = readIndicator(ind, all)
  const history = app.history.map((m) => ({ t: Date.parse(m.timestamp), v: Math.round(numeric(m) * 100) / 100, passed: m.quality.passed, source: m.source }))
  const passed = history.filter((h) => h.passed)
  const failed = history.length - passed.length
  if (!app.latest) return { id: ind, label, unit, dp, status: 'gray', latest: null, baseline: null, history, failed, z: null }
  const latest = passed[passed.length - 1]
  const baseline = app.baseline ? { mean: app.baseline.mean, sd: app.baseline.sd, n: app.baseline.n } : null
  const z = baseline && typeof app.latest.value === 'number' ? (app.latest.value - baseline.mean) / baseline.sd : null
  const reference = app.reference ? { mean: app.reference.mean, sd: app.reference.sd, n: app.reference.n } : null
  return { id: ind, label, unit, dp, status: app.status, latest, baseline, history, failed, z, source: app.latest.source, reference, drift: app.drift ?? null, basis: app.basis ?? 'recent' }
}

// Trend chart geometry: baseline band (±1 SD), ±2 SD dotted, gaps where quality failed, straight segments only.
export function chart(r, W = 640, H = 220) {
  const L = 44, R = 10, T = 12, B = 26
  const pts = r.history
  const vals = pts.filter((p) => p.passed).map((p) => p.v)
  if (vals.length < 2) return null
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (r.baseline) { lo = Math.min(lo, r.baseline.mean - 2.3 * r.baseline.sd); hi = Math.max(hi, r.baseline.mean + 2.3 * r.baseline.sd) }
  const span = hi - lo || 1
  const x = (i) => L + (i / Math.max(1, pts.length - 1)) * (W - L - R)
  const y = (v) => T + (1 - (v - lo) / span) * (H - T - B)
  let d = '', pen = false
  pts.forEach((p, i) => { if (!p.passed) { pen = false; return } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)} `; pen = true })
  const last = pts.length - 1 - [...pts].reverse().findIndex((p) => p.passed)
  const ticks = [0, 0.5, 1].map((f) => { const v = lo + f * span; return { y: y(v).toFixed(1), top: (y(v) / H) * 100 + '%', label: v.toFixed(r.dp > 1 ? 2 : r.dp === 0 && span > 10 ? 0 : 1) } })
  const day = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const xt = [0, pts.length - 1].map((i) => ({ x: x(i).toFixed(1), label: day(pts[i].t) }))
  const b = r.baseline
  const points = pts.map((p, i) => ({ i, x: x(i), y: p.passed ? y(p.v) : null, v: p.passed ? p.v : null, day: day(p.t) }))
  return {
    W, H, d, L, R, T, B, ticks, xt, points,
    lastX: x(last).toFixed(1), lastY: y(pts[last].v).toFixed(1),
    band: b ? { y: y(b.mean + b.sd).toFixed(1), h: (y(b.mean - b.sd) - y(b.mean + b.sd)).toFixed(1), mean: y(b.mean).toFixed(1), up2: y(b.mean + 2 * b.sd).toFixed(1), dn2: y(b.mean - 2 * b.sd).toFixed(1) } : null,
    gaps: pts.filter((p) => !p.passed).length,
  }
}

export const fmt = (r) => (r.latest ? r.latest.v.toFixed(r.dp) : '—')
export const fmtUnit = (r) => (r.unit === '0-10' ? '/ 10' : r.unit)
export const sigma = (z) => (z === null ? 'no baseline' : `${z > 0 ? '+' : ''}${z.toFixed(1)}σ`)

export function crewData(crewId) {
  const readings = {}
  for (const k of Object.keys(IND)) readings[k] = read(crewId, k)
  const regions = {}
  for (const g of REGIONS) {
    const rs = g.indicators.map((i) => readings[i])
    const withData = rs.filter((r) => r.latest)
    const driver = [...withData].sort((a, b) => STATUS[b.status].sev - STATUS[a.status].sev)[0] || null
    regions[g.id] = { ...g, status: worst(rs.map((r) => r.status)), driver, withData: withData.length, readings: rs }
  }
  const statuses = Object.fromEntries(REGIONS.map((g) => [g.id, regions[g.id].status]))
  const all = REGIONS.flatMap((g) => g.indicators)
  const flagged = REGIONS.filter((g) => ['yellow', 'red'].includes(statuses[g.id])).sort((a, b) => STATUS[statuses[b.id]].sev - STATUS[statuses[a.id]].sev)
  return { readings, regions, statuses, flagged, worst: worst(Object.values(statuses)), withData: all.filter((i) => readings[i].latest).length, total: all.length }
}

export function spark(r, n = 14) {
  return r ? r.history.filter((h) => h.passed).map((h) => h.v).slice(-n) : []
}
export function sparkPath(vals, w, h, pad = 3) {
  if (vals.length < 2) return { d: '', x: 0, y: 0 }
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1
  const pts = vals.map((v, i) => [pad + (i / (vals.length - 1)) * (w - pad * 2), h - pad - ((v - lo) / span) * (h - pad * 2)])
  return { d: 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L'), x: pts.at(-1)[0], y: pts.at(-1)[1] }
}

/** The real ground packet from lib/packet, in the shape the prototype renders. */
export function buildPacket(crewId) {
  const p = appBuildPacket({ crewId, measurements: getSnapshot().measurements[crewId] ?? [], now: new Date() })
  return { changed: p.changed.map((c) => ({ ...c, quality: c.quality.score })), json: p.json, bytes: p.bytes }
}

const FORM_ICON = { bloodPressure: 'heart', temperature: 'body', bloodSugar: 'gut', bodyMass: 'gut', sleepHours: 'head', exerciseMinutes: 'bone' }
const FORM_REGION = { bloodPressure: 'Heart', temperature: 'Whole body', bloodSugar: 'Gut and nutrition', bodyMass: 'Gut and nutrition', sleepHours: 'Head', exerciseMinutes: 'Skeleton' }
const WITH_SLIDER = new Set(['temperature', 'sleepHours', 'exerciseMinutes'])
/** The real entry forms and their typo guards, in the prototype's shape. */
export const ENTRY_FORMS = APP_FORMS.map((f) => ({
  kind: f.kind, title: f.title, icon: FORM_ICON[f.kind], region: FORM_REGION[f.kind], hint: f.hint,
  fields: f.fields.map((x) => ({ name: x.name, label: x.label, unit: x.unit, min: x.min, max: x.max, step: x.step, slider: WITH_SLIDER.has(x.name), indicator: x.indicator })),
}))
export function validateEntry(kind, raw) {
  const r = appValidate(kind, raw)
  if (!r.ok) return r
  const form = APP_FORMS.find((f) => f.kind === kind)
  return { ok: true, values: r.values.map((v, i) => ({ label: form.fields[i].label, value: v.value, unit: v.unit, indicator: v.indicator })) }
}
export const POINTS_EXERCISE = APP_POINTS.exerciseComplete

export const TIME_DEFAULTS = APP_TIME
export const REPORTING_DEFAULTS = APP_REPORTING
export function crewMinutesPerDay(a) {
  const r = appMinutes(a)
  return { mirror: r.mirrorMinPerCrewDay, manual: r.manualMinPerCrewDay, saved: r.savedMinPerCrewDay, hours: r.savedHoursPerMission }
}
export function reportingCompleteness(a) {
  const r = appReporting(a)
  const pct = (f) => Math.round(f * 1000) / 10
  return { effort: pct(r.effort), value: pct(r.value), hidden: r.hiddenBadDays, opportunities: r.opportunities }
}

// ---- Cross-page state, bridged to the real AppContext -------------------------------------------
const THEME_KEY = 'chm-theme-v2'
export function getState() {
  const crew = crewList()
  const env = ENVS.find((e) => e.id === bridge.envId) || ENVS[2]
  let theme = 'paper'
  try { theme = localStorage.getItem(THEME_KEY) || 'paper' } catch {}
  return {
    crewId: bridge.crewId,
    envId: env.id,
    delay: env.min === undefined ? env.delay : bridge.delaySec,
    theme,
    crew: crew.find((c) => c.id === bridge.crewId) || crew[0] || { id: bridge.crewId, name: '', code: '', role: '', dataLabel: '', traits: traits(bridge.crewId) },
    env,
  }
}
export function setState(patch) {
  if (patch.crewId) bridge.setCrewId(patch.crewId)
  if (patch.envId) bridge.setEnvironmentId(patch.envId)
  if (patch.delay !== undefined) bridge.setDelaySec(Number(patch.delay))
  if (patch.theme) { try { localStorage.setItem(THEME_KEY, patch.theme) } catch {} applyTheme(patch.theme) }
  notify()
}
export const onState = (cb) => onChange(cb)

/** The prototype's own dark palette for its theme switch. Paper is the stylesheet default. */
const DECK = { ink: '#ecebe6', 'ink-soft': '#c9c6bd', paper: '#0f1012', 'paper-deep': '#08090a', panel: '#17191c', 'panel-2': '#1e2024', rule: '#2b2e33', 'rule-strong': '#4a4e55', muted: '#a29f97', accent: '#9cbcff', 'accent-wash': '#1c2230', ok: '#4cc38a', 'ok-ink': '#6fdba5', watch: '#e9b043', 'watch-ink': '#f4c96b', act: '#f0645a', 'act-ink': '#ff8a80', nodata: '#6b6e75', 'nodata-ink': '#a3a6ad', 'on-accent': '#0f1012' }
const PAPER = { ink: '#14181f', 'ink-soft': '#2b323d', paper: '#f3f1ea', 'paper-deep': '#e8e4d8', panel: '#fbfaf6', 'panel-2': '#f6f4ec', rule: '#d9d4c4', 'rule-strong': '#a49c88', muted: '#5b6270', accent: '#0b3d91', 'accent-wash': '#e4e9f3', ok: '#2f7d4f', 'ok-ink': '#1b5b33', watch: '#b7791f', 'watch-ink': '#7a4f00', act: '#b3261e', 'act-ink': '#8c1d18', nodata: '#8a8f98', 'nodata-ink': '#5b6270', 'on-accent': '#ffffff' }
/** As in the prototype: theme tokens are written onto every page root, which carries them inline. */
export function applyTheme(theme) {
  const t = theme === 'paper' ? PAPER : DECK
  document.querySelectorAll('[data-chm-root]').forEach((el) => { for (const k in t) el.style.setProperty('--' + k, t[k]) })
  document.body.style.background = t.paper
}

export const NAV = [
  { group: 'Crew', items: [
    { label: 'Body map', icon: 'body', href: 'Body%20Map.dc.html', desc: 'Every indicator against this person’s own baseline' },
    { label: 'Mirror check', icon: 'scan', href: 'Mirror.dc.html', desc: 'Thirty seconds of camera, then four questions' },
    { label: 'Crew progress', icon: 'award', href: 'Rewards.dc.html', desc: 'Points for effort, never for values' },
    { label: 'Manual entry', icon: 'pen', href: 'Manual%20Entry.dc.html', desc: 'Readings the camera cannot take' },
  ] },
  { group: 'Mission', items: [
    { label: 'Escalation', icon: 'send', href: 'Escalation.dc.html', desc: 'Who to tell, and when' },
    { label: 'Radiation', icon: 'shield', href: 'Radiation.dc.html', desc: 'Replay a historical solar particle event' },
    { label: 'Medical view', icon: 'users', href: 'Medical%20View.dc.html', desc: 'Every crew member at once' },
  ] },
  { group: 'Evidence', items: [
    { label: 'Metrics', icon: 'chart', href: 'Metrics.dc.html', desc: 'Two simulated numbers, assumptions open' },
    { label: 'Sources', icon: 'book', href: 'Sources.dc.html', desc: 'Every NASA dataset and page used' },
  ] },
]

// ---- Gamification: the real scoring, in the prototype's shape -----------------------------------
export const POINTS = APP_POINTS
export const WEEKLY_GOAL_PER_CREW = APP_GOAL
export const SYSTEMS = APP_SYSTEMS

const dayKey = (t) => new Date(t).toISOString().slice(0, 10)
export const todayKey = () => new Date().toISOString().slice(0, 10)

/** Effort history for one crew member, from their real credited events. */
export function game(crewId) {
  const events = getSnapshot().events[crewId] ?? []
  const credited = creditedEvents(events)
  const now = new Date()
  const byDay = new Map()
  for (const e of credited) {
    const k = dayKey(e.timestamp)
    const d = byDay.get(k) ?? { checkIn: false, exercise: false, symptom: false }
    if (e.kind === 'checkInComplete') d.checkIn = true
    if (e.kind === 'exerciseComplete') d.exercise = true
    if (e.kind === 'symptomReported') d.symptom = true
    byDay.set(k, d)
  }
  const days = Array.from({ length: 30 }, (_, i) => byDay.get(dayKey(now.getTime() - (29 - i) * DAY)) ?? { checkIn: false, exercise: false, symptom: false })
  let best = 0, run = 0
  for (const d of days) { run = d.checkIn ? run + 1 : 0; best = Math.max(best, run) }
  return {
    streak: currentStreak(checkInDays(events, crewId), todayKey()),
    week: pointsInWindow(events, now, 7),
    total: pointsFor(credited),
    month: days.map((d) => (d.checkIn ? (d.exercise ? 2 : 1) : 0)),
    best,
    days: days.slice(-14).map((d) => d.checkIn),
    today: days[29],
    symptoms: credited.filter((e) => e.kind === 'symptomReported').length,
    retakes: credited.filter((e) => e.kind === 'retakeAfterQualityFail').length,
  }
}
export function crewGoal() {
  const crew = crewList()
  const week = crew.reduce((a, c) => a + game(c.id).week, 0)
  const total = crew.reduce((a, c) => a + game(c.id).total, 0)
  const goal = WEEKLY_GOAL_PER_CREW * Math.max(1, crew.length)
  return { week, goal, frac: Math.min(1, week / goal), total, systems: SYSTEMS.map((s) => ({ ...s, online: total >= s.threshold })) }
}
export function todayTasks(crewId) {
  const t = game(crewId).today
  return [
    { id: 'checkIn', label: 'Mirror check', sub: 'Thirty seconds of camera, then four questions', points: POINTS.checkInComplete, done: t.checkIn, icon: 'scan', href: 'Mirror.dc.html' },
    { id: 'exercise', label: 'Log exercise', sub: 'Any session counts, whatever the minutes', points: POINTS.exerciseComplete, done: t.exercise, icon: 'activity', href: 'Manual%20Entry.dc.html' },
    { id: 'symptom', label: 'Report anything that feels off', sub: 'Reporting early earns the most', points: POINTS.symptomReported, done: t.symptom, icon: 'alert', href: 'Mirror.dc.html', optional: true },
  ]
}

// ---- Coins, levels, locker ----------------------------------------------------------------------
export const SHOP = [
  { id: 'frame-none', slot: 'frame', name: 'Standard ring', price: 0 },
  { id: 'frame-brass', slot: 'frame', name: 'Brass ring', price: 120, bg: 'linear-gradient(135deg, #8a5527, #e7b07a 45%, #b8763a 70%, #6e4220)' },
  { id: 'frame-double', slot: 'frame', name: 'Mission double ring', price: 220, bg: 'repeating-radial-gradient(circle, #0b3d91 0 2px, #fbfaf6 2px 4px)' },
  { id: 'frame-silver', slot: 'frame', name: 'Silver ring', price: 300, bg: 'linear-gradient(135deg, #6d7782, #eef1f4 40%, #9aa3ad 65%, #59626d)' },
  { id: 'frame-gold', slot: 'frame', name: 'Gold ring', price: 420, bg: 'linear-gradient(135deg, #8a6100, #f6d77a 40%, #c9962b 65%, #7a5400)' },
  { id: 'frame-holo', slot: 'frame', name: 'Holo ring', price: 700, holo: true },
  { id: 'visor-std', slot: 'visor', name: 'Standard visor', price: 0, c1: '#4cc9f0', c2: '#0b3d91' },
  { id: 'visor-silver', slot: 'visor', name: 'Mirror visor', price: 90, c1: '#eef1f4', c2: '#6d7782' },
  { id: 'visor-night', slot: 'visor', name: 'Night visor', price: 110, c1: '#4a5670', c2: '#11151d' },
  { id: 'visor-rose', slot: 'visor', name: 'Rose visor', price: 140, c1: '#f2b8b0', c2: '#9c4a52' },
  { id: 'visor-gold', slot: 'visor', name: 'EVA gold visor', price: 260, c1: '#f6d77a', c2: '#a8740a' },
  { id: 'suit-white', slot: 'suit', name: 'Station whites', price: 0, fill: '#e9e6dc' },
  { id: 'suit-blue', slot: 'suit', name: 'Flight blues', price: 120, fill: '#3b5c9e' },
  { id: 'suit-black', slot: 'suit', name: 'Night ops', price: 150, fill: '#2a2f38' },
  { id: 'suit-orange', slot: 'suit', name: 'Launch orange', price: 240, fill: '#e8742c' },
  { id: 'patch-none', slot: 'patch', name: 'No patch', price: 0 },
  { id: 'patch-moon', slot: 'patch', name: 'Lunar patch', price: 80, bg: '#14181f', fg: '#f3f1ea', glyph: 'M15 5a7 7 0 1 0 4 12.5A8 8 0 0 1 15 5Z' },
  { id: 'patch-mars', slot: 'patch', name: 'Mars patch', price: 140, bg: '#b3412a', fg: '#f6d0b8', glyph: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z M9 10h.01 M14 14h.01 M14 9h.01' },
  { id: 'patch-iss', slot: 'patch', name: 'Station patch', price: 110, bg: '#0b3d91', fg: '#fbfaf6', glyph: 'M3 12h18 M7 8v8 M17 8v8 M10 10h4v4h-4z' },
  { id: 'patch-comet', slot: 'patch', name: 'Comet patch', price: 200, bg: '#2a2f38', fg: '#f6d77a', glyph: 'M16 8a3 3 0 1 1 0 .01Z M4 20 13.5 10.5 M4 15l7-4 M9 20l4-7' },
  { id: 'top-none', slot: 'top', name: 'No topper', price: 0 },
  { id: 'top-antenna', slot: 'top', name: 'Antenna', price: 60 },
  { id: 'top-star', slot: 'top', name: 'Pole star', price: 160 },
  { id: 'top-halo', slot: 'top', name: 'Orbit halo', price: 320 },
  { id: 'banner-plain', slot: 'banner', name: 'Paper', price: 0, bg: 'var(--panel-2)', ink: 'var(--ink)' },
  { id: 'banner-grid', slot: 'banner', name: 'Flight manual', price: 90, bg: 'linear-gradient(to right, rgba(11,61,145,.12) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(to bottom, rgba(11,61,145,.12) 1px, transparent 1px) 0 0 / 22px 22px, #f6f4ec', ink: 'var(--ink)' },
  { id: 'banner-orbit', slot: 'banner', name: 'Orbits', price: 180, bg: 'repeating-radial-gradient(circle at 85% 120%, transparent 0 26px, rgba(243,241,234,.18) 26px 27px), #0b3d91', ink: '#fbfaf6' },
  { id: 'banner-stars', slot: 'banner', name: 'Deep field', price: 260, bg: 'radial-gradient(1px 1px at 12% 30%, #fff, transparent), radial-gradient(1px 1px at 38% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 66% 22%, #fff, transparent), radial-gradient(1px 1px at 82% 62%, #fff, transparent), radial-gradient(1px 1px at 92% 18%, #fff, transparent), radial-gradient(1px 1px at 24% 88%, #fff, transparent), #0a0e16', ink: '#fbfaf6' },
  { id: 'banner-mars', slot: 'banner', name: 'Red dunes', price: 340, bg: 'repeating-linear-gradient(170deg, rgba(0,0,0,.08) 0 2px, transparent 2px 14px), linear-gradient(180deg, #e9a17a, #b3412a)', ink: '#fffaf3' },
  // Illustrated mission scenes (src/proto/MissionScene.tsx). `bg` is the backdrop the scene draws over.
  { id: 'banner-mission', slot: 'banner', name: 'Current mission', price: 0, scene: 'mission', bg: 'linear-gradient(180deg, #050814, #0b1430)', ink: '#f3f1ea' },
  { id: 'banner-lunar', slot: 'banner', name: 'Earthrise', price: 220, scene: 'lunar', bg: 'linear-gradient(180deg, #000, #0a0d14)', ink: '#f3f1ea' },
  { id: 'banner-iss', slot: 'banner', name: 'Pale blue dot', price: 280, scene: 'iss', bg: 'linear-gradient(180deg, #050814, #0b1430)', ink: '#f3f1ea' },
  { id: 'banner-jezero', slot: 'banner', name: 'Jezero dusk', price: 360, scene: 'mars', bg: 'linear-gradient(180deg, #1b0c17, #b8643a)', ink: '#f3f1ea' },
  { id: 'banner-transit', slot: 'banner', name: 'Deep transit', price: 420, scene: 'transit', bg: 'linear-gradient(180deg, #070612, #1a1033)', ink: '#f3f1ea' },
]
export const SLOTS = [['frame', 'Frames'], ['visor', 'Visors'], ['suit', 'Suits'], ['patch', 'Patches'], ['top', 'Toppers'], ['banner', 'Banners']]
const DEFAULT_GEAR = { frame: 'frame-none', visor: 'visor-std', suit: 'suit-white', patch: 'patch-none', top: 'top-none', banner: 'banner-mission' }
const STARTER = {
  'crew-1': { owned: ['frame-gold', 'visor-gold', 'patch-moon', 'banner-stars', 'top-antenna'], eq: { frame: 'frame-gold', visor: 'visor-gold', patch: 'patch-moon', banner: 'banner-stars', top: 'top-antenna' } },
  'crew-2': { owned: ['frame-brass', 'suit-orange', 'patch-iss', 'banner-grid'], eq: { frame: 'frame-brass', suit: 'suit-orange', patch: 'patch-iss', banner: 'banner-grid' } },
  'crew-3': { owned: ['frame-silver', 'visor-silver', 'patch-mars', 'suit-blue', 'banner-mars', 'top-star'], eq: { frame: 'frame-silver', visor: 'visor-silver', patch: 'patch-mars', suit: 'suit-blue', banner: 'banner-mars', top: 'top-star' } },
}
const FREE = SHOP.filter((x) => x.price === 0).map((x) => x.id)

/** Cosmetic locker state only: what you own, what you wear, what you have spent. */
type Locker = { owned: string[]; equipped: Record<string, string>; spent: number; bonus: number; granted: string[]; pass: number[]; found: string[]; onboarded: boolean; goal: string; log: { n: number; why: string; at: number }[] }
const lockerKey = (id) => 'chm-locker-' + id
function locker(id): Locker {
  const st = STARTER[id] || { owned: [], eq: {} }
  let l: Locker = { owned: [...FREE, ...st.owned], equipped: { ...DEFAULT_GEAR, ...st.eq }, spent: 0, bonus: 0, granted: [], pass: [], found: [], onboarded: id !== 'guest', goal: 'regular', log: [] }
  try { const raw = localStorage.getItem(lockerKey(id)); if (raw) l = { ...l, ...JSON.parse(raw) } } catch {}
  l.owned = Array.from(new Set([...FREE, ...l.owned]))
  l.found = l.found || []
  return l
}
function saveLocker(id, l: Locker) {
  try { localStorage.setItem(lockerKey(id), JSON.stringify(l)) } catch {}
  notify()
}

/**
 * The wallet. Two kinds of coin, deliberately kept apart:
 *  - EARNED coins are real credited points from scoring.ts. They are the only thing that moves XP,
 *    level, the crew goal and ship systems, and they only come from doing something.
 *  - BONUS coins are one-off grants (a mission-pass tier, the setup welcome). They can only be
 *    spent on cosmetic gear, each one can be granted exactly once, and they never touch XP.
 */
export function wallet(id) {
  const events = getSnapshot().events[id] ?? []
  const earned = pointsFor(creditedEvents(events))
  const l = locker(id)
  const chest = events.some((e) => e.kind === 'supplyDrop' && dayKey(e.timestamp) === todayKey())
  const claimed = events.filter((e) => e.kind === 'streakMilestone' && e.detail).map((e) => Number(String(e.detail).replace('streak-', '')))
  return {
    coins: Math.max(0, earned + (l.bonus || 0) - l.spent),
    xp: earned,
    owned: l.owned,
    equipped: l.equipped,
    chestDay: chest ? todayKey() : null,
    claimed,
    pass: l.pass || [],
    onboarded: l.onboarded,
    goal: l.goal,
    log: l.log,
    done: {},
  }
}
/** Only the cosmetic parts of a wallet persist; earned coins are always derived from real events. */
export function saveWallet(id, w) {
  const l = locker(id)
  saveLocker(id, {
    ...l,
    owned: w.owned ?? l.owned,
    equipped: w.equipped ?? l.equipped,
    onboarded: w.onboarded ?? l.onboarded,
    goal: w.goal ?? l.goal,
    pass: Array.from(new Set([...(l.pass || []), ...(w.pass || [])])),
  })
}

/** A one-off spendable grant. Returns 0 if this key was already granted, so nothing can be farmed. */
function grant(id, n, key, why) {
  const l = locker(id)
  if ((l.granted || []).includes(key)) return 0
  saveLocker(id, { ...l, bonus: (l.bonus || 0) + n, granted: [...(l.granted || []), key], log: [{ n, why, at: Date.now() }, ...(l.log || [])].slice(0, 20) })
  window.dispatchEvent(new CustomEvent('chm:coins', { detail: { n, why } }))
  return n
}

async function credit(id, kind, why, detail?) {
  await addEvent({ id: crypto.randomUUID(), crewId: id, timestamp: new Date().toISOString(), kind, ...(detail ? { detail } : {}) })
  const l = locker(id)
  saveLocker(id, { ...l, log: [{ n: POINTS[kind], why, at: Date.now() }, ...(l.log || [])].slice(0, 20) })
  bridge.refresh()
  window.dispatchEvent(new CustomEvent('chm:coins', { detail: { n: POINTS[kind], why } }))
}

/**
 * The prototype's earn() minted coins from nothing. Here each kind of earn goes where it belongs:
 * a streak milestone and the daily crate are real credited events (so the cap applies and each
 * milestone is remembered by its own detail), a pass tier and the setup welcome are one-off bonus
 * grants, and anything else earns nothing rather than inventing a number.
 */
export function earn(id, n, why) {
  const lower = String(why).toLowerCase()
  const streak = lower.match(/(\d+)-day streak/)
  if (streak) void credit(id, 'streakMilestone', why, `streak-${streak[1]}`)
  else if (lower.includes('supply drop') || lower.includes('crate')) void credit(id, 'supplyDrop', why)
  else if (lower.startsWith('mission pass tier')) grant(id, n, `tier-${lower.replace(/\D+/g, '')}`, why)
  else if (lower.includes('finished setup')) grant(id, n, 'welcome', why)
  notify()
  return wallet(id)
}

/**
 * Save a manual reading for real: a measurement for every field, plus the effort credit. Returns
 * the coins this log actually earns, worked out synchronously from the same cap the app applies,
 * so the "+N" the screen shows is never a promise the scoring will not keep.
 */
export function logReading(id, kind, values) {
  const timestamp = new Date().toISOString()
  const effort = kind === 'exerciseMinutes' ? { kind: 'exerciseComplete' } : { kind: 'readingLogged', detail: kind }
  const { credited } = creditableKinds(getSnapshot().events[id] ?? [], [effort], id, new Date(timestamp))
  const points = credited.length ? POINTS[effort.kind] : 0
  void (async () => {
    for (const v of values) {
      await addMeasurement({
        id: crypto.randomUUID(),
        crewId: id,
        timestamp,
        indicator: v.indicator,
        value: v.value,
        unit: v.unit,
        // A number a person typed in is taken at face value: there is no signal to score.
        quality: { score: 1, passed: true },
        source: 'manual',
      })
    }
    await addEvent({ id: crypto.randomUUID(), crewId: id, timestamp, kind: effort.kind, ...(effort.detail ? { detail: effort.detail } : {}) })
    bridge.refresh()
  })()
  return points
}

export function buy(id, itemId) {
  const w = wallet(id), it = SHOP.find((x) => x.id === itemId)
  if (!it || w.owned.includes(itemId) || w.coins < it.price) return false
  const l = locker(id)
  saveLocker(id, { ...l, spent: l.spent + it.price, owned: [...l.owned, itemId], equipped: { ...l.equipped, [it.slot]: itemId } })
  return true
}
export function equip(id, itemId) {
  const l = locker(id), it = SHOP.find((x) => x.id === itemId)
  if (!it || !l.owned.includes(itemId)) return
  saveLocker(id, { ...l, equipped: { ...l.equipped, [it.slot]: itemId } })
}
export function gear(idOrWallet) {
  const w = typeof idOrWallet === 'string' ? wallet(idOrWallet) : idOrWallet
  const out = {}
  for (const [slot] of SLOTS) out[slot] = SHOP.find((x) => x.id === (w.equipped[slot] || DEFAULT_GEAR[slot]))
  return out
}
const LV = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000]
const RANK = ['Cadet', 'Cadet', 'Navigator', 'Navigator', 'Pilot', 'Pilot', 'Specialist', 'Specialist', 'Commander', 'Commander', 'Legend']
export function level(xp) {
  let i = 0
  while (i < LV.length - 1 && xp >= LV[i + 1]) i++
  const lo = LV[i], hi = LV[i + 1] ?? LV[i] + 1000
  return { n: i + 1, rank: RANK[i], into: xp - lo, need: hi - lo, frac: Math.min(1, (xp - lo) / (hi - lo)), next: hi }
}
export const MILESTONES = [{ days: 3, coins: POINTS.streakMilestone }, { days: 7, coins: POINTS.streakMilestone }, { days: 14, coins: POINTS.streakMilestone }, { days: 30, coins: POINTS.streakMilestone }]
export function achievements(id) {
  const g = game(id), cd = crewData(id), w = wallet(id)
  const paid = w.owned.filter((x) => !FREE.includes(x)).length
  return [
    { id: 'first', name: 'First light', desc: 'Finish your first check-in', icon: 'scan', got: g.total > 0 },
    { id: 'streak7', name: 'Week strong', desc: 'Check in seven days running', icon: 'flame', got: g.streak >= 7 },
    { id: 'honest', name: 'Honest reporter', desc: 'Report a symptom early', icon: 'alert', got: g.symptoms > 0 },
    { id: 'retake', name: 'Second look', desc: 'Retake a reading the app could not trust', icon: 'clock', got: g.retakes > 0 },
    { id: 'full', name: 'Full picture', desc: 'Good data in all six regions', icon: 'body', got: Object.values(cd.statuses).every((s) => s !== 'gray') },
    { id: 'crew', name: 'Crew player', desc: 'Help the crew hit its weekly goal', icon: 'users', got: crewGoal().frac >= 1 },
    { id: 'collector', name: 'Collector', desc: 'Own five accessories', icon: 'award', got: paid >= 5 },
    { id: 'explorer', name: 'Explorer', desc: `Find all ${DISCOVERY_COUNT} discoveries in the mission banners`, icon: 'spark', got: locker(id).found.length >= DISCOVERY_COUNT },
  ]
}
/** The daily crate always pays the supply-drop rate: one honest number, not a lottery. */
export function chestReward() { return POINTS.supplyDrop }
export const COIN_PATH = 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z M12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z'

/**
 * Tasks are completed by DOING them, not by tapping them: completing one opens the screen where
 * it is done, and its credit arrives from that real flow.
 */
export function completeTask(crewId, taskId) {
  bridge.go(taskId === 'exercise' ? 'manual' : 'mirror')
  return 0
}

// Scroll reveal: elements with data-reveal fade and rise in as they enter the viewport.
export function reveal() {
  if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const els = [...document.querySelectorAll('[data-reveal]:not([data-revealed])')]
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      const el = e.target
      el.style.opacity = '1'; el.style.transform = 'none'
      io.unobserve(el)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
  els.forEach((el) => {
    el.setAttribute('data-revealed', '1')
    const r = el.getBoundingClientRect()
    if (r.top < innerHeight) return
    el.style.opacity = '0'; el.style.transform = 'translateY(28px) scale(.985)'
    el.style.transition = 'opacity 700ms cubic-bezier(.22,1,.36,1), transform 800ms cubic-bezier(.22,1,.36,1)'
    io.observe(el)
  })
}

/** What to do about one indicator: the content file's advice, or the plan's safe fallback until it is written. */
export function recommendedAction(ind) {
  const a = getContent(ind).recommendedAction
  return !a || a === '[CONTENT TODO]' ? 'Tell a crewmate or your crew medical officer, and pick one small change you can make today.' : a
}

/* ---- Mission scenes: what each banner draws, and the discoveries hidden in it ---------------- */

/** Which scene a mission sends you to. Mars is "Mars transit": the crew is still on the way. */
const MISSION_SCENE = { iss: 'iss', lunar: 'lunar', mars: 'transit', marsSurface: 'mars' }
/** The scene a banner draws (null for a plain one). The mission banner follows the chosen mission. */
export function sceneFor(banner) {
  if (!banner || !banner.scene) return null
  return banner.scene === 'mission' ? MISSION_SCENE[getState().envId] || 'iss' : banner.scene
}

/** Every fact here is checked against NASA material; keep them short and true. */
export const DISCOVERIES = {
  mars: [
    { id: 'rover', label: 'Rover', fact: 'Perseverance has been exploring Jezero Crater, an ancient lake bed, since February 2021.' },
    { id: 'devil', label: 'Dust devil', fact: 'Whirlwinds on Mars can tower several kilometres high, and gusts have cleaned dust off rover solar panels.' },
    { id: 'sunset', label: 'Blue sunset', fact: 'Martian sunsets glow blue: fine dust scatters blue light forward, toward whoever is watching.' },
  ],
  iss: [
    { id: 'station', label: 'Space station', fact: 'The ISS circles Earth about every 90 minutes, so its crew sees around 16 sunrises a day.' },
    { id: 'aurora', label: 'Aurora', fact: 'Auroras glow roughly 100 to 300 km up. The ISS flies at about 400 km, so crews look down on them.' },
    { id: 'cargo', label: 'Cargo ship', fact: 'Uncrewed cargo ships bring food, water, spare parts and experiments several times a year.' },
  ],
  lunar: [
    { id: 'earth', label: 'Earth', fact: "From the Moon's near side, Earth stays in almost the same spot in the sky, going through phases." },
    { id: 'flag', label: 'Flag', fact: 'With no air there is nothing to make a flag wave, so Apollo flags hung from a horizontal rod.' },
    { id: 'prints', label: 'Bootprints', fact: 'No wind and no rain: bootprints in lunar dust can last for millions of years.' },
  ],
  transit: [
    { id: 'ship', label: 'Spacecraft', fact: 'A trip to Mars takes roughly six to nine months each way, depending on where the planets are.' },
    { id: 'earth', label: 'Earth', fact: 'At Mars distances a message takes about 3 to 22 minutes each way, so the crew handles emergencies on their own.' },
    { id: 'sun', label: 'Solar storm', fact: "Outside Earth's magnetic field, solar particle events are a major radiation risk. The Radiation page replays a real one." },
  ],
}
export const DISCOVERY_COUNT = Object.values(DISCOVERIES).reduce((a, d) => a + d.length, 0)
export const SCENE_BONUS = 20

export function foundIn(id, scene) {
  const f = locker(id).found
  return (DISCOVERIES[scene] || []).filter((d) => f.includes(`${scene}:${d.id}`)).map((d) => d.id)
}

/**
 * Record a discovery. Finding the last one in a scene pays a one-off bonus (cosmetic coins only,
 * never XP), so tapping the same thing again can never farm anything.
 */
export function discover(id, scene, did) {
  const key = `${scene}:${did}`
  const l = locker(id)
  if (l.found.includes(key)) return { fresh: false, bonus: 0 }
  saveLocker(id, { ...l, found: [...l.found, key] })
  const all = (DISCOVERIES[scene] || []).every((d) => locker(id).found.includes(`${scene}:${d.id}`))
  const bonus = all ? grant(id, SCENE_BONUS, `scene-${scene}`, `Explored every corner of ${SCENE_NAMES[scene]}`) : 0
  return { fresh: true, bonus }
}
export const SCENE_NAMES = { mars: 'Jezero dusk', iss: 'Pale blue dot', lunar: 'Earthrise', transit: 'Deep transit' }

/* ---- Food and water -------------------------------------------------------------------------
 * Today's running totals live in the locker-style local store; a finished day is committed as one
 * waterIntake and one mealsEaten measurement. That way the body map compares whole days with whole
 * days, and a half-finished morning is never colored "low" against your own baseline.
 */
export const MEALS = [
  ['breakfast', 'Breakfast'],
  ['lunch', 'Lunch'],
  ['dinner', 'Dinner'],
  ['snack', 'Snack'],
]
/**
 * Default daily fluid goal, editable per person. NASA's exploration requirement is 32 mL per kg of
 * body mass a day (food and drinks together), at least 2,100 mL for women and 2,500 mL for men.
 * With a body-mass reading we use 32 mL/kg (never below 2.1 L); without one, 2.5 L.
 */
export const WATER_GOAL_SOURCE = 'https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf'
function defaultWaterGoal(id) {
  const mass = (getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'bodyMass' && typeof m.value === 'number').sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  if (!mass) return 2.5
  return Math.max(2.1, Math.round(0.032 * mass.value * 4) / 4)
}
const intakeKey = (id) => 'chm-intake-' + id
const intakeId = (id, ind, day) => `${id}-${ind}-${day}`
type Day = { water: number; meals: string[]; committed?: boolean }
function intakeStore(id): { goal?: number; days: Record<string, Day> } {
  try { return JSON.parse(localStorage.getItem(intakeKey(id)) || '') || { days: {} } } catch { return { days: {} } }
}
function saveIntakeStore(id, s) {
  try { localStorage.setItem(intakeKey(id), JSON.stringify(s)) } catch {}
  notify()
}

/** Commit every finished day that has not been saved as measurements yet. Safe to call often. */
export async function commitIntake(id) {
  const s = intakeStore(id)
  const today = todayKey()
  const due = Object.entries(s.days).filter(([day, d]) => day < today && !d.committed && (d.water > 0 || d.meals.length > 0))
  if (!due.length) return
  for (const [day, d] of due) {
    const timestamp = `${day}T23:59:00.000Z`
    const base = { crewId: id, timestamp, quality: { score: 1, passed: true }, source: 'manual' }
    await addMeasurement({ ...base, id: intakeId(id, 'waterIntake', day), indicator: 'waterIntake', value: Math.round(d.water * 100) / 100, unit: 'L' })
    await addMeasurement({ ...base, id: intakeId(id, 'mealsEaten', day), indicator: 'mealsEaten', value: d.meals.length, unit: 'meals' })
    s.days[day] = { ...d, committed: true }
  }
  saveIntakeStore(id, s)
  bridge.refresh()
}

/** Today's totals, the goal, and the last seven days (finished days come from the database). */
export function intake(id) {
  const s = intakeStore(id)
  const today = todayKey()
  const d = s.days[today] || { water: 0, meals: [] }
  const ms = getSnapshot().measurements[id] ?? []
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = dayKey(Date.now() - (6 - i) * DAY)
    if (day === today) return { day, water: d.water, today: true }
    const m = ms.find((x) => x.id === intakeId(id, 'waterIntake', day))
    return { day, water: m ? m.value : (s.days[day]?.water ?? 0), today: false }
  })
  return { water: d.water, meals: d.meals, goal: s.goal ?? defaultWaterGoal(id), custom: s.goal !== undefined, week }
}

export function setWaterGoal(id, goal) {
  const s = intakeStore(id)
  saveIntakeStore(id, { ...s, goal: Math.min(6, Math.max(0.5, Math.round(goal * 4) / 4)) })
}

/** The effort credit for logging food or water, once a day each, using the app's own cap. */
function intakeCredit(id, ind) {
  const effort = { kind: 'readingLogged', detail: ind }
  const { credited } = creditableKinds(getSnapshot().events[id] ?? [], [effort], id, new Date())
  if (!credited.length) return 0
  void addEvent({ id: crypto.randomUUID(), crewId: id, timestamp: new Date().toISOString(), ...effort }).then(() => bridge.refresh())
  return POINTS.readingLogged
}

/** Add (or with a negative amount, take back) water in litres. Returns coins earned. */
export function addWater(id, litres) {
  const s = intakeStore(id)
  const today = todayKey()
  const d = s.days[today] || { water: 0, meals: [] }
  const water = Math.min(10, Math.max(0, Math.round((d.water + litres) * 100) / 100))
  saveIntakeStore(id, { ...s, days: { ...s.days, [today]: { ...d, water } } })
  return litres > 0 ? intakeCredit(id, 'waterIntake') : 0
}

/** Mark a meal eaten, or un-mark it. Returns coins earned. */
export function toggleMeal(id, meal) {
  const s = intakeStore(id)
  const today = todayKey()
  const d = s.days[today] || { water: 0, meals: [] }
  const had = d.meals.includes(meal)
  const meals = had ? d.meals.filter((m) => m !== meal) : [...d.meals, meal]
  saveIntakeStore(id, { ...s, days: { ...s.days, [today]: { ...d, meals } } })
  return had ? 0 : intakeCredit(id, 'mealsEaten')
}

/* ---- Mission schedule: this person's own blocks and hand ticks (see lib/schedule.ts) -------- */
const scheduleKey = (id) => 'chm-schedule-' + id
export function scheduleStore(id): { custom: any[]; ticks: Record<string, string[]> } {
  try { return { custom: [], ticks: {}, ...JSON.parse(localStorage.getItem(scheduleKey(id)) || '{}') } } catch { return { custom: [], ticks: {} } }
}
function saveSchedule(id, s) {
  try { localStorage.setItem(scheduleKey(id), JSON.stringify(s)) } catch {}
  notify()
}
const localDayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function addBlock(id, b) {
  const s = scheduleStore(id)
  saveSchedule(id, { ...s, custom: [...s.custom, { ...b, id: 'my-' + crypto.randomUUID().slice(0, 8), kind: 'custom', ...(b.repeat === 'once' ? { day: b.day || localDayKey() } : {}) }] })
}
export function removeBlock(id, blockId) {
  const s = scheduleStore(id)
  saveSchedule(id, { ...s, custom: s.custom.filter((b) => b.id !== blockId) })
}
/** Hand ticks are for the person's own tracking only; they never pay coins. */
export function tickBlock(id, blockId) {
  const s = scheduleStore(id)
  const day = localDayKey()
  const t = s.ticks[day] || []
  saveSchedule(id, { ...s, ticks: { [day]: t.includes(blockId) ? t.filter((x) => x !== blockId) : [...t, blockId] } })
}
export const ticksToday = (id) => scheduleStore(id).ticks[localDayKey()] || []

/** Patterns across this person's indicators (lib/patterns.ts), most serious first. */
export function patterns(crewId) {
  const hits = patternFlags(appReadAll(getSnapshot().measurements[crewId] ?? []))
  return hits.map((h) => ({
    id: h.pattern.id, title: h.pattern.title, summary: h.pattern.summary, risk: h.pattern.risk, riskUrl: h.pattern.riskUrl,
    status: h.status, rung: h.rung, rungName: RUNG_NAME[h.rung],
    parts: h.parts.map((x) => ({ id: x.indicator, label: IND[x.indicator][0], status: x.status, direction: x.direction })),
    care: carePlan(h),
  }))
}

/**
 * A care plan for one pattern, assembled only from text that is already sourced: the involved
 * readings' recommended actions and prevention steps, what to re-check, and when to move up the
 * escalation ladder (the rung rule is this app's, see lib/patterns.ts).
 */
function carePlan(h) {
  const ids = Array.from(new Set(h.parts.map((x) => x.indicator)))
  const sourced = (k) => Array.from(new Set(ids.map((i) => getContent(i)[k]).filter((t) => t && t !== '[CONTENT TODO]')))
  const next = Math.min(4, h.rung + 1)
  return {
    now: sourced('recommendedAction'),
    prevent: sourced('prevention'),
    recheck: ids.map((i) => IND[i][0]),
    moveUp: h.rung >= 4
      ? 'You are already at the top rung: keep the flight surgeon updated with each new reading.'
      : `If this is still here after another day, or any reading in it turns red, move up to ${RUNG_NAME[next]}.`,
  }
}

/** Tomorrow's date key in local time, for a one-off block the next day. */
export const tomorrowKey = () => localDayKey(new Date(Date.now() + 86400000))

/* ---- The five hazards, and what they mean on this mission ------------------------------------ */
const okText = (t) => (t && !String(t).includes('[CONTENT TODO]') ? t : '')
/** Which environment field speaks to which hazard. The closed-environment hazard shows the cabin instead. */
const HAZARD_ENV_FIELD = { radiation: 'radiation', isolation: 'isolation', distance: 'distance', gravity: 'gravity' }
export function envGuide(envId) {
  const e = ENV_RAW.find((x) => x.id === envId) || {}
  return { label: e.label, gravity: okText(e.gravity), radiation: okText(e.radiation), distance: okText(e.distance), isolation: okText(e.isolation), dayLength: okText(e.dayLength), equipment: (e.equipment || []).filter(okText) }
}
export function hazards(crewId) {
  const content = INDICATORS.map((i) => ({ id: i, hazardEffect: getContent(i).hazardEffect }))
  const map = hazardIndicators(content)
  const st = hazardStatus(map, appReadAll(getSnapshot().measurements[crewId] ?? []))
  const envId = getState().envId
  const guide = envGuide(envId)
  return HAZARD_IDS.map((h) => {
    const info = HAZARDS_RAW.find((x) => x.id === h) || {}
    return {
      id: h, name: info.name || h, url: info.url, what: okText(info.what), body: okText(info.body), selfCare: okText(info.selfCare),
      status: st[h].status, measured: st[h].measured,
      linked: map[h].map((i) => IND[i][0]), flagged: st[h].flagged.map((i) => IND[i][0]),
      here: h === 'environment' ? '' : guide[HAZARD_ENV_FIELD[h]],
    }
  })
}
/** Simulated cabin air for the current mission (lib/sim/cabin.ts), with today's symptom context. */
export function cabin(crewId) {
  const envId = getState().envId
  const series = cabinSeries(envId, new Date())
  const ms = getSnapshot().measurements[crewId] ?? []
  const today = todayKey()
  const headache = ms.some((m) => m.indicator === 'symptomReport' && dayKey(Date.parse(m.timestamp)) === today && Array.isArray(m.value?.symptoms) && m.value.symptoms.some((x) => /headache/i.test(String(x))))
  return { series, limit: CABIN.limit, unit: CABIN.unit, facts: CABIN.facts, limitText: CABIN.limitText, limitUrl: CABIN.limitUrl, headache }
}

/** What a body region does, and why spaceflight matters for it (src/content/regions.json, sourced). */
export function regionInfo(id) {
  const r = REGION_RAW[id] || {}
  return { function: okText(r.function), spaceflight: okText(r.spaceflight) }
}
