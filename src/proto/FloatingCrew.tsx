import type { CSSProperties } from 'react'

/*
 * A tiny crew member drifting down through a profile banner, tumbling slowly like someone
 * floating out of an airlock. It wears whatever the person has equipped in the locker (visor,
 * suit, patch, topper) and their own visor shape, so it is always recognisably them.
 * Purely decorative: hidden from assistive tech, never catches clicks, and holds still for
 * people who ask for reduced motion.
 */

type Gear = Record<string, { id: string; fill?: string; c1?: string; c2?: string; bg?: string; fg?: string } | undefined>
type Crew = { id: string; traits?: { visor?: number; stripes?: number } }

const INK = '#14181f'

/** A stable number from the crew id, so each person drifts on their own schedule. */
const seed = (id: string) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7)

export function FloatingCrew({ crew, gear, size = 40, duration = 16 }: { crew?: Crew; gear?: Gear; size?: number; duration?: number }) {
  // The page renders once before its data arrives; there is nobody to draw yet.
  if (!crew || !gear) return null
  const n = seed(crew.id)
  const suit = gear.suit?.fill ?? '#e9e6dc'
  const v1 = gear.visor?.c1 ?? '#4cc9f0'
  const v2 = gear.visor?.c2 ?? '#0b3d91'
  const patch = gear.patch && gear.patch.id !== 'patch-none' ? gear.patch : null
  const top = gear.top?.id ?? 'top-none'
  const shape = crew.traits?.visor ?? 0
  const stripes = Math.max(0, Math.min(3, crew.traits?.stripes ?? 1))
  const gid = `fc-${crew.id.replace(/\W/g, '')}-${size}`

  const style = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: size,
    height: size * 1.2,
    pointerEvents: 'none',
    animation: `chm-drift ${duration}s linear ${-((n % 1000) / 1000) * duration}s infinite`,
    // Each person tumbles the other way about half the time.
    '--spin': n % 2 ? '1' : '-1',
  } as CSSProperties

  return (
    <span aria-hidden="true" className="chm-drift" style={style}>
      <svg viewBox="-6 -10 52 60" width="100%" height="100%" style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.25))' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={v1} />
            <stop offset="1" stopColor={v2} />
          </linearGradient>
        </defs>
        {/* Topper */}
        {top === 'top-antenna' && (
          <g stroke={INK} strokeWidth="1.5" strokeLinecap="round">
            <path d="M20 3 L20 -5" />
            <circle cx="20" cy="-6.5" r="2" fill="#f0645a" />
          </g>
        )}
        {top === 'top-star' && <path d="M20 -9 l2 4.2 4.6.6-3.4 3.2.9 4.6L20 1.4l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6Z" fill="#f6c445" stroke={INK} strokeWidth="1" strokeLinejoin="round" />}
        {top === 'top-halo' && <ellipse cx="20" cy="0" rx="12" ry="3" fill="none" stroke="#f6c445" strokeWidth="2" />}
        {/* Backpack */}
        <rect x="5" y="17" width="30" height="19" rx="5" fill={suit} stroke={INK} strokeWidth="1.5" />
        <rect x="5" y="17" width="30" height="19" rx="5" fill="rgba(0,0,0,.18)" />
        {/* Arms */}
        <rect x="1" y="20" width="8" height="13" rx="4" fill={suit} stroke={INK} strokeWidth="1.5" transform="rotate(18 5 20)" />
        <rect x="31" y="20" width="8" height="13" rx="4" fill={suit} stroke={INK} strokeWidth="1.5" transform="rotate(-18 35 20)" />
        {/* Legs */}
        <rect x="11" y="33" width="8" height="11" rx="3.5" fill={suit} stroke={INK} strokeWidth="1.5" />
        <rect x="21" y="33" width="8" height="11" rx="3.5" fill={suit} stroke={INK} strokeWidth="1.5" />
        {/* Body */}
        <rect x="9" y="18" width="22" height="20" rx="8" fill={suit} stroke={INK} strokeWidth="1.5" />
        {Array.from({ length: stripes }, (_, i) => (
          <path key={i} d={`M${11 + i * 3} 36 L${11 + i * 3} 31`} stroke="#0b3d91" strokeWidth="1.4" strokeLinecap="round" />
        ))}
        {patch?.bg && <circle cx="24.5" cy="27" r="3.6" fill={patch.bg} stroke={patch.fg ?? '#fff'} strokeWidth="1" />}
        {/* Helmet and visor (shape follows the person's own visor trait) */}
        <circle cx="20" cy="12" r="11" fill={suit} stroke={INK} strokeWidth="1.5" />
        {shape === 1 ? (
          <rect x="11.5" y="7.5" width="17" height="9" rx="4.5" fill={`url(#${gid})`} stroke={INK} strokeWidth="1.3" />
        ) : shape === 2 ? (
          <path d="M12 9.5 Q20 5 28 9.5 L27 15 Q20 18 13 15 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth="1.3" />
        ) : (
          <ellipse cx="21" cy="12" rx="8" ry="5.6" fill={`url(#${gid})`} stroke={INK} strokeWidth="1.3" />
        )}
        <ellipse cx="17.5" cy="9.8" rx="2.6" ry="1.3" fill="rgba(255,255,255,.75)" />
      </svg>
    </span>
  )
}
