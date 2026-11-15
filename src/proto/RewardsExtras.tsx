import { useEffect, useReducer } from 'react'
import * as D from './data'
import * as P from './parts'

/*
 * The parts of Rewards that tie the game together week to week: this week's mission-pass tasks
 * (your own) and crew quests (together, no ranking), collection sets, the level reward track, and
 * two featured items a day.
 */

const card = { borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: '24px 26px', display: 'grid', gap: 14 } as const
const h2 = { margin: 0, fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em' } as const
const sub = { margin: 0, fontSize: 13.5, color: 'var(--muted)' } as const

function useData() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  return D.getState().crew.id as string
}

function Bar({ frac, color = '#f6c445' }: { frac: number; color?: string }) {
  return (
    <span aria-hidden="true" style={{ display: 'block', height: 8, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
      <span style={{ display: 'block', width: `${Math.min(1, frac) * 100}%`, height: '100%', background: color, transition: 'width 500ms ease' }} />
    </span>
  )
}

export function ThisWeek() {
  const id = useData()
  const tasks = D.passTasks(id) as { id: string; label: string; xp: number; progress: number; goal: number; done: boolean }[]
  const quests = D.crewQuests() as { id: string; label: string; contributors: { crew: { id: string; name: string }; gear: unknown }[]; total: number; complete: boolean; xp: number }[]
  return (
    <section aria-labelledby="week-heading" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
      <div style={{ ...card, flex: '1 1 380px' }}>
        <div>
          <h2 id="week-heading" style={h2}>
            This week's pass tasks
          </h2>
          <p style={sub}>Three new tasks every Monday. Each one adds mission-pass XP. Only effort counts, never the numbers.</p>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {tasks.map((t) => (
            <li key={t.id} style={{ display: 'grid', gap: 6, padding: '10px 12px', borderRadius: 14, background: t.done ? 'rgba(47,125,79,.08)' : 'var(--panel-2)' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 14.5, textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</strong>
                <span style={{ fontSize: 13, fontWeight: 750, color: t.done ? 'var(--ok-ink)' : '#a8740a' }}>{t.done ? 'Done' : `+${t.xp} pass XP`}</span>
              </span>
              <Bar frac={t.progress / t.goal} color={t.done ? 'var(--ok)' : '#f6c445'} />
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {t.progress} of {t.goal}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ ...card, flex: '1 1 380px', background: '#14181f', color: '#f3f1ea', border: 0 }}>
        <div>
          <h2 style={{ ...h2, color: '#f3f1ea' }}>Crew quests</h2>
          <p style={{ ...sub, color: 'rgba(243,241,234,.7)' }}>The whole crew, together. Everyone who has done their part shows up here. There is no ranking.</p>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {quests.map((q) => (
            <li key={q.id} style={{ display: 'grid', gap: 8, padding: '12px 14px', borderRadius: 16, background: 'rgba(243,241,234,.06)', border: `1px solid ${q.complete ? '#7ef0c5' : 'rgba(243,241,234,.12)'}` }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 14.5 }}>{q.label}</strong>
                <span style={{ fontSize: 13, fontWeight: 750, color: q.complete ? '#7ef0c5' : '#f6c445', whiteSpace: 'nowrap' }}>{q.complete ? 'Crew done' : `+${q.xp} pass XP each`}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {q.contributors.map((c) => (
                  <span key={c.crew.id} title={c.crew.name}>
                    <P.Avatar crew={c.crew} gear={c.gear} size={30} ring="#7ef0c5" />
                  </span>
                ))}
                <span style={{ fontSize: 12.5, color: 'rgba(243,241,234,.7)', marginLeft: 4 }}>
                  {q.contributors.length} of {q.total} have done their part
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function SetsAndLevels() {
  const id = useData()
  const sets = D.sets(id) as { id: string; name: string; have: string[]; items: string[]; done: boolean; rewardName: string; itemNames: string[] }[]
  const perks = D.levelPerks(id) as { lv: number; unlocked: { lv: number }[]; next: { lv: number; label: string } | null; title: string }
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
      <div style={{ ...card, flex: '1 1 380px' }}>
        <div>
          <h2 style={h2}>Collection sets</h2>
          <p style={sub}>Own every piece of a kit to unlock its matching ring. Set rings are never sold.</p>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {sets.map((st) => (
            <li key={st.id} style={{ display: 'grid', gap: 6, padding: '10px 12px', borderRadius: 14, background: st.done ? 'rgba(246,196,69,.14)' : 'var(--panel-2)', border: st.done ? '1.5px solid #f6c445' : '1.5px solid transparent' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 14.5 }}>{st.name}</strong>
                <span style={{ fontSize: 13, fontWeight: 750, color: st.done ? '#a8740a' : 'var(--muted)' }}>{st.done ? `Unlocked: ${st.rewardName}` : `${st.have.length} of ${st.items.length}`}</span>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {st.itemNames.map((n, i) => (
                  <span key={n} style={{ color: st.have.includes(st.items[i]) ? 'var(--ink)' : 'var(--muted)', fontWeight: st.have.includes(st.items[i]) ? 650 : 400 }}>
                    {i ? ' · ' : ''}
                    {st.have.includes(st.items[i]) ? '✓ ' : ''}
                    {n}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ ...card, flex: '1 1 380px' }}>
        <div>
          <h2 style={h2}>Level rewards</h2>
          <p style={sub}>Every level unlocks something: a title under your name, a dock skin or a piece of gear.</p>
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {(D.LEVEL_UNLOCKS as { lv: number; id: string; label: string; what: string; kind: string }[]).map((u) => {
            const got = u.lv <= perks.lv
            return (
              <li key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 12, background: got ? 'rgba(47,125,79,.08)' : 'transparent', opacity: got ? 1 : 0.75 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, flex: '0 0 auto', borderRadius: 99, background: got ? '#14181f' : 'var(--paper-deep)', color: got ? '#f6c445' : 'var(--muted)', fontSize: 12.5, fontWeight: 800 }}>{u.lv}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{u.label}</strong>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)' }}>{u.what}</span>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: got ? 'var(--ok-ink)' : 'var(--muted)' }}>{got ? 'Unlocked' : perks.next?.lv === u.lv ? 'Next' : ''}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export function FeaturedToday() {
  useData()
  const ids = D.featuredToday() as string[]
  const items = ids.map((x) => (D.SHOP as { id: string; name: string; price: number; slot: string }[]).find((i) => i.id === x)!).filter(Boolean)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 16, background: 'rgba(246,196,69,.12)', border: '1px solid rgba(246,196,69,.5)' }}>
      <strong style={{ fontSize: 13.5 }}>Featured today:</strong>
      {items.map((it) => (
        <span key={it.id} style={{ fontSize: 13.5 }}>
          {it.name} <span style={{ color: 'var(--muted)' }}>({it.slot}, {it.price} coins)</span>
        </span>
      ))}
      <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 'auto' }}>Two new picks every day</span>
    </div>
  )
}
