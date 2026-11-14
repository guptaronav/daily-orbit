import { useState } from 'react'
import { saveSession } from '../../db/repo'
import { sessionEventKinds, type MirrorSession } from '../../lib/session'
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

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mirror check</h1>
      {step === 'camera' && <CameraCheck onComplete={onCamera} />}
      {step === 'vision' && <Vision onComplete={onVision} />}
      {step === 'symptoms' && <Symptoms onComplete={onSymptoms} busy={saving} />}
      {step === 'summary' && <Summary crewId={crewId} sessionId={session.sessionId} earned={sessionEventKinds(session)} diagnostics={diagnostics} trace={trace} onRetake={retake} onDone={() => go('bodymap')} />}
    </main>
  )
}
