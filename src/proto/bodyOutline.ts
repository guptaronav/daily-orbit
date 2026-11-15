/*
 * The one human silhouette the app draws, in a 200 x 446 box: the Body page figure (with its
 * organs and status colors) and the pain map both use it, so there is a single body to maintain.
 *
 * The right half is a list of cubic Bezier segments starting at the top of the head; the left
 * half is the same list mirrored, so the body is always symmetric.
 *
 * Landmarks, for anything drawn on top: head 16-79, neck 79-95, shoulders about 95-130, arms
 * outside x 137 (on the right) down to the wrist at about y 246, hands to y 276, torso to the
 * waist at y 204, hips to the crotch at y 259, legs to the ankle at y 424, feet to y 436.
 */

export const BODY_VIEWBOX = { w: 200, h: 446 }

const RIGHT_HALF: readonly (readonly [number, number, number, number, number, number])[] = [
  [116, 16, 126, 29, 126, 46], [126, 63, 117, 76, 107, 79], [107, 84, 108, 88, 109, 91], [118, 95, 133, 96, 143, 101],
  [152, 105, 156, 114, 157, 126], [159, 152, 161, 184, 162, 214], [163, 232, 162, 248, 161, 262], [160, 272, 154, 276, 150, 272],
  [147, 268, 148, 256, 148, 246], [147, 222, 144, 196, 141, 170], [140, 158, 138, 148, 136, 141], [134, 162, 131, 186, 130, 204],
  [129, 218, 134, 230, 135, 244], [135, 292, 131, 342, 129, 382], [128, 402, 127, 414, 129, 424], [131, 431, 124, 435, 115, 433],
  [110, 431, 108, 425, 108, 414], [108, 378, 106, 318, 104, 268], [103, 262, 101, 259, 100, 259],
]

function outline(): string {
  let d = 'M100 16 ' + RIGHT_HALF.map((s) => `C${s.join(' ')}`).join(' ')
  const ends: [number, number][] = [[100, 16], ...RIGHT_HALF.map((s) => [s[4], s[5]] as [number, number])]
  for (let i = RIGHT_HALF.length - 1; i >= 0; i--) {
    const s = RIGHT_HALF[i]
    const p0 = ends[i]
    d += ` C${200 - s[2]} ${s[3]} ${200 - s[0]} ${s[1]} ${200 - p0[0]} ${p0[1]}`
  }
  return d + ' Z'
}

/** The full silhouette as one closed SVG path. */
export const BODY_OUTLINE = outline()
