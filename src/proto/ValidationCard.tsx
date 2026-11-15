import v from '../content/validation.json'

/*
 * The flagging rules, replayed on real NASA bed-rest data (src/lib/validation.ts). The numbers
 * come from a committed file that a test regenerates and checks, so the page can never quietly
 * drift from what the code actually does.
 */

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function Bar({ label, n, of, tone }: { label: string; n: number; of: number; tone: string }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
        <span>{label}</span>
        <strong>
          {n} of {of}
        </strong>
      </p>
      <div role="img" aria-label={`${label}: ${n} of ${of}`} style={{ height: 10, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
        <div style={{ width: `${pct(n, of)}%`, height: '100%', background: tone }} />
      </div>
    </div>
  )
}

export function ValidationCard() {
  const o = v.old
  const c = v.current
  return (
    <section aria-labelledby="validation-heading" style={{ borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(20px, 3vw, 32px)', display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>Tested on real NASA data</p>
        <h2 id="validation-heading" style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 750, letterSpacing: '-0.035em' }}>
          Do the flags catch a real change?
        </h2>
        <p style={{ margin: 0, maxWidth: 760, fontSize: 15.5, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
          We replayed one real participant from NASA’s head-down-tilt bed-rest study, day by day, using only the readings available on each day: {v.baselineDays} baseline days, then {v.tiltDays} days of tilt. During the
          baseline nothing is done to the person, so any flag is a false alarm. During tilt their body mass really falls, so that is the change to catch.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
        <div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 18, background: 'var(--panel-2)' }}>
          <p style={{ margin: 0, fontWeight: 750 }}>Old rule: rolling baseline only</p>
          <Bar label="Body mass at Act during tilt" n={o.bodyMassTiltRed} of={o.bodyMassTiltJudged} tone="var(--act)" />
          <Bar label="Body mass flagged at all during tilt" n={o.bodyMassTiltFlags} of={o.bodyMassTiltJudged} tone="var(--watch)" />
          <Bar label="False alarms in the baseline (any flag)" n={o.baselineFlags} of={o.baselineJudged} tone="var(--rule-strong)" />
        </div>
        <div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 18, background: 'var(--panel-2)', border: '2px solid var(--ink)' }}>
          <p style={{ margin: 0, fontWeight: 750 }}>Current rule: plus a fixed reference and slide detection</p>
          <Bar label="Body mass at Act during tilt" n={c.bodyMassTiltRed} of={c.bodyMassTiltJudged} tone="var(--act)" />
          <Bar label="Body mass flagged at all during tilt" n={c.bodyMassTiltFlags} of={c.bodyMassTiltJudged} tone="var(--watch)" />
          <Bar label="False alarms in the baseline (any flag)" n={c.baselineFlags} of={c.baselineJudged} tone="var(--rule-strong)" />
        </div>
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5, lineHeight: 1.5 }}>
        <li>
          Both rules first flag the weight loss on tilt day {c.bodyMassFirstTiltDay}. The current rule keeps it at Act on {c.bodyMassTiltRed} of {c.bodyMassTiltJudged} tilt days instead of {o.bodyMassTiltRed}, because a slow loss can no longer drag
          its own baseline down.
        </li>
        <li>
          It costs no extra false alarms: {c.baselineFlags} of {c.baselineJudged} baseline indicator-days were flagged ({pct(c.baselineFlags, c.baselineJudged)}%), {c.baselineRed} of them at Act, the same as before.
        </li>
        <li>What this does not show: one person, a ground analog rather than flight, and six indicators. It is a sanity check on real data, not a clinical validation.</li>
      </ul>
    </section>
  )
}
