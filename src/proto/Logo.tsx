import { useId } from 'react'

/*
 * The Daily Orbit mark: a planet with a tilted orbit that passes behind it (the lighter back arc)
 * and in front of it (the solid front arc), and a gold satellite on the near side. The gaps where
 * the front arc crosses the planet and around the satellite are cut with masks, so the mark sits
 * cleanly on any background. Geometry lives in a 100 x 100 box; MARK_SVG is the same drawing as a
 * standalone file for the favicon and app icons.
 */

const CX = 50
const CY = 50
const RX = 40
const RY = 13
const TILT = -20
const PHI = (TILT * Math.PI) / 180
const PLANET = { cx: 48, cy: 44, r: 21 }
const SAT_T = 55

function pt(deg: number): [number, number] {
  const t = (deg * Math.PI) / 180
  const x = CX + RX * Math.cos(t) * Math.cos(PHI) - RY * Math.sin(t) * Math.sin(PHI)
  const y = CY + RX * Math.cos(t) * Math.sin(PHI) + RY * Math.sin(t) * Math.cos(PHI)
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100]
}
/** An arc of the orbit from angle a to angle b (degrees, b < a draws through the lower half). */
function arc(a: number, b: number) {
  const [x1, y1] = pt(a)
  const [x2, y2] = pt(b)
  const sweep = b > a ? 1 : 0
  const large = Math.abs(b - a) > 180 ? 1 : 0
  return `M${x1} ${y1} A${RX} ${RY} ${TILT} ${large} ${sweep} ${x2} ${y2}`
}

const FRONT = arc(170, 8) // lower (near) half, left tip to right tip
const BACK = arc(196, 346) // upper (far) half
const [SX, SY] = pt(SAT_T)

export type LogoTone = 'light' | 'dark'
const TONES: Record<LogoTone, { body: string; back: string; sat: string }> = {
  light: { body: '#14181f', back: '#9a9893', sat: '#dda21b' },
  dark: { body: '#f3f1ea', back: '#7d7e80', sat: '#f6c445' },
}

function drawing(id: string, tone: LogoTone) {
  const c = TONES[tone]
  return {
    defs: (
      <defs>
        {/* What the planet keeps: everything but a band along the front arc and a ring round the satellite */}
        <mask id={`${id}-p`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <path d={FRONT} fill="none" stroke="#000" strokeWidth="12.5" strokeLinecap="round" />
          <circle cx={SX} cy={SY} r="10" fill="#000" />
        </mask>
        {/* The front arc keeps everything but the ring round the satellite */}
        <mask id={`${id}-f`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <circle cx={SX} cy={SY} r="10" fill="#000" />
        </mask>
      </defs>
    ),
    body: (
      <>
        <path d={BACK} fill="none" stroke={c.back} strokeWidth="5.5" strokeLinecap="round" />
        <circle cx={PLANET.cx} cy={PLANET.cy} r={PLANET.r} fill={c.body} mask={`url(#${id}-p)`} />
        <path d={FRONT} fill="none" stroke={c.body} strokeWidth="6.5" strokeLinecap="round" mask={`url(#${id}-f)`} />
        <circle cx={SX} cy={SY} r="6.8" fill={c.sat} />
      </>
    ),
  }
}

/** The mark alone, cropped tight to the drawing. Width follows from height (about 1.55 : 1). */
export function LogoMark({ height = 24, tone = 'light', title }: { height?: number; tone?: LogoTone; title?: string }) {
  const id = 'lg' + useId().replace(/[^a-z0-9]/gi, '')
  const d = drawing(id, tone)
  return (
    <svg viewBox="6 18 88 57" height={height} width={(height * 88) / 57} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: 'block', flex: '0 0 auto' }}>
      {d.defs}
      {d.body}
    </svg>
  )
}

/** The square app icon: the mark on a rounded tile (dark tile by default, as on the home screen). */
export function LogoTile({ size = 48, tone = 'dark' }: { size?: number; tone?: LogoTone }) {
  const id = 'lt' + useId().replace(/[^a-z0-9]/gi, '')
  const d = drawing(id, tone)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block', flex: '0 0 auto' }}>
      {d.defs}
      <rect width="100" height="100" rx="22" fill={tone === 'dark' ? '#14181f' : '#f3f1ea'} />
      <g transform="translate(50 50) scale(0.86) translate(-50 -46)">{d.body}</g>
    </svg>
  )
}

/** The icon as a standalone SVG file (favicon, and the source for the PNG app icons). */
export function markSvg({ tile = true, tone = 'dark' as LogoTone, rounded = true } = {}) {
  const c = TONES[tone]
  const bg = tone === 'dark' ? '#14181f' : '#f3f1ea'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <mask id="p" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${FRONT}" fill="none" stroke="#000" stroke-width="12.5" stroke-linecap="round"/><circle cx="${SX}" cy="${SY}" r="10" fill="#000"/></mask>
    <mask id="f" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><circle cx="${SX}" cy="${SY}" r="10" fill="#000"/></mask>
  </defs>
  ${tile ? `<rect width="100" height="100"${rounded ? ' rx="22"' : ''} fill="${bg}"/>` : ''}
  <g transform="translate(50 50) scale(${tile ? 0.86 : 1}) translate(-50 -46)">
    <path d="${BACK}" fill="none" stroke="${c.back}" stroke-width="5.5" stroke-linecap="round"/>
    <circle cx="${PLANET.cx}" cy="${PLANET.cy}" r="${PLANET.r}" fill="${c.body}" mask="url(#p)"/>
    <path d="${FRONT}" fill="none" stroke="${c.body}" stroke-width="6.5" stroke-linecap="round" mask="url(#f)"/>
    <circle cx="${SX}" cy="${SY}" r="6.8" fill="${c.sat}"/>
  </g>
</svg>
`
}
