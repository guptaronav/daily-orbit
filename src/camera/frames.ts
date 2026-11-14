import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { lumaOf, meanRgb } from '../lib/signal/color'
import type { FrameSample } from '../lib/signal/assemble'
import { faceWidth, roiRects } from './rois'

const MAX_WIDTH = 640 // detection and pixel reads run on a downscaled copy to keep the frame rate up

export type FrameAnalysis = { found: boolean; sample?: FrameSample }

/**
 * Per-frame analysis: detect the face, read the mean skin color from the three regions, and note
 * blink scores. Returns `found: false` when there is no usable face. All on-device.
 */
export function createFrameAnalyzer(video: HTMLVideoElement, landmarker: FaceLandmarker) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  let lastTs = -1

  return (nowMs: number): FrameAnalysis => {
    if (!ctx || video.videoWidth === 0) return { found: false }
    const w = Math.min(MAX_WIDTH, video.videoWidth)
    const h = Math.round((video.videoHeight * w) / video.videoWidth)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    ctx.drawImage(video, 0, 0, w, h)

    lastTs = Math.max(Math.round(nowMs), lastTs + 1) // MediaPipe needs strictly increasing timestamps
    const result = landmarker.detectForVideo(video, lastTs)
    const lm = result.faceLandmarks[0]
    const rois = lm && roiRects(lm, w, h)
    if (!lm || !rois) return { found: false }

    const means = [rois.forehead, rois.leftCheek, rois.rightCheek].map((r) => meanRgb(ctx.getImageData(r.x, r.y, r.w, r.h).data))
    const avg = (pick: (c: (typeof means)[number]) => number) => means.reduce((a, m) => a + pick(m), 0) / means.length
    const rgb = { r: avg((m) => m.r), g: avg((m) => m.g), b: avg((m) => m.b) }

    const scores = result.faceBlendshapes?.[0]?.categories ?? []
    const score = (name: string) => scores.find((c) => c.categoryName === name)?.score ?? 0

    return {
      found: true,
      sample: { t: nowMs / 1000, ...rgb, luma: lumaOf(rgb), nose: { x: lm[1].x, y: lm[1].y }, faceW: faceWidth(lm), blinkL: score('eyeBlinkLeft'), blinkR: score('eyeBlinkRight') },
    }
  }
}

/** Calls `cb` for every new video frame (or animation frame if the browser lacks the video API). Returns a stop function. */
export function onEachFrame(video: HTMLVideoElement, cb: (nowMs: number) => void): () => void {
  let stopped = false
  let handle = 0
  const useVideoCb = 'requestVideoFrameCallback' in video
  const tick = (now: number) => {
    if (stopped) return
    cb(now)
    schedule()
  }
  const schedule = () => {
    handle = useVideoCb ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
  }
  schedule()
  return () => {
    stopped = true
    if (useVideoCb) video.cancelVideoFrameCallback(handle)
    else cancelAnimationFrame(handle)
  }
}
