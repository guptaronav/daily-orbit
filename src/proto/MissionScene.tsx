import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import * as D from './data'
import { useStoreTick } from './shared'

/*
 * Illustrated mission banners: the Moon with Earth rising, the ISS over Earth, dusk in Jezero
 * Crater on Mars, and the long cruise between planets. The "Current mission" banner draws
 * whichever mission the top bar is set to.
 *
 * On the Rewards profile the banner is a small game: each scene hides three things to find.
 * Tapping one shows a short, true NASA fact; finding all three pays a one-off coin bonus
 * (cosmetic coins only, never XP), and finding all twelve earns the Explorer badge. Anywhere
 * else (the profile card, crew cards, shop tiles) the scene is purely decorative.
 */

type Banner = { id: string; scene?: string } | undefined
type Spot = { did: string; ring: [number, number, number] }
type Fact = { label: string; fact: string; fresh: boolean; bonus: number; scene: string }

type Discovery = { id: string; label: string; fact: string }
const DISC = D.DISCOVERIES as Record<string, Discovery[]>
const NAMES = D.SCENE_NAMES as Record<string, string>

const W = 1200
const H = 300

/** A fixed, seeded star field, so stars never jump around between renders. */
function starField(n: number, seed: number, yMax: number) {
  let x = seed
  const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280)
  return Array.from({ length: n }, () => ({ cx: r() * W, cy: r() * yMax, r: 0.5 + r() * 1.3, d: (r() * 5).toFixed(2), o: 0.35 + r() * 0.65 }))
}

function Stars({ n, seed, yMax, twinkle = true }: { n: number; seed: number; yMax: number; twinkle?: boolean }) {
  return (
    <g>
      {starField(n, seed, yMax).map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="#fff"
          opacity={s.o}
          style={twinkle && i % 3 === 0 ? { animation: `ms-twinkle 3.2s ease-in-out ${s.d}s infinite` } : undefined}
        />
      ))}
    </g>
  )
}

/** A layer that slides a little with the pointer: deeper layers move more. */
const depth = (d: number): CSSProperties => ({
  transform: `translate(calc(var(--px, 0) * ${d}px), calc(var(--py, 0) * ${d * 0.45}px))`,
  transition: 'transform 400ms cubic-bezier(.22,1,.36,1)',
})
const anim = (a: string, extra: CSSProperties = {}): CSSProperties => ({ animation: a, transformBox: 'fill-box', transformOrigin: 'center', ...extra })

export function BannerScene({ banner, crewId, interactive = false }: { banner: Banner; crewId?: string; interactive?: boolean }) {
  // Re-draw when the mission changes (the "Current mission" banner follows it) or a discovery lands.
  useStoreTick()
  const raw = useId()
  const uid = 'ms' + raw.replace(/[^a-zA-Z0-9]/g, '')
  const wrap = useRef<HTMLSpanElement>(null)
  const [fact, setFact] = useState<Fact | null>(null)
  const [poke, setPoke] = useState<Record<string, number>>({})
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (!fact) return
    const t = setTimeout(() => setFact(null), fact.bonus ? 9000 : 7000)
    return () => clearTimeout(t)
  }, [fact])

  const scene: string | null = D.sceneFor(banner)
  if (!scene) return null
  const live = interactive && !!crewId
  const list = DISC[scene] || []
  const found: string[] = live ? D.foundIn(crewId, scene) : []
  const allFound = found.length === list.length

  const hit = (did: string) => {
    if (!crewId) return
    const d = list.find((x) => x.id === did)
    if (!d) return
    const res = D.discover(crewId, scene, did)
    setPoke((p) => ({ ...p, [did]: (p[did] || 0) + 1 }))
    setFact({ label: d.label, fact: d.fact, fresh: res.fresh, bonus: res.bonus, scene })
    if (res.bonus) setBurst((b) => b + 1)
  }

  /** A discoverable thing: a real button for keyboard and screen readers, with a glowing ring until found. */
  const spot = ({ did, ring: [cx, cy, r] }: Spot, children: ReactNode) => {
    if (!live) return <g>{children}</g>
    const d = list.find((x) => x.id === did)
    const got = found.includes(did)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        hit(did)
      }
    }
    return (
      <g role="button" tabIndex={0} aria-label={`${d?.label ?? did}${got ? ', found' : ', not found yet'}`} className="ms-spot" onClick={() => hit(did)} onKeyDown={onKey}>
        {/* A generous invisible hit area, so small things are easy to tap. */}
        <circle cx={cx} cy={cy} r={Math.max(r, 26)} fill="transparent" />
        {children}
        <circle className="ms-focus" cx={cx} cy={cy} r={r + 4} fill="none" stroke="#f6c445" strokeWidth="3" />
        {!got && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f6c445" strokeWidth="2" style={anim('ms-ping 2.4s ease-out infinite')} />}
        {got && (
          <g transform={`translate(${cx + r * 0.7} ${cy - r * 0.7})`}>
            <circle r="8" fill="#f6c445" stroke="#14181f" strokeWidth="1.5" />
            <path d="M-3.5 0 L-1 2.5 L3.5 -2.5" fill="none" stroke="#14181f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>
    )
  }

  const onMove = (e: PointerEvent) => {
    const el = wrap.current
    if (!el) return
    const b = el.getBoundingClientRect()
    el.style.setProperty('--px', (((e.clientX - b.left) / b.width) * 2 - 1).toFixed(3))
    el.style.setProperty('--py', (((e.clientY - b.top) / b.height) * 2 - 1).toFixed(3))
  }
  const onLeave = () => {
    wrap.current?.style.setProperty('--px', '0')
    wrap.current?.style.setProperty('--py', '0')
  }

  const art =
    scene === 'mars' ? marsScene(uid, spot, poke) : scene === 'lunar' ? lunarScene(uid, spot, poke) : scene === 'transit' ? transitScene(uid, spot, poke) : issScene(uid, spot, poke)

  return (
    <span
      ref={wrap}
      className="ms-scene"
      onPointerMove={live ? onMove : undefined}
      onPointerLeave={live ? onLeave : undefined}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: live ? 'auto' : 'none' }}
      aria-hidden={live ? undefined : true}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }} role={live ? 'group' : undefined} aria-label={live ? `${NAMES[scene]} banner, ${found.length} of ${list.length} discoveries found` : undefined}>
        {art}
      </svg>

      {live && (
        <span className="ms-chip" style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 8px', borderRadius: 999, background: 'rgba(8,11,18,.72)', color: '#f3f1ea', fontSize: 12.5, fontWeight: 650, backdropFilter: 'blur(6px)', border: `1px solid ${allFound ? '#f6c445' : 'rgba(243,241,234,.18)'}`, pointerEvents: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={allFound ? '#f6c445' : '#9cbcff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m10.07 9.53 4.38 7.6M3 13.5l5.66-3.27M8.6 8.4l6.94-4L19 10.4l-6.94 4z M12 17l-2 5 M12 17l2 5" />
          </svg>
          <span>{allFound ? `${NAMES[scene]} explored` : `Discoveries ${found.length}/${list.length}`}</span>
          <span style={{ display: 'flex', gap: 4 }}>
            {list.map((d) => (
              <span key={d.id} style={{ width: 7, height: 7, borderRadius: 99, background: found.includes(d.id) ? '#f6c445' : 'rgba(243,241,234,.25)' }} />
            ))}
          </span>
          {!allFound && <span style={{ color: '#f6c445', whiteSpace: 'nowrap' }}>+{D.SCENE_BONUS}</span>}
        </span>
      )}

      {live && fact && (
        <span role="status" style={{ position: 'absolute', top: 12, left: 12, maxWidth: 'min(440px, calc(100% - 24px))', padding: '12px 14px 12px 16px', borderRadius: 18, background: 'rgba(8,11,18,.86)', color: '#f3f1ea', backdropFilter: 'blur(8px)', border: '1px solid rgba(243,241,234,.16)', boxShadow: '0 18px 40px -18px rgba(0,0,0,.7)', animation: 'ms-pop 360ms cubic-bezier(.34,1.56,.64,1) both', fontSize: 13.5, lineHeight: 1.45, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ flex: '1 1 auto' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <strong style={{ fontSize: 14.5 }}>{fact.label}</strong>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: fact.fresh ? '#f6c445' : 'rgba(243,241,234,.14)', color: fact.fresh ? '#14181f' : '#c9c6bd' }}>{fact.fresh ? 'New discovery' : 'Already found'}</span>
            </span>
            <span style={{ display: 'block', color: '#d9d6cd' }}>{fact.fact}</span>
            {fact.bonus > 0 && (
              <span style={{ display: 'block', marginTop: 6, color: '#f6c445', fontWeight: 700 }}>
                +{fact.bonus} coins: you found everything in {NAMES[fact.scene]}
              </span>
            )}
          </span>
          <button type="button" onClick={() => setFact(null)} aria-label="Close fact" style={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: 99, border: 0, background: 'rgba(243,241,234,.12)', color: '#f3f1ea', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
            ×
          </button>
        </span>
      )}

      {burst > 0 && (
        <span key={burst} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '45%', pointerEvents: 'none' }}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2
            const dist = 70 + (i % 3) * 30
            return (
              <span key={i} style={{ position: 'absolute', width: 10, height: 10, borderRadius: 99, background: i % 2 ? '#f6c445' : '#7ef0c5', ['--bx' as string]: `${Math.cos(a) * dist}px`, ['--by' as string]: `${Math.sin(a) * dist}px`, animation: 'ms-burst 1100ms cubic-bezier(.22,1,.36,1) forwards' }} />
            )
          })}
        </span>
      )}
    </span>
  )
}

type SpotFn = (s: Spot, children: ReactNode) => ReactNode
type Pokes = Record<string, number>

/* ---- Jezero dusk: Mars at sunset, rover, habitat, a dust devil and Mars's blue sunset --------- */
function marsScene(u: string, spot: SpotFn, poke: Pokes) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#140a16" />
          <stop offset=".35" stopColor="#3d1a22" />
          <stop offset=".62" stopColor="#8e4a2f" />
          <stop offset=".82" stopColor="#c97c48" />
          <stop offset="1" stopColor="#e6b07a" />
        </linearGradient>
        <radialGradient id={`${u}sun`}>
          <stop offset="0" stopColor="#f4faff" />
          <stop offset=".12" stopColor="#b9dcff" stopOpacity=".95" />
          <stop offset=".4" stopColor="#6f9fdc" stopOpacity=".45" />
          <stop offset="1" stopColor="#6f9fdc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b45a37" />
          <stop offset="1" stopColor="#5e2617" />
        </linearGradient>
        <linearGradient id={`${u}dune`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a5502f" />
          <stop offset="1" stopColor="#74331f" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}sky)`} />
      <g opacity=".7">
        <Stars n={50} seed={7} yMax={110} />
      </g>
      {/* Phobos and Deimos crossing the sky */}
      <g transform="translate(1300 74)">
        <g style={anim('ms-cross 80s linear infinite', { ['--dist' as string]: '-1500px' })}>
          <path d="M-9 -5 C-4 -11 8 -9 10 -2 C12 5 4 9 -3 8 C-10 7 -13 1 -9 -5Z" fill="#8b7d72" />
          <circle cx="2" cy="-1" r="2" fill="#6b5f57" />
        </g>
      </g>
      <g transform="translate(1260 46)">
        <g style={anim('ms-cross 150s linear -60s infinite', { ['--dist' as string]: '-1400px' })}>
          <circle r="3.2" fill="#a39488" />
        </g>
      </g>
      {/* Blue sunset */}
      <g style={depth(2)}>
        {spot(
          { did: 'sunset', ring: [930, 214, 20] },
          <g>
            <circle cx="930" cy="214" r="120" fill={`url(#${u}sun)`} style={anim('ms-glow 6s ease-in-out infinite')} />
            <circle cx="930" cy="214" r="7" fill="#f8fbff" />
          </g>,
        )}
      </g>
      {/* Far rim: a broad shield volcano on the horizon */}
      <g style={depth(4)}>
        <path d="M0 222 C150 206 250 212 380 204 C520 160 700 156 820 198 C900 208 1000 206 1200 212 L1200 300 L0 300Z" fill="#6b2f22" />
      </g>
      {/* Mid dunes with a dust devil */}
      <g style={depth(8)}>
        <path d="M0 236 C120 222 230 230 340 224 C470 216 560 232 680 228 C820 222 940 236 1060 230 C1120 227 1170 232 1200 230 L1200 300 L0 300Z" fill={`url(#${u}dune)`} />
        <g transform="translate(250 230)">
          <g style={anim('ms-patrol 18s ease-in-out infinite alternate', { ['--dist' as string]: '150px', transformBox: 'view-box' })}>
            {spot(
              { did: 'devil', ring: [12, -38, 36] },
              <g style={anim('ms-sway 2.6s ease-in-out infinite', { transformOrigin: 'bottom' })}>
                <path d="M-4 0 L-16 -76 Q14 -86 44 -74 L6 0Z" fill="#d8955f" opacity=".22" />
                {[
                  [0, 0, 6, 2],
                  [2, -15, 10, 3],
                  [5, -31, 15, 4],
                  [9, -49, 21, 5],
                  [13, -68, 27, 6],
                ].map(([x, y, rx, ry], i) => (
                  <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke="#e8b083" strokeWidth="2.6" opacity=".6" style={anim(`ms-twinkle 1.${i + 2}s ease-in-out infinite`)} />
                ))}
              </g>,
            )}
          </g>
        </g>
        {/* Habitat */}
        <g transform="translate(800 232)">
          <g transform="skewX(-18)">
            <rect x="-112" y="-14" width="30" height="12" fill="#24345e" stroke="#0b1430" strokeWidth="1.2" />
            <rect x="-78" y="-14" width="30" height="12" fill="#24345e" stroke="#0b1430" strokeWidth="1.2" />
            <path d="M-112 -8 H-48 M-97 -14 V-2 M-63 -14 V-2" stroke="#4a6bb0" strokeWidth=".8" />
          </g>
          <path d="M-46 0 A46 32 0 0 1 46 0 Z" fill="#e6ddd1" stroke="#4a2a20" strokeWidth="1.5" />
          <path d="M-30 0 A30 30 0 0 1 0 -32 M30 0 A30 30 0 0 0 0 -32 M-46 0 Q0 -14 46 0" fill="none" stroke="#b9ab9b" strokeWidth="1.2" />
          {[-24, -8, 8].map((x, i) => (
            <rect key={x} x={x} y="-14" width="7" height="5" rx="1.5" fill="#ffd27a" style={anim(`ms-twinkle ${2.4 + i * 0.7}s ease-in-out infinite`)} />
          ))}
          <rect x="18" y="-12" width="10" height="12" rx="2" fill="#7a5a48" />
          <path d="M46 -4 H80" stroke="#b9ab9b" strokeWidth="5" />
          <path d="M80 0 A22 18 0 0 1 124 0 Z" fill="#e6ddd1" stroke="#4a2a20" strokeWidth="1.5" />
          <path d="M136 0 V-30" stroke="#4a2a20" strokeWidth="2" />
          <ellipse cx="140" cy="-34" rx="11" ry="5" fill="#e6ddd1" stroke="#4a2a20" strokeWidth="1.3" transform="rotate(-30 140 -34)" />
          <circle cx="136" cy="-31" r="1.8" fill="#f0645a" style={anim('ms-twinkle 1.4s steps(2) infinite')} />
        </g>
      </g>
      {/* Near ground and the rover */}
      <g style={depth(14)}>
        <path d="M0 250 C200 238 360 246 520 242 C700 236 880 250 1040 244 C1110 241 1160 246 1200 244 L1200 300 L0 300Z" fill={`url(#${u}ground)`} />
        {[
          [120, 266, 14, 5],
          [330, 276, 9, 3.5],
          [610, 270, 18, 6],
          [880, 280, 11, 4],
          [1080, 268, 15, 5],
        ].map(([x, y, rx, ry], i) => (
          <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#5a2516" opacity=".8" />
        ))}
        <g transform="translate(480 250)">
          <g style={anim('ms-patrol 24s ease-in-out infinite alternate', { ['--dist' as string]: '200px', transformBox: 'view-box' })}>
            {spot(
              { did: 'rover', ring: [0, -24, 40] },
              <g>
                <path d="M-24 -8 L-12 -2 L0 -8 L12 -2 L24 -8" fill="none" stroke="#2b1d18" strokeWidth="2" />
                <rect x="-28" y="-22" width="56" height="14" rx="3" fill="#e9e6dc" stroke="#2b1d18" strokeWidth="1.5" />
                <rect x="-32" y="-26" width="64" height="5" rx="1.5" fill="#c9962b" stroke="#2b1d18" strokeWidth="1" />
                <path d="M18 -26 V-46" stroke="#2b1d18" strokeWidth="2.2" />
                <rect x="11" y="-53" width="16" height="8" rx="2" fill="#e9e6dc" stroke="#2b1d18" strokeWidth="1.3" />
                <circle cx="24" cy="-49" r="2.2" fill="#0b3d91" />
                <path d="M-28 -14 L-40 -8 L-44 -1" fill="none" stroke="#2b1d18" strokeWidth="2" strokeLinecap="round" />
                {[-24, 0, 24].map((x) => (
                  <g key={x} transform={`translate(${x} 0)`}>
                    <circle r="6.5" fill="#3a2a24" stroke="#14181f" strokeWidth="1.3" />
                    <path d="M-5 0 H5 M0 -5 V5" stroke="#8a7a70" strokeWidth="1.2" style={anim('ms-spin 2.2s linear infinite')} />
                  </g>
                ))}
                {poke.rover ? <circle key={poke.rover} cx="24" cy="-49" r="34" fill="#fff" style={anim('ms-flash 700ms ease-out forwards')} /> : null}
              </g>,
            )}
          </g>
        </g>
        {/* Drifting dust */}
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={(i * 83) % W} cy={150 + ((i * 37) % 110)} r={0.8 + (i % 3) * 0.6} fill="#f3c9a0" opacity=".55" style={anim(`ms-dust ${9 + (i % 5) * 2}s linear ${-i * 1.3}s infinite`)} />
        ))}
      </g>
    </>
  )
}

/* ---- Pale blue dot: the ISS crossing over Earth, an aurora on the limb, a cargo ship ---------- */
function issScene(u: string, spot: SpotFn, poke: Pokes) {
  const land = (
    <g>
      <path d="M120 230 C180 205 260 215 300 240 C330 262 280 300 220 300 C160 300 100 270 120 230Z" fill="#5f8a45" />
      <path d="M190 236 C210 228 236 232 244 246 C236 258 206 256 190 236Z" fill="#a8935a" />
      <path d="M460 205 C520 190 600 200 640 220 C670 236 650 262 600 268 C540 274 470 250 460 205Z" fill="#5f8a45" />
      <path d="M820 215 C880 200 960 210 990 232 C1010 250 970 280 920 282 C860 284 800 250 820 215Z" fill="#6c8f47" />
      <path d="M880 226 C910 220 940 228 944 242 C920 252 890 246 880 226Z" fill="#b39a5c" />
    </g>
  )
  const clouds = (
    <g fill="#fff" opacity=".6">
      {[
        [80, 214, 60, 7],
        [260, 230, 90, 8],
        [420, 200, 70, 6],
        [560, 240, 110, 9],
        [760, 206, 80, 7],
        [960, 236, 100, 8],
        [1110, 210, 70, 6],
      ].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} />
      ))}
    </g>
  )
  return (
    <>
      <defs>
        <linearGradient id={`${u}space`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#02040c" />
          <stop offset="1" stopColor="#0a1430" />
        </linearGradient>
        <radialGradient id={`${u}ocean`} cx=".5" cy=".12" r=".7">
          <stop offset="0" stopColor="#3a9be0" />
          <stop offset=".5" stopColor="#1d63a8" />
          <stop offset="1" stopColor="#0b2f5e" />
        </radialGradient>
        <linearGradient id={`${u}night`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#020611" stopOpacity="0" />
          <stop offset=".58" stopColor="#020611" stopOpacity="0" />
          <stop offset=".78" stopColor="#020611" stopOpacity=".82" />
          <stop offset="1" stopColor="#020611" stopOpacity=".95" />
        </linearGradient>
        <radialGradient id={`${u}sunglow`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".1" stopColor="#fff6d8" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}aur`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b28dff" stopOpacity="0" />
          <stop offset=".35" stopColor="#7ef0c5" stopOpacity=".55" />
          <stop offset="1" stopColor="#7ef0c5" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${u}earth`}>
          <circle cx="600" cy="940" r="760" />
        </clipPath>
        <filter id={`${u}blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${u}soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}space)`} />
      <Stars n={90} seed={3} yMax={200} />
      <g style={depth(2)}>
        <circle cx="1120" cy="56" r="120" fill={`url(#${u}sunglow)`} />
        <g transform="translate(1120 56)">
          <g style={anim('ms-spin 80s linear infinite')} stroke="#fff6d8" strokeWidth="1.2" opacity=".55">
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={`M0 0 L${Math.cos((i * Math.PI) / 4) * 70} ${Math.sin((i * Math.PI) / 4) * 70}`} />
            ))}
          </g>
        </g>
        <circle cx="1120" cy="56" r="9" fill="#fff" />
      </g>
      {/* Earth */}
      <g style={depth(4)}>
        <circle cx="600" cy="940" r="772" fill="none" stroke="#7fd0ff" strokeWidth="18" opacity=".35" filter={`url(#${u}blur)`} />
        <circle cx="600" cy="940" r="760" fill={`url(#${u}ocean)`} />
        <g clipPath={`url(#${u}earth)`}>
          <g style={anim('ms-scroll 160s linear infinite', { ['--dist' as string]: '-1200px', transformBox: 'view-box', transformOrigin: '0 0' })}>
            {land}
            <g transform="translate(1200 0)">{land}</g>
          </g>
          <g style={anim('ms-scroll 95s linear infinite', { ['--dist' as string]: '-1200px', transformBox: 'view-box', transformOrigin: '0 0' })}>
            {clouds}
            <g transform="translate(1200 0)">{clouds}</g>
          </g>
          <rect x="0" y="170" width={W} height="130" fill={`url(#${u}night)`} />
          {Array.from({ length: 34 }, (_, i) => (
            <circle key={i} cx={900 + ((i * 47) % 290)} cy={206 + ((i * 29) % 90)} r={0.9 + (i % 3) * 0.4} fill="#ffd27a" opacity=".85" style={i % 4 === 0 ? anim(`ms-twinkle 2.${i % 9}s ease-in-out infinite`) : undefined} />
          ))}
        </g>
        <circle cx="600" cy="940" r="760" fill="none" stroke="#bfe8ff" strokeWidth="2" opacity=".9" />
      </g>
      {/* Aurora on the limb */}
      <g style={depth(4)}>
        {spot(
          { did: 'aurora', ring: [360, 196, 42] },
          <g filter={`url(#${u}soft)`}>
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={296 + i * 17} y={150 + Math.abs(3.5 - i) * 4} width="16" height="62" rx="8" fill={`url(#${u}aur)`} transform={`skewX(${-8 + i * 2})`} style={anim(`ms-aurora ${2.2 + (i % 3) * 0.6}s ease-in-out ${i * 0.25}s infinite alternate`, { transformOrigin: 'bottom' })} />
            ))}
          </g>,
        )}
      </g>
      {/* Cargo ship on approach */}
      <g style={depth(7)}>
        <g transform="translate(940 140)">
          <g style={anim('ms-bob 5s ease-in-out infinite')}>
            {spot(
              { did: 'cargo', ring: [0, -2, 30] },
              <g transform="rotate(-24)">
                <path d="M-10 -16 L10 -16 L15 6 L-15 6Z" fill="#f3f1ea" stroke="#14181f" strokeWidth="1.3" />
                <path d="M-10 -16 Q0 -24 10 -16Z" fill="#c9ccd2" stroke="#14181f" strokeWidth="1.2" />
                <rect x="-4" y="-10" width="8" height="5" rx="1.5" fill="#0b3d91" />
                <rect x="-14" y="6" width="28" height="14" fill="#2b2f38" stroke="#14181f" strokeWidth="1.2" />
                <rect x="-14" y="9" width="14" height="8" fill="#24345e" />
                <circle cx="-13" cy="-4" r="2.5" fill="#bfe8ff" style={anim('ms-puffs 3.6s ease-out infinite')} />
              </g>,
            )}
          </g>
        </g>
      </g>
      {/* The ISS crossing */}
      <g style={depth(9)}>
      <g transform="translate(-180 104)">
        <g style={anim('ms-cross 48s linear infinite', { ['--dist' as string]: '1560px', transformBox: 'view-box', transformOrigin: '0 0' })}>
          {spot(
            { did: 'station', ring: [0, 0, 54] },
            <g transform="rotate(-6)">
              <rect x="-72" y="-2.5" width="144" height="5" fill="#c9ccd2" stroke="#14181f" strokeWidth="1" />
              {[-64, -46, 46, 64].map((x) => (
                <g key={x}>
                  {[-36, 4].map((y) => (
                    <g key={y}>
                      <rect x={x - 6} y={y} width="12" height="32" fill="#c98f2a" stroke="#14181f" strokeWidth=".9" />
                      <path d={`M${x} ${y} V${y + 32} M${x - 6} ${y + 8} H${x + 6} M${x - 6} ${y + 16} H${x + 6} M${x - 6} ${y + 24} H${x + 6}`} stroke="#7a5400" strokeWidth=".6" />
                    </g>
                  ))}
                </g>
              ))}
              <rect x="-26" y="-20" width="6" height="15" fill="#f3f1ea" stroke="#14181f" strokeWidth=".8" />
              <rect x="20" y="5" width="6" height="15" fill="#f3f1ea" stroke="#14181f" strokeWidth=".8" />
              <rect x="-5" y="-22" width="10" height="44" rx="4" fill="#e9e6dc" stroke="#14181f" strokeWidth="1.1" />
              <rect x="-17" y="-5" width="34" height="10" rx="4" fill="#e9e6dc" stroke="#14181f" strokeWidth="1.1" />
              {poke.station ? (
                <g key={poke.station}>
                  {[0, 1, 2].map((i) => (
                    <circle key={i} cx={-20 - i * 8} cy={14 + i * 3} r={4 + i * 2} fill="#e6f4ff" style={anim(`ms-puff 900ms ease-out ${i * 90}ms forwards`, { opacity: 0 })} />
                  ))}
                </g>
              ) : null}
            </g>,
          )}
        </g>
      </g>
      </g>
    </>
  )
}

/* ---- Earthrise: the lunar surface, a lander and flag, bootprints, Earth in the sky ------------ */
function lunarScene(u: string, spot: SpotFn, poke: Pokes) {
  const earthLand = (
    <g>
      <path d="M856 70 C870 60 890 66 896 80 C900 94 884 104 870 98 C858 92 850 82 856 70Z" fill="#5f8a45" />
      <path d="M910 96 C920 90 934 96 936 108 C930 118 916 116 910 96Z" fill="#a8935a" />
      <path d="M800 90 C812 84 826 90 826 102 C818 112 804 106 800 90Z" fill="#5f8a45" />
    </g>
  )
  return (
    <>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#0a0d14" />
        </linearGradient>
        <radialGradient id={`${u}ocean`} cx=".65" cy=".35" r=".8">
          <stop offset="0" stopColor="#4aaef0" />
          <stop offset=".55" stopColor="#1d63a8" />
          <stop offset="1" stopColor="#0b2f5e" />
        </radialGradient>
        <linearGradient id={`${u}phase`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".92" />
          <stop offset=".42" stopColor="#000" stopOpacity=".85" />
          <stop offset=".6" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${u}fg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9acb2" />
          <stop offset="1" stopColor="#5f6268" />
        </linearGradient>
        <linearGradient id={`${u}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1cd6a" />
          <stop offset=".5" stopColor="#c9962b" />
          <stop offset="1" stopColor="#7a5400" />
        </linearGradient>
        <clipPath id={`${u}earth`}>
          <circle cx="900" cy="92" r="44" />
        </clipPath>
        <filter id={`${u}blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}sky)`} />
      <Stars n={120} seed={11} yMax={230} />
      {/* Earth hanging in the sky */}
      <g style={depth(2)}>
        {spot(
          { did: 'earth', ring: [900, 92, 58] },
          <g>
            <circle cx="900" cy="92" r="56" fill="#6fb7ff" opacity=".35" filter={`url(#${u}blur)`} style={anim('ms-glow 5s ease-in-out infinite')} />
            <circle cx="900" cy="92" r="44" fill={`url(#${u}ocean)`} />
            <g clipPath={`url(#${u}earth)`}>
              <g style={anim(`ms-scroll ${poke.earth ? 6 : 40}s linear infinite`, { ['--dist' as string]: '-130px', transformBox: 'view-box', transformOrigin: '0 0' })}>
                {earthLand}
                <g transform="translate(130 0)">{earthLand}</g>
                <g fill="#fff" opacity=".7">
                  <ellipse cx="870" cy="62" rx="22" ry="3" />
                  <ellipse cx="910" cy="118" rx="26" ry="3.5" />
                  <ellipse cx="1000" cy="62" rx="22" ry="3" />
                  <ellipse cx="1040" cy="118" rx="26" ry="3.5" />
                </g>
              </g>
              <rect x="856" y="48" width="88" height="88" fill={`url(#${u}phase)`} />
            </g>
          </g>,
        )}
      </g>
      {/* Mountains and ground */}
      <g style={depth(4)}>
        <path d="M0 206 L90 176 L170 196 L260 160 L360 194 L470 170 L560 198 L680 182 L780 200 L900 172 L1010 196 L1110 178 L1200 192 L1200 300 L0 300Z" fill="#3c3f46" />
      </g>
      <g style={depth(8)}>
        <path d="M0 226 C150 214 290 222 420 216 C560 210 700 224 840 218 C980 212 1100 222 1200 218 L1200 300 L0 300Z" fill="#5d6068" />
      </g>
      <g style={depth(14)}>
        <path d="M0 246 C180 236 360 244 540 240 C720 236 900 248 1200 242 L1200 300 L0 300Z" fill={`url(#${u}fg)`} />
        {[
          [120, 268, 34, 7],
          [700, 282, 46, 8],
          [1010, 262, 26, 5],
          [880, 274, 14, 3],
          [230, 286, 18, 4],
        ].map(([x, y, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#6f7279" />
            <path d={`M${x - rx} ${y} A${rx} ${ry} 0 0 0 ${x + rx} ${y}`} fill="none" stroke="#c7c9cd" strokeWidth="1.4" opacity=".7" />
          </g>
        ))}
        {/* Lander */}
        <g transform="translate(330 244)">
          <path d="M-24 -8 L-42 8 M24 -8 L42 8 M-10 -6 L-16 9 M10 -6 L16 9" stroke="#c9ccd2" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="-42" cy="9" rx="7" ry="2" fill="#c9ccd2" />
          <ellipse cx="42" cy="9" rx="7" ry="2" fill="#c9ccd2" />
          <rect x="-28" y="-28" width="56" height="22" rx="3" fill={`url(#${u}gold)`} stroke="#14181f" strokeWidth="1.3" />
          <path d="M-20 -24 L-8 -12 M2 -26 L12 -10 M-26 -14 L-14 -20 M14 -22 L24 -12" stroke="#7a5400" strokeWidth=".9" opacity=".8" />
          <path d="M-18 -28 L-14 -54 L14 -54 L20 -42 L18 -28Z" fill="#e9e6dc" stroke="#14181f" strokeWidth="1.3" />
          <path d="M-8 -48 L0 -48 L-4 -40Z" fill="#0b3d91" />
          <path d="M10 -54 V-62" stroke="#14181f" strokeWidth="1.3" />
          <ellipse cx="14" cy="-65" rx="7" ry="3" fill="#e9e6dc" stroke="#14181f" strokeWidth="1" transform="rotate(-25 14 -65)" />
        </g>
        {/* Flag on a horizontal rod */}
        <g transform="translate(404 246)">
          {spot(
            { did: 'flag', ring: [18, -40, 32] },
            <g>
              <path d="M0 0 V-60 M0 -58 H36" stroke="#e9e6dc" strokeWidth="2.2" strokeLinecap="round" />
              <rect x="1" y="-58" width="34" height="21" fill="#0b3d91" stroke="#14181f" strokeWidth=".8" />
              <circle cx="18" cy="-47.5" r="6" fill="none" stroke="#f3f1ea" strokeWidth="1.5" />
              <path d="M10 -44 Q18 -54 27 -49" fill="none" stroke="#f0645a" strokeWidth="1.5" />
              {poke.flag ? <circle key={poke.flag} cx="18" cy="-48" r="28" fill="#fff" style={anim('ms-flash 600ms ease-out forwards')} /> : null}
            </g>,
          )}
        </g>
        {/* Bootprints */}
        {spot(
          { did: 'prints', ring: [560, 268, 34] },
          <g fill="#4d5056" opacity=".85">
            {Array.from({ length: 14 }, (_, i) => {
              const x = 440 + i * 17
              const y = 258 + i * 1.4 + (i % 2 ? 5 : 0)
              return <ellipse key={i} cx={x} cy={y} rx="4" ry="2" transform={`rotate(8 ${x} ${y})`} />
            })}
          </g>,
        )}
      </g>
    </>
  )
}

/* ---- Deep transit: a crewed ship between Earth and Mars, the Sun and its particle storms ------ */
function transitScene(u: string, spot: SpotFn, poke: Pokes) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#05040d" />
          <stop offset="1" stopColor="#140a28" />
        </linearGradient>
        <radialGradient id={`${u}sun`}>
          <stop offset="0" stopColor="#fff8e0" />
          <stop offset=".18" stopColor="#ffd27a" stopOpacity=".9" />
          <stop offset=".55" stopColor="#ff8a3d" stopOpacity=".25" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${u}neb1`}>
          <stop offset="0" stopColor="#6b34a0" stopOpacity=".55" />
          <stop offset="1" stopColor="#6b34a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${u}neb2`}>
          <stop offset="0" stopColor="#12708a" stopOpacity=".45" />
          <stop offset="1" stopColor="#12708a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${u}dot`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}bg)`} />
      <g style={depth(1)}>
        <ellipse cx="330" cy="90" rx="320" ry="110" fill={`url(#${u}neb1)`} />
        <ellipse cx="920" cy="230" rx="300" ry="100" fill={`url(#${u}neb2)`} />
        <ellipse cx="640" cy="150" rx="700" ry="38" fill="#fff" opacity=".05" transform="rotate(-12 640 150)" />
      </g>
      <Stars n={150} seed={23} yMax={300} />
      {/* The Sun and a solar particle stream */}
      <g style={depth(2)}>
        {spot(
          { did: 'sun', ring: [64, 150, 40] },
          <g>
            <circle cx="-20" cy="150" r="240" fill={`url(#${u}sun)`} style={anim('ms-glow 4s ease-in-out infinite')} />
            <circle cx="-20" cy="150" r="70" fill="#fff4cf" opacity=".9" />
            {Array.from({ length: 10 }, (_, i) => (
              <path key={i} d={`M60 ${110 + i * 9} h22`} stroke="#ffd27a" strokeWidth="1.6" strokeLinecap="round" opacity=".8" style={anim(`ms-stream ${2.4 + (i % 4) * 0.5}s linear ${-i * 0.4}s infinite`, { transformBox: 'view-box', transformOrigin: '0 0' })} />
            ))}
            {poke.sun ? <circle key={poke.sun} cx="40" cy="150" r="90" fill="#ffd27a" style={anim('ms-flash 900ms ease-out forwards')} /> : null}
          </g>,
        )}
      </g>
      {/* Trajectory, Earth behind, Mars ahead */}
      <g style={depth(4)}>
        <path d="M232 214 C480 300 820 40 1058 72" fill="none" stroke="#9cbcff" strokeWidth="1.6" opacity=".5" strokeDasharray="4 9" style={{ animation: 'ms-dash 3s linear infinite' }} />
        {spot(
          { did: 'earth', ring: [232, 214, 20] },
          <g style={{ color: '#6fb7ff' }}>
            <circle cx="232" cy="214" r="16" fill={`url(#${u}dot)`} />
            <circle cx="232" cy="214" r="4.5" fill="#6fb7ff" />
          </g>,
        )}
        <g style={{ color: '#e0703f' }}>
          <circle cx="1058" cy="72" r="20" fill={`url(#${u}dot)`} />
          <circle cx="1058" cy="72" r="6.5" fill="#e0703f" />
        </g>
      </g>
      {/* The ship */}
      <g style={depth(9)}>
        <g transform="translate(640 158) rotate(-16)">
          <g style={anim('ms-bob 6s ease-in-out infinite')}>
            {spot(
              { did: 'ship', ring: [0, 0, 66] },
              <g>
                <ellipse cx="-90" cy="0" rx={poke.ship ? 34 : 20} ry="6" fill="#9cd8ff" opacity=".85" style={anim('ms-flicker 160ms steps(2) infinite')} />
                <path d="M-74 -7 L-62 -10 L-62 10 L-74 7Z" fill="#5b6270" stroke="#14181f" strokeWidth="1.2" />
                <rect x="-62" y="-9" width="16" height="18" rx="3" fill="#9aa3ad" stroke="#14181f" strokeWidth="1.2" />
                <rect x="-46" y="-3" width="52" height="6" fill="#c9ccd2" stroke="#14181f" strokeWidth="1" />
                {[-22, -6].map((x) => (
                  <g key={x}>
                    <rect x={x - 10} y="-50" width="20" height="44" fill="#24345e" stroke="#9cbcff" strokeWidth=".8" />
                    <rect x={x - 10} y="6" width="20" height="44" fill="#24345e" stroke="#9cbcff" strokeWidth=".8" />
                    <path d={`M${x} -50 V-6 M${x} 6 V50 M${x - 10} -28 H${x + 10} M${x - 10} 28 H${x + 10}`} stroke="#4a6bb0" strokeWidth=".7" />
                  </g>
                ))}
                <rect x="6" y="-11" width="62" height="22" rx="10" fill="#e9e6dc" stroke="#14181f" strokeWidth="1.4" />
                <path d="M58 -11 Q78 0 58 11" fill="#c9ccd2" stroke="#14181f" strokeWidth="1.2" />
                {[20, 32, 44].map((x) => (
                  <circle key={x} cx={x} cy="0" r="2.6" fill="#ffd27a" style={anim(`ms-twinkle ${2 + x / 30}s ease-in-out infinite`)} />
                ))}
                <rect x="14" y="11" width="10" height="16" fill="#f3f1ea" stroke="#14181f" strokeWidth=".8" />
              </g>,
            )}
          </g>
        </g>
      </g>
    </>
  )
}
