import { useEffect, useRef, useState } from 'react'
import { BodyFigureMap } from './BodyFigureMap'
import { getContent } from '../lib/content'
import * as D from './data'
import { bridge } from './store'
import { painColor, useCrewId } from './shared'
import { openEscalation } from './EscalationAdvice'

/*
 * Body checks: four short checks that cover what the camera and the daily forms do not.
 *
 *  - Pain map: tap where it hurts, front or back, and rate it. "Nothing hurts" is a reading too.
 *  - Stand-up test: pulse (and blood pressure) lying, then standing, for gravity changes.
 *  - Weekly check: NASA-TLX workload (raw) plus the PHQ-2 and GAD-2 mood screens.
 *  - Strength: grip strength each week, and resistance (bone-loading) sessions.
 *
 * Every check pays for doing it, never for the result. Reporting pain pays the symptom-report rate,
 * because reporting early is what the app rewards most. Text that explains a result comes from the
 * indicator's sourced content (src/content/indicators.json); the cutoffs are the published ones.
 */

type Tab = 'pain' | 'stand' | 'weekly' | 'strength'
const TAB_KEY = 'chm-bodycheck-tab'
/** Open the Log page on one body check (used by Today's quick actions). */
export function openBodyCheck(tab: Tab) {
  try {
    sessionStorage.setItem(TAB_KEY, tab)
  } catch {
    // Opens on the first tab instead.
  }
  bridge.go?.('manual' as never)
}

const card = { borderRadius: 18, background: 'var(--panel-2)', padding: 16, display: 'grid', gap: 12, alignContent: 'start' } as const
const label = { fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 } as const
const input = { minHeight: 42, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', fontSize: 15, width: '100%', boxSizing: 'border-box' } as const
const primary = (on = true) => ({ minHeight: 46, padding: '0 18px', borderRadius: 14, border: 0, background: on ? '#14181f' : 'var(--paper-deep)', color: on ? '#f3f1ea' : 'var(--muted)', boxShadow: on ? '0 4px 0 #000' : 'none', fontWeight: 750, fontSize: 15, cursor: on ? 'pointer' : 'not-allowed' }) as const
const ghost = { minHeight: 40, padding: '0 14px', borderRadius: 12, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' } as const

function Coins({ n }: { n: number }) {
  if (!n) return null
  return <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#a8740a', animation: 'fw-coin 1100ms ease-out forwards' }}>+{n}</span>
}

function Note({ tone = 'info', children }: { tone?: 'info' | 'watch' | 'act' | 'ok'; children: React.ReactNode }) {
  const bg = { info: 'var(--panel)', watch: 'rgba(183,121,31,.12)', act: 'rgba(179,38,30,.1)', ok: 'rgba(47,125,79,.1)' }[tone]
  const bd = { info: 'var(--rule)', watch: 'var(--watch)', act: 'var(--act)', ok: 'var(--ok)' }[tone]
  return <div style={{ padding: '10px 12px', borderRadius: 12, background: bg, border: `1.5px solid ${bd}`, fontSize: 14, lineHeight: 1.5 }}>{children}</div>
}

function Sourced({ ind }: { ind: string }) {
  const c = getContent(ind as never)
  return <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{c.whyCheck}</p>
}

/* ---------------------------------------------------------------- Pain map */

type Area = { area: string; label: string; level: number; kind: string }
const KINDS = ['Ache', 'Sharp', 'Stiff', 'Numb or tingling']

function PainMap() {
  const id = useCrewId()
  const [back, setBack] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ points: number; level: number } | null>(null)
  const pick = (z: { id: string; label: string }) => {
    setSaved(null)
    if (!areas.find((a) => a.area === z.id)) setAreas((l) => [...l, { area: z.id, label: z.label, level: 3, kind: 'Ache' }])
    setEditing(z.id)
  }
  const upd = (aid: string, patch: Partial<Area>) => setAreas((l) => l.map((a) => (a.area === aid ? { ...a, ...patch } : a)))
  const save = (none = false) => {
    const list = none ? [] : areas
    const level = list.reduce((m, a) => Math.max(m, a.level), 0)
    const points = D.saveBodyCheck(id, 'painReport', [{ indicator: 'painReport', value: { level, areas: list }, unit: '0-10', detail: { areas: list } }], level > 0 ? { kind: 'symptomReported', detail: 'pain' } : undefined)
    setSaved({ points, level })
    setAreas([])
    setEditing(null)
  }
  const sum = D.painSummary(id) as { checks: number; painDays: number; areas: { area: string; label: string; days: number; worst: number }[] }
  const cur = areas.find((a) => a.area === editing)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ ...card, flex: '0 1 280px', justifyItems: 'center' }}>
        <div role="group" aria-label="Body side" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'var(--paper-deep)' }}>
          {[false, true].map((b) => (
            <button key={String(b)} type="button" aria-pressed={back === b} onClick={() => setBack(b)} style={{ minHeight: 34, padding: '0 14px', borderRadius: 999, border: 0, background: back === b ? 'var(--panel)' : 'transparent', color: back === b ? 'var(--ink)' : 'var(--muted)', fontWeight: 650, fontSize: 13.5, cursor: 'pointer' }}>
              {b ? 'Back' : 'Front'}
            </button>
          ))}
        </div>
        <BodyFigureMap back={back} areas={areas} editing={editing} onPick={pick} />
        <span style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center' }}>{back ? 'Seen from behind: their left is your left.' : 'Facing you: their right is on your left.'}</span>
      </div>

      <div style={{ ...card, flex: '1 1 300px' }}>
        <p style={label}>Where it hurts today</p>
        {areas.length === 0 && !saved && <p style={{ margin: 0, fontSize: 14.5, color: 'var(--muted)' }}>Tap an area on the body. If nothing hurts, say so: that is a useful reading too.</p>}
        {areas.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {areas.map((a) => (
              <li key={a.area} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: editing === a.area ? 'var(--panel)' : 'transparent', border: `1.5px solid ${editing === a.area ? 'var(--ink)' : 'var(--rule)'}` }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 99, background: painColor(a.level) }} />
                <button type="button" onClick={() => setEditing(a.area)} style={{ flex: 1, textAlign: 'left', border: 0, background: 'transparent', color: 'var(--ink)', font: 'inherit', fontWeight: 650, cursor: 'pointer', padding: 0 }}>
                  {a.label} · {a.level}/10 · {a.kind.toLowerCase()}
                </button>
                <button type="button" aria-label={`Remove ${a.label}`} onClick={() => { setAreas((l) => l.filter((x) => x.area !== a.area)); if (editing === a.area) setEditing(null) }} style={{ width: 30, height: 30, borderRadius: 99, border: 0, background: 'var(--paper-deep)', color: 'var(--ink)', cursor: 'pointer' }}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {cur && (
          <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--rule)' }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 650 }}>
              {cur.label}: how bad, 1 to 10? <strong style={{ fontSize: 22, color: painColor(cur.level) }}>{cur.level}</strong>
              <input type="range" min={1} max={10} value={cur.level} onChange={(e) => upd(cur.area, { level: Number(e.target.value) })} />
            </label>
            <div role="group" aria-label="What kind of pain" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {KINDS.map((k) => (
                <button key={k} type="button" aria-pressed={cur.kind === k} onClick={() => upd(cur.area, { kind: k })} style={{ minHeight: 34, padding: '0 12px', borderRadius: 99, border: `1.5px solid ${cur.kind === k ? 'var(--ink)' : 'var(--rule-strong)'}`, background: cur.kind === k ? '#14181f' : 'var(--panel)', color: cur.kind === k ? '#f3f1ea' : 'var(--ink)', fontWeight: 650, fontSize: 13, cursor: 'pointer' }}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" className="fw-press" disabled={!areas.length} onClick={() => save(false)} style={primary(areas.length > 0)}>
            Save pain check
          </button>
          <button type="button" onClick={() => save(true)} style={ghost}>
            Nothing hurts today
          </button>
        </div>
        {saved && (
          <Note tone={saved.level ? 'watch' : 'ok'}>
            <span style={{ display: 'flex', gap: 8 }}>
              <strong>{saved.level ? `Saved: worst ${saved.level}/10.` : 'Saved: no pain today.'}</strong>
              <Coins n={saved.points} />
            </span>
            {saved.level ? <span>{getContent('painReport').whenToEscalate}</span> : <span>Logging the good days is what makes a bad one stand out.</span>}
          </Note>
        )}
        {sum.areas.length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            <p style={label}>Last 14 days</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4, fontSize: 13.5 }}>
              {sum.areas.slice(0, 4).map((a) => (
                <li key={a.area} style={{ display: 'flex', gap: 8 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, marginTop: 6, borderRadius: 99, background: painColor(a.worst) }} />
                  <span>
                    <strong>{a.label}</strong>: {a.days} day{a.days === 1 ? '' : 's'}, worst {a.worst}/10
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Sourced ind="painReport" />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Stand-up test */

function Countdown({ seconds, label: what, onDone }: { seconds: number; label: string; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  const done = useRef(false)
  useEffect(() => {
    const end = Date.now() + seconds * 1000
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setLeft(l)
      if (l === 0 && !done.current) {
        done.current = true
        onDone()
      }
    }, 250)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div role="timer" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 34, fontWeight: 750, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 14, color: 'var(--muted)' }}>{what}</span>
    </div>
  )
}

type StandStep = 'intro' | 'lying' | 'lyingRead' | 'standing' | 'standingRead' | 'result'
function StandTest() {
  const id = useCrewId()
  const [step, setStep] = useState<StandStep>('intro')
  const [v, setV] = useState({ lyHr: '', lySys: '', lyDia: '', stHr: '', stSys: '', stDia: '', dizzy: false })
  const [res, setRes] = useState<{ rise: number; sysDrop: number | null; diaDrop: number | null; points: number } | null>(null)
  const num = (x: string) => (x.trim() === '' ? null : Number(x))
  const ok = (x: string, lo: number, hi: number) => x.trim() !== '' && Number(x) >= lo && Number(x) <= hi
  const env = (D.getState().env?.label || '') as string
  const save = () => {
    const rise = Number(v.stHr) - Number(v.lyHr)
    const sysDrop = num(v.lySys) !== null && num(v.stSys) !== null ? Number(v.lySys) - Number(v.stSys) : null
    const diaDrop = num(v.lyDia) !== null && num(v.stDia) !== null ? Number(v.lyDia) - Number(v.stDia) : null
    const points = D.saveBodyCheck(id, 'orthostaticRise', [
      { indicator: 'orthostaticRise', value: rise, unit: 'bpm', detail: { lyingHr: Number(v.lyHr), standingHr: Number(v.stHr), lyingSys: num(v.lySys), lyingDia: num(v.lyDia), standingSys: num(v.stSys), standingDia: num(v.stDia), dizzy: v.dizzy } },
    ])
    setRes({ rise, sysDrop, diaDrop, points })
    setStep('result')
  }
  const field = (k: keyof typeof v, lbl: string, ph: string) => (
    <label style={{ display: 'grid', gap: 4, fontSize: 13.5, fontWeight: 650, flex: '1 1 120px' }}>
      {lbl}
      <input inputMode="numeric" value={v[k] as string} placeholder={ph} onChange={(e) => { const val = e.target.value.replace(/[^\d.]/g, ''); setV((x) => ({ ...x, [k]: val })) }} style={input} />
    </label>
  )
  const hypo = res && ((res.sysDrop !== null && res.sysDrop >= 20) || (res.diaDrop !== null && res.diaDrop >= 10))
  const last = D.lastReading(id, 'orthostaticRise') as { value: number; timestamp: string } | null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ ...card, flex: '1 1 340px' }}>
        <p style={label}>Stand-up test · about 4 minutes</p>
        {step === 'intro' && (
          <>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5, lineHeight: 1.5 }}>
              <li>Lie down flat and rest for 2 minutes.</li>
              <li>Take your pulse (count 15 seconds and multiply by 4), and blood pressure if you have a cuff.</li>
              <li>Stand up and stay still for 1 minute, then take them again. Sit down any time you feel faint.</li>
            </ol>
            <Note>This test is for gravity: on the Moon, on Mars, and after landing.{/transit|ISS|station|orbit/i.test(env) ? ` On ${env} it works as practice, so you know your numbers before landing.` : ''}</Note>
            <button type="button" className="fw-press" onClick={() => setStep('lying')} style={primary()}>
              Lie down and start
            </button>
          </>
        )}
        {step === 'lying' && (
          <>
            <Countdown seconds={120} label="lying still" onDone={() => setStep('lyingRead')} />
            <button type="button" onClick={() => setStep('lyingRead')} style={{ ...ghost, justifySelf: 'start' }}>
              I've rested already
            </button>
          </>
        )}
        {step === 'lyingRead' && (
          <>
            <strong>Lying down</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {field('lyHr', 'Pulse (bpm)', 'e.g. 62')}
              {field('lySys', 'Systolic (optional)', 'e.g. 118')}
              {field('lyDia', 'Diastolic (optional)', 'e.g. 76')}
            </div>
            <button type="button" className="fw-press" disabled={!ok(v.lyHr, 25, 220)} onClick={() => setStep('standing')} style={primary(ok(v.lyHr, 25, 220))}>
              Now stand up
            </button>
          </>
        )}
        {step === 'standing' && (
          <>
            <Countdown seconds={60} label="standing still" onDone={() => setStep('standingRead')} />
            <Note tone="watch">Feel faint or dizzy? Sit down now. That is a result too: tick it on the next step.</Note>
            <button type="button" onClick={() => setStep('standingRead')} style={{ ...ghost, justifySelf: 'start' }}>
              Skip the wait
            </button>
          </>
        )}
        {step === 'standingRead' && (
          <>
            <strong>Standing, after 1 minute</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {field('stHr', 'Pulse (bpm)', 'e.g. 78')}
              {field('stSys', 'Systolic (optional)', 'e.g. 112')}
              {field('stDia', 'Diastolic (optional)', 'e.g. 74')}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5 }}>
              <input type="checkbox" checked={v.dizzy} onChange={(e) => setV({ ...v, dizzy: e.target.checked })} style={{ width: 18, height: 18 }} />I felt dizzy, light-headed or faint
            </label>
            <button type="button" className="fw-press" disabled={!ok(v.stHr, 25, 220)} onClick={save} style={primary(ok(v.stHr, 25, 220))}>
              Save the test
            </button>
          </>
        )}
        {step === 'result' && res && (
          <>
            <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 750, letterSpacing: '-0.04em' }}>
                {res.rise > 0 ? '+' : ''}
                {res.rise}
              </span>
              <span style={{ color: 'var(--muted)' }}>bpm on standing</span>
              <Coins n={res.points} />
            </p>
            {res.sysDrop !== null && (
              <span style={{ fontSize: 14 }}>
                Blood pressure changed by {res.sysDrop > 0 ? '−' : '+'}
                {Math.abs(res.sysDrop)}/{res.diaDrop !== null ? `${res.diaDrop > 0 ? '−' : '+'}${Math.abs(res.diaDrop)}` : '?'} mmHg.
              </span>
            )}
            {hypo || v.dizzy ? (
              <Note tone="act">
                <strong>{hypo ? 'Your blood pressure fell enough to meet the medical definition of orthostatic hypotension.' : 'You felt faint on standing.'}</strong> {getContent('orthostaticRise').recommendedAction}{' '}
                <button type="button" onClick={() => openEscalation({ title: hypo ? 'Stand-up test: blood pressure fell on standing' : 'Stand-up test: felt faint on standing', detail: `Lying ${v.lyHr} bpm, standing ${v.stHr} bpm${res.sysDrop !== null ? `; blood pressure changed by ${res.sysDrop > 0 ? '-' : '+'}${Math.abs(res.sysDrop)} systolic` : ''}.`, status: 'red' })} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
                  Who to tell
                </button>
              </Note>
            ) : (
              <Note tone="ok">Saved. Each test is compared with your own earlier ones, on the Heart region of Body.</Note>
            )}
            <button type="button" onClick={() => { setV({ lyHr: '', lySys: '', lyDia: '', stHr: '', stSys: '', stDia: '', dizzy: false }); setRes(null); setStep('intro') }} style={{ ...ghost, justifySelf: 'start' }}>
              Do it again
            </button>
          </>
        )}
      </div>
      <div style={{ ...card, flex: '1 1 260px' }}>
        <p style={label}>Why</p>
        <Sourced ind="orthostaticRise" />
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
          <strong>Tell someone if: </strong>
          {getContent('orthostaticRise').whenToEscalate}
        </p>
        {last && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Last test: {last.value > 0 ? '+' : ''}{last.value} bpm, {new Date(last.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Weekly check */

// NASA-TLX subscales (raw, unweighted), asked about the past week.
const TLX = [
  { k: 'mental', q: 'How mentally demanding was your work?', lo: 'Very low', hi: 'Very high' },
  { k: 'physical', q: 'How physically demanding was it?', lo: 'Very low', hi: 'Very high' },
  { k: 'temporal', q: 'How hurried or rushed was the pace?', lo: 'Very low', hi: 'Very high' },
  { k: 'performance', q: 'How far did you fall short of what you set out to do?', lo: 'Not at all', hi: 'Completely' },
  { k: 'effort', q: 'How hard did you have to work to manage it?', lo: 'Very low', hi: 'Very high' },
  { k: 'frustration', q: 'How stressed, irritated or discouraged were you?', lo: 'Very low', hi: 'Very high' },
]
// PHQ-2 and GAD-2, word for word, over the last 2 weeks.
const SCREEN = [
  { k: 'phq1', q: 'Little interest or pleasure in doing things' },
  { k: 'phq2', q: 'Feeling down, depressed, or hopeless' },
  { k: 'gad1', q: 'Feeling nervous, anxious, or on edge' },
  { k: 'gad2', q: 'Not being able to stop or control worrying' },
]
const FREQ = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']

function WeeklyCheck() {
  const id = useCrewId()
  const [tlx, setTlx] = useState<Record<string, number>>(Object.fromEntries(TLX.map((t) => [t.k, 5])))
  const [scr, setScr] = useState<Record<string, number | null>>(Object.fromEntries(SCREEN.map((s) => [s.k, null])))
  const [res, setRes] = useState<{ workload: number; phq2: number; gad2: number; points: number; prev: number | null } | null>(null)
  const age = D.weeklyCheckAge(id) as number | null
  const complete = SCREEN.every((s) => scr[s.k] !== null)
  const save = () => {
    const workload = Math.round((TLX.reduce((a, t) => a + tlx[t.k], 0) / TLX.length) * 10)
    const phq2 = (scr.phq1 ?? 0) + (scr.phq2 ?? 0)
    const gad2 = (scr.gad1 ?? 0) + (scr.gad2 ?? 0)
    const prevM = D.lastReading(id, 'workload') as { value: number } | null
    const points = D.saveBodyCheck(
      id,
      'weeklyCheck',
      [
        { indicator: 'workload', value: workload, unit: '0-100', detail: { tlx } },
        { indicator: 'moodScreen', value: { phq2, gad2 }, unit: 'score', detail: { items: scr } },
      ],
      { kind: 'readingLogged', detail: 'weeklyCheck' },
    )
    setRes({ workload, phq2, gad2, points, prev: prevM ? prevM.value : null })
  }
  if (res) {
    const positive = res.phq2 >= 3 || res.gad2 >= 3
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ ...card, flex: '1 1 300px' }}>
          <p style={label}>Workload this week</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 750, letterSpacing: '-0.04em' }}>{res.workload}</span>
            <span style={{ color: 'var(--muted)' }}>of 100</span>
            <Coins n={res.points} />
          </p>
          <span style={{ fontSize: 14 }}>{res.prev === null ? 'Your first weekly check: next week has something to compare with.' : `Last time: ${res.prev}. ${res.workload - res.prev >= 15 ? 'A clear rise: look at the schedule for something that can move.' : 'About the same as before.'}`}</span>
        </div>
        <div style={{ ...card, flex: '1 1 300px' }}>
          <p style={label}>Mood screen</p>
          <span style={{ fontSize: 15 }}>
            Low mood (PHQ-2): <strong>{res.phq2}</strong> of 6 · Anxiety (GAD-2): <strong>{res.gad2}</strong> of 6
          </span>
          {positive ? (
            <Note tone="watch">
              <strong>At or above the screening cutoff.</strong> {getContent('moodScreen').whenToEscalate}{' '}
              <button type="button" onClick={() => openEscalation({ title: 'Asked for a private talk', detail: 'The weekly check suggests a private conversation with the medical officer or flight surgeon.', status: 'yellow' })} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
                Who to tell
              </button>
            </Note>
          ) : (
            <Note tone="ok">Below the screening cutoff on both. Thanks for checking in on yourself.</Note>
          )}
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>A screen, not a diagnosis. Only you and your crew medical officer see the answers; you choose on Escalate whether this kind of reading goes to Earth.</span>
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ ...card, flex: '1 1 340px' }}>
        <p style={label}>Workload, the past week (NASA-TLX)</p>
        {TLX.map((t) => (
          <label key={t.k} style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 650 }}>{t.q}</span>
              <strong>{tlx[t.k]}</strong>
            </span>
            <input type="range" min={0} max={10} value={tlx[t.k]} onChange={(e) => setTlx({ ...tlx, [t.k]: Number(e.target.value) })} aria-label={t.q} />
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)' }}>
              <span>{t.lo}</span>
              <span>{t.hi}</span>
            </span>
          </label>
        ))}
      </div>
      <div style={{ ...card, flex: '1 1 340px' }}>
        <p style={label}>Over the last 2 weeks, how often have you been bothered by…</p>
        {SCREEN.map((s) => (
          <fieldset key={s.k} style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: 6 }}>
            <legend style={{ fontSize: 14, fontWeight: 650, marginBottom: 6 }}>{s.q}</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
              {FREQ.map((f, i) => (
                <button key={f} type="button" aria-pressed={scr[s.k] === i} onClick={() => setScr({ ...scr, [s.k]: i })} style={{ minHeight: 36, padding: '4px 8px', borderRadius: 10, border: `1.5px solid ${scr[s.k] === i ? 'var(--ink)' : 'var(--rule-strong)'}`, background: scr[s.k] === i ? '#14181f' : 'var(--panel)', color: scr[s.k] === i ? '#f3f1ea' : 'var(--ink)', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="button" className="fw-press" disabled={!complete} onClick={save} style={primary(complete)}>
          Save the weekly check
        </button>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{age === null ? 'Once a week, about 2 minutes.' : age >= 7 ? `Last done ${age} days ago: due now.` : `Last done ${age === 0 ? 'today' : `${age} day${age === 1 ? '' : 's'} ago`}. Next due in ${7 - age} day${7 - age === 1 ? '' : 's'}.`}</span>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Strength */

const LIFTS = ['Squats', 'Deadlifts', 'Heel raises', 'Bench press', 'Rows', 'Other']
function Strength() {
  const id = useCrewId()
  const [g, setG] = useState({ right: '', left: '' })
  const [lift, setLift] = useState({ exercise: 'Squats', sets: '3', reps: '8', load: '', minutes: '30' })
  const [msg, setMsg] = useState<{ text: string; points: number } | null>(null)
  const n = (x: string) => Number(x)
  const gripOk = (g.right !== '' && n(g.right) > 0 && n(g.right) < 150) || (g.left !== '' && n(g.left) > 0 && n(g.left) < 150)
  const liftOk = n(lift.sets) > 0 && n(lift.reps) > 0 && n(lift.minutes) > 0 && n(lift.minutes) <= 300
  const grips = D.readingsOf(id, 'gripStrength', 60) as { value: number; timestamp: string }[]
  const bl = D.boneLoading(id) as unknown as { week: { detail: { exercise: string; sets: number; reps: number; loadKg: number | null }; timestamp: string }[] }
  const saveGrip = () => {
    const vals = [g.right, g.left].filter((x) => x !== '').map(Number)
    const value = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    const points = D.saveBodyCheck(id, 'gripStrength', [{ indicator: 'gripStrength', value, unit: 'kg', detail: { right: g.right === '' ? null : n(g.right), left: g.left === '' ? null : n(g.left) } }])
    setMsg({ text: `Grip saved: ${value} kg${vals.length > 1 ? ' (average of both hands)' : ''}.`, points })
    setG({ right: '', left: '' })
  }
  const saveLift = () => {
    const loadKg = lift.load === '' ? null : n(lift.load)
    const detail = { type: 'resistance', exercise: lift.exercise, sets: n(lift.sets), reps: n(lift.reps), loadKg, volumeKg: loadKg ? n(lift.sets) * n(lift.reps) * loadKg : null }
    const points = D.saveBodyCheck(id, 'resistance', [{ indicator: 'exerciseMinutes', value: n(lift.minutes), unit: 'min', detail }], { kind: 'exerciseComplete' })
    setMsg({ text: `${lift.exercise} logged: ${lift.sets} × ${lift.reps}${loadKg ? ` at ${loadKg} kg` : ''}. It counts as today's exercise too.`, points })
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ ...card, flex: '1 1 300px' }}>
        <p style={label}>Grip strength · once a week</p>
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>{getContent('gripStrength').recommendedAction}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['right', 'left'] as const).map((h) => (
            <label key={h} style={{ display: 'grid', gap: 4, fontSize: 13.5, fontWeight: 650, flex: 1 }}>
              {h === 'right' ? 'Right hand (kg)' : 'Left hand (kg)'}
              <input inputMode="decimal" value={g[h]} placeholder="best of 3" onChange={(e) => { const val = e.target.value.replace(/[^\d.]/g, ''); setG((x) => ({ ...x, [h]: val })) }} style={input} />
            </label>
          ))}
        </div>
        <button type="button" className="fw-press" disabled={!gripOk} onClick={saveGrip} style={primary(gripOk)}>
          Save grip
        </button>
        {grips.length > 0 && (
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13.5 }}>
              Latest: <strong>{grips[grips.length - 1].value} kg</strong>
              {grips.length > 1 ? ` · before that ${grips[grips.length - 2].value} kg` : ' · log again next week to see the trend'}
            </span>
            {grips.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48 }} aria-label="Recent grip strength" role="img">
                {grips.slice(-8).map((m, i, arr) => {
                  const lo = Math.min(...arr.map((x) => x.value)) * 0.9
                  const hi = Math.max(...arr.map((x) => x.value))
                  return <span key={m.timestamp} title={`${m.value} kg, ${new Date(m.timestamp).toLocaleDateString()}`} style={{ width: 22, height: `${Math.max(14, ((m.value - lo) / Math.max(0.1, hi - lo)) * 100)}%`, borderRadius: 6, background: i === arr.length - 1 ? '#14181f' : 'var(--rule-strong)' }} />
                })}
              </div>
            )}
          </div>
        )}
        <Sourced ind="gripStrength" />
      </div>
      <div style={{ ...card, flex: '1 1 340px' }}>
        <p style={label}>Bone-loading session</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {LIFTS.map((x) => (
            <button key={x} type="button" aria-pressed={lift.exercise === x} onClick={() => setLift((l) => ({ ...l, exercise: x }))} style={{ minHeight: 34, padding: '0 12px', borderRadius: 99, border: `1.5px solid ${lift.exercise === x ? 'var(--ink)' : 'var(--rule-strong)'}`, background: lift.exercise === x ? '#14181f' : 'var(--panel)', color: lift.exercise === x ? '#f3f1ea' : 'var(--ink)', fontWeight: 650, fontSize: 13, cursor: 'pointer' }}>
              {x}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {(
            [
              ['sets', 'Sets'],
              ['reps', 'Reps'],
              ['load', 'Load (kg)'],
              ['minutes', 'Minutes'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} style={{ display: 'grid', gap: 4, fontSize: 12.5, fontWeight: 650 }}>
              {l}
              <input inputMode="decimal" value={lift[k]} placeholder={k === 'load' ? 'optional' : ''} onChange={(e) => { const val = e.target.value.replace(/[^\d.]/g, ''); setLift((l) => ({ ...l, [k]: val })) }} style={{ ...input, padding: '0 8px' }} />
            </label>
          ))}
        </div>
        <button type="button" className="fw-press" disabled={!liftOk} onClick={saveLift} style={primary(liftOk)}>
          Log the session
        </button>
        <span style={{ fontSize: 14 }}>
          <strong>{bl.week.length}</strong> bone-loading session{bl.week.length === 1 ? '' : 's'} this week
          {bl.week.length ? `: ${bl.week.slice(-3).map((m) => m.detail.exercise.toLowerCase()).join(', ')}` : ''}
        </span>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)' }}>{getContent('exerciseMinutes').whyCheck}</p>
      </div>
      {msg && (
        <div style={{ flex: '1 1 100%' }}>
          <Note tone="ok">
            <span style={{ display: 'flex', gap: 8 }}>
              <strong>{msg.text}</strong>
              <Coins n={msg.points} />
            </span>
          </Note>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- The card */

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: 'pain', label: 'Pain map', sub: 'Where it hurts' },
  { id: 'stand', label: 'Stand-up test', sub: 'For gravity changes' },
  { id: 'weekly', label: 'Weekly check', sub: 'Workload and mood' },
  { id: 'strength', label: 'Strength', sub: 'Grip and bone loading' },
]

export function BodyChecks() {
  const [tab, setTab] = useState<Tab>('pain')
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    let t: string | null = null
    try {
      t = sessionStorage.getItem(TAB_KEY)
      sessionStorage.removeItem(TAB_KEY)
    } catch {
      t = null
    }
    if (t && TABS.some((x) => x.id === t)) {
      setTab(t as Tab)
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [])
  return (
    <section ref={ref} aria-labelledby="bodychecks-heading" style={{ borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(18px, 2.4vw, 28px)', display: 'grid', gap: 16, scrollMarginTop: 120 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 id="bodychecks-heading" style={{ margin: 0, fontSize: 'clamp(24px, 2.6vw, 32px)', fontWeight: 750, letterSpacing: '-0.035em' }}>
          Body checks
        </h2>
        <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>Coins for doing the check, never for the result.</span>
      </div>
      <div role="tablist" aria-label="Body checks" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={{ display: 'grid', gap: 2, textAlign: 'left', padding: '10px 14px', borderRadius: 16, border: `1.5px solid ${tab === t.id ? 'var(--ink)' : 'var(--rule)'}`, background: tab === t.id ? '#14181f' : 'var(--panel-2)', color: tab === t.id ? '#f3f1ea' : 'var(--ink)', cursor: 'pointer', font: 'inherit' }}>
            <strong style={{ fontSize: 15 }}>{t.label}</strong>
            <span style={{ fontSize: 12.5, opacity: 0.75 }}>{t.sub}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)!.label}>
        {tab === 'pain' && <PainMap />}
        {tab === 'stand' && <StandTest />}
        {tab === 'weekly' && <WeeklyCheck />}
        {tab === 'strength' && <Strength />}
      </div>
    </section>
  )
}
