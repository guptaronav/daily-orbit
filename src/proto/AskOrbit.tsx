import { useEffect, useRef, useState, type FormEvent } from 'react'
import * as D from './data'
import { bridge } from './store'

/*
 * Ask Orbit: a chat window on every page for questions about symptoms, readings and spaceflight
 * health. Answers are passages from the app's NASA-sourced content with their sources, next to the
 * person's own readings; red-flag symptoms go straight to escalation. It never writes medical text
 * of its own and needs no network.
 */

type Hit = { title: string; text: string; url?: string }
type Mine = { id: string; label: string; status: 'gray' | 'green' | 'yellow' | 'red'; value: number | null; unit: string; usual: number | null }
type Answer =
  | { kind: 'urgent'; flag: string; rung: string }
  | { kind: 'answer'; hits: Hit[]; mine: Mine[]; patterns: { title: string; status: string; rung: string }[]; next: string }
type Msg = { from: 'me'; text: string } | { from: 'orbit'; a: Answer | null }

const STARTERS = ['I have a headache', 'I feel really tired today', 'My eyes feel blurry', 'How much water should I drink?', 'What is SANS?', 'Why does radiation matter?']
const WORD = { gray: 'No data', green: 'Within your usual', yellow: 'Watch', red: 'Act' }
const INK = { gray: 'var(--nodata-ink)', green: 'var(--ok-ink)', yellow: 'var(--watch-ink)', red: 'var(--act-ink)' }

// Kept outside React so the conversation survives moving between pages.
let history: Msg[] = []

function Reply({ a, onAsk }: { a: Answer | null; onAsk: (q: string) => void }) {
  if (!a) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>Hi, I'm Orbit. Ask me about a symptom, one of your readings, or how spaceflight affects the body. I answer only from the NASA sources in this app, I show where each answer comes from, and I can't diagnose.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STARTERS.map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)} style={{ minHeight: 32, padding: '0 10px', borderRadius: 99, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (a.kind === 'urgent') {
    return (
      <div role="alert" style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 14, background: 'var(--act)', color: 'var(--paper)' }}>
        <strong style={{ fontSize: 15 }}>This could be serious: {a.flag}.</strong>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>Don't wait for a search result. Tell your crew medical officer now. If you can't reach them, use Escalate to send the flight surgeon a summary.</p>
        <button type="button" onClick={() => bridge.go?.('escalation' as never)} style={{ justifySelf: 'start', minHeight: 38, padding: '0 14px', borderRadius: 10, border: 0, background: '#fff', color: '#14181f', fontWeight: 750, cursor: 'pointer' }}>
          Open Escalate
        </button>
      </div>
    )
  }
  if (!a.hits.length && !a.mine.length) {
    return <p style={{ margin: 0 }}>I couldn't find that in the NASA sources this app uses. Try asking about a symptom (headache, tiredness, dizziness), a reading (sleep, heart rate, water), or a hazard (radiation, isolation).</p>
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {a.hits.length > 0 && <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>Here is what NASA's material says. This is information, not a diagnosis.</p>}
      {a.hits.map((h) => (
        <div key={h.title + h.text.slice(0, 20)} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--panel)', border: '1px solid var(--rule)', display: 'grid', gap: 4 }}>
          <strong style={{ fontSize: 13.5 }}>{h.title}</strong>
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>{h.text}</span>
          {h.url && (
            <a href={h.url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--accent)' }}>
              Source
            </a>
          )}
        </div>
      ))}
      {a.mine.length > 0 && (
        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ fontSize: 13 }}>Your readings</strong>
          {a.mine.map((m) => (
            <span key={m.id} style={{ fontSize: 13.5 }}>
              {m.label}: <strong style={{ color: INK[m.status] }}>{WORD[m.status]}</strong>
              {m.value !== null ? ` · latest ${Number(m.value.toFixed(2))} ${m.unit}` : ''}
              {m.usual !== null ? ` · your usual ${m.usual}` : ''}
            </span>
          ))}
        </div>
      )}
      {a.patterns.map((p) => (
        <span key={p.title} style={{ fontSize: 13.5 }}>
          Pattern: <strong>{p.title}</strong> ({p.status === 'red' ? 'Act' : 'Watch'}), next step {p.rung}.
        </span>
      ))}
      {a.next && <p style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>{a.next}</p>}
    </div>
  )
}

export function AskOrbit() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>(history)
  const [q, setQ] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    history = msgs
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open])
  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onAsk = (e: Event) => {
      setOpen(true)
      askNow(String((e as CustomEvent).detail || ''))
    }
    window.addEventListener('orbit:open', onOpen)
    window.addEventListener('orbit:ask', onAsk)
    return () => {
      window.removeEventListener('orbit:open', onOpen)
      window.removeEventListener('orbit:ask', onAsk)
    }
  })
  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const askNow = (text: string) => {
    const t = text.trim()
    if (!t) return
    const a = D.ask(D.getState().crew.id, t) as Answer
    setMsgs((m) => [...m, { from: 'me', text: t }, { from: 'orbit', a }])
    setQ('')
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    askNow(q)
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ask-orbit"
        onClick={() => setOpen((o) => !o)}
        className="fw-press"
        style={{ position: 'fixed', right: 18, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 104px)', zIndex: 45, pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, minHeight: 50, padding: '0 18px 0 14px', borderRadius: 99, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 5px 0 #000, 0 18px 30px -14px rgba(20,24,31,.7)', fontWeight: 750, fontSize: 15, cursor: 'pointer' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f6c445" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z M8 9h8 M8 13h5" />
        </svg>
        {open ? 'Close' : 'Ask Orbit'}
      </button>
      {open && (
        <section
          id="ask-orbit"
          role="dialog"
          aria-label="Ask Orbit"
          style={{ position: 'fixed', right: 16, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 166px)', zIndex: 46, pointerEvents: 'auto', width: 'min(430px, calc(100vw - 32px))', height: 'min(600px, calc(100vh - 240px))', display: 'flex', flexDirection: 'column', borderRadius: 24, background: 'var(--panel-2)', border: '1px solid var(--rule)', boxShadow: '0 30px 60px -24px rgba(20,24,31,.55)', overflow: 'hidden', animation: 'ms-pop 260ms cubic-bezier(.34,1.56,.64,1) both', color: 'var(--ink)', fontFamily: 'inherit' }}
        >
          <header style={{ padding: '14px 16px', background: '#14181f', color: '#f3f1ea', display: 'grid', gap: 2 }}>
            <strong style={{ fontSize: 16 }}>Ask Orbit</strong>
            <span style={{ fontSize: 12.5, color: 'rgba(243,241,234,.7)' }}>Answers only from this app's NASA sources, offline. Not a doctor.</span>
          </header>
          <div ref={list} aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'grid', gap: 12, alignContent: 'start' }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>
              <Reply a={null} onAsk={askNow} />
            </div>
            {msgs.map((m, i) =>
              m.from === 'me' ? (
                <p key={i} style={{ margin: 0, justifySelf: 'end', maxWidth: '85%', padding: '8px 12px', borderRadius: '16px 16px 4px 16px', background: '#14181f', color: '#f3f1ea', fontSize: 14.5 }}>
                  {m.text}
                </p>
              ) : (
                <div key={i} style={{ fontSize: 14.5, lineHeight: 1.5, animation: 'ms-pop 240ms ease both' }}>
                  <Reply a={m.a} onAsk={askNow} />
                </div>
              ),
            )}
          </div>
          <form onSubmit={submit} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--rule)', background: 'var(--panel)' }}>
            <label htmlFor="ask-orbit-q" style={{ position: 'absolute', left: -9999 }}>
              Your question
            </label>
            <input id="ask-orbit-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder="Ask about a symptom or reading…" style={{ flex: 1, minHeight: 44, padding: '0 12px', borderRadius: 12, border: '2px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit' }} />
            <button type="submit" disabled={!q.trim()} style={{ minHeight: 44, padding: '0 16px', borderRadius: 12, border: 0, background: q.trim() ? '#14181f' : 'var(--paper-deep)', color: q.trim() ? '#f3f1ea' : 'var(--muted)', fontWeight: 750, cursor: q.trim() ? 'pointer' : 'not-allowed' }}>
              Ask
            </button>
          </form>
        </section>
      )}
    </>
  )
}
