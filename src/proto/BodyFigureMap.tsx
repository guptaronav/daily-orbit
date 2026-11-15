import { useId } from 'react'
import { BODY_OUTLINE } from './bodyOutline'
import { painColor } from './shared'

/*
 * The body for the pain map, drawn on the app's one shared silhouette (bodyOutline.ts), front or
 * back. Each tappable area is a band clipped to that silhouette, so the areas follow the real
 * outline. Light anatomy lines (collarbones, sternum, navel and knees on the front; spine,
 * shoulder blades and the buttock fold on the back) say which side you are looking at.
 *
 * Front view: the person faces you, so their right side is on your left. Back view: their right
 * is on your right.
 */

export type Zone = { id: string; label: string; points: string; cx: number; cy: number }
export type MarkedArea = { area: string; level: number }

const poly = (pts: [number, number][]) => pts.map((q) => q.join(',')).join(' ')
const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [200 - x, y] as [number, number])
// Right-hand side of the picture; the left-hand side mirrors it.
const SIDE: Record<'shoulder' | 'arm' | 'hand' | 'leg' | 'foot', [number, number][]> = {
  shoulder: [[118, 90], [172, 90], [172, 140], [137, 140], [128, 132], [118, 128]],
  arm: [[137, 140], [175, 140], [175, 246], [137, 246]],
  hand: [[137, 246], [175, 246], [175, 282], [137, 282]],
  leg: [[100, 262], [142, 262], [142, 420], [100, 420]],
  foot: [[100, 420], [142, 420], [142, 442], [100, 442]],
}
const CENTRE: Record<keyof typeof SIDE, [number, number]> = { shoulder: [146, 114], arm: [152, 190], hand: [155, 262], leg: [117, 340], foot: [118, 428] }
const TORSO_TOP: [number, number][] = [[82, 98], [118, 98], [118, 128], [128, 132], [137, 140], [137, 172], [63, 172], [63, 140], [72, 132], [82, 128]]

export function zonesFor(back: boolean): Zone[] {
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
    { id: 'head', label: 'Head', points: poly([[60, 0], [140, 0], [140, 80], [60, 80]]), cx: 100, cy: 46 },
    { id: 'neck', label: 'Neck', points: poly([[82, 80], [118, 80], [118, 98], [82, 98]]), cx: 100, cy: 89 },
    ...pair('shoulder', 'shoulder'),
    { id: back ? 'upper-back' : 'chest', label: back ? 'Upper back' : 'Chest', points: poly(TORSO_TOP), cx: 100, cy: 140 },
    { id: back ? 'lower-back' : 'belly', label: back ? 'Lower back' : 'Belly', points: poly([[60, 172], [140, 172], [140, 214], [60, 214]]), cx: 100, cy: 193 },
    { id: 'hips', label: back ? 'Hips and buttocks' : 'Hips', points: poly([[58, 214], [142, 214], [142, 262], [58, 262]]), cx: 100, cy: 238 },
    ...pair('arm', 'arm'),
    ...pair('hand', 'hand'),
    ...pair('leg', 'leg'),
    ...pair('foot', 'foot'),
  ]
}

export function BodyFigureMap({ back, areas, editing, onPick }: { back: boolean; areas: MarkedArea[]; editing: string | null; onPick: (z: Zone) => void }) {
  const uid = 'bfm' + useId().replace(/[^a-z0-9]/gi, '')
  const zones = zonesFor(back)
  const line = { fill: 'none', stroke: 'var(--rule-strong)', strokeWidth: 1.1, strokeLinecap: 'round' as const, opacity: 0.75 }
  return (
    <svg viewBox="30 8 140 434" width="230" role="group" aria-label={`Body, ${back ? 'back' : 'front'} view. Tap where it hurts.`} style={{ display: 'block', maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={BODY_OUTLINE} />
        </clipPath>
        <radialGradient id={`${uid}-g`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="var(--panel)" />
          <stop offset="100%" stopColor="var(--paper-deep)" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${uid}-c)`}>
        <rect x="0" y="0" width="200" height="446" fill={`url(#${uid}-g)`} />
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
              fill={a ? painColor(a.level) : 'transparent'}
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
              <path d="M100 98 L100 212" {...line} strokeDasharray="2 4" />
              <path d="M80 112 Q88 134 84 152 M120 112 Q112 134 116 152" {...line} />
              <path d="M100 226 L100 256" {...line} />
              <path d="M74 248 Q88 260 100 254 Q112 260 126 248" {...line} />
              <path d="M88 334 Q84 350 88 366 M112 334 Q116 350 112 366" {...line} />
              <path d="M84 22 Q100 12 116 22" {...line} />
            </>
          ) : (
            <>
              <path d="M84 100 Q92 104 99 100 M101 100 Q108 104 116 100" {...line} />
              <path d="M100 106 L100 152" {...line} />
              <path d="M80 152 Q90 158 99 154 M101 154 Q110 158 120 152" {...line} />
              <circle cx="100" cy="198" r="1.7" fill="var(--rule-strong)" opacity="0.8" />
              <path d="M80 232 Q92 246 100 256 M120 232 Q108 246 100 256" {...line} />
              <path d="M110 334 Q117 327 124 334 M76 334 Q83 327 90 334" {...line} />
              <path d="M92 70 Q100 76 108 70" {...line} />
            </>
          )}
          <path d="M124 40 Q129 46 124 53 M76 40 Q71 46 76 53" {...line} />
        </g>
      </g>

      <path d={BODY_OUTLINE} fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinejoin="round" pointerEvents="none" />

      {zones.map((z) => {
        const a = areas.find((x) => x.area === z.id)
        if (!a && editing !== z.id) return null
        return (
          <g key={z.id + '-tag'} pointerEvents="none">
            {editing === z.id && <polygon points={z.points} fill="none" stroke="var(--ink)" strokeWidth="2" clipPath={`url(#${uid}-c)`} />}
            {a && (
              <>
                <circle cx={z.cx} cy={z.cy} r="9" fill="var(--panel)" stroke={painColor(a.level)} strokeWidth="2" />
                <text x={z.cx} y={z.cy + 3.6} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="var(--ink)">
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
