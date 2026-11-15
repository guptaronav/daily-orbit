import { describe, expect, it } from 'vitest'
import { CAREER_LIMIT_MSV, careerBudget } from './radiationBudget'

describe('career radiation budget', () => {
  it('adds earlier missions, days on this mission at its rate, and event dose', () => {
    const b = careerBudget({ prior: 100, missionDays: 100, env: 'iss', eventMSv: 20 })
    expect(b.used).toBe(170)
    expect(b.remaining).toBe(CAREER_LIMIT_MSV - 170)
    expect(b.daysLeft).toBe(Math.floor(430 / 0.5))
  })
  it('burns faster in deep space than on the ISS', () => {
    const iss = careerBudget({ prior: 0, missionDays: 200, env: 'iss', eventMSv: 0 })
    const deep = careerBudget({ prior: 0, missionDays: 200, env: 'mars', eventMSv: 0 })
    expect(deep.used).toBeGreaterThan(iss.used)
  })
  it('never goes below zero remaining and marks a spent budget red', () => {
    const b = careerBudget({ prior: 590, missionDays: 50, env: 'mars', eventMSv: 0 })
    expect(b.remaining).toBe(0)
    expect(b.daysLeft).toBe(0)
    expect(b.status).toBe('red')
  })
  it('stays green early in a career', () => {
    expect(careerBudget({ prior: 0, missionDays: 30, env: 'iss', eventMSv: 0 }).status).toBe('green')
  })
})
