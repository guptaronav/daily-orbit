import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { assembleCapture, type Assembled, type FrameSample } from '../lib/signal/assemble'
import { createFrameAnalyzer, onEachFrame } from './frames'

export type CaptureProgress = { elapsedSec: number; faceFound: boolean; frames: number }

type Options = {
  video: HTMLVideoElement
  landmarker: FaceLandmarker
  durationSec: number
  onProgress?: (p: CaptureProgress) => void
  signal?: AbortSignal
}

const PROGRESS_EVERY_MS = 250

/** Record `durationSec` of footage (or until the video ends) and return the assembled traces. */
export function runCapture({ video, landmarker, durationSec, onProgress, signal }: Options): Promise<Assembled> {
  return new Promise((resolve, reject) => {
    const analyze = createFrameAnalyzer(video, landmarker)
    const samples: FrameSample[] = []
    const flags: boolean[] = []
    let start: number | null = null
    let lastReport = 0

    const stop = onEachFrame(video, (now) => {
      if (signal?.aborted) {
        stop()
        reject(new DOMException('Capture cancelled', 'AbortError'))
        return
      }
      start ??= now
      const frame = analyze(now)
      flags.push(frame.found)
      if (frame.sample) samples.push(frame.sample)

      const elapsedSec = (now - start) / 1000
      if (now - lastReport >= PROGRESS_EVERY_MS) {
        lastReport = now
        onProgress?.({ elapsedSec, faceFound: frame.found, frames: flags.length })
      }
      if (elapsedSec >= durationSec || video.ended) {
        stop()
        resolve(assembleCapture(samples, flags))
      }
    })
  })
}
