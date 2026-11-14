// Build-time only: fetches historical solar energetic particle (SEP) events from NASA DONKI and,
// for the strongest ones, the measured dose rate and proton flux from NASA CCMC iSWA.
// Writes src/data/donki-sep.json. The app never calls the network at runtime.
//
// Run: node scripts/fetch-donki.ts            (Node 24, runs TypeScript directly)
// Optional: NASA_API_KEY=... to try api.nasa.gov first. Never commit a key.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(import.meta.dirname, '..', 'src', 'data', 'donki-sep.json')
const START = '2010-01-01'
const WINDOW_DAYS = 30 // both DONKI hosts reject long ranges (CCMC: 60 days max)
const HOUR = 3_600_000
const DAY = 24 * HOUR

const API_NASA = 'https://api.nasa.gov/DONKI/SEP'
const CCMC = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP'
const ISWA = 'https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi'

// Replay window around each event onset, in hourly steps.
const HOURS_BEFORE = 24
const HOURS_AFTER = 72
const STEPS = HOURS_BEFORE + HOURS_AFTER
const CLUSTER_GAP_HOURS = 72 // SEP reports closer than this are treated as one event
const REPLAY_COUNT = 6
const MIN_COVERAGE = 0.85 // share of hourly steps that must have a measured dose rate

type DonkiSep = {
  sepID: string
  eventTime: string
  instruments: { displayName: string }[] | null
  link: string
  linkedEvents: { activityID: string }[] | null
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 19) + 'Z'
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getText(url: string, okStatuses: number[] = []): Promise<string> {
  let last: unknown
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
      if (res.ok || okStatuses.includes(res.status)) return await res.text()
      last = new Error(`HTTP ${res.status} for ${url.replace(/api_key=[^&]+/, 'api_key=***')}`)
      if (res.status === 400 || res.status === 403) break // will not improve on retry
    } catch (error) {
      last = error
    }
    await sleep(1500 * (attempt + 1))
  }
  throw last
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
      }
    }),
  )
  return out
}

function windows(startMs: number, endMs: number): [string, string][] {
  const out: [string, string][] = []
  for (let a = startMs; a <= endMs; a += WINDOW_DAYS * DAY) out.push([day(a), day(Math.min(a + (WINDOW_DAYS - 1) * DAY, endMs))])
  return out
}

async function fetchSepFrom(base: string, key?: string): Promise<DonkiSep[]> {
  const byId = new Map<string, DonkiSep>()
  const all = windows(Date.parse(START), Date.now())
  await pool(all, 2, async ([a, b]) => {
    const text = await getText(`${base}?startDate=${a}&endDate=${b}${key ? `&api_key=${key}` : ''}`)
    const rows = text.trim() ? (JSON.parse(text) as DonkiSep[]) : []
    if (!Array.isArray(rows)) throw new Error(`Unexpected DONKI response for ${a}..${b}`)
    for (const r of rows) byId.set(r.sepID, r)
  })
  return [...byId.values()].sort((x, y) => x.eventTime.localeCompare(y.eventTime))
}

async function fetchSep(): Promise<{ events: DonkiSep[]; endpoint: string }> {
  const key = process.env.NASA_API_KEY
  if (key) {
    try {
      const events = await fetchSepFrom(API_NASA, key)
      console.log(`DONKI: api.nasa.gov worked (${events.length} events)`)
      return { events, endpoint: API_NASA }
    } catch (error) {
      console.warn(`DONKI: api.nasa.gov failed (${String(error)}), trying CCMC`)
    }
  } else {
    console.log('DONKI: NASA_API_KEY not set, skipping api.nasa.gov and using CCMC')
  }
  const events = await fetchSepFrom(CCMC)
  console.log(`DONKI: ccmc.gsfc.nasa.gov worked (${events.length} events)`)
  return { events, endpoint: CCMC }
}

/** One iSWA HAPI column over a time range, as [timeMs, value] pairs. Fill and non-positive values are dropped. */
async function hapi(id: string, parameter: string, fromMs: number, toMs: number): Promise<[number, number][]> {
  const url = `${ISWA}/data?id=${id}&parameters=${parameter}&time.min=${iso(fromMs)}&time.max=${iso(toMs)}&format=csv`
  const text = await getText(url, [404]) // 404 carries a HAPI "no data" status
  if (text.trimStart().startsWith('{')) return []
  const out: [number, number][] = []
  for (const line of text.split('\n')) {
    const [t, v] = line.split(',')
    const ms = Date.parse(t)
    const value = Number(v)
    if (Number.isFinite(ms) && Number.isFinite(value) && value > 0) out.push([ms, value])
  }
  return out
}

/** Mean per hourly step; null where the hour has no measurement. */
function hourly(points: [number, number][], startMs: number): (number | null)[] {
  const sum = new Array<number>(STEPS).fill(0)
  const n = new Array<number>(STEPS).fill(0)
  for (const [ms, v] of points) {
    const i = Math.floor((ms - startMs) / HOUR)
    if (i >= 0 && i < STEPS) {
      sum[i] += v
      n[i]++
    }
  }
  return sum.map((s, i) => (n[i] ? s / n[i] : null))
}

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b)
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : NaN
}
const round = (v: number | null, digits: number) => (v === null ? null : Number(v.toPrecision(digits)))

async function main() {
  const { events, endpoint } = await fetchSep()
  if (events.length === 0) throw new Error('DONKI returned no SEP events')

  // Only reports from a GOES instrument (near Earth) set the onset. Reports of the same storm arrive
  // minutes to days apart (several energy channels), so close ones are grouped into one event.
  const isGoes = (e: DonkiSep) => (e.instruments ?? []).some((i) => i.displayName.startsWith('GOES'))
  const nearEarth: DonkiSep[][] = []
  for (const e of events.filter(isGoes)) {
    const last = nearEarth.at(-1)
    if (last && Date.parse(e.eventTime) - Date.parse(last.at(-1)!.eventTime) <= CLUSTER_GAP_HOURS * HOUR) last.push(e)
    else nearEarth.push([e])
  }
  const instrumentsOf = (c: DonkiSep[]) => [...new Set(c.flatMap((e) => (e.instruments ?? []).map((i) => i.displayName)))]
  console.log(`${nearEarth.length} separate events reported by a GOES instrument near Earth`)

  // Measured dose rate at the Moon (LRO CRaTER, detector pair D3/D4) around each onset.
  const candidates = await pool(nearEarth, 4, async (cluster) => {
    const onsetMs = Date.parse(cluster[0].eventTime)
    const startMs = onsetMs - HOURS_BEFORE * HOUR
    const points = await hapi('CRaTER', 'd3_4_dose_rate', startMs, startMs + STEPS * HOUR)
    const mGyPerH = hourly(points, startMs).map((v) => (v === null ? null : (v * 10) / 24)) // cGy/day -> mGy/h
    const before = mGyPerH.slice(0, HOURS_BEFORE).filter((v): v is number => v !== null)
    const quiet = median(before)
    const have = mGyPerH.filter((v) => v !== null).length
    const added = mGyPerH.reduce<number>((a, v) => a + (v === null ? 0 : Math.max(v - quiet, 0)), 0)
    const usable = have / STEPS >= MIN_COVERAGE && before.length >= HOURS_BEFORE * 0.75
    return { cluster, onsetMs, startMs, mGyPerH, quiet, added, usable }
  })

  const chosen = candidates
    .filter((c) => c.usable)
    .sort((a, b) => b.added - a.added)
    .slice(0, REPLAY_COUNT)
    .sort((a, b) => a.onsetMs - b.onsetMs)
  if (chosen.length === 0) throw new Error('No SEP event had enough CRaTER dose-rate coverage to replay')

  const replays = await pool(chosen, 3, async (c) => {
    const flux = hourly(await hapi('goesp_part_flux_P5M', 'P10', c.startMs, c.startMs + STEPS * HOUR), c.startMs)
    const first = c.cluster[0]
    return {
      id: first.sepID,
      onset: iso(c.onsetMs),
      start: iso(c.startMs),
      stepMinutes: 60,
      link: first.link,
      instruments: instrumentsOf(c.cluster),
      linkedEvents: [...new Set(c.cluster.flatMap((e) => (e.linkedEvents ?? []).map((l) => l.activityID)))],
      reportCount: c.cluster.length,
      quietRateMGyPerH: round(c.quiet, 4),
      doseRateMGyPerH: c.mGyPerH.map((v) => round(v, 4)),
      protonFluxPfu: flux.map((v) => round(v, 4)),
    }
  })

  const perYear: Record<string, number> = {}
  for (const e of events) perYear[e.eventTime.slice(0, 4)] = (perYear[e.eventTime.slice(0, 4)] ?? 0) + 1

  const out = {
    generatedAt: new Date().toISOString(),
    sources: {
      events: { name: 'NASA DONKI solar energetic particle (SEP) events', endpoint, range: [START, day(Date.now())] },
      doseRate: {
        name: 'LRO CRaTER dose rates, detector pair D3/D4, via NASA CCMC iSWA',
        endpoint: `${ISWA}/data?id=CRaTER&parameters=d3_4_dose_rate`,
        unit: 'mGy/h (converted from cGy/day)',
      },
      protonFlux: {
        name: 'GOES primary >10 MeV proton flux, 5-minute, via NASA CCMC iSWA',
        endpoint: `${ISWA}/data?id=goesp_part_flux_P5M&parameters=P10`,
        unit: 'protons/(cm^2 s sr)',
      },
    },
    eventCount: events.length,
    eventsPerYear: perYear,
    selection: `The ${REPLAY_COUNT} events seen near Earth by GOES with the largest measured dose above the pre-event level at LRO CRaTER, with at least ${MIN_COVERAGE * 100}% hourly coverage. Window: ${HOURS_BEFORE} h before to ${HOURS_AFTER} h after the first GOES report in DONKI.`,
    replays,
  }
  writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
  console.log(`Wrote ${OUT}: ${events.length} events, ${replays.length} replays (${replays.map((r) => r.onset.slice(0, 10)).join(', ')})`)
}

main().catch((error) => {
  console.error('fetch-donki FAILED:', error)
  process.exit(1)
})
