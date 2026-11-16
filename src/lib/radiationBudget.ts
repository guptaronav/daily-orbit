import type { EnvId } from './environments'

/*
 * Career radiation budget. NASA-STD-3001 Volume 1 [V1 4030]: "An individual crewmember's total
 * career effective radiation dose due to spaceflight radiation exposure shall be less than
 * 600 mSv. This limit is universal for all ages and sexes."
 *
 * Dose so far = earlier missions (simulated for the demo crew) + days on this mission x the
 * mission's daily rate + any solar particle event dose recorded by the radiation replay.
 * The daily rates are NASA figures for each environment, each with its source below. This is a
 * planning estimate, not dosimetry: a real crewmember wears a dosimeter.
 */

export const CAREER_LIMIT_MSV = 600
export const CAREER_LIMIT_SOURCE = 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf'

const LSAH = 'https://www.nasa.gov/wp-content/uploads/2023/10/lsah-newsletter-2023-vol28-issue2.pdf'

export const DAILY_RATE: Record<EnvId, { mSvPerDay: number; basis: string; url: string }> = {
  iss: { mSvPerDay: 0.5, basis: 'about 0.5 mSv a day on the ISS (NASA LSAH newsletter)', url: LSAH },
  lunar: { mSvPerDay: 0.5, basis: 'about 0.5 mSv a day projected on the lunar surface (NASA LSAH newsletter)', url: LSAH },
  lunarRover: { mSvPerDay: 0.5, basis: 'about 0.5 mSv a day projected on the lunar surface (NASA LSAH newsletter)', url: LSAH },
  mars: { mSvPerDay: 1, basis: 'about 1 mSv a day or more beyond low Earth orbit (NASA LSAH newsletter)', url: LSAH },
  marsSurface: {
    mSvPerDay: 0.9,
    basis: 'up to 0.9 mSv a day, NASA’s design ceiling for habitats on planetary surfaces [V1 4033]',
    url: CAREER_LIMIT_SOURCE,
  },
}

/** Earlier-mission dose for the demo crew. Simulated, and labeled so on screen. */
export const PRIOR_MISSIONS_MSV: Record<string, number> = { 'crew-1': 150, 'crew-2': 80, 'crew-3': 0, guest: 0 }

export type Budget = {
  prior: number
  mission: number
  event: number
  used: number
  remaining: number
  fraction: number
  rate: number
  /** Days at today's rate until the limit, or 0 if it is already reached. */
  daysLeft: number
  status: 'green' | 'yellow' | 'red'
}

export function careerBudget(args: { prior: number; missionDays: number; env: EnvId; eventMSv: number }): Budget {
  const rate = DAILY_RATE[args.env]?.mSvPerDay ?? 1
  const mission = Math.max(0, args.missionDays) * rate
  const used = args.prior + mission + Math.max(0, args.eventMSv)
  const remaining = Math.max(0, CAREER_LIMIT_MSV - used)
  const fraction = Math.min(1, used / CAREER_LIMIT_MSV)
  // Our own planning bands, not NASA's: half the budget is worth watching, 85% means plan now.
  const status = fraction >= 0.85 ? 'red' : fraction >= 0.5 ? 'yellow' : 'green'
  return { prior: args.prior, mission, event: Math.max(0, args.eventMSv), used, remaining, fraction, rate, daysLeft: Math.floor(remaining / rate), status }
}
