import { useEffect, useRef, type CSSProperties } from 'react'

/*
 * A tiny crew member drifting through a profile banner, tumbling slowly on a loose tether,
 * like someone floating out of an airlock. Each pass comes in from a different edge (left,
 * right or the top) and always drifts downward. The figure wears whatever the person has
 * equipped in the locker (visor, suit, patch, topper) and their own visor shape.
 * Purely decorative: hidden from assistive tech, never catches clicks, and holds still with
 * the tether hanging slack for people who ask for reduced motion.
 */

type Gear = Record<string, { id: string; fill?: string; c1?: string; c2?: string; bg?: string; fg?: string } | undefined>
type Crew = { id: string; traits?: { visor?: number; stripes?: number } }
type Pt = { x: number; y: number }
type Pass = { a: Pt; b: Pt; ms: number; spin: number; r0: number; t0: number }

const INK = '#14181f'

const rnd = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
/** Mostly constant drift with a soft start and finish, like coasting in zero g. */
const ease = (t: number) => t * t * (3 - 2 * t) * 0.35 + t * 0.65

/** A route across a W x H banner for a figure of size s: enter one edge, leave lower down. */
function newPass(W: number, H: number, s: number, speed: number, t0: number): Pass {
  const m = s * 1.4
  const edge = Math.floor(Math.random() * 3)
  let a: Pt
  let b: Pt
  if (edge === 0) {
    a = { x: -m, y: rnd(-m * 0.6, H * 0.35) }
    b = { x: W + m, y: rnd(H * 0.45, H + m) }
  } else if (edge === 1) {
    a = { x: W + m, y: rnd(-m * 0.6, H * 0.35) }
    b = { x: -m, y: rnd(H * 0.45, H + m) }
  } else {
    a = { x: rnd(W * 0.1, W * 0.9), y: -m * 1.3 }
    b = { x: Math.min(W + m, Math.max(-m, a.x + rnd(-W * 0.45, W * 0.45))), y: H + m * 1.3 }
  }
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  return { a, b, ms: (dist / speed) * rnd(0.85, 1.25), spin: (Math.random() < 0.5 ? -1 : 1) * rnd(160, 420), r0: rnd(-40, 40), t0 }
}

/** A loose tether from the hip, trailing back along the way it came, rippling as it goes. */
function tetherPath(hip: Pt, dir: Pt, len: number, phase: number): { d: string; end: Pt } {
  const perp = { x: -dir.y, y: dir.x }
  const pts: Pt[] = []
  const N = 14
  for (let i = 0; i <= N; i++) {
    const f = i / N
    const wave = Math.sin(phase + f * 5.2) * len * 0.13 * f + len * 0.08 * Math.sin(f * Math.PI)
    pts.push({ x: hip.x - dir.x * len * f + perp.x * wave, y: hip.y - dir.y * len * f + perp.y * wave + len * 0.06 * f * f })
  }
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  return { d, end: pts[pts.length - 1] }
}

export function FloatingCrew({ crew, gear, size = 56, duration = 16 }: { crew?: Crew; gear?: Gear; size?: number; duration?: number }) {
  const box = useRef<HTMLSpanElement>(null)
  const fig = useRef<HTMLSpanElement>(null)
  const line = useRef<SVGPathElement>(null)
  const under = useRef<SVGPathElement>(null)
  const clip = useRef<SVGCircleElement>(null)
  const ready = !!(crew && gear)

  useEffect(() => {
    const el = box.current
    const body = fig.current
    if (!el || !body) return
    const W = () => el.clientWidth || 1
    const H = () => el.clientHeight || 1
    const s = size
    const h = size * 1.2
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let pass: Pass | null = null
    let pauseUntil = 0
    let first = true

    const draw = (c: Pt, rot: number, dir: Pt, phase: number) => {
      body.style.transform = `translate(${(c.x - s / 2).toFixed(1)}px, ${(c.y - h / 2).toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`
      // The tether clips on at the hip, which turns with the body.
      const r = (rot * Math.PI) / 180
      const lx = s * 0.18
      const ly = h * 0.2
      const hip = { x: c.x + lx * Math.cos(r) - ly * Math.sin(r), y: c.y + lx * Math.sin(r) + ly * Math.cos(r) }
      const t = tetherPath(hip, dir, s * 2.1, phase)
      line.current?.setAttribute('d', t.d)
      under.current?.setAttribute('d', t.d)
      clip.current?.setAttribute('cx', t.end.x.toFixed(1))
      clip.current?.setAttribute('cy', t.end.y.toFixed(1))
    }

    if (still) {
      draw({ x: W() * 0.74, y: H() * 0.42 }, -14, { x: 0.8, y: 0.6 }, 1)
      return
    }

    const speed = () => (W() + size * 2.8) / (duration * 1000)
    const frame = (now: number) => {
      if (!pass) {
        if (now < pauseUntil) {
          raf = requestAnimationFrame(frame)
          return
        }
        pass = newPass(W(), H(), s, speed(), now)
        // The first pass starts part-way through, so a figure is in view when the page opens.
        if (first) pass.t0 = now - pass.ms * rnd(0.15, 0.5)
        first = false
      }
      const t = Math.min(1, (now - pass.t0) / pass.ms)
      const e = ease(t)
      const c = { x: pass.a.x + (pass.b.x - pass.a.x) * e, y: pass.a.y + (pass.b.y - pass.a.y) * e + Math.sin(now / 700) * s * 0.06 }
      const len = Math.hypot(pass.b.x - pass.a.x, pass.b.y - pass.a.y) || 1
      draw(c, pass.r0 + pass.spin * e, { x: (pass.b.x - pass.a.x) / len, y: (pass.b.y - pass.a.y) / len }, now / 520)
      if (t >= 1) {
        pass = null
        pauseUntil = now + rnd(800, 3800)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size, duration, ready])

  // The page renders once before its data arrives; there is nobody to draw yet.
  if (!crew || !gear) return null
  const suit = gear.suit?.fill ?? '#e9e6dc'
  const v1 = gear.visor?.c1 ?? '#4cc9f0'
  const v2 = gear.visor?.c2 ?? '#0b3d91'
  const patch = gear.patch && gear.patch.id !== 'patch-none' ? gear.patch : null
  const top = gear.top?.id ?? 'top-none'
  const shape = crew.traits?.visor ?? 0
  const stripes = Math.max(0, Math.min(3, crew.traits?.stripes ?? 1))
  const gid = `fc-${crew.id.replace(/\W/g, '')}-${size}`

  const layer: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }
  const bodyStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: size,
    height: size * 1.2,
    willChange: 'transform',
    transform: 'translate(-400px, -400px)',
  }

  return (
    <span ref={box} aria-hidden="true" style={layer}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path ref={under} fill="none" stroke="rgba(20,24,31,.55)" strokeWidth={Math.max(2.5, size / 16)} strokeLinecap="round" />
        <path ref={line} fill="none" stroke="#f3f1ea" strokeWidth={Math.max(1.2, size / 34)} strokeLinecap="round" strokeDasharray={`${size / 9} ${size / 18}`} />
        <circle ref={clip} r={Math.max(2.5, size / 14)} fill="#f6c445" stroke={INK} strokeWidth="1.2" cx="-50" cy="-50" />
      </svg>
      <span ref={fig} style={bodyStyle}>
        <svg viewBox="-6 -10 52 60" width="100%" height="100%" style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.3))' }}>
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
          {top === 'top-star' && (
            <path d="M20 -9 l2 4.2 4.6.6-3.4 3.2.9 4.6L20 1.4l-4.1 2.2.9-4.6-3.4-3.2 4.6-.6Z" fill="#f6c445" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          )}
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
    </span>
  )
}
