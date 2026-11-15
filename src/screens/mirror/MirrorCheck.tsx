import { useState } from 'react'
import { Icon } from '../../components/kit/Icon'
import { listEvents, saveSession } from '../../db/repo'
import { POINTS, creditableKinds } from '../../lib/scoring'
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
  const { crewId, crew, go, refresh } = useApp()
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
    const pts = credited.reduce((sum, e) => sum + POINTS[e.kind], 0)
    if (pts) window.dispatchEvent(new CustomEvent('chm:coins', { detail: { n: pts, why: 'Mirror check done' } }))
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

  const STEPS: { id: Step; label: string; hint: string }[] = [
    { id: 'camera', label: 'Camera', hint: 'Pulse and blinking, about a minute' },
    { id: 'vision', label: 'Vision', hint: 'Amsler grid and a near-vision test' },
    { id: 'symptoms', label: 'How you feel', hint: 'Optional, and it earns credit' },
    { id: 'summary', label: 'Result', hint: 'Compared with your own baseline' },
  ]
  const atStep = STEPS.findIndex((s) => s.id === step)
  const name = crewId === 'guest' ? 'guest' : (crew.find((c) => c.id === crewId)?.name ?? '')
  // What finishing pays: the full set before the check, then what the daily cap actually let through.
  const offered = sessionEventKinds(newSession()).reduce((sum, k) => sum + POINTS[k], 0)
  const earned = credit.earned.reduce((sum, k) => sum + POINTS[k], 0)
  const C = 2 * Math.PI * 27
  const frac = step === 'summary' ? 1 : atStep / (STEPS.length - 1)

  return (
    <main className="mc-page" style={{ width: '100%', maxWidth: 1440, margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 20 }}>
        <div style={{ flex: '2 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, padding: '8px 0', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Mirror check{name ? ` · ${name}` : ''}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
            One minute
            <br />
            in the mirror.
          </h1>
          <p style={{ margin: 0, maxWidth: 560, fontSize: 17, lineHeight: 1.5, color: 'var(--muted)' }}>
            The camera reads your pulse and blinking, then two quick vision checks and how you feel. Bad light? It refuses to guess.
          </p>
        </div>

        <section aria-label="Today's check" style={{ flex: '1 1 340px', padding: 22, borderRadius: 28, background: '#14181f', color: '#f3f1ea', display: 'flex', flexDirection: 'column', gap: 16, animation: 'lg-rise 520ms 80ms cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="68" height="68" viewBox="0 0 64 64" aria-hidden="true" style={{ flex: '0 0 auto' }}>
              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(243,241,234,.14)" strokeWidth="7" />
              <circle cx="32" cy="32" r="27" fill="none" stroke="#f6c445" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dasharray 600ms cubic-bezier(.22,1,.36,1)' }} />
              <text x="32" y="37" textAnchor="middle" fill="#f3f1ea" fontSize="16" fontWeight="750">
                {atStep + 1}/{STEPS.length}
              </text>
            </svg>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Today’s check</p>
              <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'rgba(243,241,234,.7)' }}>
                {step === 'summary' ? 'Done. Nice work.' : `Step ${atStep + 1}: ${STEPS[atStep].hint}`}
              </p>
            </div>
          </div>

          {/* Where you are in the check. Announced once, not per step, so it is not chatty. */}
          <ol aria-label={`Mirror check, step ${atStep + 1} of ${STEPS.length}`} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {STEPS.map((s, i) => {
              const done = i < atStep || step === 'summary'
              const now = i === atStep && step !== 'summary'
              return (
                <li key={s.id} aria-current={i === atStep ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 14, background: now ? 'rgba(246,196,69,.16)' : 'rgba(243,241,234,.06)', transition: 'background-color 300ms ease' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 99, background: done ? '#f6c445' : now ? 'transparent' : 'rgba(243,241,234,.14)', border: now ? '2px solid #f6c445' : 0, color: '#14181f', flex: '0 0 auto' }}>
                    {done && <Icon name="check" size={12} />}
                  </span>
                  <span style={{ fontSize: 14.5, fontWeight: now ? 700 : 550, color: done ? 'rgba(243,241,234,.65)' : '#f3f1ea' }}>{s.label}</span>
                </li>
              )
            })}
          </ol>

          <p style={{ margin: 'auto 0 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 650 }}>
            <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 99, background: 'radial-gradient(circle at 35% 35%, #ffe08a, #f6c445 55%, #c9962b)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.2)' }} />
            {step === 'summary'
              ? earned > 0
                ? `+${earned} coins earned`
                : 'Already counted today, no new coins'
              : `Up to +${offered} coins when you finish`}
          </p>
        </section>
      </div>

      <section key={step} className="mc-panel" style={{ borderRadius: 32, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(20px, 3vw, 36px)', animation: 'lg-rise 520ms 120ms cubic-bezier(.22,1,.36,1) both' }}>
        {step === 'camera' && <CameraCheck onComplete={onCamera} />}
        {step === 'vision' && <Vision onComplete={onVision} />}
        {step === 'symptoms' && <Symptoms onComplete={onSymptoms} busy={saving} />}
        {step === 'summary' && <Summary crewId={crewId} sessionId={session.sessionId} earned={credit.earned} alreadyCounted={credit.alreadyCounted} diagnostics={diagnostics} trace={trace} onRetake={retake} onDone={() => go('bodymap')} />}
      </section>
    </main>
  )
}
