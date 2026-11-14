import { useState } from 'react'
import { Icon } from '../../components/kit/Icon'
import { listEvents, saveSession } from '../../db/repo'
import { creditableKinds } from '../../lib/scoring'
import { sessionEventKinds, type MirrorSession } from '../../lib/session'
import type { GameEventKind } from '../../contract/types'
import { useApp } from '../../state/AppContext'
import { CameraCheck, type CameraResult } from './CameraCheck'
import type { CaptureDiagnostics, CaptureTrace } from '../../lib/signal/analyze'
import { Summary } from './Summary'
import { Symptoms, type SymptomResult } from './Symptoms'
import { Vision, type VisionResult } from './Vision'

type Step = 'camera' | 'vision' | 'symptoms' | 'summary'

/** Development only: jump into the mirror check at a step (?screen=mirror&step=vision) without a webcam. */
const devStep = (): Step => {
  const wanted = import.meta.env.DEV ? new URLSearchParams(location.search).get('step') : null
  return wanted === 'vision' || wanted === 'symptoms' || wanted === 'summary' ? wanted : 'camera'
}

/** Development only: ?step=summary&session=<id> shows the summary for records already in the local database. */
const devSessionId = (): string | undefined => (import.meta.env.DEV ? (new URLSearchParams(location.search).get('session') ?? undefined) : undefined)

const newSession = (retook = false, id?: string): MirrorSession => ({ sessionId: id ?? crypto.randomUUID(), ...(retook ? { retookAfterQualityFail: true } : {}) })

export function MirrorCheck() {
  const { crewId, go, refresh } = useApp()
  const [step, setStep] = useState<Step>(devStep)
  const [session, setSession] = useState<MirrorSession>(() => newSession(false, devSessionId()))
  const [saving, setSaving] = useState(false)
  const [diagnostics, setDiagnostics] = useState<CaptureDiagnostics | null>(null)
  const [trace, setTrace] = useState<CaptureTrace | null>(null)
  // Credit this check-in actually earns, after the once-per-day caps. Starts as the uncapped kinds (dev summary view).
  const [credit, setCredit] = useState<{ earned: GameEventKind[]; alreadyCounted: GameEventKind[] }>(() => ({ earned: sessionEventKinds(newSession()), alreadyCounted: [] }))

  const onCamera = ({ analysis, selfReport, source }: CameraResult) => {
    const { heartRate, blink } = analysis
    setDiagnostics(analysis.diagnostics)
    setTrace(analysis.trace)
    setSession((s) => ({
      ...s,
      selfReport,
      heartRate: { bpm: heartRate.bpm, estimateBpm: heartRate.estimateBpm, quality: heartRate.quality, source },
      blink: { blinkRate: blink.blinkRate, eyelidClosurePct: blink.eyelidClosurePct, quality: blink.quality, source },
    }))
    setStep('vision')
  }

  const onVision = (v: VisionResult) => {
    setSession((s) => ({ ...s, ...v }))
    setStep('symptoms')
  }

  async function onSymptoms(symptoms: SymptomResult) {
    setSaving(true)
    const { gut, ...symptomAnswers } = symptoms
    const done: MirrorSession = { ...session, selfReport: { ...session.selfReport, ...gut }, symptoms: symptomAnswers }
    setSession(done)
    const { credited, alreadyCounted } = creditableKinds(await listEvents(crewId), sessionEventKinds(done).map((kind) => ({ kind })), crewId, new Date())
    setCredit({ earned: credited.map((e) => e.kind), alreadyCounted: alreadyCounted.map((e) => e.kind) })
    await saveSession(done, crewId)
    refresh()
    setSaving(false)
    setStep('summary')
  }

  const retake = () => {
    setSession(newSession(true))
    setDiagnostics(null)
    setTrace(null)
    setStep('camera')
  }

  const STEPS: { id: Step; label: string }[] = [
    { id: 'camera', label: 'Camera' },
    { id: 'vision', label: 'Vision' },
    { id: 'symptoms', label: 'How you feel' },
    { id: 'summary', label: 'Result' },
  ]
  const atStep = STEPS.findIndex((s) => s.id === step)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-8 sm:px-8">
      {/* Where you are in the check. Announced once, not per step, so it is not chatty. */}
      <ol className="flex flex-wrap items-center gap-2" aria-label={`Mirror check, step ${atStep + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <span
              className="pill"
              aria-current={i === atStep ? 'step' : undefined}
              style={
                i <= atStep
                  ? { background: 'var(--color-ink)', color: 'var(--color-paper)' }
                  : { background: 'var(--color-paper-deep)', color: 'var(--color-muted)' }
              }
            >
              {i < atStep && <Icon name="check" size={12} />}
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <h1 className="display mt-5 mb-7 text-4xl sm:text-5xl">Mirror check</h1>
      {step === 'camera' && <CameraCheck onComplete={onCamera} />}
      {step === 'vision' && <Vision onComplete={onVision} />}
      {step === 'symptoms' && <Symptoms onComplete={onSymptoms} busy={saving} />}
      {step === 'summary' && <Summary crewId={crewId} sessionId={session.sessionId} earned={credit.earned} alreadyCounted={credit.alreadyCounted} diagnostics={diagnostics} trace={trace} onRetake={retake} onDone={() => go('bodymap')} />}
    </main>
  )
}
