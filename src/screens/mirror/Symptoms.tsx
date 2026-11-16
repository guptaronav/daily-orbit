import { useState } from 'react'
import { OptionalSlider } from '../../components/OptionalSlider'

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
    <section aria-labelledby="symptoms-heading" className="mc-stack">
      <div className="mc-stack-sm">
        <p className="mc-kicker">Step 3 · How you feel · optional</p>
        <h2 id="symptoms-heading" className="mc-h2">
          Anything feel off today?
        </h2>
        <p className="mc-lead">Reporting early helps the most, and earns the biggest bonus. Nothing to report? Just save.</p>
      </div>
      <div className="mc-row" style={{ alignItems: 'stretch' }}>
        <button onClick={submit} disabled={busy} className="mc-btn">
          {picked.size || note.trim() ? 'Save and see results' : 'Nothing to report, see results'}
        </button>
      </div>
      <fieldset className="mc-symptoms">
        <legend className="mc-kicker">Tap any that apply</legend>
        {OPTIONS.map((label) => (
          <label key={label} className={picked.has(label) ? 'mc-sym mc-sym-on' : 'mc-sym'}>
            <input type="checkbox" checked={picked.has(label)} onChange={() => toggle(label)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <div className="mc-feel" style={{ maxWidth: 640 }}>
        <p className="mc-kicker">Gut and nutrition · optional</p>
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
      <label className="block font-semibold" style={{ maxWidth: 640 }}>
        Anything else (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          className="field mt-1.5 block"
        />
      </label>
      <div className="mc-row">
        <button onClick={submit} disabled={busy} className="mc-btn">
          Save and see results
        </button>
      </div>
    </section>
  )
}
