// Every value here is a tunable assumption, NOT a validated clinical number.
// Calibrate against real webcam runs and a pulse oximeter, then record results in NOTES.md.

export const BAND_LO_HZ = 0.7 // 42 bpm
export const BAND_HI_HZ = 3.0 // 180 bpm
export const MIN_SECONDS = 10 // shorter captures are refused
export const MIN_PROMINENCE = 0.38 // spectral peak (+ harmonic) share of band power needed to trust a heart rate; see NOTES.md for the calibration
export const PEAK_HALF_WIDTH_HZ = 0.1 // power within +/- this of the peak counts as "the peak"

export const MAX_MOTION = 0.03 // nose-tip spread as a fraction of face width
export const MIN_LUMA = 50 // mean face brightness, 0-255
export const MAX_LUMA = 240
export const MAX_FACE_LOST = 0.1 // fraction of frames with no face

export const BLINK_CLOSE = 0.5 // eyeBlink blendshape score counted as "closed"
export const BLINK_OPEN = 0.3 // hysteresis: must fall below this to count as reopened
