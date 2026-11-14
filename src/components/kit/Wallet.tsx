import { useEffect, useRef, useState } from 'react'

/** Streak flame and coin, the two gamification glyphs. Drawn here so nothing else needs them. */
export function FlameIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--color-flame)" aria-hidden focusable="false">
      <path d="M12 2.5c.6 3.2-1.3 4.6-2.7 6C7.6 10.2 6 11.8 6 14.4A6 6 0 0 0 18 15c0-2.3-1-3.8-2.2-5.2-.5 .8-1.2 1.3-2 1.5.8-2.4.2-5.4-1.8-8.8Z" />
    </svg>
  )
}

export function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="10" fill="var(--color-coin)" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="var(--color-coin-deep)" strokeWidth="1.6" />
      <path d="M12 8.6v6.8" stroke="var(--color-coin-deep)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type Props = {
  streak: number
  coins: number
  onClick?: () => void
  title?: string
}

/**
 * The dark wallet chip: days in a row, then coins. It bumps and floats a "+n" when the total
 * goes up, which is the one moment of celebration in the app — and it fires on EFFORT (a check-in,
 * a logged reading, a reported symptom), never on a health value being good.
 */
export function Wallet({ streak, coins, onClick, title = 'Rewards' }: Props) {
  const previous = useRef(coins)
  const [gain, setGain] = useState<number | null>(null)
  const [bumpKey, setBumpKey] = useState(0)

  useEffect(() => {
    const delta = coins - previous.current
    previous.current = coins
    if (delta <= 0) return
    setGain(delta)
    setBumpKey((k) => k + 1)
    const timer = setTimeout(() => setGain(null), 1500)
    return () => clearTimeout(timer)
  }, [coins])

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={`${title}: ${streak} day streak, ${coins} coins`}
      className="relative flex min-h-[44px] items-center rounded-full border text-sm font-semibold"
      style={{ background: '#14181f', color: '#f3f1ea', borderColor: 'rgb(243 241 234 / 0.14)' }}
    >
      <span className="flex items-center gap-1.5 py-0 pl-3.5 pr-2.5">
        <FlameIcon />
        {streak}
      </span>
      <span aria-hidden className="h-5 w-px" style={{ background: 'rgb(243 241 234 / 0.24)' }} />
      <span key={bumpKey} className="animate-bump flex items-center gap-1.5 py-0 pl-2.5 pr-3.5">
        <CoinIcon />
        {coins}
      </span>

      {gain !== null && (
        <span
          aria-hidden
          className="animate-floatup pointer-events-none absolute left-[70%] -top-1 rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: 'var(--color-coin)', color: '#3b2a00' }}
        >
          +{gain}
        </span>
      )}
    </button>
  )
}
