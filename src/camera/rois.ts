export type Landmark = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type Rois = { forehead: Rect; leftCheek: Rect; rightCheek: Rect }

// MediaPipe Face Mesh indices we rely on (well-known anchor points on the 478-point mesh):
// 10 top of forehead, 168 between the eyes, 234/454 face edges at ear level,
// 33/263 outer eye corners, 61/291 mouth corners.
const TOP = 10
const BRIDGE = 168
const EDGE_L = 234
const EDGE_R = 454
const EYE_L = 33
const EYE_R = 263
const MOUTH_L = 61
const MOUTH_R = 291
const MIN_LANDMARKS = 455

// ROI sizes as fractions of the face width in pixels. Skin-only areas: mid-forehead (below the
// hairline, above the brows) and the cheeks (between eye corner and mouth corner).
const FOREHEAD_W = 0.3
const FOREHEAD_H = 0.12
const FOREHEAD_UP = 0.45 // how far from the hairline point toward the bridge the forehead box is centered
const CHEEK = 0.16

/** Face width in normalized image units. */
export const faceWidth = (lm: readonly Landmark[]): number => Math.abs(lm[EDGE_R].x - lm[EDGE_L].x)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function box(cx: number, cy: number, w: number, h: number, imgW: number, imgH: number): Rect {
  const x = clamp(Math.round(cx - w / 2), 0, imgW - 1)
  const y = clamp(Math.round(cy - h / 2), 0, imgH - 1)
  return { x, y, w: clamp(Math.round(w), 1, imgW - x), h: clamp(Math.round(h), 1, imgH - y) }
}

/**
 * Axis-aligned skin regions (forehead and both cheeks) in pixel coordinates for one frame.
 * Returns null when the landmarks are missing or the face has no measurable width.
 * ponytail: ignores head tilt; the boxes are small enough that a few degrees stays on skin.
 */
export function roiRects(lm: readonly Landmark[], imgW: number, imgH: number): Rois | null {
  if (lm.length < MIN_LANDMARKS) return null
  const base = faceWidth(lm) * imgW
  if (!(base > 0)) return null

  const forehead = box(
    ((lm[TOP].x + lm[BRIDGE].x) / 2) * imgW,
    (lm[TOP].y + (lm[BRIDGE].y - lm[TOP].y) * FOREHEAD_UP) * imgH,
    base * FOREHEAD_W,
    base * FOREHEAD_H,
    imgW,
    imgH,
  )
  const cheek = (eye: Landmark, mouth: Landmark) => box(((eye.x + mouth.x) / 2) * imgW, ((eye.y + mouth.y) / 2) * imgH, base * CHEEK, base * CHEEK, imgW, imgH)
  return { forehead, leftCheek: cheek(lm[EYE_L], lm[MOUTH_L]), rightCheek: cheek(lm[EYE_R], lm[MOUTH_R]) }
}
