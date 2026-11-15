import type { CrewProgress } from '../lib/scoring'
import { CoinIcon } from './kit/Wallet'

/** The crew's shared weekly goal. A progress bar, not a leaderboard: nobody is ranked. */
export function CrewGoal({ progress }: { progress: CrewProgress }) {
  const pct = Math.round(progress.fraction * 100)
  return (
    <section aria-labelledby="goal-heading" className="card p-6">
      <h2 id="goal-heading" className="text-xl font-bold tracking-tight">
        Crew weekly goal
      </h2>
      <p className="mt-2 flex items-center gap-2 text-lg font-bold">
        <CoinIcon size={18} />
        {progress.weekPoints} of {progress.goal} coins this week
      </p>
      <div
        className="meter mt-3"
        style={{ height: 12 }}
        role="progressbar"
        aria-label="Crew weekly goal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%`, background: progress.reached ? 'var(--color-ok)' : 'var(--color-ink)' }} />
      </div>
      <p className="mt-3 leading-relaxed text-muted">
        {progress.reached
          ? 'Goal reached. Everyone contributed by checking in.'
          : `${pct}% of the way there. One shared goal, so nobody is ranked. Every check-in counts, including hard days.`}
      </p>
    </section>
  )
}
