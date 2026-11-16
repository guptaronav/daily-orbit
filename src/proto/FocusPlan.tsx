import * as D from './data'
import { openSection } from './Sections'
import { useStoreTick } from './shared'
import { bridge } from './store'

/*
 * "Your focus today": up to three things to work on, each with why, what to do (sourced), a button
 * that takes you there, and "I did it". Earlier "I did it" items whose reading has been re-taken
 * come back with a verdict: better, the same, or worse than before. See focusPlan() in data.ts.
 */

type Item = { key: string; kind: string; status: string; title: string; why: string; action: string; go: string; goLabel: string; source: string; done: boolean; ind?: string }
type Follow = { key: string; label: string; before: string; after: string; verdict: 'better' | 'same' | 'worse' }

const TONE: Record<string, string> = { red: 'var(--act)', yellow: 'var(--watch)', gray: 'var(--rule-strong)' }
const VERDICT = { better: { t: 'Moved toward your usual', c: 'var(--ok-ink)', i: '↗' }, same: { t: 'About the same', c: 'var(--muted)', i: '→' }, worse: { t: 'Moved further away: tell your medical officer', c: 'var(--act-ink)', i: '↘' } }

function goTo(where: string) {
  if (where === 'bodymap') return openSection('body', 'patterns')
  if (where === 'manual') return openSection('log', 'readings')
  bridge.go?.(where as never)
}

export function FocusPlan({ compact = false }: { compact?: boolean }) {
  useStoreTick()
  const id = D.getState().crew.id as string
  const items = D.focusPlan(id) as Item[]
  const follow = D.focusFollowUps(id) as Follow[]
  const left = items.filter((x) => !x.done).length

  return (
    <section aria-labelledby="focus-heading" className="focus">
      <div className="focus-head">
        <div>
          <p className="focus-k">Your focus today</p>
          <h2 id="focus-heading" className="focus-h">
            {items.length === 0 ? 'Nothing to fix. Keep the routine going.' : left === 0 ? 'All done. Nice work.' : `${left} thing${left === 1 ? '' : 's'} to work on`}
          </h2>
        </div>
        {!compact && <p className="focus-sub">From your own readings, compared with your usual. Each step comes from the app's NASA or NIH sources.</p>}
      </div>

      {follow.length > 0 && (
        <ul className="focus-follow">
          {follow.map((f) => (
            <li key={f.key} style={{ color: VERDICT[f.verdict].c }}>
              <span aria-hidden="true">{VERDICT[f.verdict].i}</span>
              <span>
                <strong>{f.label}</strong> since you worked on it: {f.before} → {f.after}. {VERDICT[f.verdict].t}.
              </span>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ol className="focus-list">
          {items.map((x, i) => (
            <li key={x.key} className={x.done ? 'focus-item focus-done' : 'focus-item'} style={{ borderLeftColor: TONE[x.status] ?? 'var(--rule-strong)' }}>
              <span className="focus-n" aria-hidden="true">{x.done ? '✓' : i + 1}</span>
              <div className="focus-body">
                <strong className="focus-title">{x.title}</strong>
                <span className="focus-why">{x.why}</span>
                <span className="focus-do">
                  <b>Do:</b> {x.action}{' '}
                  <a href={x.source} target="_blank" rel="noreferrer">
                    Source ↗
                  </a>
                </span>
              </div>
              <div className="focus-btns">
                {!x.done ? (
                  <>
                    <button type="button" className="focus-go" onClick={() => goTo(x.go)}>
                      {x.goLabel}
                    </button>
                    <button type="button" className="focus-did" onClick={() => D.markFocus(id, x)}>
                      I did it
                    </button>
                  </>
                ) : (
                  <span className="focus-saved">{x.ind ? 'Saved. Re-check later to see if it moved.' : 'Saved.'}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
