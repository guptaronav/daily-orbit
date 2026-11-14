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

export type SymptomResult = { symptoms: string[]; note?: string }

export function Symptoms({ onComplete, busy }: { onComplete: (result: SymptomResult) => void; busy?: boolean }) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [note, setNote] = useState('')

  const toggle = (label: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  const submit = () => onComplete({ symptoms: [...picked], ...(note.trim() ? { note: note.trim() } : {}) })

  return (
    <section aria-labelledby="symptoms-heading" className="space-y-4">
      <h2 id="symptoms-heading" className="text-xl font-semibold tracking-tight">
        Anything feel off today?
      </h2>
      <p className="max-w-xl text-sm text-muted">Optional. Reporting early is useful and earns credit. Leave it empty if you have nothing to report.</p>
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
