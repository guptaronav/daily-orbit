import { useId } from 'react'

/*
 * The body for the pain map: one smooth human silhouette (head, neck, shoulders, arms with hands,
 * torso, hips, legs and feet), front or back. Each tappable area is a band of the body clipped to
 * that silhouette, so the areas follow the real outline instead of floating boxes. Light anatomy
 * lines (collarbones, sternum, navel and knees on the front; spine, shoulder blades and the
 * buttock fold on the back) say which side you are looking at.
 *
 * Front view: the person faces you, so their right side is on your left. Back view: their right
 * is on your right.
 */

export type Zone = { id: string; label: string; points: string; cx: number; cy: number }
export type MarkedArea = { area: string; level: number }

/* ---- The silhouette: half the body as points, mirrored, then smoothed into one path ---------- */
// The right-hand half of the picture, from the neck down the arm, back up to the armpit, down the
// torso and leg, and up the inside of the leg to the crotch.
const HALF: [number, number][] = [
  [108, 58], [110, 72], [122, 77], [136, 82], [146, 90], [150, 104], [152, 124], [154, 146], [157, 166],
  [161, 190], [164, 210], [169, 224], [171, 238], [166, 250], [158, 251], [154, 240], [151, 226], [148, 212],
  [145, 192], [141, 170], [138, 150], [136, 130], [134, 116],
  [131, 128], [129, 150], [126, 172], [128, 192], [132, 210], [133, 228],
  [131, 256], [128, 284], [125, 304], [126, 324], [124, 350], [119, 376], [117, 388], [126, 398], [124, 405],
  [106, 405], [104, 394], [105, 376], [104, 350], [106, 326], [107, 304], [106, 282], [104, 256], [100, 232],
]

/** Catmull-Rom through the points, as a closed cubic Bezier path: smooth, and through every point. */
function smooth(pts: [number, number][]): string {
  const n = pts.length
  const p = (i: number) => pts[(i + n) % n]
  let d = `M${p(0)[0]} ${p(0)[1]}`
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1)
    const [x1, y1] = p(i)
    const [x2, y2] = p(i + 1)
    const [x3, y3] = p(i + 2)
    const t = 6
    d += ` C${(x1 + (x2 - x0) / t).toFixed(1)} ${(y1 + (y2 - y0) / t).toFixed(1)} ${(x2 - (x3 - x1) / t).toFixed(1)} ${(y2 - (y3 - y1) / t).toFixed(1)} ${x2} ${y2}`
  }
  return d + ' Z'
}
const LEFT = [...HALF].reverse().map(([x, y]) => [200 - x, y] as [number, number])
// Right half from the neck to the crotch, then the mirrored left half from the crotch back up.
const BODY = smooth([...HALF, ...LEFT.slice(1)])

/* ---- The areas: bands of the picture, clipped to the silhouette -------------------------------- */
const poly = (pts: [number, number][]) => pts.map((q) => q.join(',')).join(' ')
const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [200 - x, y] as [number, number])
// Right-hand side of the picture; the left-hand side mirrors it.
const SIDE = {
  shoulder: [[118, 70], [162, 70], [162, 110], [134, 110], [128, 106], [118, 104]] as [number, number][],
  arm: [[133, 110], [175, 110], [175, 214], [140, 214]] as [number, number][],
  hand: [[138, 214], [178, 214], [178, 262], [138, 262]] as [number, number][],
  leg: [[100, 236], [140, 236], [140, 386], [100, 386]] as [number, number][],
  foot: [[100, 386], [140, 386], [140, 412], [100, 412]] as [number, number][],
}
const CENTRE = {
  shoulder: [139, 90], arm: [150, 160], hand: [160, 238], leg: [117, 300], foot: [114, 398],
} as const

export function zonesFor(back: boolean): Zone[] {
  // Which person's side is drawn on the right of the picture.
  const rightOfPicture = back ? 'right' : 'left'
  const leftOfPicture = back ? 'left' : 'right'
  const name = (s: string) => s[0].toUpperCase() + s.slice(1)
  const pair = (part: keyof typeof SIDE, label: string): Zone[] => {
    const [cx, cy] = CENTRE[part]
    return [
      { id: `${part}-${leftOfPicture}`, label: `${name(leftOfPicture)} ${label}`, points: poly(mirror(SIDE[part])), cx: 200 - cx, cy },
      { id: `${part}-${rightOfPicture}`, label: `${name(rightOfPicture)} ${label}`, points: poly(SIDE[part]), cx, cy },
    ]
  }
  return [
    { id: 'head', label: 'Head', points: poly([[60, 0], [140, 0], [140, 58], [60, 58]]), cx: 100, cy: 34 },
    { id: 'neck', label: 'Neck', points: poly([[82, 58], [118, 58], [118, 76], [82, 76]]), cx: 100, cy: 67 },
    ...pair('shoulder', 'shoulder'),
    back
      ? { id: 'upper-back', label: 'Upper back', points: poly([[82, 76], [118, 76], [118, 104], [128, 106], [134, 110], [134, 146], [66, 146], [66, 110], [72, 106], [82, 104]]), cx: 100, cy: 118 }
      : { id: 'chest', label: 'Chest', points: poly([[82, 76], [118, 76], [118, 104], [128, 106], [134, 110], [134, 146], [66, 146], [66, 110], [72, 106], [82, 104]]), cx: 100, cy: 118 },
    back
      ? { id: 'lower-back', label: 'Lower back', points: poly([[64, 146], [136, 146], [136, 198], [64, 198]]), cx: 100, cy: 172 }
      : { id: 'belly', label: 'Belly', points: poly([[64, 146], [136, 146], [136, 198], [64, 198]]), cx: 100, cy: 172 },
    { id: 'hips', label: back ? 'Hips and buttocks' : 'Hips', points: poly([[62, 198], [138, 198], [138, 236], [62, 236]]), cx: 100, cy: 216 },
    ...pair('arm', 'arm'),
    ...pair('hand', 'hand'),
    ...pair('leg', 'leg'),
    ...pair('foot', 'foot'),
  ]
}

const heat = (lv: number) => (lv >= 7 ? 'var(--act)' : lv >= 4 ? '#e8742c' : 'var(--watch)')

export function BodyFigureMap({ back, areas, editing, onPick }: { back: boolean; areas: MarkedArea[]; editing: string | null; onPick: (z: Zone) => void }) {
  const uid = 'bfm' + useId().replace(/[^a-z0-9]/gi, '')
  const zones = zonesFor(back)
  const line = { fill: 'none', stroke: 'var(--rule-strong)', strokeWidth: 1.1, strokeLinecap: 'round' as const, opacity: 0.75 }
  return (
    <svg viewBox="22 2 156 410" width="230" role="group" aria-label={`Body, ${back ? 'back' : 'front'} view. Tap where it hurts.`} style={{ display: 'block', maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <clipPath id={`${uid}-c`}>
          <ellipse cx="100" cy="34" rx="19" ry="24" />
          <path d={BODY} />
        </clipPath>
        <radialGradient id={`${uid}-g`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="var(--panel)" />
          <stop offset="100%" stopColor="var(--paper-deep)" />
        </radialGradient>
      </defs>

      {/* The body, softly shaded */}
      <g clipPath={`url(#${uid}-c)`}>
        <rect x="0" y="0" width="200" height="420" fill={`url(#${uid}-g)`} />
        {/* The areas: tap targets, tinted by how much they hurt */}
        {zones.map((z) => {
          const a = areas.find((x) => x.area === z.id)
          const on = editing === z.id
          return (
            <polygon
              key={z.id}
              className="bfm-zone"
              points={z.points}
              role="button"
              tabIndex={0}
              aria-label={`${z.label}${a ? `, pain ${a.level} of 10` : ''}`}
              aria-pressed={!!a}
              onClick={() => onPick(z)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPick(z)
                }
              }}
              fill={a ? heat(a.level) : 'transparent'}
              fillOpacity={a ? (on ? 0.95 : 0.8) : 1}
              stroke="var(--rule)"
              strokeWidth={0.8}
              style={{ cursor: 'pointer', outline: 'none', transition: 'fill-opacity 160ms ease' }}
            />
          )
        })}
        {/* Anatomy hints, drawn over the areas but never catching a tap */}
        <g pointerEvents="none">
          {back ? (
            <>
              <path d="M100 76 L100 196" {...line} strokeDasharray="2 4" />
              <path d="M78 96 Q86 118 82 134" {...line} />
              <path d="M122 96 Q114 118 118 134" {...line} />
              <path d="M100 212 L100 232" {...line} />
              <path d="M74 226 Q86 236 100 230 Q114 236 126 226" {...line} />
              <path d="M110 326 Q116 340 112 352 M90 326 Q84 340 88 352" {...line} />
            </>
          ) : (
            <>
              <path d="M84 80 Q92 84 99 80 M101 80 Q108 84 116 80" {...line} />
              <path d="M100 86 L100 130" {...line} />
              <path d="M80 122 Q90 128 99 124 M101 124 Q110 128 120 122" {...line} />
              <circle cx="100" cy="176" r="1.6" fill="var(--rule-strong)" opacity="0.8" />
              <path d="M76 214 Q100 232 124 214" {...line} />
              <path d="M110 302 Q116 296 122 302 M78 302 Q84 296 90 302" {...line} />
            </>
          )}
        </g>
      </g>

      {/* Outline on top */}
      <ellipse cx="100" cy="34" rx="19" ry="24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" pointerEvents="none" />
      <path d={BODY} fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinejoin="round" pointerEvents="none" />
      {/* The face side: a hint of ears and, on the front, a soft chin line */}
      <g pointerEvents="none">
        <path d="M81 32 Q78 36 81 41 M119 32 Q122 36 119 41" {...line} />
        {!back && <path d="M92 50 Q100 55 108 50" {...line} />}
        {back && <path d="M86 18 Q100 10 114 18" {...line} />}
      </g>

      {/* The selected area gets a ring; every marked area shows its number */}
      {zones.map((z) => {
        const a = areas.find((x) => x.area === z.id)
        if (!a && editing !== z.id) return null
        return (
          <g key={z.id + '-tag'} pointerEvents="none">
            {editing === z.id && <polygon points={z.points} fill="none" stroke="var(--ink)" strokeWidth="2" clipPath={`url(#${uid}-c)`} />}
            {a && (
              <>
                <circle cx={z.cx} cy={z.cy} r="8.5" fill="var(--panel)" stroke={heat(a.level)} strokeWidth="2" />
                <text x={z.cx} y={z.cy + 3.6} textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ink)">
                  {a.level}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
