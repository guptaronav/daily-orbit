import type { KeyboardEvent, ReactNode } from 'react'
import type { Status } from '../contract/types'
import { REGIONS, STATUS_LABEL, type RegionId } from '../lib/regions'
import { STATUS_COLOR } from './StatusDot'

type Props = {
  statuses: Record<RegionId, Status>
  selected: RegionId | null
  onSelect: (id: RegionId) => void
  /** Smaller figure for the all-crew grid. */
  className?: string
  /**
   * False renders the same silhouette as a single labelled image: no buttons, no tab stops.
   * The all-crew grid needs this because each figure sits inside a card-sized button.
   */
  interactive?: boolean
}

const LABEL = Object.fromEntries(REGIONS.map((r) => [r.id, r.label])) as Record<RegionId, string>

/*
 * One coherent front-view silhouette, drawn back to front so the joints are covered:
 *   limbs -> torso (hides shoulder and hip seams) -> head -> the small organs on top.
 * Region ids and aria-labels are part of the contract; keep them.
 * Small regions (eyes, heart, gut) carry an invisible .hit rect so the touch target
 * clears 44 px at the default render width.
 */
const LIMBS = {
  armLeft: 'M64 102 C50 112 44 140 42 172 C40 204 42 232 45 252 L57 250 C54 230 52 204 54 174 C56 144 62 120 74 108 Z',
  armRight: 'M136 102 C150 112 156 140 158 172 C160 204 158 232 155 252 L143 250 C146 230 148 204 146 174 C144 144 138 120 126 108 Z',
  legLeft: 'M68 238 C64 290 66 340 68 380 C69 406 71 422 73 434 L91 434 C92 420 92 404 92 380 C93 340 94 290 97 238 Z',
  legRight: 'M132 238 C136 290 134 340 132 380 C131 406 129 422 127 434 L109 434 C108 420 108 404 108 380 C107 340 106 290 103 238 Z',
}

const TORSO =
  'M100 94 C117 94 131 100 138 114 C142 123 143 137 142 153 C141 173 136 193 133 211 C131 229 131 239 130 247 C120 252 110 254 100 254 C90 254 80 252 70 247 C69 239 69 229 67 211 C64 193 59 173 58 153 C57 137 58 123 62 114 C69 100 83 94 100 94 Z'
const NECK = 'M91 72 L109 72 L109 97 L91 97 Z'
const HEAD = 'M100 13 C117 13 128 27 128 47 C128 68 116 82 100 82 C84 82 72 68 72 47 C72 27 83 13 100 13 Z'
const HEART = 'M104 160 C86 145 89 127 99 127 C103 127 105 131 105 131 C105 131 107 127 111 127 C121 127 123 147 104 160 Z'

export function BodyFigure({ statuses, selected, onSelect, className = 'w-full max-w-[260px]', interactive = true }: Props) {
  // A plain function (not a component) so the <g> elements keep their identity, and focus, across renders.
  const region = (id: RegionId, shapes: ReactNode) => {
    const status = statuses[id]
    const fill = { fill: STATUS_COLOR[status], fillOpacity: status === 'gray' ? 0.35 : 0.85 }
    const label = `${LABEL[id]}: ${STATUS_LABEL[status]}`

    if (!interactive) {
      return (
        <g key={id} className="region" role="img" aria-label={label} {...fill}>
          {shapes}
        </g>
      )
    }

    const activate = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(id)
      }
    }
    return (
      <g
        key={id}
        className="region"
        role="button"
        tabIndex={0}
        aria-pressed={selected === id}
        aria-label={label}
        onClick={() => onSelect(id)}
        onKeyDown={activate}
        {...fill}
      >
        {shapes}
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 200 446"
      className={`${className} ${interactive ? '' : 'figure-static'}`}
      role="group"
      aria-label="Human body map"
      focusable="false"
    >
      {region(
        'skeleton',
        <>
          <path className="shape" d={LIMBS.armLeft} />
          <path className="shape" d={LIMBS.armRight} />
          <path className="shape" d={LIMBS.legLeft} />
          <path className="shape" d={LIMBS.legRight} />
        </>,
      )}
      {region(
        'body',
        <>
          <path className="shape" d={NECK} />
          <path className="shape" d={TORSO} />
        </>,
      )}
      {region('head', <path className="shape" d={HEAD} />)}
      {region(
        'eyes',
        <>
          <rect className="hit" x="70" y="30" width="60" height="30" />
          <ellipse className="shape" cx="87" cy="45" rx="9" ry="5.5" />
          <ellipse className="shape" cx="113" cy="45" rx="9" ry="5.5" />
        </>,
      )}
      {region(
        'heart',
        <>
          <rect className="hit" x="84" y="122" width="40" height="42" />
          <path className="shape" d={HEART} />
        </>,
      )}
      {region(
        'gut',
        <>
          <rect className="hit" x="78" y="186" width="44" height="48" />
          <rect className="shape" x="81" y="190" width="38" height="40" rx="16" />
        </>,
      )}
    </svg>
  )
}
