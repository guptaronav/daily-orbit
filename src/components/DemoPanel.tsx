import { useEffect, useRef, useState } from 'react'
import { addMeasurements, listEvents, listMeasurements, removeEvents } from '../db/repo'
import { amslerDistortionEvent, eventsToRemove, noisyReadingEvent, sleepDeclineStep } from '../lib/demoEvents'
import { SCENARIOS, clearScenarios, runScenario } from '../proto/scenarios'
import { useApp } from '../state/AppContext'
import { linkBtn } from './ui'

const MISSED_DAYS = 3

type Action = { id: string; label: string; detail: string; run: () => Promise<string> }

/** Demo controls for recording the walkthrough. Everything it injects is ordinary data labeled simulated. */
export function DemoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { crewId, currentCrew, refresh, go, resetDemo } = useApp()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const who = currentCrew?.name ?? crewId
  const newest = async (indicator: Parameters<typeof listMeasurements>[1]) => (await listMeasurements(crewId, indicator)).at(-1)
  const newestPassed = async (indicator: Parameters<typeof listMeasurements>[1]) => (await listMeasurements(crewId, indicator)).filter((m) => m.quality.passed).at(-1)

  const actions: Action[] = [
    {
      id: 'sleep',
      label: 'Sleep decline: one more night',
      detail: 'Lowers sleep hours and quality. Press twice: the head goes yellow, then red.',
      run: async () => {
        const [sleepHours, sleepQuality] = await Promise.all([newestPassed('sleepHours'), newestPassed('sleepQuality')])
        const records = sleepDeclineStep({ crewId, now: new Date(), latest: { sleepHours, sleepQuality } })
        await addMeasurements(records)
        return `Sleep ${records[0].value} h, quality ${records[1].value} / 10`
      },
    },
    {
      id: 'noisy',
      label: 'Noisy heart-rate reading',
      detail: 'A reading that failed quality. It is recorded but never colors the heart.',
      run: async () => {
        await addMeasurements([noisyReadingEvent({ crewId, now: new Date(), latest: await newest('heartRate') })])
        return 'Failed heart-rate reading (motion). The heart region keeps its color.'
      },
    },
    {
      id: 'amsler',
      label: 'New Amsler distortion',
      detail: 'A distortion near the center of vision. The eyes go yellow.',
      run: async () => {
        await addMeasurements([amslerDistortionEvent({ crewId, now: new Date(), latest: await newest('amslerDistortion') })])
        return 'Central Amsler distortion reported'
      },
    },
    {
      id: 'missed',
      label: `Missed check-ins (last ${MISSED_DAYS} days)`,
      detail: 'Removes recent check-ins. The streak and the crew goal drop.',
      run: async () => {
        const ids = eventsToRemove(await listEvents(crewId), crewId, new Date(), MISSED_DAYS)
        await removeEvents(ids)
        return `Removed ${ids.length} check-in${ids.length === 1 ? '' : 's'}`
      },
    },
    ...SCENARIOS.map((sc) => ({ id: sc.id, label: sc.label, detail: sc.detail, run: () => runScenario(sc.id, crewId) })),
    {
      id: 'sep',
      label: 'Solar particle event',
      detail: 'Opens the radiation replay: shelter prompt and dose ledger.',
      run: async () => {
        go('radiation')
        onClose()
        return ''
      },
    },
  ]

  async function run(a: Action) {
    setBusy(true)
    const result = await a.run()
    refresh()
    setBusy(false)
    if (result) setMessage(`${who}: ${result}`)
  }

  return (
    <aside role="dialog" aria-labelledby="demo-heading" className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-ink bg-panel p-5 shadow-xl">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="demo-heading" className="text-lg font-semibold tracking-tight">
          Demo controls
        </h2>
        <button ref={closeRef} onClick={onClose} className={linkBtn}>
          Close (Esc)
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Acting on <strong>{who}</strong>. Injected data is labeled simulated and flows through the real status, escalation and points code.
      </p>
      <ul className="mt-4 space-y-3">
        {actions.map((a) => (
          <li key={a.id} className="border border-rule bg-paper p-3">
            <button onClick={() => void run(a)} disabled={busy} className="text-left text-sm font-medium text-accent underline underline-offset-4 hover:text-ink disabled:opacity-40">
              {a.label}
            </button>
            <p className="mt-1 text-xs text-muted">{a.detail}</p>
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="mt-4 min-h-10 text-sm">
        {message}
      </p>
      <button onClick={() => { onClose(); window.dispatchEvent(new Event('tour:start')) }} className={`${linkBtn} mt-2 block`}>
        Start the 60-second guided tour
      </button>
      <button onClick={() => void resetDemo().then(() => { clearScenarios(); setMessage('Demo data reset.') })} className={`${linkBtn} mt-2`}>
        Reset demo data
      </button>
    </aside>
  )
}
