import { useState } from 'react'
import { OptionalSlider } from '../../components/OptionalSlider'
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
      <h2 id="symptoms-heading" className="text-2xl font-bold tracking-tight">
        Anything feel off today?
      </h2>
      <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted">Optional. Reporting early is useful and earns credit. Leave it empty if you have nothing to report.</p>
      <div className="card max-w-xl space-y-3 p-5">
        <h3 className="font-bold">Gut and nutrition (optional)</h3>
        {GUT.map(({ key, label, hint }) => (
          <OptionalSlider
            key={key}
            label={label}
            hint={hint}
            value={gut[key]}
            onChange={(v) => setGut(({ [key]: _dropped, ...rest }) => (v === undefined ? rest : { ...rest, [key]: v }))}
          />
        ))}
      </div>
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Symptoms</legend>
        {OPTIONS.map((label) => (
          <label
            key={label}
            className="card flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-2.5"
            style={picked.has(label) ? { borderColor: 'var(--color-ink)', background: 'var(--color-accent-wash)' } : undefined}
          >
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={picked.has(label)} onChange={() => toggle(label)} />
            <span className="font-medium">{label}</span>
          </label>
        ))}
      </fieldset>
      <label className="block font-semibold">
        Anything else (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          className="field mt-1.5 block"
        />
      </label>
      <button onClick={submit} disabled={busy} className={btnPrimary}>
        Save and see results
      </button>
    </section>
  )
}
