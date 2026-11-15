import { useEffect, useState } from 'react'
import * as D from './data'
import { bridge } from './store'
import { useStoreTick } from './shared'

/*
 * A gentle reminder: once the chosen time has passed and today's mirror check isn't done, a quiet
 * banner says so, once. "Later" snoozes it for two hours, "Not today" hides it until tomorrow.
 * Never a guilt message, never a count of missed days. Set the time (or turn it off) on Schedule.
 */

const KEY = 'chm-reminder'
type Settings = { on: boolean; time: string }
type Snooze = { day?: string; until?: number; off?: string }

export function reminderSettings(): Settings {
  try {
    return { on: true, time: '09:00', ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { on: true, time: '09:00' }
  }
}
export function saveReminderSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Not remembered: the default stays.
  }
}
const snoozeKey = (id: string) => `chm-reminder-snooze-${id}`
const localDay = () => new Date().toLocaleDateString('en-CA')

/** `here` is the current page: the Today page and the mirror check itself already carry the call to action. */
export function ReminderBanner({ here = '' }: { here?: string }) {
  const bump = useStoreTick()
  useEffect(() => {
    const t = setInterval(bump, 60_000)
    return () => clearInterval(t)
  }, [])
  const [, force] = useState(0)
  const id = D.getState().crew.id as string
  if (!id || here === 'Today' || here === 'Mirror check') return null
  const set = reminderSettings()
  if (!set.on) return null
  const now = new Date()
  const [h, m] = set.time.split(':').map(Number)
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return null
  if ((D.game(id) as { today: { checkIn: boolean } }).today.checkIn) return null
  let snooze: Snooze = {}
  try {
    snooze = JSON.parse(localStorage.getItem(snoozeKey(id)) || '{}')
  } catch {
    snooze = {}
  }
  if (snooze.off === localDay()) return null
  if (snooze.until && Date.now() < snooze.until) return null
  const save = (s: Snooze) => {
    try {
      localStorage.setItem(snoozeKey(id), JSON.stringify(s))
    } catch {
      // Not remembered: it may show again, which is harmless.
    }
    force((n) => n + 1)
  }
  const streak = (D.game(id) as { streak: number }).streak
  return (
    <div style={{ pointerEvents: 'auto', maxWidth: 1440, margin: '8px auto 0', padding: '0 4px' }}>
      <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '9px 12px 9px 14px', borderRadius: 16, background: 'var(--panel)', border: '1px solid var(--rule)', boxShadow: '0 10px 24px -18px rgba(20,24,31,.5)' }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>☀</span>
        <span style={{ fontSize: 14.5 }}>
          <strong>Your streak is waiting</strong>
          {streak ? ` (${streak} days)` : ''}: today's mirror check takes about a minute.
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => bridge.go?.('mirror' as never)} style={{ minHeight: 34, padding: '0 12px', borderRadius: 10, border: 0, background: '#14181f', color: '#f3f1ea', fontWeight: 750, cursor: 'pointer' }}>
            Start the check
          </button>
          <button type="button" onClick={() => save({ ...snooze, until: Date.now() + 2 * 3_600_000 })} style={{ minHeight: 34, padding: '0 10px', borderRadius: 10, border: '1px solid var(--rule-strong)', background: 'transparent', color: 'var(--ink)', fontWeight: 650, cursor: 'pointer' }}>
            Later
          </button>
          <button type="button" onClick={() => save({ ...snooze, off: localDay() })} style={{ minHeight: 34, padding: '0 10px', borderRadius: 10, border: 0, background: 'transparent', color: 'var(--muted)', fontWeight: 650, cursor: 'pointer' }}>
            Not today
          </button>
        </span>
      </div>
    </div>
  )
}

/** The setting, for the Schedule page. */
export function ReminderSetting() {
  const [s, setS] = useState(reminderSettings)
  const update = (n: Settings) => {
    setS(n)
    saveReminderSettings(n)
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 18, background: 'var(--panel)', border: '1px solid var(--rule)', fontSize: 14 }}>
      <strong>Daily reminder</strong>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" checked={s.on} onChange={(e) => update({ ...s, on: e.target.checked })} />
        On
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        at
        <input type="time" value={s.time} disabled={!s.on} onChange={(e) => e.target.value && update({ ...s, time: e.target.value })} style={{ minHeight: 34, padding: '0 8px', borderRadius: 10, border: '1.5px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit' }} />
      </label>
      <span style={{ color: 'var(--muted)' }}>A quiet note if today's mirror check isn't done yet. Never a guilt message.</span>
    </div>
  )
}
