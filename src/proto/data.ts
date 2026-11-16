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
import { CAREER_LIMIT_MSV, CAREER_LIMIT_SOURCE, DAILY_RATE, PRIOR_MISSIONS_MSV, careerBudget } from '../lib/radiationBudget'
import { selfReportGaps } from '../lib/selfReportGap'
import { marsLink } from '../lib/orbit'
import { alertCandidates, alertState } from '../lib/alerts'
import { buildIndex, redFlag, search } from '../lib/assistant'
import { blockState, doneToday, isBlockDone, planFor, toMinutes } from '../lib/schedule'
import SOURCES_RAW from '../content/sources.json'
import { cabinSeries, CABIN } from '../lib/sim/cabin'
import HAZARDS_RAW from '../content/hazards.json'
import ENV_RAW from '../content/environments.json'
import REGION_RAW from '../content/regions.json'
import { formatDelay as appFormatDelay } from '../lib/environments'
import { ENTRY_FORMS as APP_FORMS, validateEntry as appValidate } from '../lib/manualEntry'
import { buildPacket as appBuildPacket } from '../lib/packet'
import { POINTS as APP_POINTS, SYSTEMS as APP_SYSTEMS, WEEKLY_GOAL_PER_CREW as APP_GOAL, DAILY_COIN_CAP, cappedPoints, creditableKinds, creditedEvents, pointsFor, pointsInWindow } from '../lib/scoring'
import {
  REPORTING_DEFAULTS as APP_REPORTING,
  TIME_DEFAULTS as APP_TIME,
  crewMinutesPerDay as appMinutes,
  reportingCompleteness as appReporting,
} from '../lib/sim/metrics'
import { checkInDays } from '../lib/streak'
import { streakWithShields } from '../lib/shields'
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

/** Today's real one-way light time to Mars, from JPL planet positions (lib/orbit.ts). */
export const MARS_TODAY = Math.round(marsLink(new Date()).delaySec)
export const ENVS = [
  { id: 'iss', label: 'ISS (low Earth orbit)', short: 'ISS', delay: 1 },
  { id: 'lunar', label: 'Lunar surface', short: 'Lunar', delay: 1.3 },
  { id: 'lunarRover', label: 'Lunar pressurized rover', short: 'Rover', delay: 1.3 },
  { id: 'mars', label: 'Mars transit', short: 'Mars', delay: MARS_TODAY, min: 180, max: 1320 },
  { id: 'marsSurface', label: 'Mars surface base', short: 'Mars base', delay: MARS_TODAY, min: 180, max: 1320 },
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
  painReport: ['Pain', '0-10', 0], orthostaticRise: ['Stand-up heart rate rise', 'bpm', 0], workload: ['Workload', '0-100', 0], moodScreen: ['Mood screen', 'score', 0], gripStrength: ['Grip strength', 'kg', 1],
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
  if (typeof v.level === 'number') return v.level
  if (typeof v.phq2 === 'number' && typeof v.gad2 === 'number') return v.phq2 + v.gad2
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
  const shared = sharedIndicators(crewId)
  const p = appBuildPacket({ crewId, measurements: getSnapshot().measurements[crewId] ?? [], now: new Date(), include: (i) => shared.has(i) })
  return { changed: p.changed.map((c) => ({ ...c, quality: c.quality.score })), json: p.json, bytes: p.bytes, withheld: p.withheld }
}

const FORM_ICON = { bloodPressure: 'heart', temperature: 'body', bloodSugar: 'gut', bodyMass: 'gut', bowelMovements: 'gut', sleepHours: 'head', exerciseMinutes: 'bone' }
const FORM_REGION = { bloodPressure: 'Heart', temperature: 'Whole body', bloodSugar: 'Gut and nutrition', bodyMass: 'Gut and nutrition', bowelMovements: 'Gut and nutrition', sleepHours: 'Head', exerciseMinutes: 'Skeleton' }
const WITH_SLIDER = new Set(['temperature', 'sleepHours', 'exerciseMinutes', 'bowelMovements'])
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
    { label: 'Mirror check', icon: 'scan', href: 'Mirror.dc.html', desc: 'About a minute of camera, two vision checks, how you feel' },
    { label: 'Crew progress', icon: 'award', href: 'Rewards.dc.html', desc: 'Points for effort, never for values' },
    { label: 'Manual entry', icon: 'pen', href: 'Manual%20Entry.dc.html', desc: 'Readings the camera cannot take' },
  ] },
  { group: 'Mission', items: [
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
    ...(() => { const sh = streakWithShields(checkInDays(events, crewId), todayKey()); return { streak: sh.streak, shields: sh.shields, saves: sh.saves } })(),
    week: pointsInWindow(events, now, 7),
    total: cappedPoints(credited),
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
/**
 * Today's goals: the one list every screen reads (Today, the dock, the Log page, Rewards). Each goal
 * pays the app's own capped effort credit (lib/scoring.ts), once a day, and is done only when that
 * credit was really recorded today. Required goals make "all done today"; optional ones are bonuses.
 */
export function todayTasks(crewId) {
  const t = game(crewId).today
  const today = todayKey()
  const logged = new Set((getSnapshot().events[crewId] ?? []).filter((e) => e.kind === 'readingLogged' && dayKey(e.timestamp) === today).map((e) => e.detail))
  return [
    { id: 'checkIn', label: 'Mirror check', sub: 'About a minute of camera, two vision checks, how you feel', points: POINTS.checkInComplete, done: t.checkIn, icon: 'scan', href: 'Mirror.dc.html' },
    { id: 'exercise', label: 'Log exercise', sub: 'Any session counts, whatever the minutes', points: POINTS.exerciseComplete, done: t.exercise, icon: 'activity', href: 'Manual%20Entry.dc.html' },
    { id: 'water', label: 'Log water', sub: 'Tap +250 or +500 mL on the Log page', points: POINTS.readingLogged, done: logged.has('waterIntake'), icon: 'gut', href: 'Manual%20Entry.dc.html' },
    { id: 'meals', label: 'Log a meal', sub: 'Mark breakfast, lunch, dinner or a snack', points: POINTS.readingLogged, done: logged.has('mealsEaten'), icon: 'gut', href: 'Manual%20Entry.dc.html' },
    { id: 'alertness', label: 'Alertness check', sub: 'One minute of reaction-time taps', points: POINTS.readingLogged, done: logged.has('reactionTime'), icon: 'clock', href: 'Manual%20Entry.dc.html', optional: true },
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
  { id: 'top-sprout', slot: 'top', name: 'Greenhouse sprout', price: 90 },
  { id: 'top-flag', slot: 'top', name: 'Mission flag', price: 120 },
  { id: 'top-headlamp', slot: 'top', name: 'EVA headlamp', price: 140 },
  { id: 'top-moon', slot: 'top', name: 'Crescent moon', price: 200 },
  { id: 'top-satellite', slot: 'top', name: 'Tiny satellite', price: 260 },
  { id: 'top-rings', slot: 'top', name: 'Saturn rings', price: 380 },
  { id: 'top-comet', slot: 'top', name: 'Comet', price: 440 },
  { id: 'top-crown', slot: 'top', name: 'Commander crown', price: 560 },
  { id: 'banner-plain', slot: 'banner', name: 'Paper', price: 0, bg: 'var(--panel-2)', ink: 'var(--ink)' },
  { id: 'banner-grid', slot: 'banner', name: 'Flight manual', price: 90, bg: 'linear-gradient(to right, rgba(11,61,145,.12) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(to bottom, rgba(11,61,145,.12) 1px, transparent 1px) 0 0 / 22px 22px, #f6f4ec', ink: 'var(--ink)' },
  { id: 'banner-orbit', slot: 'banner', name: 'Orbits', price: 180, bg: 'repeating-radial-gradient(circle at 85% 120%, transparent 0 26px, rgba(243,241,234,.18) 26px 27px), #0b3d91', ink: '#fbfaf6' },
  { id: 'banner-stars', slot: 'banner', name: 'Deep field', price: 260, bg: 'radial-gradient(1px 1px at 12% 30%, #fff, transparent), radial-gradient(1px 1px at 38% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 66% 22%, #fff, transparent), radial-gradient(1px 1px at 82% 62%, #fff, transparent), radial-gradient(1px 1px at 92% 18%, #fff, transparent), radial-gradient(1px 1px at 24% 88%, #fff, transparent), #0a0e16', ink: '#fbfaf6' },
  { id: 'banner-mars', slot: 'banner', name: 'Red dunes', price: 340, bg: 'repeating-linear-gradient(170deg, rgba(0,0,0,.08) 0 2px, transparent 2px 14px), linear-gradient(180deg, #e9a17a, #b3412a)', ink: '#fffaf3' },
  // More gear (2026-11-15). Every slot here is one the avatar already draws.
  { id: 'frame-copper', slot: 'frame', name: 'Copper ring', price: 160, bg: 'linear-gradient(135deg, #6e3b1f, #e0a070 42%, #b8682f 68%, #5a2e15)' },
  { id: 'frame-mars', slot: 'frame', name: 'Red planet ring', price: 260, bg: 'radial-gradient(circle at 30% 30%, #f6b48a, #c8673f 45%, #6e2c1a)' },
  { id: 'frame-aurora', slot: 'frame', name: 'Aurora ring', price: 380, bg: 'linear-gradient(135deg, #12708a, #7ef0c5 40%, #b28dff 70%, #3b1f5e)' },
  { id: 'frame-nebula', slot: 'frame', name: 'Nebula ring', price: 560, bg: 'conic-gradient(from 40deg, #3b1f5e, #6b34a0, #12708a, #4cc9f0, #3b1f5e)' },
  { id: 'visor-aurora', slot: 'visor', name: 'Aurora visor', price: 180, c1: '#7ef0c5', c2: '#12708a' },
  { id: 'visor-sunset', slot: 'visor', name: 'Mars sunset visor', price: 200, c1: '#b9dcff', c2: '#b8643a' },
  { id: 'visor-deep', slot: 'visor', name: 'Deep space visor', price: 230, c1: '#9cbcff', c2: '#1e1838' },
  { id: 'suit-sand', slot: 'suit', name: 'Desert tan', price: 110, fill: '#c9a46a' },
  { id: 'suit-green', slot: 'suit', name: 'Hab green', price: 130, fill: '#3f8a5c' },
  { id: 'suit-red', slot: 'suit', name: 'Rescue red', price: 170, fill: '#c0392b' },
  { id: 'suit-purple', slot: 'suit', name: 'Nebula violet', price: 190, fill: '#5b3a8c' },
  { id: 'suit-gold', slot: 'suit', name: 'EVA gold', price: 320, fill: '#c9962b' },
  { id: 'patch-sun', slot: 'patch', name: 'Sun patch', price: 120, bg: '#f6c445', fg: '#14181f', glyph: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4' },
  { id: 'patch-dna', slot: 'patch', name: 'Science patch', price: 150, bg: '#12708a', fg: '#e8eefc', glyph: 'M8 3c0 6 8 6 8 12s-8 6-8 6 M16 3c0 6-8 6-8 12 M9 7h6 M9 17h6' },
  { id: 'patch-rocket', slot: 'patch', name: 'Launch patch', price: 170, bg: '#e8742c', fg: '#fff7ec', glyph: 'M12 2c3 2 5 6 5 10l-2 3H9l-2-3c0-4 2-8 5-10Z M12 8h.01 M9 15l-2 4 M15 15l2 4' },
  { id: 'patch-saturn', slot: 'patch', name: 'Ringed planet patch', price: 230, bg: '#5b3a8c', fg: '#f6c445', glyph: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M3 15c2 2 16-2 18-6' },
  { id: 'banner-sunrise', slot: 'banner', name: 'Orbital sunrise', price: 150, bg: 'linear-gradient(180deg, #14181f, #3d1a22 45%, #e8742c 80%, #f6c445)', ink: '#f3f1ea' },
  { id: 'banner-aurora', slot: 'banner', name: 'Aurora', price: 200, bg: 'linear-gradient(160deg, #05140f, #0e3b33 40%, #2fbf8f 72%, #b28dff)', ink: '#f3f1ea' },
  { id: 'banner-blueprint', slot: 'banner', name: 'Blueprint', price: 120, bg: 'linear-gradient(to right, rgba(243,241,234,.12) 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(to bottom, rgba(243,241,234,.12) 1px, transparent 1px) 0 0 / 26px 26px, #0b3d91', ink: '#f3f1ea' },
  // Season 1 mission pass only: earned on the pass, never sold.
  { id: 'frame-pass', slot: 'frame', name: 'Season 1 ring', price: 0, pass: true, bg: 'conic-gradient(from 0deg, #f6c445, #0b3d91, #f6c445, #0b3d91, #f6c445)' },
  { id: 'visor-pass', slot: 'visor', name: 'Season 1 visor', price: 0, pass: true, c1: '#f6c445', c2: '#0b3d91' },
  { id: 'suit-pass', slot: 'suit', name: 'Season 1 flight suit', price: 0, pass: true, fill: '#1d2b53' },
  { id: 'patch-pass', slot: 'patch', name: 'Season 1 patch', price: 0, pass: true, bg: '#0b3d91', fg: '#f6c445', glyph: 'M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8Z' },
  { id: 'banner-pass', slot: 'banner', name: 'Season 1', price: 0, pass: true, bg: 'radial-gradient(circle at 80% 20%, rgba(246,196,69,.55), transparent 40%), linear-gradient(135deg, #0b1220, #1d2b53 55%, #0b3d91)', ink: '#f3f1ea' },
  // Level rewards: earned by reaching the level, never sold.
  { id: 'banner-starlight', slot: 'banner', name: 'Starlight', price: 0, level: 4, bg: 'radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 60% 70%, #fff, transparent), radial-gradient(2px 2px at 80% 20%, #f6c445, transparent), linear-gradient(180deg, #0b1220, #24345e)', ink: '#f3f1ea' },
  { id: 'frame-comet', slot: 'frame', name: 'Comet ring', price: 0, level: 7, bg: 'conic-gradient(from 200deg, #f6c445, #e8742c, #14181f 40%, #f6c445)' },
  { id: 'visor-legend', slot: 'visor', name: 'Legend visor', price: 0, level: 10, c1: '#ffe08a', c2: '#5b3a8c' },
  // Collection-set rewards: complete a set to unlock its matching ring.
  { id: 'frame-set-mars', slot: 'frame', name: 'Mars kit ring', price: 0, set: 'mars', bg: 'repeating-conic-gradient(#c8673f 0 20deg, #6e2c1a 20deg 40deg)' },
  { id: 'frame-set-moon', slot: 'frame', name: 'Moon kit ring', price: 0, set: 'moon', bg: 'repeating-conic-gradient(#d9dbe0 0 20deg, #6b6e75 20deg 40deg)' },
  { id: 'frame-set-station', slot: 'frame', name: 'Station kit ring', price: 0, set: 'station', bg: 'repeating-conic-gradient(#4cc9f0 0 20deg, #0b3d91 20deg 40deg)' },
  { id: 'frame-set-deep', slot: 'frame', name: 'Deep space kit ring', price: 0, set: 'deep', bg: 'repeating-conic-gradient(#b28dff 0 20deg, #1e1838 20deg 40deg)' },
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
const FREE = SHOP.filter((x) => x.price === 0 && !x.pass && !x.level && !x.set).map((x) => x.id)

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
  const earned = cappedPoints(creditedEvents(events))
  const l = locker(id)
  const unlocked = computedUnlocks(id, earned, l.owned)
  const chest = events.some((e) => e.kind === 'supplyDrop' && dayKey(e.timestamp) === todayKey())
  const claimed = events.filter((e) => e.kind === 'streakMilestone' && e.detail).map((e) => Number(String(e.detail).replace('streak-', '')))
  return {
    coins: Math.max(0, earned + (l.bonus || 0) - l.spent),
    xp: earned,
    owned: Array.from(new Set([...l.owned, ...unlocked])),
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
  const points = credited.length ? Math.min(POINTS[effort.kind], capRoom(id)) : 0
  if (credited.length && !points) announce(0, 'Daily coin limit reached', true)
  if (points) announce(points, kind === 'exerciseMinutes' ? 'Exercise logged' : kind === 'reactionTime' ? 'Alertness check done' : `${IND[values[0]?.indicator]?.[0] ?? 'Reading'} logged`)
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
  // Level and set rewards are owned by being earned, not bought: make them equippable.
  if (computedUnlocks(id, wallet(id).xp, locker(id).owned).includes(itemId)) { const l0 = locker(id); if (!l0.owned.includes(itemId)) saveLocker(id, { ...l0, owned: [...l0.owned, itemId] }) }
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
    { id: 'streak14', name: 'Two weeks strong', desc: 'Check in fourteen days running', icon: 'flame', got: g.streak >= 14 },
    { id: 'streak30', name: 'Month in orbit', desc: 'Check in thirty days running', icon: 'moon', got: g.streak >= 30 },
    { id: 'hydrated', name: 'Hydrated', desc: 'Reach your water goal on three days', icon: 'gut', got: Object.values(intakeStore(id).days).filter((d) => d.water >= (intakeStore(id).goal ?? 2.5)).length >= 3 },
    { id: 'fed', name: 'Three square meals', desc: 'Log breakfast, lunch and dinner on one day', icon: 'sun', got: Object.values(intakeStore(id).days).some((d) => ['breakfast', 'lunch', 'dinner'].every((m) => d.meals.includes(m))) },
    { id: 'sharp', name: 'Sharp', desc: 'Finish three alertness checks', icon: 'zap', got: (getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'reactionTime').length >= 3 },
    { id: 'focus', name: 'Steady focus', desc: 'Finish a 3-minute alertness test', icon: 'zap', got: pvtbHistory(id).length > 0 },
    { id: 'responder', name: 'First responder', desc: `Acknowledge an alert within ${ESCALATE_BACKUP_MIN} minutes`, icon: 'alert', got: Object.values(alertStore()).some((r) => r.ackBy === id && r.ackAt && r.firstSeen && r.ackAt - r.firstSeen <= ESCALATE_BACKUP_MIN * 60000) },
    { id: 'mapper', name: 'Body mapper', desc: 'Do a pain check, even when nothing hurts', icon: 'body', got: hasReading(id, 'painReport') },
    { id: 'standup', name: 'Steady on your feet', desc: 'Do the stand-up test', icon: 'heart', got: hasReading(id, 'orthostaticRise') },
    { id: 'selfcheck', name: 'Checking in on yourself', desc: 'Do the weekly workload and mood check', icon: 'users', got: hasReading(id, 'workload') },
    { id: 'grip', name: 'Strong grip', desc: 'Log grip strength three times', icon: 'zap', got: (getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'gripStrength').length >= 3 },
    { id: 'planner', name: 'Planner', desc: 'Add a block of your own to the schedule', icon: 'clock', got: scheduleStore(id).custom.length > 0 },
    { id: 'contact', name: 'Ground contact', desc: 'Send a packet to Earth from Escalate', icon: 'send', got: groundLink(id).list.length > 0 },
    { id: 'scout', name: 'Scout', desc: 'Find your first discovery in a mission banner', icon: 'target', got: locker(id).found.length > 0 },
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
  bridge.go(taskId === 'checkIn' || taskId === 'symptom' ? 'mirror' : 'manual')
  return 0
}

/** The next block on this person's schedule (now or upcoming), with minutes until it starts. */
export function nextBlock(crewId) {
  const now = new Date()
  const crew = getState().crew
  const plan = planFor(crew.role || '', scheduleStore(crewId).custom, now)
  const done = doneToday(getSnapshot().events[crewId] ?? [], now)
  const meals = intake(crewId).meals
  const ticks = ticksToday(crewId)
  const rows = plan.map((b) => ({ b, st: blockState(b, now, isBlockDone(b, done, meals, ticks)) }))
  const next = rows.find((r) => r.st === 'now') ?? rows.find((r) => r.st === 'upcoming')
  if (!next) return null
  return { title: next.b.title, start: next.b.start, now: next.st === 'now', minsTo: toMinutes(next.b.start) - (now.getHours() * 60 + now.getMinutes()) }
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
const MISSION_SCENE = { iss: 'iss', lunar: 'lunar', lunarRover: 'lunar', mars: 'transit', marsSurface: 'mars' }
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
  const pts = Math.min(POINTS.readingLogged, capRoom(id))
  if (pts) announce(pts, ind === 'waterIntake' ? 'Water logged' : 'Meal logged')
  else announce(0, 'Daily coin limit reached', true)
  return pts
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
  let fault = null
  try { fault = localStorage.getItem('chm-cabin-fault') } catch {}
  const series = cabinSeries(envId, new Date(), fault)
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

/** Career radiation budget against NASA's 600 mSv limit (lib/radiationBudget.ts). */
export function radiationBudget(crewId) {
  const ms = getSnapshot().measurements[crewId] ?? []
  const first = ms.length ? Math.min(...ms.map((m) => Date.parse(m.timestamp))) : Date.now()
  const missionDays = Math.max(0, Math.floor((Date.now() - first) / DAY))
  const doses = ms.filter((m) => m.indicator === 'radiationDose' && typeof m.value === 'number').sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const dose = doses[0]
  // A replay's readings are a running total that starts from the quiet days already on the ledger;
  // the mission days are counted above, so only what the storm itself added goes on the budget.
  const replay = doses.filter((m) => String(m.id).startsWith('radiation-replay-'))
  const eventMSv = !dose ? 0 : String(dose.id).startsWith('radiation-replay-') ? Math.max(0, dose.value - Math.min(...replay.map((m) => m.value))) : dose.value
  const env = getState().envId
  const b = careerBudget({ prior: PRIOR_MISSIONS_MSV[crewId] ?? 0, missionDays, env, eventMSv })
  return { ...b, limit: CAREER_LIMIT_MSV, limitUrl: CAREER_LIMIT_SOURCE, missionDays, rateBasis: DAILY_RATE[env]?.basis, rateUrl: DAILY_RATE[env]?.url, priorSimulated: crewId !== 'guest' }
}

/** Where how someone rates themselves disagrees with what was measured (lib/selfReportGap.ts). */
export function gaps(crewId) {
  return [...selfReportGaps(appReadAll(getSnapshot().measurements[crewId] ?? [])), ...pvtbGap(crewId)]
}

/* ---- The alert loop (lib/alerts.ts): open until acknowledged, cleared only with a note -------- */
const ALERT_KEY = 'chm-alerts'
function alertStore() {
  try { return JSON.parse(localStorage.getItem(ALERT_KEY) || '{}') } catch { return {} }
}
function saveAlerts(st, quiet = false) {
  try { localStorage.setItem(ALERT_KEY, JSON.stringify(st)) } catch {}
  if (!quiet) notify()
}
export function alerts() {
  const st = alertStore()
  let changed = false
  const out = []
  for (const c of CREW) {
    const readings = appReadAll(getSnapshot().measurements[c.id] ?? [])
    const live = new Set()
    const raised = manualAlerts().filter((m) => m.crewId === c.id).map((m) => ({ id: `${c.id}:manual:${m.id}`, crewId: c.id, kind: 'manual', title: m.title, detail: m.detail, status: m.status, signature: String(m.at) }))
    for (const a of [...alertCandidates(c.id, readings, patternFlags(readings), (i) => IND[i][0]), ...raised]) {
      live.add(a.id)
      const meta = { title: a.title, crewId: c.id, crewName: c.id === 'guest' ? 'Guest' : c.name, status: a.status }
      // New, or back after it had resolved on its own: a fresh episode with its own clock.
      if (!st[a.id] || st[a.id].resolvedAt) { st[a.id] = { firstSeen: Date.now(), ...meta }; changed = true }
      else if (!st[a.id].title) { st[a.id] = { ...st[a.id], ...meta }; changed = true }
      const rec = st[a.id]
      const state = alertState(a, rec)
      // A reopened alert starts its clock again.
      if (state === 'open' && rec.signature && rec.signature !== a.signature) { st[a.id] = { firstSeen: Date.now() }; changed = true }
      out.push({ ...a, crewName: c.id === 'guest' ? 'Guest' : c.name, state, firstSeen: st[a.id].firstSeen, note: rec.note, ackAt: rec.ackAt, closedAt: rec.closedAt, ackBy: rec.ackBy })
    }
    // An alert whose readings came back within usual closes itself, and says so.
    for (const [id, rec] of Object.entries(st)) {
      if (!id.startsWith(c.id + ':') || live.has(id) || rec.closedAt || rec.resolvedAt) continue
      st[id] = { ...rec, resolvedAt: Date.now() }
      changed = true
    }
  }
  if (changed) saveAlerts(st, true)
  const rank = { open: 0, acknowledged: 1, closed: 2 }
  return out.sort((a, b) => rank[a.state] - rank[b.state] || (a.status === b.status ? a.firstSeen - b.firstSeen : a.status === 'red' ? -1 : 1))
}
export function ackAlert(id) {
  const st = alertStore()
  const a = alerts().find((x) => x.id === id)
  st[id] = { ...(st[id] || {}), ackAt: Date.now(), signature: a?.signature, ackBy: getState().crew.id }
  saveAlerts(st)
}
export function closeAlert(id, note) {
  const st = alertStore()
  const a = alerts().find((x) => x.id === id)
  st[id] = { ...(st[id] || {}), ackAt: st[id]?.ackAt || Date.now(), closedAt: Date.now(), note: String(note).slice(0, 280), signature: a?.signature }
  saveAlerts(st)
}

/* ---- Ask Orbit (lib/assistant.ts): offline answers from the app's own sourced content ---------- */
const HRP_RISKS = 'https://www.nasa.gov/hrp/risks'
const FIELD_Q = {
  canMeasureInSpace: (l) => `Can ${l.toLowerCase()} be measured in space?`,
  whyCheck: (l) => `Why check ${l.toLowerCase()}?`,
  hazardEffect: (l) => `How spaceflight affects ${l.toLowerCase()}`,
  whenToEscalate: (l) => `When ${l.toLowerCase()} needs attention`,
  prevention: (l) => `Preventing problems with ${l.toLowerCase()}`,
  recommendedAction: (l) => `What to do about ${l.toLowerCase()}`,
}
function sourceFor(id, field) {
  const hits = SOURCES_RAW.filter((x) => String(x.usedFor || '').includes(id))
  return (hits.find((x) => x.usedFor.includes(field)) || hits[0] || {}).url || HRP_RISKS
}
let ASK_INDEX = null
function askIndex() {
  if (ASK_INDEX) return ASK_INDEX
  const ps = []
  for (const i of INDICATORS) {
    const c = getContent(i)
    for (const [f, q] of Object.entries(FIELD_Q)) {
      const t = okText(c[f])
      if (t) ps.push({ id: `${i}:${f}`, title: q(c.label), text: t, url: sourceFor(i, f), topic: i })
    }
  }
  for (const h of HAZARDS_RAW) {
    const t = [h.what, h.body, h.selfCare].map(okText).filter(Boolean).join(' ')
    if (t) ps.push({ id: `hazard:${h.id}`, title: `${h.name} (one of NASA's five hazards)`, text: t, url: h.url })
  }
  for (const [rid, r] of Object.entries(REGION_RAW)) {
    const t = [r.function, r.spaceflight].map(okText).filter(Boolean).join(' ')
    if (t) ps.push({ id: `region:${rid}`, title: `What the ${rid === 'body' ? 'whole body' : rid} does`, text: t, url: (r.sources || [])[0] })
  }
  for (const e of ENV_RAW) {
    for (const f of ['gravity', 'radiation', 'distance', 'isolation', 'dayLength']) {
      const t = okText(e[f])
      if (t) ps.push({ id: `env:${e.id}:${f}`, title: `${e.label}: ${f === 'dayLength' ? 'day length' : f}`, text: t, url: (e.sources || [])[0] })
    }
  }
  CABIN.facts.forEach((f, k) => ps.push({ id: `cabin:${k}`, title: 'Cabin air and noise', text: f.text, url: f.url }))
  ps.push({ id: 'cabin:limit', title: 'Cabin CO2 limit', text: `${CABIN.limitText} ${CABIN.weekLimitText}`, url: CABIN.limitUrl })
  ps.push({ id: 'radiation:limit', title: 'Career radiation limit', text: `NASA-STD-3001: an individual crewmember's total career effective dose from spaceflight radiation shall be less than ${CAREER_LIMIT_MSV} mSv, for all ages and sexes.`, url: CAREER_LIMIT_SOURCE })
  ASK_INDEX = buildIndex([...ps, ...ASK_EXTRA])
  return ASK_INDEX
}
export function addPassages(extra) {
  // Lets other modules (the nutrition tips) join the index without an import cycle.
  ASK_EXTRA.push(...extra)
  ASK_INDEX = null
}
const ASK_EXTRA = []

/**
 * Answer one question: a red-flag check first, then the best passages with their sources, then
 * how this person's own related readings look and the escalation step that fits.
 */
export function ask(crewId, question) {
  const flag = redFlag(question)
  if (flag) {
    return { kind: 'urgent', flag: flag.say, rung: 'Crew medical officer now, and the flight surgeon through Escalate' }
  }
  const hits = search(askIndex(), question, 3)
  const readings = appReadAll(getSnapshot().measurements[crewId] ?? [])
  const topics = new Set(hits.map((h) => h.p.topic).filter(Boolean))
  for (const i of INDICATORS) if (question.toLowerCase().includes(IND[i][0].toLowerCase())) topics.add(i)
  const mine = [...topics].map((i) => {
    const r = readings[i]
    const base = r?.reference ?? r?.baseline
    const v = typeof r?.latest?.value === 'number' ? r.latest.value : null
    return { id: i, label: IND[i][0], status: r?.status ?? 'gray', value: v, unit: IND[i][1], usual: base ? Math.round(base.mean * 10) / 10 : null }
  })
  const pats = patternFlags(readings).filter((p) => p.parts.some((x) => topics.has(x.indicator))).map((p) => ({ title: p.pattern.title, status: p.status, rung: RUNG_NAME[p.rung] }))
  const worst = mine.some((m) => m.status === 'red') || pats.some((p) => p.status === 'red') ? 'red' : mine.some((m) => m.status === 'yellow') || pats.length ? 'yellow' : 'ok'
  const next = worst === 'red' ? 'Tell your crew medical officer today, and use Escalate if it is not settling.' : worst === 'yellow' ? 'Keep an eye on it: try the self-care steps, re-check tomorrow, and ask a crewmate for a second look if it stays.' : ''
  return { kind: 'answer', hits: hits.map((h) => ({ title: h.p.title, text: h.p.text, url: h.p.url })), mine: mine.filter((m) => m.status !== 'gray' || m.value !== null), patterns: pats, next }
}

/* ---- Ground link: transmissions that take the real comm delay to reach Earth ---------------- */
const linkKey = (id) => 'chm-groundlink-' + id
function linkStore(id) {
  try { return JSON.parse(localStorage.getItem(linkKey(id)) || '[]') } catch { return [] }
}
/** Record a transmitted ground packet. Earth only sees it once the one-way delay has passed. */
export function queuePacket(id) {
  const delay = Math.round(getState().delay)
  const p = buildPacket(id)
  const now = Date.now()
  const list = [{ id: crypto.randomUUID(), sentAt: now, arriveAt: now + delay * 1000, replyAt: now + 2 * delay * 1000, delay, env: getState().env.label, bytes: p.bytes, changed: p.changed.map((c) => c.label || c.indicator), count: p.changed.length }, ...linkStore(id)].slice(0, 20)
  try { localStorage.setItem(linkKey(id), JSON.stringify(list)) } catch {}
  notify()
}
/** Every transmission with where it is now, and what Earth knows at this moment. */
export function groundLink(id) {
  const now = Date.now()
  const list = linkStore(id).map((x) => ({ ...x, state: now >= x.arriveAt ? 'arrived' : 'inflight', progress: Math.min(1, (now - x.sentAt) / Math.max(1, x.arriveAt - x.sentAt)), replyPossible: now >= x.replyAt }))
  const known = list.find((x) => x.state === 'arrived') || null
  return { list, known, delay: Math.round(getState().delay), env: getState().env.label }
}

/** Body regions with an open alert (a red reading or a pattern), for the living body figure. */
export function alertRegions(crewId) {
  const open = alerts().filter((a) => a.crewId === crewId && a.state !== 'closed')
  const out = new Set()
  const regionOf = (ind) => REGIONS.find((r) => r.indicators.includes(ind))?.id
  for (const a of open) {
    const [, kind, key] = a.id.split(':')
    if (kind === 'reading') out.add(regionOf(key))
    else for (const p of patterns(crewId).filter((x) => x.id === key)) for (const part of p.parts) out.add(regionOf(part.id))
  }
  return [...out].filter(Boolean)
}

/** Every earning action announces itself the same way: the header coin pop and the goals toast listen. */
export function announce(n, why, capped = false) {
  try {
    window.dispatchEvent(new CustomEvent('chm:coins', { detail: { n, why, capped } }))
  } catch {
    // No window (tests): nothing to announce.
  }
}

/* ---- Weekly report: ready once a week is complete ------------------------------------------- */
const reportKey = (id) => 'chm-report-seen-' + id
export function reportStatus(crewId) {
  let seen = 0
  try { seen = Number(localStorage.getItem(reportKey(crewId)) || 0) } catch {}
  const ms = getSnapshot().measurements[crewId] ?? []
  const first = ms.length ? Math.min(...ms.map((m) => Date.parse(m.timestamp))) : Date.now()
  const week = 7 * DAY
  const ready = seen ? Date.now() - seen >= week : Date.now() - first >= week
  return { ready, seen }
}
export function markReportSeen(crewId) {
  try { localStorage.setItem(reportKey(crewId), String(Date.now())) } catch {}
}

/* ---- Daily coin cap ------------------------------------------------------------------------ */
/** Coins still allowed today under the daily cap (lib/scoring.ts DAILY_COIN_CAP). */
export function capRoom(id) {
  const today = todayKey()
  const todays = creditedEvents(getSnapshot().events[id] ?? []).filter((e) => dayKey(e.timestamp) === today)
  return Math.max(0, DAILY_COIN_CAP - cappedPoints(todays.filter((e) => e.kind !== 'streakMilestone')))
}
export const COIN_CAP = DAILY_COIN_CAP

/* ---- Levels: every level unlocks something ------------------------------------------------- */
export const LEVEL_UNLOCKS = [
  { lv: 2, kind: 'title', id: 't-first', label: 'First steps', what: 'A title under your name' },
  { lv: 3, kind: 'dock', id: 'dock-midnight', label: 'Midnight dock', what: 'A dark dock skin' },
  { lv: 4, kind: 'item', id: 'banner-starlight', label: 'Starlight banner', what: 'A banner for your profile' },
  { lv: 5, kind: 'title', id: 't-steady', label: 'Steady hand', what: 'A title under your name' },
  { lv: 6, kind: 'dock', id: 'dock-gold', label: 'Gold trim dock', what: 'A gold-trimmed dock skin' },
  { lv: 7, kind: 'item', id: 'frame-comet', label: 'Comet ring', what: 'A frame for your avatar' },
  { lv: 8, kind: 'title', id: 't-veteran', label: 'Orbit veteran', what: 'A title under your name' },
  { lv: 9, kind: 'dock', id: 'dock-aurora', label: 'Aurora dock', what: 'An aurora dock skin' },
  { lv: 10, kind: 'item', id: 'visor-legend', label: 'Legend visor', what: 'A visor for your avatar' },
  { lv: 11, kind: 'title', id: 't-legend', label: 'Legend of the deep', what: 'The top title' },
]
export function levelPerks(id) {
  const lv = level(wallet(id).xp).n
  const got = LEVEL_UNLOCKS.filter((u) => u.lv <= lv)
  const title = [...got].reverse().find((u) => u.kind === 'title')
  const dock = [...got].reverse().find((u) => u.kind === 'dock')
  return { lv, unlocked: got, next: LEVEL_UNLOCKS.find((u) => u.lv > lv) || null, title: title ? title.label : '', dockSkin: dock ? dock.id : '' }
}

/* ---- Collection sets ------------------------------------------------------------------------ */
export const SETS = [
  { id: 'mars', name: 'Mars kit', items: ['patch-mars', 'banner-mars', 'suit-orange'], reward: 'frame-set-mars' },
  { id: 'moon', name: 'Moon kit', items: ['patch-moon', 'banner-lunar', 'visor-silver'], reward: 'frame-set-moon' },
  { id: 'station', name: 'Station kit', items: ['patch-iss', 'banner-iss', 'suit-blue'], reward: 'frame-set-station' },
  { id: 'deep', name: 'Deep space kit', items: ['patch-comet', 'banner-transit', 'visor-deep'], reward: 'frame-set-deep' },
]
/** Items owned because they were earned (a level reached, a set completed), not bought. */
function computedUnlocks(id, xp, owned) {
  const lv = level(xp).n
  const out = SHOP.filter((x) => x.level && x.level <= lv).map((x) => x.id)
  for (const set of SETS) if (set.items.every((i) => owned.includes(i))) out.push(set.reward)
  return out
}
export function sets(id) {
  const owned = wallet(id).owned
  return SETS.map((st) => ({ ...st, have: st.items.filter((i) => owned.includes(i)), done: st.items.every((i) => owned.includes(i)), rewardName: SHOP.find((x) => x.id === st.reward)?.name, itemNames: st.items.map((i) => SHOP.find((x) => x.id === i)?.name || i) }))
}

/* ---- Shop: rarity and two featured items a day ---------------------------------------------- */
export function rarity(it) {
  if (it.pass || it.level || it.set) return 'legendary'
  if (it.price >= 300) return 'epic'
  if (it.price >= 150) return 'rare'
  return 'common'
}
const hashStr = (str) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
export function featuredToday() {
  const pool = SHOP.filter((x) => x.price > 0 && !x.pass && !x.level && !x.set)
  const h = hashStr(todayKey())
  const a = pool[h % pool.length]
  let b = pool[(h >>> 7) % pool.length]
  if (b.id === a.id) b = pool[(pool.indexOf(a) + 5) % pool.length]
  return [a.id, b.id]
}

/* ---- Weekly: crew quests (together) and mission-pass tasks (yours) -------------------------- */
const weekStart = () => {
  const d = new Date()
  const day = (d.getUTCDay() + 6) % 7 // Monday-based
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)
}
const weekNo = () => Math.floor(weekStart() / (7 * DAY))
const sinceWeek = (list, t = (x) => x.timestamp) => list.filter((x) => Date.parse(t(x)) >= weekStart())
const waterDaysThisWeek = (id) => Object.entries(intakeStore(id).days).filter(([d, v]) => Date.parse(d + 'T00:00:00Z') >= weekStart() && v.water >= (intakeStore(id).goal ?? 2.5)).length

const CREW_QUESTS = [
  { id: 'mass', label: 'Everyone logs body mass this week', per: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).some((m) => m.indicator === 'bodyMass') },
  { id: 'mirror3', label: 'Everyone does three mirror checks this week', per: (id) => new Set(sinceWeek(getSnapshot().events[id] ?? []).filter((e) => e.kind === 'checkInComplete').map((e) => dayKey(e.timestamp))).size >= 3 },
  { id: 'feel', label: 'Everyone tells the crew how they feel at least once', per: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).some((m) => m.indicator === 'mood' || m.indicator === 'symptomReport') },
  { id: 'move', label: 'Everyone logs an exercise session', per: (id) => sinceWeek(getSnapshot().events[id] ?? []).some((e) => e.kind === 'exerciseComplete') },
  { id: 'alert', label: 'Everyone does one alertness check', per: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).some((m) => m.indicator === 'reactionTime') },
]
export const CREW_QUEST_XP = 40
/** Two shared quests a week, rotating. Everyone who has done their part is shown; there is no ranking. */
export function crewQuests() {
  const n = weekNo()
  const picked = [CREW_QUESTS[n % CREW_QUESTS.length], CREW_QUESTS[(n + 2) % CREW_QUESTS.length]]
  const crew = crewList()
  return picked.map((q) => {
    const done = crew.filter((c) => q.per(c.id))
    return { id: q.id, label: q.label, contributors: done.map((c) => ({ crew: c, gear: gear(c.id) })), total: crew.length, complete: crew.length > 0 && done.length === crew.length, xp: CREW_QUEST_XP }
  })
}

const PASS_TASKS = [
  { id: 'bp2', label: 'Log blood pressure twice', xp: 60, count: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'bloodPressureSys' && m.source === 'manual').length, goal: 2 },
  { id: 'alert3', label: 'Do three alertness checks', xp: 60, count: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'reactionTime').length, goal: 3 },
  { id: 'water3', label: 'Reach your water goal on three days', xp: 60, count: (id) => waterDaysThisWeek(id), goal: 3 },
  { id: 'mirror5', label: 'Do five mirror checks', xp: 50, count: (id) => new Set(sinceWeek(getSnapshot().events[id] ?? []).filter((e) => e.kind === 'checkInComplete').map((e) => dayKey(e.timestamp))).size, goal: 5 },
  { id: 'packet', label: 'Send one packet to Earth', xp: 40, count: (id) => sinceWeek(groundLink(id).list, (p) => new Date(p.sentAt).toISOString()).length, goal: 1 },
  { id: 'pvtb1', label: 'Take the 3-minute alertness test', xp: 50, count: (id) => sinceWeek(pvtbHistory(id), (x) => new Date(x.at).toISOString()).length, goal: 1 },
  { id: 'weekly1', label: 'Do the weekly workload and mood check', xp: 50, count: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'workload').length, goal: 1 },
  { id: 'grip1', label: 'Log your grip strength', xp: 40, count: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'gripStrength').length, goal: 1 },
  { id: 'load2', label: 'Log two bone-loading sessions', xp: 50, count: (id) => boneLoading(id).week.length, goal: 2 },
  { id: 'mass1', label: 'Log body mass once', xp: 40, count: (id) => sinceWeek(getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === 'bodyMass' && m.source === 'manual').length, goal: 1 },
]
/** Three rotating tasks a week that give mission-pass XP. Only effort, never values. */
export function passTasks(id) {
  const n = weekNo()
  const picked = [0, 2, 4].map((k) => PASS_TASKS[(n + k) % PASS_TASKS.length])
  return picked.map((t) => {
    const c = Math.min(t.goal, t.count(id))
    return { id: t.id, label: t.label, xp: t.xp, progress: c, goal: t.goal, done: c >= t.goal }
  })
}
/** Season XP: 60% of earned XP, plus this week's finished pass tasks and completed crew quests. */
export function seasonXp(id) {
  const base = Math.round(wallet(id).xp * 0.6)
  const tasks = passTasks(id).filter((t) => t.done).reduce((a, t) => a + t.xp, 0)
  const quests = crewQuests().filter((q) => q.complete).length * CREW_QUEST_XP
  return base + tasks + quests
}

/* ---- Moments: shield saves and level-ups, each shown once ----------------------------------- */
const seenKey = (id) => 'chm-moments-' + id
function seenMoments(id) {
  try { return JSON.parse(localStorage.getItem(seenKey(id)) || '{}') } catch { return {} }
}
export function pendingMoments(id) {
  // Wait for the stored data: counting from an empty wallet would greet a first visit with a level-up.
  if (!getSnapshot().loadedAt) return []
  const seen = seenMoments(id)
  const out = []
  const save = (game(id).saves || []).at(-1)
  if (save && Date.now() - Date.parse(save.day) < 3 * DAY && seen.shield !== save.day) out.push({ kind: 'shield', key: save.day, text: `Your shield saved a ${save.streak}-day streak.` })
  const lv = level(wallet(id).xp).n
  if (seen.level === undefined) {
    // First run: start counting from here, no surprise screen.
    try { localStorage.setItem(seenKey(id), JSON.stringify({ ...seen, level: lv })) } catch {}
  } else if (lv > seen.level) {
    out.push({ kind: 'level', key: lv, lv, rank: level(wallet(id).xp).rank, unlocks: LEVEL_UNLOCKS.filter((u) => u.lv > seen.level && u.lv <= lv) })
  }
  return out
}
export function markMoment(id, kind, key) {
  const seen = seenMoments(id)
  try { localStorage.setItem(seenKey(id), JSON.stringify({ ...seen, [kind]: key })) } catch {}
}

/* ---- Ship systems: each one that comes online changes something you can see ----------------- */
export const SYSTEM_EFFECT = {
  comms: 'Ground link packets go out through the relay',
  telemetry: 'Turns on the cabin air (CO2) chart on Body',
  medbay: 'Adds a scanning sweep to the body viewer',
  shelter: 'Marks the radiation budget as shelter-ready',
  nav: 'Lights a starfield behind your Today greeting',
}
export function systemsOnline() {
  return Object.fromEntries(crewGoal().systems.map((x) => [x.id, x.online]))
}

/* ==== Round 3: alert action cards, the backup medical officer, ignored-alert escalation, slide
   forecasts, reading freshness, the 3-minute PVT-B, what Earth receives, and a CSV of readings ==== */

/* ---- The crew medical officer, and who covers when they are the patient --------------------- */
const CMO_KEY = 'chm-cmo'
const defaultCmo = () => {
  const ids = crewList().map((c) => c.id).filter((x) => x !== 'guest')
  return { primary: ids[1] || ids[0] || '', backup: ids[0] || '' }
}
export function medicalOfficer() {
  let set = defaultCmo()
  try { set = { ...set, ...JSON.parse(localStorage.getItem(CMO_KEY) || '{}') } } catch {}
  const name = (id) => { const c = crewList().find((x) => x.id === id); return c ? (c.id === 'guest' ? 'Guest' : c.name) : '' }
  // The medical officer is "the patient" when their own body has anything at Act, or an open alert of their own.
  const cd = set.primary ? crewData(set.primary) : null
  const ownOpen = alertStoreOpenFor(set.primary)
  const unwell = !!set.primary && (cd?.worst === 'red' || ownOpen)
  const active = unwell && set.backup && set.backup !== set.primary ? set.backup : set.primary
  return { primary: set.primary, backup: set.backup, primaryName: name(set.primary), backupName: name(set.backup), unwell, active, activeName: name(active) }
}
export function setMedicalOfficer(primary, backup) {
  try { localStorage.setItem(CMO_KEY, JSON.stringify({ primary, backup })) } catch {}
  notify()
}
function alertStoreOpenFor(crewId) {
  if (!crewId) return false
  const readings = appReadAll(getSnapshot().measurements[crewId] ?? [])
  const st = alertStore()
  return alertCandidates(crewId, readings, patternFlags(readings), (i) => IND[i][0]).some((a) => alertState(a, st[a.id]) !== 'closed')
}

/* ---- Ignored alerts climb: nothing waits quietly forever ------------------------------------ */
/** Minutes an alert can wait unacknowledged before the backup medical officer is told too, and before Earth should hear. */
export const ESCALATE_BACKUP_MIN = 15
export const ESCALATE_GROUND_MIN = 60
export function alertEscalation(a) {
  if (a.state !== 'open') return { level: 0, text: '' }
  const min = Math.floor((Date.now() - a.firstSeen) / 60000)
  const waited = min < 60 ? `${min} min` : min < 2880 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 1440)} days`
  const cmo = medicalOfficer()
  if (min >= ESCALATE_GROUND_MIN && a.status === 'red') return { level: 2, min, text: `Unanswered for ${waited}: send the change summary to the flight surgeon from Escalate, and keep onboard care going.` }
  if (min >= ESCALATE_BACKUP_MIN) return { level: 1, min, text: `Unanswered for ${waited}: ${cmo.backupName && cmo.backup !== cmo.active ? `${cmo.backupName}, the backup medical officer, is asked too.` : 'ask any crewmate to look at it with you now.'}` }
  return { level: 0, min, text: '' }
}

/** Alerts that went away on their own because the readings came back within usual. Kept for 3 days. */
export function resolvedAlerts() {
  const st = alertStore()
  return Object.entries(st)
    .filter(([, r]) => r.resolvedAt && r.title && Date.now() - r.resolvedAt < 3 * DAY)
    .map(([id, r]) => ({ id, crewId: r.crewId, crewName: r.crewName, title: r.title, status: r.status, firstSeen: r.firstSeen, resolvedAt: r.resolvedAt }))
    .sort((a, b) => b.resolvedAt - a.resolvedAt)
}

/* ---- An action card for every alert: Now, Today, Escalate if ------------------------------- */
const STEP_KEY = 'chm-alert-steps'
function stepStore() { try { return JSON.parse(localStorage.getItem(STEP_KEY) || '{}') } catch { return {} } }
const okT = (t) => (t && t !== '[CONTENT TODO]' ? t : '')
export function alertPlan(a) {
  const [crewId, kind, key] = a.id.split(':')
  let now = [], today = [], escalateIf = '', source = HRP_RISKS, recheck = 'mirror'
  if (kind === 'manual') {
    now = [{ id: 'talk', text: 'Talk it through with them, and look at their latest readings together.' }, { id: 'recheck', text: 'Repeat the check that worried you, so you have a fresh number.', go: 'mirror' }]
    escalateIf = 'If it is getting worse, or the medical officer cannot settle it onboard, send the change summary to the flight surgeon.'
  } else if (kind === 'reading') {
    const c = getContent(key)
    recheck = ['bloodPressureSys', 'bloodPressureDia', 'temperature', 'bloodSugar', 'bodyMass', 'sleepHours', 'exerciseMinutes', 'reactionTime', ...BODY_CHECKS].includes(key) ? 'manual' : 'mirror'
    now = [
      { id: 'retake', text: `Retake the ${c.label.toLowerCase()} reading, to rule out a one-off.`, go: recheck },
      ...(okT(c.recommendedAction) ? [{ id: 'act', text: okT(c.recommendedAction) }] : [{ id: 'tell', text: 'Tell a crewmate or the crew medical officer what you are seeing.' }]),
    ]
    today = okT(c.prevention) ? [{ id: 'prevent', text: okT(c.prevention) }] : []
    escalateIf = okT(c.whenToEscalate) || 'If the retake is still at Act, or you feel worse than the number says, move up to the crew medical officer.'
    source = sourceFor(key, 'recommendedAction')
  } else {
    const p = patterns(crewId).find((x) => x.id === key)
    if (p) {
      now = p.care.now.slice(0, 2).map((t, i) => ({ id: 'now' + i, text: t }))
      if (!now.length) now = [{ id: 'tell', text: 'Tell a crewmate or the crew medical officer what you are seeing.' }]
      now.push({ id: 'retake', text: `Re-check ${p.care.recheck.slice(0, 3).join(', ').toLowerCase()}.`, go: 'mirror' })
      today = p.care.prevent.slice(0, 2).map((t, i) => ({ id: 'today' + i, text: t }))
      escalateIf = p.care.moveUp
      source = p.riskUrl || HRP_RISKS
    }
  }
  const st = stepStore()[a.id]
  const done = st && st.day === todayKey() ? st.done : []
  const steps = [...now, ...today].map((s) => ({ ...s, done: done.includes(s.id) }))
  const nowDone = now.every((s) => done.includes(s.id))
  return { now: steps.slice(0, now.length), today: steps.slice(now.length), escalateIf, source, nowDone, points: POINTS.countermeasureComplete }
}
/** Tick a step. Finishing every "Now" step is one care step for the person the alert is about: +10, once a day. */
export function tickAlertStep(a, stepId) {
  const all = stepStore()
  const cur = all[a.id] && all[a.id].day === todayKey() ? all[a.id] : { day: todayKey(), done: [] }
  const done = cur.done.includes(stepId) ? cur.done.filter((x) => x !== stepId) : [...cur.done, stepId]
  all[a.id] = { day: cur.day, done }
  try { localStorage.setItem(STEP_KEY, JSON.stringify(all)) } catch {}
  const plan = alertPlan(a)
  let points = 0
  if (plan.nowDone) {
    const effort = { kind: 'countermeasureComplete', detail: `alert-${a.id.split(':').slice(1).join('-')}` }
    const { credited } = creditableKinds(getSnapshot().events[a.crewId] ?? [], [effort], a.crewId, new Date())
    if (credited.length) {
      points = Math.min(POINTS.countermeasureComplete, capRoom(a.crewId))
      void addEvent({ id: crypto.randomUUID(), crewId: a.crewId, timestamp: new Date().toISOString(), ...effort }).then(() => bridge.refresh())
      if (points) announce(points, 'Alert care steps done')
      else announce(0, 'Daily coin limit reached', true)
    }
  }
  notify()
  return points
}

/* ---- Slides: "at this rate, outside your usual in about N days" ----------------------------- */
const UNIT_SHORT = (r) => (r.unit === '0-10' ? 'points' : r.unit || '')
export function slideForecast(r) {
  if (!r || !r.drift || !r.latest) return null
  const ref = r.reference || r.baseline
  if (!ref || !ref.sd) return null
  const per = r.drift.perDay
  const edge = per > 0 ? ref.mean + 2 * ref.sd : ref.mean - 2 * ref.sd
  const gap = edge - r.latest.v
  const outside = per > 0 ? gap <= 0 : gap >= 0
  const days = outside ? 0 : Math.ceil(gap / per)
  const rate = `${Math.abs(per) >= 1 ? Math.abs(per).toFixed(0) : Math.abs(per).toFixed(Math.max(1, r.dp))} ${UNIT_SHORT(r)} a day`.replace(/\s+a day/, ' a day')
  const dir = per > 0 ? 'up' : 'down'
  const text = outside
    ? `Sliding ${dir} about ${rate} for ${r.drift.days} days, and already in the Act zone, far from your usual.`
    : `Sliding ${dir} about ${rate} for ${r.drift.days} days. At this rate it reaches the Act zone, far from your usual, in about ${days} day${days === 1 ? '' : 's'}.`
  return { dir, days, outside, perDay: per, text }
}
export function slideForecasts(crewId) {
  const cd = crewData(crewId)
  return Object.values(cd.readings).map((r) => ({ r, f: slideForecast(r) })).filter((x) => x.f).map(({ r, f }) => ({ id: r.id, label: r.label, status: r.status, ...f }))
}

/* ---- Freshness: how old the newest good reading is ------------------------------------------ */
export const STALE_DAYS = 3
/** Indicators people only measure now and then; they go stale more slowly. */
const SLOW = new Set(['bodyMass', 'bloodSugar', 'radiationDose', 'symptomReport', 'amslerDistortion', 'nearAcuity', 'painReport'])
/** Weekly checks go stale after a week and a day. */
const WEEKLY = new Set(['workload', 'moodScreen', 'gripStrength', 'orthostaticRise'])
export function freshness(r) {
  if (!r || !r.latest) return { state: 'none', days: null, text: 'Never measured' }
  const days = Math.floor((Date.now() - r.latest.t) / DAY)
  const limit = WEEKLY.has(r.id) ? 8 : SLOW.has(r.id) ? STALE_DAYS * 2 : STALE_DAYS
  const when = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  return { state: days >= limit ? 'stale' : 'fresh', days, text: `Last measured ${when}` }
}
export function staleReadings(crewId) {
  const cd = crewData(crewId)
  return Object.values(cd.readings)
    .map((r) => ({ id: r.id, label: r.label, ...freshness(r), go: ['bloodPressureSys', 'bloodPressureDia', 'temperature', 'bloodSugar', 'bodyMass', 'sleepHours', 'exerciseMinutes', 'reactionTime', ...BODY_CHECKS].includes(r.id) ? 'manual' : 'mirror' }))
    .filter((x) => x.state === 'stale')
    .sort((a, b) => b.days - a.days)
}

/* ---- The 3-minute PVT-B (Basner et al. 2011): the validated short alertness test ------------- */
export const PVTB_SOURCE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786'
export const PVTB_LAPSE_MS = 355
const pvtKey = (id) => 'chm-pvtb-' + id
export function pvtbHistory(id) {
  try { return JSON.parse(localStorage.getItem(pvtKey(id)) || '[]') } catch { return [] }
}
/** Save a finished PVT-B and pay the effort credit (+5, once a day), whatever the score. */
export function savePvtb(id, res) {
  const list = [{ ...res, at: Date.now() }, ...pvtbHistory(id)].slice(0, 30)
  try { localStorage.setItem(pvtKey(id), JSON.stringify(list)) } catch {}
  const effort = { kind: 'readingLogged', detail: 'pvtb' }
  const { credited } = creditableKinds(getSnapshot().events[id] ?? [], [effort], id, new Date())
  const points = credited.length ? Math.min(POINTS.readingLogged, capRoom(id)) : 0
  if (credited.length) {
    void addEvent({ id: crypto.randomUUID(), crewId: id, timestamp: new Date().toISOString(), ...effort }).then(() => bridge.refresh())
    if (points) announce(points, '3-minute alertness test done')
    else announce(0, 'Daily coin limit reached', true)
  }
  notify()
  return points
}
/** This test against the person's own earlier PVT-Bs (needs three before it says anything). */
export function pvtbVerdict(id, res) {
  const prev = pvtbHistory(id).filter((x) => x.at !== res.at).slice(0, 10)
  if (prev.length < 3) return { known: false, usual: null, text: `Your first few tests set your usual. ${3 - prev.length} more to go.` }
  const sorted = prev.map((x) => x.lapses).sort((a, b) => a - b)
  const usual = sorted[Math.floor(sorted.length / 2)]
  const more = res.lapses - usual
  return {
    known: true, usual, worse: more >= 3,
    text: more >= 3 ? `${res.lapses} slow responses, ${more} more than your usual ${usual}. Slow responses rise with sleep loss: protect tonight's sleep and say so if you feel it too.` : `${res.lapses} slow response${res.lapses === 1 ? '' : 's'}, in line with your usual ${usual}.`,
  }
}

/** The PVT-B joins the self-report gaps: rated well rested, but the test says otherwise. */
function pvtbGap(crewId) {
  const last = pvtbHistory(crewId)[0]
  if (!last || Date.now() - last.at > DAY) return []
  const v = pvtbVerdict(crewId, last)
  if (!v.known || !v.worse) return []
  const r = crewData(crewId).readings
  const rated = [['sleepQuality', 'sleep quality'], ['mood', 'mood']].map(([k, label]) => ({ k, label, r: r[k] })).find((x) => x.r?.latest && x.r.baseline && x.r.latest.v >= x.r.baseline.mean)
  if (!rated) return []
  return [{ id: 'pvtb-gap', rated: { label: rated.label, value: rated.r.latest.v }, measured: [{ indicator: 'reactionTime', label: 'alertness', text: `your 3-minute alertness test had ${last.lapses} slow responses, more than your usual ${v.usual}`, status: 'yellow' }] }]
}

/* ---- What Earth receives: the crew member chooses which kinds of change leave the ship ------- */
export const SHARE_GROUPS = [
  { id: 'vitals', label: 'Vital signs', hint: 'Heart rate, blood pressure, temperature, stand-up test', indicators: ['heartRate', 'bloodPressureSys', 'bloodPressureDia', 'temperature', 'orthostaticRise'] },
  { id: 'body', label: 'Body and nutrition', hint: 'Body mass, blood sugar, appetite, digestion', indicators: ['bodyMass', 'bloodSugar', 'appetite', 'digestiveComfort'] },
  { id: 'sleep', label: 'Sleep, mood and workload', hint: 'Sleep, mood, stress, the weekly check', indicators: ['sleepHours', 'sleepQuality', 'mood', 'stress', 'workload', 'moodScreen'] },
  { id: 'eyes', label: 'Eyes and alertness', hint: 'Blinking, eyelids, vision checks, reaction time', indicators: ['blinkRate', 'eyelidClosure', 'amslerDistortion', 'nearAcuity', 'reactionTime'] },
  { id: 'exposure', label: 'Exercise, strength and radiation', hint: 'Exercise, grip strength, radiation dose', indicators: ['exerciseMinutes', 'gripStrength', 'radiationDose'] },
  { id: 'symptoms', label: 'Symptoms and pain', hint: 'What you reported feeling, and where it hurts', indicators: ['symptomReport', 'painReport'] },
]
const shareKey = (id) => 'chm-share-' + id
export function shareSettings(id) {
  let s = {}
  try { s = JSON.parse(localStorage.getItem(shareKey(id)) || '{}') } catch {}
  return Object.fromEntries(SHARE_GROUPS.map((g) => [g.id, s[g.id] !== false]))
}
export function setShare(id, group, on) {
  const s = shareSettings(id)
  try { localStorage.setItem(shareKey(id), JSON.stringify({ ...s, [group]: on })) } catch {}
  notify()
}
export function sharedIndicators(id) {
  const s = shareSettings(id)
  const set = new Set(SHARE_GROUPS.filter((g) => s[g.id]).flatMap((g) => g.indicators))
  // Anything not in a group (a new indicator) follows the vital-signs choice.
  for (const i of INDICATORS) if (!SHARE_GROUPS.some((g) => g.indicators.includes(i)) && s.vitals) set.add(i)
  return set
}

/* ---- A CSV of every reading, for the flight surgeon's own tools ----------------------------- */
export function readingsCsv(crewId, days = 30) {
  const since = Date.now() - days * DAY
  const ms = (getSnapshot().measurements[crewId] ?? []).filter((m) => Date.parse(m.timestamp) >= since).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const val = (m) => (typeof m.value === 'number' ? m.value : JSON.stringify(m.value))
  const rows = [['timestamp', 'indicator', 'label', 'value', 'unit', 'quality_passed', 'quality_score', 'source']]
  for (const m of ms) rows.push([m.timestamp, m.indicator, IND[m.indicator]?.[0] ?? m.indicator, val(m), m.unit ?? '', m.quality?.passed ? 'yes' : 'no', m.quality?.score ?? '', m.source ?? ''])
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n'
}

/* ==== Body checks: pain map, stand-up test, weekly workload and mood, grip and bone loading ==== */
export const BODY_CHECKS = ['painReport', 'orthostaticRise', 'workload', 'moodScreen', 'gripStrength']
const hasReading = (id, ind) => (getSnapshot().measurements[id] ?? []).some((m) => m.indicator === ind)
/** The newest reading of one indicator, with its detail. */
export function lastReading(id, ind) {
  return (getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === ind).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] || null
}
export function readingsOf(id, ind, days = 30) {
  const since = Date.now() - days * DAY
  return (getSnapshot().measurements[id] ?? []).filter((m) => m.indicator === ind && Date.parse(m.timestamp) >= since).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

/**
 * Save one body check: its measurements (each may carry a detail) and one effort credit. Reporting
 * pain pays the symptom-report rate, because reporting early is what the app rewards most; a
 * "nothing hurts" check, the stand-up test, the weekly check and grip pay the logging rate. Never a
 * health value. Returns the coins this earns, worked out from the same daily cap the app applies.
 */
export function saveBodyCheck(id, kind, values, effort = undefined as undefined | { kind: string; detail?: string }) {
  const timestamp = new Date().toISOString()
  const e = effort || { kind: 'readingLogged', detail: kind }
  const { credited } = creditableKinds(getSnapshot().events[id] ?? [], [e], id, new Date(timestamp))
  const points = credited.length ? Math.min(POINTS[e.kind], capRoom(id)) : 0
  const NAMES = { painReport: 'Pain check', orthostaticRise: 'Stand-up test', weeklyCheck: 'Weekly check', gripStrength: 'Grip strength', resistance: 'Bone-loading session' }
  if (credited.length && !points) announce(0, 'Daily coin limit reached', true)
  if (points) announce(points, `${NAMES[kind] || 'Check'} logged`)
  void (async () => {
    for (const v of values) {
      await addMeasurement({ id: crypto.randomUUID(), crewId: id, timestamp, indicator: v.indicator, value: v.value, unit: v.unit, quality: { score: 1, passed: true }, source: 'manual', ...(v.detail ? { detail: v.detail } : {}) })
    }
    await addEvent({ id: crypto.randomUUID(), crewId: id, timestamp, kind: e.kind, ...(e.detail ? { detail: e.detail } : {}) })
    bridge.refresh()
  })()
  return points
}

/** Resistance sessions this week and over 30 days, from exercise logged with a resistance detail. */
export function boneLoading(id) {
  const all = readingsOf(id, 'exerciseMinutes', 30).filter((m) => m.detail && m.detail.type === 'resistance')
  const ws = weekStart()
  return { all, week: all.filter((m) => Date.parse(m.timestamp) >= ws) }
}

/** Pain over the last 14 days, by body area: how many days it came up and the worst rating. */
export function painSummary(id, days = 14) {
  const list = readingsOf(id, 'painReport', days)
  const byArea = {}
  for (const m of list) for (const a of (m.detail?.areas || [])) {
    const k = a.area
    const day = m.timestamp.slice(0, 10)
    byArea[k] = byArea[k] || { area: k, label: a.label, days: new Set(), worst: 0 }
    byArea[k].days.add(day)
    byArea[k].worst = Math.max(byArea[k].worst, a.level)
  }
  return {
    checks: list.length,
    painDays: new Set(list.filter((m) => (m.value?.level ?? 0) > 0).map((m) => m.timestamp.slice(0, 10))).size,
    areas: Object.values(byArea).map((x) => ({ ...x, days: x.days.size })).sort((a, b) => b.days - a.days || b.worst - a.worst),
  }
}

/** Days since the weekly check, or null if never done. */
export function weeklyCheckAge(id) {
  const m = lastReading(id, 'workload')
  return m ? Math.floor((Date.now() - Date.parse(m.timestamp)) / DAY) : null
}

/* ==== Escalation, built into the app: what to do now, and who to tell ===================== */
const MANUAL_KEY = 'chm-manual-alerts'
function manualAlerts() {
  try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '[]') } catch { return [] }
}
/** Raise an alert by hand (from Ask Orbit or a body check). It stays open until acknowledged and closed. */
export function raiseAlert(crewId, title, detail, status = 'yellow') {
  const st = alertStore()
  // Keep the list short: drop raised alerts that were closed more than three days ago.
  const keep = manualAlerts().filter((m) => { const r = st[`${m.crewId}:manual:${m.id}`]; return !(r && r.closedAt && Date.now() - r.closedAt > 3 * DAY) })
  const m = { id: crypto.randomUUID().slice(0, 8), crewId, title: String(title).slice(0, 80), detail: String(detail).slice(0, 280), status, at: Date.now() }
  try { localStorage.setItem(MANUAL_KEY, JSON.stringify([...keep, m])) } catch {}
  notify()
  return m
}

const RUNG_STEPS = {
  1: ['Rest, drink some water, and keep to the schedule.', 'Retake any reading the app could not trust.', 'Check again tomorrow so a change can show.'],
  2: ['Ask a crewmate to look at the reading with you, or run the mirror check side by side.', 'Note what you feel, not just the numbers.'],
  3: ['Tell the crew medical officer what you are seeing, with the readings that worry you.', 'Keep doing the care steps on the alert while you wait.'],
  4: ['Send the change summary to the flight surgeon on the ground.', 'Keep onboard care going: an answer cannot arrive sooner than the round-trip delay.'],
}

/**
 * Where this person is on the escalation ladder right now, worked out from their own data: open
 * alerts (and how long they have waited), patterns and their rung, regions at Act, self-report
 * gaps, a positive mood screen, and a fall in blood pressure or faintness on the stand-up test.
 * The ladder and its wording are the app's; the content behind each reason is sourced.
 */
export function escalationAdvice(crewId) {
  const cd = crewData(crewId)
  const reasons = []
  let rung = 1
  const up = (r, why) => { rung = Math.max(rung, r); reasons.push({ rung: r, why }) }
  const open = alerts().filter((a) => a.crewId === crewId && a.state !== 'closed')
  for (const a of open) {
    const e = alertEscalation(a)
    if (e.level === 2) up(4, `"${a.title}" has waited over an hour with no answer`)
    else up(a.status === 'red' ? 3 : 2, `Open alert: ${a.title}`)
  }
  for (const p of patterns(crewId)) up(Math.min(4, Math.max(1, p.rung)), `${p.title} (${p.status === 'red' ? 'Act' : 'Watch'})`)
  const red = REGIONS.filter((g) => cd.statuses[g.id] === 'red').map((g) => g.label)
  if (red.length) up(3, `${red.join(', ')} at Act`)
  const yellow = REGIONS.filter((g) => cd.statuses[g.id] === 'yellow').map((g) => g.label)
  if (yellow.length >= 2) up(2, `${yellow.length} regions at Watch`)
  else if (yellow.length) up(1, `${yellow[0]} at Watch`)
  if (gaps(crewId).length) up(2, 'How you rate yourself and what was measured disagree')
  const screen = lastReading(crewId, 'moodScreen')
  if (screen && Date.now() - Date.parse(screen.timestamp) < 14 * DAY && (screen.value.phq2 >= 3 || screen.value.gad2 >= 3)) up(3, 'The weekly mood screen was at or above the cutoff')
  const stand = lastReading(crewId, 'orthostaticRise')
  if (stand && Date.now() - Date.parse(stand.timestamp) < 2 * DAY) {
    const d = stand.detail || {}
    const fall = (d.lyingSys != null && d.standingSys != null && d.lyingSys - d.standingSys >= 20) || (d.lyingDia != null && d.standingDia != null && d.lyingDia - d.standingDia >= 10)
    if (fall || d.dizzy) up(3, fall ? 'Blood pressure fell on standing' : 'You felt faint on standing')
  }
  const cmo = medicalOfficer()
  const who = { 1: 'Self-care', 2: 'A crewmate', 3: cmo.activeName ? `${cmo.unwell ? 'Backup medical officer' : 'Crew medical officer'}: ${cmo.activeName}` : 'Crew medical officer', 4: 'Flight surgeon on the ground' }[rung]
  return {
    rung, who, rungName: RUNG_NAME[rung] || who,
    reasons: reasons.sort((a, b) => b.rung - a.rung).map((r) => r.why).slice(0, 4),
    steps: RUNG_STEPS[rung],
    canRaise: rung >= 2, canSend: rung >= 3,
    delay: formatDelay(Math.round(getState().delay)),
    openAlerts: open.length,
  }
}

/* ---- Radiation replay: sheltering is a care step --------------------------------------------- */
/** Reaching the shelter in a replayed storm counts as following a care step (+10, once a day). */
export function recordShelter(id) {
  const effort = { kind: 'countermeasureComplete', detail: 'shelter' }
  const { credited } = creditableKinds(getSnapshot().events[id] ?? [], [effort], id, new Date())
  const points = credited.length ? Math.min(POINTS.countermeasureComplete, capRoom(id)) : 0
  if (credited.length) {
    void addEvent({ id: crypto.randomUUID(), crewId: id, timestamp: new Date().toISOString(), ...effort }).then(() => bridge.refresh())
    if (points) announce(points, 'Sheltered from the solar storm')
    else announce(0, 'Daily coin limit reached', true)
  }
  return points
}

/* ---- Whose change is it? You, the whole crew, or the sensor ---------------------------------- */
/**
 * Before anyone climbs the ladder, a reading alert asks where the change comes from. Our own rule
 * of thumb, from readings the app already has (not a NASA rule, and the card says so):
 *  - the sensor: the newest reading jumped 4 SD or more while the three before it sat within 1 SD,
 *    or two of the last five readings failed their quality check;
 *  - the crew: another crew member's same indicator moved the same way (shared air, food, schedule);
 *  - you: nobody else moved, and the measurement looks sound.
 */
function sensorIssue(crewId, key) {
  const me = read(crewId, key)
  if (!me.latest || !me.baseline || me.z == null) return null
  const passed = me.history.filter((h) => h.passed)
  const before = passed.slice(-4, -1)
  const zOf = (v) => (v - me.baseline.mean) / (me.baseline.sd || 1)
  const spike = Math.abs(me.z) >= 4 && before.length === 3 && before.every((h) => Math.abs(zOf(h.v)) < 1)
  const failed = me.history.slice(-5).filter((h) => !h.passed).length
  if (spike) return 'The newest reading jumped far from your usual while the three before it were normal. Retake it before acting: a loose cuff, bad light or a misread scale can do this.'
  if (failed >= 2) return `${failed} of your last five ${me.label.toLowerCase()} readings failed the quality check. Fix the measurement first, then judge the number.`
  return null
}

export function whoseChange(a) {
  const [crewId, kind, key] = String(a.id).split(':')
  if (kind !== 'reading' || !IND[key]) return null
  const me = read(crewId, key)
  if (!me.latest || !me.baseline || me.z == null) return null
  const sensor = sensorIssue(crewId, key)
  if (sensor) return { who: 'sensor', text: sensor }
  // Another person's change counts as shared only if it is not itself a sensor problem.
  const crew = CREW.filter((c) => c.id !== crewId && c.id !== 'guest')
  const same = crew.filter((c) => { const r = read(c.id, key); return (r.status === 'yellow' || r.status === 'red') && r.z != null && Math.sign(r.z) === Math.sign(me.z) && !sensorIssue(c.id, key) })
  if (same.length) {
    const names = same.map((c) => c.name).join(' and ')
    return { who: 'crew', text: `${names} ${same.length > 1 ? 'have' : 'has'} the same change. Something shared, like cabin air, food, water or the schedule, may be behind it: check the five hazards on Body and tell the crew medical officer.` }
  }
  return { who: 'you', text: 'The rest of the crew are within their usual and the measurement looks sound, so treat this change as yours.' }
}

/* ---- Focus plan: what to work on today, and whether it worked ------------------------------- */
/**
 * The app's answer to "so what should I do?": up to three things to work on today, most serious
 * first. Each says why (your number against your usual), what to do (from the indicator's sourced
 * recommended action, or a pattern's care plan), where to do it, and the source. "I did it" saves
 * the reading's value at that moment; the next time the reading is taken, the plan says whether
 * it moved toward your usual. Nothing here is invented: the actions are the sourced text.
 */
const FOCUS_KEY = 'chm-focus'
const LOG_INDS = new Set(['bloodPressureSys', 'bloodPressureDia', 'temperature', 'bloodSugar', 'bodyMass', 'sleepHours', 'exerciseMinutes', 'reactionTime', ...BODY_CHECKS])
function focusStore() {
  try { return JSON.parse(localStorage.getItem(FOCUS_KEY) || '{}') } catch { return {} }
}
const fmtV = (r, v) => `${Math.round(v * 10 ** r.dp) / 10 ** r.dp}${r.unit ? ' ' + r.unit : ''}`
export function focusPlan(crewId) {
  const rd = crewData(crewId).readings
  const done = (focusStore()[crewId] || {})[todayKey()] || {}
  const items = []
  // 1. Readings away from your usual, red first.
  const away = Object.values(rd).filter((r) => (r.status === 'red' || r.status === 'yellow') && r.latest && r.baseline && typeof r.latest.v === 'number')
    .sort((a, b) => STATUS[b.status].sev - STATUS[a.status].sev || Math.abs(b.z || 0) - Math.abs(a.z || 0))
  for (const r of away) {
    const c = getContent(r.id)
    const action = okT(c.recommendedAction)
    if (!action) continue
    const up = r.latest.v > r.baseline.mean
    items.push({
      key: 'r:' + r.id, kind: 'reading', ind: r.id, status: r.status,
      title: `${r.label} is ${up ? 'above' : 'below'} your usual`,
      why: `Latest ${fmtV(r, r.latest.v)}, your usual is about ${fmtV(r, r.baseline.mean)}.`,
      action, go: LOG_INDS.has(r.id) ? 'manual' : 'mirror', goLabel: 'Re-check it', source: sourceFor(r.id, 'recommendedAction'),
    })
  }
  // 2. Patterns, with the first step of their care plan.
  for (const p of patterns(crewId)) {
    if (!p.care.now.length || items.some((x) => p.parts.some((q) => x.ind === q.id))) continue
    items.push({ key: 'p:' + p.id, kind: 'pattern', status: p.status, title: p.title, why: `${p.parts.map((q) => q.label).join(' + ')} moved together.`, action: p.care.now[0], go: 'bodymap', goLabel: 'Care plan', source: p.riskUrl || HRP_RISKS })
  }
  // 3. The basics NASA builds a crew day around, when nothing above fills the list.
  const ex = rd.exerciseMinutes
  const week = (ex?.history || []).filter((h) => h.passed && Date.now() - h.t < 7 * DAY).reduce((a, h) => a + h.v, 0)
  if (week / 7 < 60) items.push({ key: 'b:exercise', kind: 'basic', status: 'gray', title: 'Move more this week', why: `About ${Math.round(week / 7)} min a day over the last week; ISS crews exercise about two hours a day against bone and muscle loss.`, action: 'Fit in a resistance or cycling session today and log it.', go: 'manual', goLabel: 'Log exercise', source: 'https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/' })
  const w = intake(crewId)
  if (w.water < w.goal && new Date().getHours() >= 12) items.push({ key: 'b:water', kind: 'basic', status: 'gray', title: 'Drink to your fluid goal', why: `${w.water.toFixed(1)} of ${w.goal.toFixed(1)} L so far today.`, action: 'Crews tend to drink too little in space. Take a pouch with each meal and log it.', go: 'manual', goLabel: 'Log water', source: 'https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf' })
  const sl = rd.sleepHours
  if (sl?.latest && sl.latest.v < 7 && !items.some((x) => x.ind === 'sleepHours')) items.push({ key: 'b:sleep', kind: 'basic', status: 'gray', title: 'Protect tonight’s sleep', why: `${sl.latest.v} h last night; NASA plans an 8.5-hour sleep period.`, action: okT(getContent('sleepHours').recommendedAction) || 'Keep to the planned sleep period tonight.', go: 'schedule', goLabel: 'Schedule', source: 'https://www.nasa.gov/reference/6-0-medical-operations/' })
  return items.slice(0, 3).map((x) => ({ ...x, done: !!done[x.key] }))
}
/** "I did it": remember the reading's value now, so tomorrow can say whether it moved. */
export function markFocus(crewId, item) {
  const s = focusStore()
  const day = todayKey()
  const r = item.ind ? crewData(crewId).readings[item.ind] : null
  s[crewId] = s[crewId] || {}
  s[crewId][day] = { ...(s[crewId][day] || {}), [item.key]: { at: Date.now(), v: r?.latest?.v ?? null, title: item.title, ind: item.ind || null } }
  try { localStorage.setItem(FOCUS_KEY, JSON.stringify(s)) } catch {}
  notify()
}
/** Follow-up on earlier days' "I did it" items whose reading has been taken again since. */
export function focusFollowUps(crewId) {
  const s = focusStore()[crewId] || {}
  const out = []
  for (const [day, items] of Object.entries(s)) {
    if (day === todayKey()) continue
    for (const [key, x] of Object.entries(items)) {
      if (!x.ind || x.v == null) continue
      const r = crewData(crewId).readings[x.ind]
      if (!r?.latest || r.latest.t <= x.at || !r.baseline) continue
      const before = Math.abs(x.v - r.baseline.mean), after = Math.abs(r.latest.v - r.baseline.mean)
      const verdict = after < before * 0.85 ? 'better' : after > before * 1.15 ? 'worse' : 'same'
      out.push({ key: day + key, label: r.label, day, before: fmtV(r, x.v), after: fmtV(r, r.latest.v), verdict })
    }
  }
  return out.slice(-3)
}
