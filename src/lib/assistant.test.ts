import { describe, expect, it } from 'vitest'
import { buildIndex, redFlag, search, type Passage } from './assistant'

const P: Passage[] = [
  { id: 'sleep', title: 'Sleep duration: why check it', text: 'Sleep loss and fatigue lower alertness and slow reaction time.' },
  { id: 'co2', title: 'Cabin carbon dioxide', text: 'Past missions linked headaches to CO2 levels of 2.8 to 4.5 mmHg.' },
  { id: 'water', title: 'Water intake', text: 'Drink fluid on purpose; fluid shifts can make you drink less.' },
  { id: 'sans', title: 'Amsler grid: SANS', text: 'Fluid shifts toward the head can fold the retina and blur vision.' },
]
const idx = buildIndex(P)

describe('assistant search', () => {
  it('finds the passage for a plain-language symptom', () => {
    expect(search(idx, 'I have a headache')[0].p.id).toBe('co2')
    expect(search(idx, 'I feel so tired')[0].p.id).toBe('sleep')
    expect(search(idx, 'how much should I drink')[0].p.id).toBe('water')
    expect(search(idx, 'my eyes are blurry')[0].p.id).toBe('sans')
  })
  it('returns nothing rather than something irrelevant', () => {
    expect(search(idx, 'what is the capital of France')).toEqual([])
  })
})

describe('red flags', () => {
  it('catches warning signs before any search', () => {
    expect(redFlag('I have chest pain')?.id).toBe('chest')
    expect(redFlag("I can't breathe properly")?.id).toBe('breath')
    expect(redFlag('I passed out after exercise')?.id).toBe('faint')
    expect(redFlag('worst headache of my life')?.id).toBe('head')
  })
  it('leaves ordinary questions alone', () => {
    expect(redFlag('I have a headache')).toBeNull()
    expect(redFlag('how much water should I drink')).toBeNull()
  })
})
