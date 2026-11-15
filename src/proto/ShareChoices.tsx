import { useEffect, useReducer } from 'react'
import * as D from './data'

/*
 * What Earth receives. The crew member chooses which kinds of change may leave the ship; anything
 * switched off stays onboard and is counted, never sent. The packet above updates as you choose.
 * Not gamified on purpose: privacy is never something to earn coins for.
 */
export function ShareChoices({ withheld }: { withheld: number }) {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  const id = D.getState().crew.id as string
  const set = D.shareSettings(id) as Record<string, boolean>
  const groups = D.SHARE_GROUPS as { id: string; label: string; hint: string }[]
  const on = groups.filter((g) => set[g.id]).length
  return (
    <fieldset data-tour="share" style={{ margin: '0 0 20px', padding: 0, border: 0, display: 'grid', gap: 10 }}>
      <legend style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px', padding: 0, marginBottom: 10 }}>
        <strong style={{ fontSize: 15 }}>What Earth receives</strong>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {on} of {groups.length} kinds shared{withheld ? ` · ${withheld} change${withheld === 1 ? '' : 's'} kept onboard by your choice` : ''}
        </span>
      </legend>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 210px), 1fr))', gap: 8 }}>
        {groups.map((g) => (
          <label key={g.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 14, background: set[g.id] ? 'var(--panel)' : 'transparent', border: `1.5px solid ${set[g.id] ? 'var(--accent)' : 'var(--rule)'}`, cursor: 'pointer' }}>
            <input type="checkbox" checked={set[g.id]} onChange={(e) => D.setShare(id, g.id, e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)', flex: '0 0 auto' }} />
            <span style={{ display: 'grid', gap: 2 }}>
              <strong style={{ fontSize: 14 }}>{g.label}</strong>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{g.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Your crew medical officer onboard still sees everything. This only decides what crosses to the ground.</span>
    </fieldset>
  )
}
