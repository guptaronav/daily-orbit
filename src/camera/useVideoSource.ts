import { useEffect, useState, type RefObject } from 'react'

export type VideoMode = 'camera' | 'sample'
export type VideoError = 'denied' | 'missing' | 'sample-missing' | 'other'

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample/mirror.webm`

function cameraError(e: unknown): VideoError {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') return 'missing'
  return 'other'
}

/**
 * Feeds the <video> element from the webcam or from the bundled sample recording (for judges
 * without a camera). Frames are only ever drawn to a local canvas, never uploaded.
 */
export function useVideoSource(video: RefObject<HTMLVideoElement | null>, mode: VideoMode | null) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<VideoError | null>(null)

  useEffect(() => {
    const el = video.current
    if (!mode || !el) return
    let cancelled = false
    let stream: MediaStream | null = null
    setReady(false)
    setError(null)

    async function start(target: HTMLVideoElement) {
      try {
        if (mode === 'camera') {
          if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('no camera API', 'NotFoundError')
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
          if (cancelled) return stream.getTracks().forEach((t) => t.stop())
          target.srcObject = stream
        } else {
          target.src = SAMPLE_URL
          target.muted = true
          target.loop = true
        }
        await target.play()
        if (!cancelled) setReady(true)
      } catch (e) {
        if (!cancelled) setError(mode === 'sample' ? 'sample-missing' : cameraError(e))
      }
    }
    void start(el)

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      el.pause()
      el.srcObject = null
      el.removeAttribute('src')
    }
  }, [video, mode])

  return { ready, error }
}
