import v from '../content/validation.json'

/*
 * The model card: what the flagging rules are, what data they were tested on, how often they are
 * wrong, and what they must not be used for. Every number is read from the same committed file the
 * validation card uses (src/content/validation.json), so this page cannot drift from the code.
 * The written version lives in docs/MODEL_CARD.md.
 */

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export function ModelCard() {
  const c = v.current
  const rows: [string, string][] = [
    ['What it does', 'Flags a reading that is far from this person’s own usual: Watch beyond 1 standard deviation, Act beyond 2. It also compares with a frozen reference from the first 14 days, catches a steady slide over the last seven readings, and links related readings into patterns.'],
    ['What it is not', 'Not a diagnosis, not a clinical threshold and not a medical device. A flag is a prompt to look closer and, if needed, to climb the escalation ladder.'],
    ['Data it learns from', 'Only this person’s own readings that passed the quality check. A baseline needs at least 5 good readings; until then the reading stays gray instead of guessing.'],
    ['Tested on', `One real participant from NASA’s head-down-tilt bed-rest study, replayed day by day: ${v.baselineDays} baseline days and ${v.tiltDays} days of tilt, ${v.indicators.length} indicators.`],
    ['False alarms', `${c.baselineFlags} of ${c.baselineJudged} baseline indicator-days flagged (${pct(c.baselineFlags, c.baselineJudged)}%), ${c.baselineRed} of them at Act. During baseline nothing is done to the person, so every one of these is a false alarm.`],
    ['Catching a real change', `The real weight loss in tilt is flagged on ${c.bodyMassTiltFlags} of ${c.bodyMassTiltJudged} days, first on tilt day ${c.bodyMassFirstTiltDay}, and held at Act on ${c.bodyMassTiltRed} of ${c.bodyMassTiltJudged} (the old rolling-only rule: ${v.old.bodyMassTiltRed}).`],
    ['Alertness', 'The quick 1-minute test is only compared with your own past results. The 3-minute PVT-B follows Basner et al. 2011 (lapse = 355 ms or more) and is kept as its own history, never mixed with the quick test.'],
    ['Known limits', 'One person, a ground analog rather than flight, and six indicators. Everyone else in the demo is simulated. A person with a long, very stable history gets a narrow band, so small changes flag sooner.'],
    ['Rewards', 'Coins and streaks pay for doing things (checking in, logging, following a care step, reporting early), never for a health value, so nobody gains by hiding a bad day.'],
  ]
  return (
    <section aria-labelledby="model-card-heading" style={{ borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(20px, 3vw, 32px)', display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>Model card</p>
        <h2 id="model-card-heading" style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 750, letterSpacing: '-0.035em' }}>
          What the flags are, and what they are not
        </h2>
      </div>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 10 }}>
        {rows.map(([k, text]) => (
          <div key={k} style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--panel-2)', display: 'grid', gap: 4, alignContent: 'start' }}>
            <dt style={{ fontWeight: 750, fontSize: 14.5 }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)' }}>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
