import { useState } from 'react'
import { saveSession } from '../../db/repo'
import type { MirrorSession } from '../../lib/session'
import { useApp } from '../../state/AppContext'
import { Summary } from './Summary'
import { Symptoms, type SymptomResult } from './Symptoms'
import { Vision, type VisionResult } from './Vision'

// 'position' and 'capture' (webcam heart rate + blink) are added in plan Task 8.
type Step = 'vision' | 'symptoms' | 'summary'

const newSession = (retook = false): MirrorSession => ({ sessionId: crypto.randomUUID(), ...(retook ? { retookAfterQualityFail: true } : {}) })

export function MirrorCheck() {
  const { crewId, go, refresh } = useApp()
  const [step, setStep] = useState<Step>('vision')
  const [session, setSession] = useState<MirrorSession>(() => newSession())
  const [saving, setSaving] = useState(false)

  const onVision = (v: VisionResult) => {
    setSession((s) => ({ ...s, ...v }))
    setStep('symptoms')
  }

  async function onSymptoms(symptoms: SymptomResult) {
    setSaving(true)
    const done: MirrorSession = { ...session, symptoms }
    setSession(done)
    await saveSession(done, crewId)
    refresh()
    setSaving(false)
    setStep('summary')
  }

  const retake = () => {
    setSession(newSession(true))
    setStep('vision')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mirror check</h1>
      {step === 'vision' && <Vision onComplete={onVision} />}
      {step === 'symptoms' && <Symptoms onComplete={onSymptoms} busy={saving} />}
      {step === 'summary' && <Summary crewId={crewId} sessionId={session.sessionId} onRetake={retake} onDone={() => go('bodymap')} />}
    </main>
  )
}
