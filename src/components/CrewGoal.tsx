import type { CrewProgress } from '../lib/scoring'

/** The crew's shared weekly goal. A progress bar, not a leaderboard: nobody is ranked. */
export function CrewGoal({ progress }: { progress: CrewProgress }) {
  const pct = Math.round(progress.fraction * 100)
  return (
    <section aria-labelledby="goal-heading" className="border border-rule bg-panel p-5">
      <h2 id="goal-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
        Crew weekly goal
      </h2>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {progress.weekPoints} <span className="text-lg font-normal text-muted">of {progress.goal} points this week</span>
      </p>
      <div
        className="mt-3 h-3 w-full bg-rule"
        role="progressbar"
        aria-label="Crew weekly goal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={`h-full origin-left ${progress.reached ? 'bg-ok' : 'bg-accent'}`} style={{ transform: `scaleX(${progress.fraction})` }} />
      </div>
      <p className="mt-2 text-sm text-muted">{progress.reached ? 'Goal reached. Everyone contributed by checking in.' : `${pct}% of the way there. Every check-in counts, including hard days.`}</p>
    </section>
  )
}
