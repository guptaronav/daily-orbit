import { useState } from 'react'
import { btnPrimary } from '../../components/ui'

// Quick-pick list only, no scoring and no thresholds. Reporting any of these earns credit.
const OPTIONS = [
  'Headache',
  'Nausea',
  'Dizziness',
  'Blurred or changed vision',
  'Unusual fatigue',
  'Heart racing or palpitations',
  'Trouble breathing',
  'Back or joint pain',
  'Skin rash or irritation',
  'Trouble sleeping',
  'Low mood or irritability',
] as const

export type GutAnswers = Partial<Record<'appetite' | 'digestiveComfort', number>>
export type SymptomResult = { symptoms: string[]; note?: string; gut: GutAnswers }

const GUT: { key: 'appetite' | 'digestiveComfort'; label: string; hint: string }[] = [
  { key: 'appetite', label: 'How is your appetite?', hint: '0 none, 10 strong' },
  { key: 'digestiveComfort', label: 'How comfortable is your digestion?', hint: '0 very uncomfortable, 10 no discomfort' },
]

export function Symptoms({ onComplete, busy }: { onComplete: (result: SymptomResult) => void; busy?: boolean }) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [note, setNote] = useState('')
  const [gut, setGut] = useState<GutAnswers>({})

  const toggle = (label: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  const submit = () => onComplete({ symptoms: [...picked], gut, ...(note.trim() ? { note: note.trim() } : {}) })

  return (
    <section aria-labelledby="symptoms-heading" className="space-y-4">
      <h2 id="symptoms-heading" className="text-xl font-semibold tracking-tight">
        Anything feel off today?
      </h2>
      <p className="max-w-xl text-sm text-muted">Optional. Reporting early is useful and earns credit. Leave it empty if you have nothing to report.</p>
      <div className="max-w-xl space-y-3 border border-rule bg-panel p-4">
        <h3 className="text-sm font-semibold">Gut and nutrition (optional)</h3>
        {GUT.map(({ key, label, hint }) => {
          const value = gut[key]
          return (
            <label key={key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
              <span>
                {label} <span className="text-xs text-muted">({hint})</span>
              </span>
              <span className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={value ?? 5}
                  aria-valuetext={value === undefined ? 'not answered' : String(value)}
                  onChange={(e) => setGut((g) => ({ ...g, [key]: Number(e.target.value) }))}
                />
                <span className={`w-12 text-right ${value === undefined ? 'text-muted' : 'font-medium'}`}>{value ?? 'skip'}</span>
              </span>
            </label>
          )
        })}
      </div>
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Symptoms</legend>
        {OPTIONS.map((label) => (
          <label key={label} className="flex items-center gap-2 border border-rule bg-panel px-3 py-2 text-sm">
            <input type="checkbox" checked={picked.has(label)} onChange={() => toggle(label)} />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm">
        Anything else (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          className="mt-1 block w-full border border-rule bg-panel p-2"
        />
      </label>
      <button onClick={submit} disabled={busy} className={btnPrimary}>
        Save and see results
      </button>
    </section>
  )
}
