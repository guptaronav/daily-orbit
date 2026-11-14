import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { runCapture } from '../../camera/capture'
import { getFaceLandmarker } from '../../camera/faceLandmarker'
import { createFrameAnalyzer, onEachFrame } from '../../camera/frames'
import { useVideoSource, type VideoError, type VideoMode } from '../../camera/useVideoSource'
import { btnPrimary, btnSecondary, linkBtn } from '../../components/ui'
import { analyzeCapture, type CaptureAnalysis } from '../../lib/signal/analyze'
import { positionChecks, type PositionChecks } from '../../lib/signal/position'
import { motionScore, type Pt } from '../../lib/signal/quality'

/** Length of the pulse capture. Long enough for a stable spectrum, short enough to tolerate. */
const CAPTURE_SECONDS = 40
const CHECK_EVERY_MS = 120
const NOSE_HISTORY = 15

/** Only what the person actually answered. Untouched questions are absent, never defaulted. */
export type SelfReport = Partial<Record<'sleepQuality' | 'mood' | 'stress' | 'sleepHours', number>>
export type CameraResult = { analysis: CaptureAnalysis; selfReport: SelfReport; source: 'camera' | 'simulated' }

const ERROR_COPY: Record<VideoError, string> = {
  denied: 'Camera access was denied. Allow it in your browser settings, or use the sample recording instead.',
  missing: 'No usable camera was found. Use the sample recording instead.',
  'sample-missing': 'The sample recording is not available yet.',
  other: 'The camera could not be started. Use the sample recording instead.',
}

type Phase = 'intro' | 'position' | 'capturing'

const SLIDERS: { key: 'sleepQuality' | 'mood' | 'stress'; label: string }[] = [
  { key: 'sleepQuality', label: 'How well did you sleep?' },
  { key: 'mood', label: 'How is your mood?' },
  { key: 'stress', label: 'How stressed do you feel?' },
]

function CheckRow({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-rule py-2 text-sm">
      <span>{label}</span>
      <span className={ok ? 'font-medium text-ok' : 'text-muted'}>{text}</span>
    </li>
  )
}

export function CameraCheck({ onComplete }: { onComplete: (result: CameraResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [mode, setMode] = useState<VideoMode | null>(null)
  const { ready, error } = useVideoSource(videoRef, mode)
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null)
  const [modelError, setModelError] = useState(false)
  const [checks, setChecks] = useState<PositionChecks | null>(null)
  const [progress, setProgress] = useState(0)
  const [faceNow, setFaceNow] = useState(true)
  const [report, setReport] = useState<SelfReport>({})
  const reportRef = useRef(report)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    reportRef.current = report
  }, [report])

  useEffect(() => () => abortRef.current?.abort(), [])

  function choose(next: VideoMode) {
    setMode(next)
    setPhase('position')
    setModelError(false)
    getFaceLandmarker().then(setLandmarker, () => setModelError(true))
  }

  // Live positioning checks (about 8 times a second) until the person presses Start.
  useEffect(() => {
    const video = videoRef.current
    if (phase !== 'position' || !ready || !landmarker || !video) return
    const analyze = createFrameAnalyzer(video, landmarker)
    const nose: Pt[] = []
    let last = 0
    return onEachFrame(video, (now) => {
      if (now - last < CHECK_EVERY_MS) return
      last = now
      const s = analyze(now).sample
      if (s) {
        nose.push(s.nose)
        if (nose.length > NOSE_HISTORY) nose.shift()
      } else {
        nose.length = 0
      }
      setChecks(
        positionChecks({
          found: Boolean(s),
          noseX: s?.nose.x ?? 0.5,
          noseY: s?.nose.y ?? 0.5,
          faceW: s?.faceW ?? 0,
          luma: s?.luma ?? 0,
          motion: s && nose.length >= 5 ? motionScore(nose, s.faceW) : 0,
        }),
      )
    })
  }, [phase, ready, landmarker])

  async function start() {
    const video = videoRef.current
    if (!video || !landmarker || !mode) return
    if (mode === 'sample') {
      video.loop = false
      video.currentTime = 0
      await video.play()
    }
    setProgress(0)
    setPhase('capturing')
    abortRef.current = new AbortController()
    try {
      const assembled = await runCapture({
        video,
        landmarker,
        durationSec: CAPTURE_SECONDS,
        signal: abortRef.current.signal,
        onProgress: (p) => {
          setProgress(Math.min(1, p.elapsedSec / CAPTURE_SECONDS))
          setFaceNow(p.faceFound)
        },
      })
      onComplete({ analysis: analyzeCapture(assembled), selfReport: reportRef.current, source: mode === 'camera' ? 'camera' : 'simulated' })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setPhase('position')
    }
  }

  const sampleMode = mode === 'sample'
  const canStart = ready && landmarker !== null && (sampleMode || checks?.ready === true)
  const outline = phase === 'capturing' ? 'var(--color-accent)' : checks?.ready ? 'var(--color-ok)' : 'var(--color-nodata)'

  if (phase === 'intro') {
    return (
      <section aria-labelledby="camera-intro" className="space-y-5">
        <h2 id="camera-intro" className="text-xl font-semibold tracking-tight">
          Look at the screen for about a minute
        </h2>
        <p className="max-w-xl text-sm">
          The camera measures your heart rate from tiny color changes in your face and tracks your blinking for signs of fatigue. While it records, you will answer three quick sliders.
        </p>
        <p className="max-w-xl border-l-4 border-accent pl-3 text-sm">
          <strong>Your video never leaves this device.</strong> Frames are processed here in your browser and discarded. Nothing is recorded, saved or uploaded.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => choose('camera')} className={btnPrimary}>
            Use my camera
          </button>
          <button onClick={() => choose('sample')} className={btnSecondary}>
            Use sample recording
          </button>
        </div>
        <p className="text-xs text-muted">No webcam? The sample recording runs the same analysis on a bundled video so you can see it work.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="camera-heading" className="space-y-4">
      <h2 id="camera-heading" className="text-xl font-semibold tracking-tight">
        {phase === 'capturing' ? 'Hold still and look at the screen' : 'Position your face'}
      </h2>

      {(error || modelError) && (
        <p role="alert" className="border-l-4 border-act pl-3 text-sm">
          {error ? ERROR_COPY[error] : 'The face model could not be loaded. Reload the page and try again.'}{' '}
          <button onClick={() => setPhase('intro')} className={linkBtn}>
            Back
          </button>
        </p>
      )}

      <div className="relative w-full max-w-xl overflow-hidden border border-ink bg-ink">
        <video ref={videoRef} playsInline muted className="block w-full -scale-x-100" />
        <svg viewBox="0 0 100 75" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <ellipse cx="50" cy="38" rx="17" ry="24" fill="none" stroke={outline} strokeWidth="1.2" strokeDasharray={checks?.ready || phase === 'capturing' ? undefined : '3 2'} />
        </svg>
        {!ready && !error && <p className="absolute inset-0 grid place-items-center text-sm text-paper">{sampleMode ? 'Loading sample…' : 'Starting camera…'}</p>}
      </div>

      {phase === 'position' && (
        <>
          <p role="status" aria-live="polite" className="text-sm font-medium">
            {error || modelError || !ready
              ? ''
              : !landmarker
                ? 'Loading the face model…'
                : sampleMode
                  ? 'Sample recording ready.'
                  : (checks?.hint ?? 'Looking for your face…')}
          </p>
          {!sampleMode && checks && (
            <ul className="max-w-xl">
              <CheckRow label="Face found" ok={checks.found} text={checks.found ? 'Yes' : 'No'} />
              <CheckRow label="Centered" ok={checks.centered} text={checks.centered ? 'Yes' : 'Move into the outline'} />
              <CheckRow label="Distance" ok={checks.size === 'ok'} text={checks.size === 'ok' ? 'Good' : checks.size === 'far' ? 'Too far' : 'Too close'} />
              <CheckRow label="Light" ok={checks.light === 'ok'} text={checks.light === 'ok' ? 'Good' : checks.light === 'dark' ? 'Too dark' : 'Too bright'} />
              <CheckRow label="Steady" ok={checks.still} text={checks.still ? 'Yes' : 'Hold still'} />
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => void start()} disabled={!canStart} className={btnPrimary}>
              Start
            </button>
            <button onClick={() => setPhase('intro')} className={linkBtn}>
              Change camera source
            </button>
          </div>
        </>
      )}

      {phase === 'capturing' && (
        <div className="space-y-5">
          <div>
            <div className="h-2 w-full max-w-xl bg-rule" role="progressbar" aria-label="Capture progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{faceNow ? 'Reading…' : 'Face lost. Move back into the outline.'}</p>
          </div>
          <div className="max-w-xl space-y-3">
            <p className="text-sm text-muted">While we read your pulse, answer what you like (0 is lowest, 10 is highest). Skipped questions are not saved.</p>
            {SLIDERS.map(({ key, label }) => {
              const value = report[key]
              return (
                <label key={key} className="flex items-center justify-between gap-4 text-sm">
                  <span>{label}</span>
                  <span className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={value ?? 5}
                      aria-valuetext={value === undefined ? 'not answered' : String(value)}
                      onChange={(e) => setReport((r) => ({ ...r, [key]: Number(e.target.value) }))}
                    />
                    <span className={`w-12 text-right ${value === undefined ? 'text-muted' : 'font-medium'}`}>{value ?? 'skip'}</span>
                  </span>
                </label>
              )
            })}
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Hours you slept last night</span>
              <input
                type="number"
                min={0}
                max={14}
                step={0.5}
                inputMode="decimal"
                value={report.sleepHours ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  setReport(({ sleepHours: _dropped, ...rest }) => (raw === '' ? rest : { ...rest, sleepHours: Math.min(14, Math.max(0, Number(raw))) }))
                }}
                className="w-20 border border-rule bg-panel px-2 py-1 text-right"
              />
            </label>
          </div>
        </div>
      )}
    </section>
  )
}
