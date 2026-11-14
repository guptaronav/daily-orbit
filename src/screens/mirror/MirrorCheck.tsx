import { useState } from 'react'
import { saveSession } from '../../db/repo'
import type { MirrorSession } from '../../lib/session'
import { useApp } from '../../state/AppContext'
import { CameraCheck, type CameraResult } from './CameraCheck'
import type { CaptureDiagnostics } from '../../lib/signal/analyze'
import { Summary } from './Summary'
import { Symptoms, type SymptomResult } from './Symptoms'
import { Vision, type VisionResult } from './Vision'

type Step = 'camera' | 'vision' | 'symptoms' | 'summary'

const newSession = (retook = false): MirrorSession => ({ sessionId: crypto.randomUUID(), ...(retook ? { retookAfterQualityFail: true } : {}) })

export function MirrorCheck() {
  const { crewId, go, refresh } = useApp()
  const [step, setStep] = useState<Step>('camera')
  const [session, setSession] = useState<MirrorSession>(() => newSession())
  const [saving, setSaving] = useState(false)
  const [diagnostics, setDiagnostics] = useState<CaptureDiagnostics | null>(null)

  const onCamera = ({ analysis, selfReport, source }: CameraResult) => {
    const { heartRate, blink } = analysis
    setDiagnostics(analysis.diagnostics)
    setSession((s) => ({
      ...s,
      selfReport,
      heartRate: { bpm: heartRate.bpm, quality: heartRate.quality, source },
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
    setStep('camera')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mirror check</h1>
      {step === 'camera' && <CameraCheck onComplete={onCamera} />}
      {step === 'vision' && <Vision onComplete={onVision} />}
      {step === 'symptoms' && <Symptoms onComplete={onSymptoms} busy={saving} />}
      {step === 'summary' && <Summary crewId={crewId} sessionId={session.sessionId} diagnostics={diagnostics} onRetake={retake} onDone={() => go('bodymap')} />}
    </main>
  )
}
