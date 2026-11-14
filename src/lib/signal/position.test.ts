import { describe, expect, test } from 'vitest'
import { positionChecks, type FrameFacts } from './position'

const good: FrameFacts = { found: true, noseX: 0.5, noseY: 0.5, faceW: 0.4, luma: 130, motion: 0.005 }

describe('positionChecks', () => {
  test('a centered, well-lit, still face at a good distance is ready', () => {
    const c = positionChecks(good)
    expect(c.ready).toBe(true)
    expect(c.hint).toMatch(/hold still/i)
  })

  test('no face is not ready and says to face the camera', () => {
    const c = positionChecks({ ...good, found: false })
    expect(c.ready).toBe(false)
    expect(c.hint).toMatch(/camera/i)
  })

  test('an off-center face is not ready', () => {
    expect(positionChecks({ ...good, noseX: 0.85 }).centered).toBe(false)
    expect(positionChecks({ ...good, noseY: 0.1 }).centered).toBe(false)
  })

  test('too far and too close are told apart', () => {
    expect(positionChecks({ ...good, faceW: 0.12 })).toMatchObject({ size: 'far', ready: false })
    expect(positionChecks({ ...good, faceW: 0.8 })).toMatchObject({ size: 'close', ready: false })
  })

  test('dark and blown-out light are told apart', () => {
    expect(positionChecks({ ...good, luma: 20 })).toMatchObject({ light: 'dark', ready: false })
    expect(positionChecks({ ...good, luma: 250 })).toMatchObject({ light: 'bright', ready: false })
  })

  test('too much movement is not ready', () => {
    expect(positionChecks({ ...good, motion: 0.08 })).toMatchObject({ still: false, ready: false })
  })

  test('the hint names the single most important problem first: face, then light, then position, then stillness', () => {
    expect(positionChecks({ ...good, found: false, luma: 20 }).hint).toMatch(/camera/i)
    expect(positionChecks({ ...good, luma: 20, noseX: 0.9 }).hint).toMatch(/light/i)
    expect(positionChecks({ ...good, noseX: 0.9, motion: 0.1 }).hint).toMatch(/center/i)
  })
})
