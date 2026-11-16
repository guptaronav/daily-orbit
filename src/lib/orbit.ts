/*
 * Where Earth and Mars really are today, and so how long a message really takes.
 *
 * Positions come from JPL's "Approximate Positions of the Planets" (E. M. Standish), Table 1:
 * Keplerian elements and their rates, valid 1800 AD to 2050 AD. Accurate to well under a percent
 * of the Earth–Mars distance, which is all a message delay needs. Pure math, so it works offline.
 * https://ssd.jpl.nasa.gov/planets/approx_pos.html
 *
 * Solar conjunction: when Mars sits close to the Sun in Earth's sky, the Sun's corona can corrupt
 * radio signals, so NASA pauses commanding its Mars spacecraft. NASA's 2015 release gives the
 * window as the Sun within two degrees of Mars. https://www.jpl.nasa.gov/news/mars-missions-to-pause-commanding-in-june-due-to-sun/
 */

export const ORBIT_SOURCE = 'https://ssd.jpl.nasa.gov/planets/approx_pos.html'
export const CONJUNCTION_SOURCE = 'https://www.jpl.nasa.gov/news/mars-missions-to-pause-commanding-in-june-due-to-sun/'

/** Within this many degrees of the Sun, NASA treats Mars as in solar conjunction. */
export const CONJUNCTION_DEG = 2

const AU_LIGHT_SECONDS = 499.004784 // light time for one astronomical unit
const AU_KM = 149_597_870.7
const RAD = Math.PI / 180

type Elements = { a: number; e: number; I: number; L: number; peri: number; node: number }
// [value at J2000, rate per Julian century]
const EARTH = { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364], node: [0, 0] }
const MARS = { a: [1.52371034, 0.00001847], e: [0.0933941, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343] }

/** Julian centuries since J2000.0 (2000-01-01 12:00 TT; the TT-UTC offset is far below what matters here). */
const centuries = (date: Date) => (date.getTime() / 86_400_000 + 2_440_587.5 - 2_451_545) / 36_525

function at(el: Record<keyof Elements, number[]>, T: number): Elements {
  const v = (k: keyof Elements) => el[k][0] + el[k][1] * T
  return { a: v('a'), e: v('e'), I: v('I'), L: v('L'), peri: v('peri'), node: v('node') }
}

/** Heliocentric position in the J2000 ecliptic frame, in au. */
export function heliocentric(body: 'earth' | 'mars', date: Date): [number, number, number] {
  const k = at(body === 'earth' ? EARTH : MARS, centuries(date))
  const w = k.peri - k.node
  let M = (k.L - k.peri) % 360
  if (M > 180) M -= 360
  if (M < -180) M += 360
  // Kepler's equation, in degrees as JPL lays it out.
  const eStar = k.e / RAD
  let E = M + eStar * Math.sin(M * RAD)
  for (let i = 0; i < 30; i++) {
    const dE = (M - (E - eStar * Math.sin(E * RAD))) / (1 - k.e * Math.cos(E * RAD))
    E += dE
    if (Math.abs(dE) <= 1e-6) break
  }
  const xp = k.a * (Math.cos(E * RAD) - k.e)
  const yp = k.a * Math.sqrt(1 - k.e * k.e) * Math.sin(E * RAD)
  const [cw, sw, cO, sO, cI, sI] = [Math.cos(w * RAD), Math.sin(w * RAD), Math.cos(k.node * RAD), Math.sin(k.node * RAD), Math.cos(k.I * RAD), Math.sin(k.I * RAD)]
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    sw * sI * xp + cw * sI * yp,
  ]
}

export type MarsLink = {
  /** Earth–Mars distance in au and km. */
  au: number
  km: number
  /** One-way light time in seconds. */
  delaySec: number
  /** Angle between the Sun and Mars as seen from Earth, in degrees. */
  sunAngleDeg: number
  /** True while Mars is within CONJUNCTION_DEG of the Sun: no reliable link to Earth. */
  blackout: boolean
}

export function marsLink(date: Date): MarsLink {
  const e = heliocentric('earth', date)
  const m = heliocentric('mars', date)
  const d = [m[0] - e[0], m[1] - e[1], m[2] - e[2]]
  const au = Math.hypot(...d)
  // Angle at Earth between the direction to the Sun (-e) and the direction to Mars (d).
  const cos = -(e[0] * d[0] + e[1] * d[1] + e[2] * d[2]) / (Math.hypot(...e) * au)
  const sunAngleDeg = Math.acos(Math.max(-1, Math.min(1, cos))) / RAD
  return { au, km: au * AU_KM, delaySec: au * AU_LIGHT_SECONDS, sunAngleDeg, blackout: sunAngleDeg < CONJUNCTION_DEG }
}

/** The next blackout window starting from `from`, searched a day at a time up to `days` ahead. */
export function nextBlackout(from: Date, days = 900): { start: Date; end: Date } | null {
  const DAY = 86_400_000
  let start: Date | null = null
  for (let i = 0; i <= days; i++) {
    const t = new Date(from.getTime() + i * DAY)
    const b = marsLink(t).blackout
    if (b && !start) start = t
    if (!b && start) return { start, end: t }
  }
  return start ? { start, end: new Date(from.getTime() + days * DAY) } : null
}
