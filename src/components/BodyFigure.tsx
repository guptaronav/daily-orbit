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
}

const LABEL = Object.fromEntries(REGIONS.map((r) => [r.id, r.label])) as Record<RegionId, string>

// Our own front-view figure. Drawn back to front: whole body, limbs, head, then the small organs on top.
export function BodyFigure({ statuses, selected, onSelect, className = 'w-full max-w-[260px]' }: Props) {
  // A plain function (not a component) so the <g> elements keep their identity, and focus, across renders.
  const region = (id: RegionId, shapes: ReactNode) => {
    const status = statuses[id]
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
        aria-label={`${LABEL[id]}: ${STATUS_LABEL[status]}`}
        onClick={() => onSelect(id)}
        onKeyDown={activate}
        fill={STATUS_COLOR[status]}
        fillOpacity={status === 'gray' ? 0.4 : 0.9}
      >
        {shapes}
      </g>
    )
  }

  return (
    <svg viewBox="0 0 200 430" className={className} role="group" aria-label="Human body map">
      {region(
        'body',
        <>
          <rect className="shape" x="92" y="74" width="16" height="22" />
          <path className="shape" d="M66 96 Q100 86 134 96 L141 140 L134 252 Q100 264 66 252 L59 140 Z" />
        </>,
      )}
      {region(
        'skeleton',
        <>
          <rect className="shape" x="34" y="100" width="22" height="150" rx="11" transform="rotate(6 45 100)" />
          <rect className="shape" x="144" y="100" width="22" height="150" rx="11" transform="rotate(-6 155 100)" />
          <rect className="shape" x="68" y="254" width="28" height="164" rx="13" />
          <rect className="shape" x="104" y="254" width="28" height="164" rx="13" />
        </>,
      )}
      {region('head', <circle className="shape" cx="100" cy="48" r="30" />)}
      {region(
        'eyes',
        <>
          <ellipse className="shape" cx="87" cy="46" rx="8" ry="5" />
          <ellipse className="shape" cx="113" cy="46" rx="8" ry="5" />
        </>,
      )}
      {region(
        'heart',
        <path className="shape" d="M114 152 C96 138 99 120 109 120 C113 120 114 124 114 124 C114 124 115 120 119 120 C129 120 132 138 114 152 Z" />,
      )}
      {region('gut', <rect className="shape" x="80" y="182" width="40" height="44" rx="19" />)}
    </svg>
  )
}
