import { useEffect, useReducer } from 'react'
import * as D from './data'
import { navigate } from './dc'

/*
 * A small page icon in the top bar that opens this person's weekly report (all their updates) on
 * any day. A gold dot appears once a week is complete: seven days since they last read it, or
 * their first full week on the mission.
 */

export function ReportButton() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  const st = D.reportStatus(D.getState().crew.id) as { ready: boolean }
  return (
    <button
      type="button"
      onClick={() => navigate('Report.dc.html')}
      aria-label={st.ready ? 'Your weekly report is ready: open it' : 'Your weekly report and updates'}
      title={st.ready ? 'Your weekly report is ready' : 'Your weekly report and updates'}
      style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 44, height: 44, flex: '0 0 auto', borderRadius: 999, border: '1px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer' }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z M14 3v5h5 M9 13h6 M9 17h6 M9 9h2" />
      </svg>
      {st.ready && <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 99, background: '#f6c445', boxShadow: '0 0 0 2px var(--panel)', animation: 'ms-twinkle 1.8s ease-in-out infinite' }} />}
    </button>
  )
}
