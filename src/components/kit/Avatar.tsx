import type { CrewMember, Status } from '../../contract/types'
import { getGear, suitById, visorById, type Gear } from '../../lib/gear'
import { mulberry32 } from '../../lib/sim/rng'
import { STATUS_COLOR } from '../StatusDot'

/**
 * PLACEHOLDER crew portraits.
 *
 * Line-art suit-and-helmet busts generated from the crew id, standing in until the team has real
 * images. The drawing is monochrome ink on paper: the challenge brief reserves color for status,
 * so the only colored parts are the ring (status, or rank when no status is given) and the level
 * chip. Crew are told apart by the drawing — visor shape, suit stripes, antenna — plus the chip.
 */

const hash = (text: string): number => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

type Traits = { visor: 0 | 1 | 2; stripes: number; antenna: boolean; tilt: number }

function traitsFor(id: string): Traits {
  const rand = mulberry32(hash(id))
  return {
    visor: Math.floor(rand() * 3) as 0 | 1 | 2,
    stripes: 1 + Math.floor(rand() * 3),
    antenna: rand() > 0.45,
    tilt: -7 + rand() * 14,
  }
}

/** "Crew 1" -> "C1", "You (guest crew member)" -> "YOU". */
export function crewCode(crew: CrewMember): string {
  const digits = crew.name.match(/\d+/)
  if (digits) return `C${digits[0]}`.slice(0, 3)
  return crew.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
}

/** Rank ring: a quiet rule at the bottom, coin gold in the middle, accent at the top. */
function ringForLevel(level: number): string {
  if (level >= 6) return 'var(--color-accent)'
  if (level >= 3) return 'var(--color-coin-deep)'
  return 'var(--color-rule-strong)'
}

type Props = {
  crew: CrewMember
  size?: number
  /** Status ring. Takes precedence over the rank ring: health outranks flair. */
  status?: Status
  /** Rank ring and the level chip. Ignored when `status` is given, except for the chip. */
  level?: number
  /** Overrides the ring color, for selection state where neither status nor rank is what it means. */
  ring?: string
  /** Shows the crew code chip. The drawing alone is too subtle to identify at 40px. */
  badge?: boolean
  /** Cosmetic visor and suit. Defaults to whatever the person picked during setup. */
  gear?: Gear
  className?: string
}

export function Avatar({ crew, size = 44, status, level, ring: ringOverride, badge = false, gear, className = '' }: Props) {
  const t = traitsFor(crew.id)
  const kit = gear ?? getGear()
  const visor = visorById(kit.visor)
  const suit = suitById(kit.suit)
  const ring = ringOverride ?? (status ? STATUS_COLOR[status] : level ? ringForLevel(level) : 'var(--color-rule-strong)')
  const uid = `av-${crew.id.replace(/[^a-z0-9]/gi, '')}`
  const chip = Math.max(17, Math.round(size * 0.4))

  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center overflow-hidden rounded-full"
        style={{ border: `${size >= 56 ? 3 : 2}px solid ${ring}`, background: 'var(--color-panel-2)' }}
      >
        <svg viewBox="0 0 48 48" width="100%" height="100%" role="img" aria-label={`${crew.name}, placeholder portrait`}>
          <defs>
            <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="0.55" y2="1">
              <stop offset="0%" stopColor={visor.from} />
              <stop offset="100%" stopColor={visor.to} />
            </linearGradient>
            <clipPath id={`${uid}-clip`}>
              <circle cx="24" cy="24" r="24" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${uid}-clip)`} stroke="var(--color-ink)" strokeWidth={1.6} fill="none" strokeLinejoin="round">
            {/* Shoulders first, so the helmet sits on top of them. */}
            <path d="M3 52 C3 39.5 12.5 33 24 33 C35.5 33 45 39.5 45 52 Z" fill={suit.fill} />
            {Array.from({ length: t.stripes }, (_, i) => (
              <path key={i} d={`M${14 + i * 5} 52 L${14 + i * 5} ${41 - i * 1.5}`} strokeWidth={1.4} opacity={0.6} />
            ))}

            <g transform={`rotate(${t.tilt.toFixed(1)} 24 20)`}>
              {t.antenna && (
                <>
                  <path d="M24 5.5 L24 1.5" strokeWidth={1.5} />
                  <circle cx="24" cy="1" r="1.8" fill="var(--color-accent)" stroke="none" />
                </>
              )}
              <circle cx="24" cy="20" r="14.5" fill="var(--color-panel)" />

              {/* Visor: the main thing that tells two crew members apart. */}
              {t.visor === 0 && <rect x="12.5" y="14.5" width="23" height="11.5" rx="5.75" fill={`url(#${uid}-visor)`} />}
              {t.visor === 1 && <path d="M11.5 20.5 A12.5 12.5 0 0 1 36.5 20.5 L36.5 23 A12.5 9.5 0 0 1 11.5 23 Z" fill={`url(#${uid}-visor)`} />}
              {t.visor === 2 && <ellipse cx="24" cy="20.5" rx="11.5" ry="7.5" fill={`url(#${uid}-visor)`} />}

              <path d="M16.5 17.5 L21 17.5" strokeWidth={1.6} opacity={0.85} stroke="#ffffff" />
            </g>
          </g>
        </svg>
      </span>

      {level !== undefined && (
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full font-bold"
          style={{
            width: chip,
            height: chip,
            fontSize: Math.max(10, chip * 0.52),
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            border: '2px solid var(--color-panel)',
          }}
        >
          {level}
        </span>
      )}

      {badge && level === undefined && (
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full font-bold"
          style={{
            minWidth: chip,
            height: chip,
            padding: '0 5px',
            fontSize: Math.max(9, chip * 0.46),
            background: 'var(--color-panel)',
            border: `1px solid ${ring}`,
            color: 'var(--color-ink)',
          }}
        >
          {crewCode(crew)}
        </span>
      )}
    </span>
  )
}
