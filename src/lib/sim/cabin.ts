/*
 * Simulated cabin air (carbon dioxide) for the hostile-closed-environment hazard. The app has no
 * cabin sensor, so these numbers are a labeled simulation: a steady level for the vehicle with
 * day-to-day wobble and the occasional build-up, shown against the NASA limit. The limit and the
 * facts come from the sources noted beside them; the simulated levels do not.
 */

export type CabinPoint = { day: string; value: number }

export const CABIN = {
  unit: 'mmHg',
  /** NASA's cabin CO2 limit, from limitUrl. Null until sourced. */
  limit: 3 as number | null,
  limitText: "The system shall limit the average one-hour CO2 partial pressure (ppCO2) in the habitable volume to no more than 3 mmHg. (NASA-STD-3001 Vol 2 [V2 6004])",
  limitUrl: "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf",
  /** Keeping the 7-day average below this keeps headache risk under 1% (same NASA brief). */
  weekLimit: 2.5,
  weekLimitText: "To keep the risk of headache below 1%, average 7-day CO2 needs to be maintained below 2.5 mmHg (current ISS range: 1 to 9 mmHg).",
  facts: [{"text": "Past missions linked headaches to CO2 levels of 2.8-4.5 mmHg. In one study, 19 of 49 ISS astronauts reported headaches.", "url": "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf"}, {"text": "Indoor air on Earth holds about 0.08% to 0.1% CO2 (0.608 to 0.76 mmHg). Spacecraft have no plants to clear CO2, so they rely on removal equipment.", "url": "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf"}, {"text": "Since a 2016 flight rule, ISS CO2 has stayed at or below a 3 mmHg 24-hour average, with occasional brief higher spikes.", "url": "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf"}, {"text": "Headaches and vision changes are the most common symptoms in spaceflight. Fluid shifts in weightlessness can cause CO2-like symptoms, including headaches.", "url": "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf"}, {"text": "Noise can harm hearing and also cause irritation, headaches and poorer sleep. Crews may stop noticing loud noise, so it must be measured.", "url": "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-035-acoustics.pdf"}, {"text": "NASA's standard requires spacecraft to show crews real-time pressure, humidity, temperature, O2 and CO2, and alert them when values leave safe limits.", "url": "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf"}] as { text: string; url: string }[],
}

/** The simulated typical level per environment (an assumption, labeled as simulated on screen). */
export const SIM_LEVEL: Record<string, number> = { iss: 2.3, lunar: 2.3, lunarRover: 2.3, mars: 2.3, marsSurface: 2.3 }

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261)
const rand = (seed: number) => ((seed * 1103515245 + 12345) >>> 0) / 4294967296

/** Seven simulated days of cabin CO2, oldest first, the same for everyone on the same mission. */
export function cabinSeries(envId: string, now: Date, faultDay?: string | null): CabinPoint[] {
  const base = SIM_LEVEL[envId] ?? 2.5
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86_400_000)
    const day = d.toISOString().slice(0, 10)
    const r = rand(hash(envId + day))
    // Mostly a small wobble; about one day in seven a scrubber struggles and the level climbs.
    const value = base * (0.9 + r * 0.2) + (r > 0.86 ? base * 0.9 : 0)
    // A demo scrubber fault: today's level climbs well past the limit.
    if (faultDay && day === faultDay) return { day, value: Math.round(base * 2.4 * 10) / 10 }
    return { day, value: Math.round(value * 10) / 10 }
  })
}
