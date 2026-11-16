import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { runCapture } from '../../camera/capture'
import { getFaceLandmarker } from '../../camera/faceLandmarker'
import { createFrameAnalyzer, onEachFrame } from '../../camera/frames'
import { useVideoSource, type VideoError, type VideoMode } from '../../camera/useVideoSource'
import { OptionalSlider } from '../../components/OptionalSlider'
import { analyzeCapture, type CaptureAnalysis } from '../../lib/signal/analyze'
import { positionChecks, type PositionChecks } from '../../lib/signal/position'
import { motionScore, type Pt } from '../../lib/signal/quality'
import * as D from '../../proto/data'
import { DEMO_PLAYBACK_RATE, DEMO_SECONDS, demoValues } from './demo'

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
    <li>
      <span>{label}</span>
      <span className={ok ? 'mc-ok' : 'mc-wait'}>{text}</span>
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
  const setAnswer = (key: keyof SelfReport, value: number | undefined) =>
    setReport(({ [key]: _dropped, ...rest }) => (value === undefined ? rest : { ...rest, [key]: value }))
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    reportRef.current = report
  }, [report])

  useEffect(() => () => abortRef.current?.abort(), [])

  function choose(next: VideoMode) {
    setMode(next)
    // The demo run fills the how-you-feel sliders with this person's usual answers (they can still move them).
    if (next === 'sample') {
      const d = demoValues(D.getState().crew.id as string)
      setReport({ sleepQuality: d.sleepQuality, mood: d.mood, stress: d.stress, sleepHours: d.sleepHours })
    }
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
    // The demo run plays the sample at 3x for a few seconds, then fills in a normal reading.
    const seconds = mode === 'sample' ? DEMO_SECONDS : CAPTURE_SECONDS
    if (mode === 'sample') {
      video.loop = true
      video.currentTime = 0
      video.playbackRate = DEMO_PLAYBACK_RATE
      await video.play()
    }
    setProgress(0)
    setPhase('capturing')
    abortRef.current = new AbortController()
    try {
      const assembled = await runCapture({
        video,
        landmarker,
        durationSec: seconds,
        signal: abortRef.current.signal,
        onProgress: (p) => {
          setProgress(Math.min(1, p.elapsedSec / seconds))
          setFaceNow(p.faceFound)
        },
      })
      const analysis = analyzeCapture(assembled)
      if (mode === 'sample') {
        // A screen recording played fast is no pulse signal: use this person's usual values, stored as simulated.
        const d = demoValues(D.getState().crew.id as string)
        const ok = { score: 1, passed: true }
        analysis.heartRate = { ...analysis.heartRate, bpm: d.heartRate, estimateBpm: d.heartRate, candidateBpm: d.heartRate, quality: ok }
        analysis.blink = { blinkRate: d.blinkRate, eyelidClosurePct: d.eyelidClosure, quality: ok }
      }
      onComplete({ analysis, selfReport: reportRef.current, source: mode === 'camera' ? 'camera' : 'simulated' })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setPhase('position')
    }
  }

  const sampleMode = mode === 'sample'
  const canStart = ready && landmarker !== null && (sampleMode || checks?.ready === true)
  const outline = phase === 'capturing' ? 'var(--color-accent)' : checks?.ready ? 'var(--color-ok)' : 'var(--color-nodata)'

  if (phase === 'intro') {
    return (
      <section aria-labelledby="camera-intro" className="mc-stack">
        <div className="mc-stack-sm">
          <p className="mc-kicker">Step 1 · Camera</p>
          <h2 id="camera-intro" className="mc-h2">
            Look at the screen while the camera reads your pulse and blinking
          </h2>
          <p className="mc-lead">The camera measures your heart rate from tiny colour changes in your face and tracks blinking for signs of fatigue. While it reads, three quick sliders ask how you feel.</p>
        </div>
        <div className="mc-choices">
          <button type="button" onClick={() => choose('camera')} className="mc-choice mc-choice-dark">
            <span className="mc-choice-k">About 40 seconds</span>
            <strong>Use my camera</strong>
            <span>Your real reading, compared with your own usual.</span>
          </button>
          <button type="button" onClick={() => choose('sample')} className="mc-choice">
            <span className="mc-choice-k">Demo · about 6 seconds</span>
            <strong>Run the demo recording</strong>
            <span>For judges or no webcam: a team member's recorded check plays at 3x, then fills in a normal reading, saved as simulated.</span>
          </button>
        </div>
        <p className="mc-note">
          <strong>Your video never leaves this device.</strong> Frames are processed in your browser and thrown away. Nothing is recorded, saved or uploaded.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="camera-heading" className="mc-stack">
      <div className="mc-stack-sm">
        <p className="mc-kicker">Step 1 · Camera{sampleMode ? ' · demo run' : ''}</p>
        <h2 id="camera-heading" className="mc-h2">
          {phase === 'capturing' ? (sampleMode ? 'Reading the demo recording…' : 'Hold still and look at the screen') : sampleMode ? 'Demo recording ready' : 'Position your face'}
        </h2>
      </div>

      {(error || modelError) && (
        <p role="alert" className="mc-note mc-note-act">
          {error ? ERROR_COPY[error] : 'The face model could not be loaded. Reload the page and try again.'}{' '}
          <button onClick={() => setPhase('intro')} className="mc-link">
            Back
          </button>
        </p>
      )}

      <div className="mc-capture">
        <div className="mc-video">
          <video ref={videoRef} playsInline muted aria-label={sampleMode ? 'Demo recording' : 'Live camera preview'} className="block w-full -scale-x-100" />
          <svg viewBox="0 0 100 75" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <ellipse cx="50" cy="38" rx="17" ry="24" fill="none" stroke={outline} strokeWidth="1.2" strokeDasharray={checks?.ready || phase === 'capturing' ? undefined : '3 2'} />
          </svg>
          {!ready && !error && <p className="absolute inset-0 grid place-items-center text-sm text-paper">{sampleMode ? 'Loading the demo recording…' : 'Starting camera…'}</p>}
          {sampleMode && <span className="mc-badge">{phase === 'capturing' ? `Demo · ${DEMO_PLAYBACK_RATE}x speed` : 'Demo recording'}</span>}
        </div>

        <div className="mc-side">
          {phase === 'position' && (
            <>
              <p role="status" aria-live="polite" className="mc-status">
                {error || modelError || !ready
                  ? ''
                  : !landmarker
                    ? 'Loading the face model…'
                    : sampleMode
                      ? 'Ready. The demo takes about 6 seconds.'
                      : (checks?.hint ?? 'Looking for your face…')}
              </p>
              {!sampleMode && checks && (
                <ul className="mc-checks">
                  <CheckRow label="Face found" ok={checks.found} text={checks.found ? 'Yes' : 'No'} />
                  <CheckRow label="Centered" ok={checks.centered} text={checks.centered ? 'Yes' : 'Move into the outline'} />
                  <CheckRow label="Distance" ok={checks.size === 'ok'} text={checks.size === 'ok' ? 'Good' : checks.size === 'far' ? 'Too far' : 'Too close'} />
                  <CheckRow label="Light" ok={checks.light === 'ok'} text={checks.light === 'ok' ? 'Good' : checks.light === 'dark' ? 'Too dark' : 'Too bright'} />
                  <CheckRow label="Steady" ok={checks.still} text={checks.still ? 'Yes' : 'Hold still'} />
                </ul>
              )}
              {sampleMode && <p className="mc-note">The how-you-feel answers below are filled with this crew member's usual answers. Change any you like.</p>}
              <div className="mc-row">
                <button onClick={() => void start()} disabled={!canStart} className="mc-btn">
                  {sampleMode ? 'Start the demo' : 'Start'}
                </button>
                <button onClick={() => setPhase('intro')} className="mc-link">
                  {sampleMode ? 'Use my camera instead' : 'Change camera source'}
                </button>
              </div>
            </>
          )}

          {phase === 'capturing' && (
            <div className="mc-stack-sm">
              <div className="mc-progress" role="progressbar" aria-label="Capture progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <div style={{ transform: `scaleX(${progress})` }} />
              </div>
              <p className="mc-status">{faceNow ? `Reading… ${Math.round(progress * 100)}%` : 'Face lost. Move back into the outline.'}</p>
            </div>
          )}

          {(phase === 'capturing' || sampleMode) && (
            <div className="mc-feel">
              <p className="mc-kicker">How you feel · 0 is lowest, 10 is highest · skip any</p>
              {SLIDERS.map(({ key, label }) => (
                <OptionalSlider key={key} label={label} value={report[key]} onChange={(v) => setAnswer(key, v)} />
              ))}
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
                  className="field h-11 w-24 py-0 text-right"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
