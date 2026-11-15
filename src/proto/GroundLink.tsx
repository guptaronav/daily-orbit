import { useEffect, useReducer } from 'react'
import * as D from './data'

/*
 * The ground link, delay and all. Each packet sent from Escalate travels for the real one-way
 * delay before Earth can read it, and the earliest possible reply needs the same time back. The
 * right-hand card shows what the flight surgeon can actually know right now, which on a Mars
 * mission is never the present.
 */

type Packet = { id: string; sentAt: number; arriveAt: number; replyAt: number; delay: number; env: string; bytes: number; changed: string[]; count: number; state: 'arrived' | 'inflight'; progress: number; replyPossible: boolean }
type Link = { list: Packet[]; known: Packet | null; delay: number; env: string }

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const span = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return s < 60 ? `${s} s` : s < 3600 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`
}

export function useGroundLink(): Link {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  useEffect(() => {
    const t = setInterval(bump, 1000)
    return () => clearInterval(t)
  }, [])
  return D.groundLink(D.getState().crew.id) as Link
}

export function GroundLinkPanel() {
  const g = useGroundLink()
  const now = Date.now()
  return (
    <section aria-labelledby="link-heading" style={{ borderRadius: 28, background: '#0b1220', color: '#e8eefc', padding: 'clamp(18px, 2.4vw, 26px)', display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 id="link-heading" style={{ margin: 0, fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
          Ground link
        </h2>
        <span style={{ fontSize: 13, color: 'rgba(232,238,252,.7)' }}>
          {g.env} · {D.formatDelay(g.delay)} each way · a reply takes at least {D.formatDelay(g.delay * 2)}{D.systemsOnline().comms ? ' · via the comms relay' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: '2 1 360px', display: 'grid', gap: 10 }}>
          {g.list.length === 0 && <p style={{ margin: 0, fontSize: 14.5, color: 'rgba(232,238,252,.75)' }}>Nothing sent yet. Hold the transmit button above to send the change summary.</p>}
          {g.list.slice(0, 4).map((p) => (
            <div key={p.id} style={{ padding: 12, borderRadius: 16, background: 'rgba(232,238,252,.06)', border: '1px solid rgba(232,238,252,.12)', display: 'grid', gap: 8 }}>
              <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
                <strong>
                  Sent {clock(p.sentAt)} · {p.count} change{p.count === 1 ? '' : 's'} · {p.bytes} bytes
                </strong>
                <span style={{ color: p.state === 'arrived' ? '#7ef0c5' : '#f6c445', fontWeight: 700 }}>{p.state === 'arrived' ? `Reached Earth ${clock(p.arriveAt)}` : `Arrives ${clock(p.arriveAt)}, in ${span(p.arriveAt - now)}`}</span>
              </p>
              <div role="progressbar" aria-label="Packet on its way to Earth" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.progress * 100)} style={{ position: 'relative', height: 18 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 8, borderTop: '2px dashed rgba(232,238,252,.25)' }} />
                <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 3, width: 12, height: 12, borderRadius: 99, background: '#e8742c' }} title="Crew" />
                <span aria-hidden="true" style={{ position: 'absolute', right: 0, top: 3, width: 12, height: 12, borderRadius: 99, background: '#4cc9f0' }} title="Earth" />
                <span aria-hidden="true" style={{ position: 'absolute', top: 1, left: `calc(${p.progress * 100}% - ${p.progress * 16}px)`, width: 16, height: 16, borderRadius: 4, background: '#f6c445', transform: 'rotate(45deg)', transition: 'left 1s linear', boxShadow: '0 0 10px rgba(246,196,69,.7)' }} />
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(232,238,252,.65)' }}>
                {p.changed.length ? p.changed.join(', ') : 'No readings outside the usual'} · earliest reply {p.replyPossible ? 'could already be here' : `${clock(p.replyAt)}`}
              </p>
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 260px', padding: 14, borderRadius: 18, background: 'rgba(76,201,240,.1)', border: '1.5px solid rgba(76,201,240,.4)', display: 'grid', gap: 6, alignContent: 'start' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: '#4cc9f0' }}>What Earth knows right now</p>
          {g.known ? (
            <>
              <strong style={{ fontSize: 16 }}>Your status as of {clock(g.known.sentAt)}</strong>
              <span style={{ fontSize: 14 }}>
                {g.known.count ? `${g.known.count} reading${g.known.count === 1 ? '' : 's'} outside the usual: ${g.known.changed.join(', ')}` : 'Nothing outside the usual'}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(232,238,252,.7)' }}>That picture is already {span(now - g.known.sentAt)} old on the ground. Anything since then, they cannot see yet.</span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: 'rgba(232,238,252,.75)' }}>Nothing yet. {g.list.length ? `Your first packet lands in ${span(g.list[g.list.length - 1].arriveAt - now)}.` : 'Until a packet arrives, the ground knows nothing about today.'}</span>
          )}
        </div>
      </div>
    </section>
  )
}
