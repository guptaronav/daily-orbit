/*
 * The extra helmet toppers, drawn once in the round avatar's coordinates (48 x 48, helmet centered
 * at 24,20 with radius 14.5). The floating crew member reuses the same art by scaling it onto its
 * own helmet, so a topper looks the same everywhere it is worn. The three original toppers
 * (antenna, pole star, orbit halo) keep their own drawings in each view.
 */

const INK = '#14181f'

export function TopperArt({ id }: { id: string | null | undefined }) {
  switch (id) {
    case 'top-sprout':
      return (
        <g strokeLinecap="round" strokeLinejoin="round" transform="translate(0 2.2)">
          <path d="M24 6 L24 1.5" stroke="#2f7d4f" strokeWidth="1.5" fill="none" />
          <path d="M24 3 C21 3 19.5 1.2 19.5 -0.5 C22 -0.5 24 1 24 3Z" fill="#5cc28a" stroke="#2f7d4f" strokeWidth="0.9" />
          <path d="M24 2.2 C27 2.2 28.6 0.2 28.6 -1.6 C26 -1.6 24 0 24 2.2Z" fill="#7ee0a6" stroke="#2f7d4f" strokeWidth="0.9" />
        </g>
      )
    case 'top-flag':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 10 L30 2.5" stroke={INK} strokeWidth="1.3" fill="none" />
          <path d="M30 2.5 L36 4.5 L30 6.5 Z" fill="#e8742c" stroke={INK} strokeWidth="0.9" />
        </g>
      )
    case 'top-headlamp':
      return (
        <g>
          <ellipse cx="24" cy="4" rx="7" ry="3.2" fill="#f6c445" opacity="0.28" />
          <rect x="20.5" y="4.2" width="7" height="3.6" rx="1.6" fill="#2b323d" stroke={INK} strokeWidth="0.9" />
          <circle cx="24" cy="6" r="1.3" fill="#fff6c9" />
        </g>
      )
    case 'top-moon':
      return <path d="M34 3 A5 5 0 1 0 34 13 A3.8 3.8 0 1 1 34 3Z" fill="#f3f1ea" stroke="#8a6100" strokeWidth="0.9" strokeLinejoin="round" />
    case 'top-satellite':
      return (
        <g strokeLinejoin="round" transform="translate(15 7.6) scale(1.3) rotate(-12) translate(-14 -6.5)">
          <rect x="9.3" y="5.3" width="3.4" height="2.4" fill="#4cc9f0" stroke={INK} strokeWidth="0.6" />
          <rect x="15.3" y="5.3" width="3.4" height="2.4" fill="#4cc9f0" stroke={INK} strokeWidth="0.6" />
          <path d="M12.7 6.5 L15.3 6.5" stroke={INK} strokeWidth="0.7" />
          <rect x="12.6" y="4.6" width="2.8" height="3.8" rx="0.7" fill="#e9e6dc" stroke={INK} strokeWidth="0.8" />
        </g>
      )
    case 'top-rings':
      return (
        <g fill="none" strokeLinecap="round">
          <ellipse cx="24" cy="6.2" rx="13" ry="3.2" stroke="#e8742c" strokeWidth="1.6" transform="rotate(-6 24 6.2)" />
          <ellipse cx="24" cy="6.2" rx="10" ry="2.2" stroke="#f6c445" strokeWidth="1.1" transform="rotate(-6 24 6.2)" />
        </g>
      )
    case 'top-comet':
      return (
        <g strokeLinecap="round">
          <path d="M5.5 13.5 L11.5 6" stroke="#4cc9f0" strokeWidth="2.6" opacity="0.35" />
          <path d="M7 12 L11.5 6" stroke="#b28dff" strokeWidth="1.6" opacity="0.7" />
          <circle cx="12" cy="5.5" r="2.2" fill="#fff6c9" stroke="#f6c445" strokeWidth="0.9" />
        </g>
      )
    case 'top-crown':
      return <path d="M17.5 7.5 L18 2.5 L21.2 5 L24 1.4 L26.8 5 L30 2.5 L30.5 7.5 Z" fill="#f6c445" stroke="#8a6100" strokeWidth="1" strokeLinejoin="round" />
    default:
      return null
  }
}
