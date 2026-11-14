# Notes

## Assumptions
- Stack versions as installed by `npm create vite` on 2026-11-14 (Vite 8, React 19, TS 7, Vitest 5).

- Status colors come from deviation from the crew member's own baseline (green within 1 SD, yellow 1-2 SD, red beyond 2 SD). This is statistical, not a clinical threshold. Baseline needs at least 5 samples, otherwise gray.
- Baseline SD is floored at 5% of |mean| so a perfectly flat history does not make every tiny change red.
- All clinical thresholds in `src/config/thresholds.ts` are `value: null` until sourced from NASA HRP / NASA-STD-3001; the UI shows "threshold not set".
- Status never colors a reading whose quality check failed (gray).

- Seeded crew (`crew-1..3`) start with 30 days of simulated history, labeled "Simulated data". **The guest starts empty** and builds their own baseline (5 earlier readings) so a real person is never compared to invented numbers; until then the summary says "Building your baseline (n of 5)". (This replaces an earlier design that seeded the guest, which showed false "Act" colors on a real first run.)
- Seed data is versioned (`SEED_VERSION` in `src/db/repo.ts`): bumping it clears local data once on the next load.
- Unanswered check-in questions are not saved, so an untouched slider can never become a fake reading. Body mass is seeded daily for simplicity, though real cadence is weekly.
- Head motion for the pulse reading is detrended, outlier-robust jitter of the nose tip, not total movement, so slow drift and brief glances do not refuse a reading.
- An acuity check where the largest letter was never answered correctly is saved as a failed reading (retake), not judged.
- Seed profiles (typical sleep, HR, etc.) are invented simulation parameters, not NASA data. Seed ids are deterministic strings (`crew-1-heartRate-3`), not UUIDs, so reseeding is reproducible.
- Comm delay: ISS 1 s, lunar 1.3 s (from the brief), Mars default 20 min, adjustable 3 to 22 min.
- Environment equipment lists are `[CONTENT TODO]` until sourced.
- Fonts: system font stack only (no web font) so the app works offline with no extra dependency.

- Region mapping (`src/lib/regions.ts`): head = sleep/mood/stress/blink/eyelid, eyes = Amsler + acuity, heart = HR + BP, skeleton = exercise (bone-loss proxy), whole body = radiation + temperature + symptom report, gut = blood sugar. `symptomReport` was not assigned a region in the brief; whole body is our choice.
- A region's color is the worst status among its indicators that have good data; gray only when none do. A latest reading that failed quality is skipped and the latest passed reading is used.
- Baseline for status excludes the latest reading, so a sudden change is not diluted by itself.
- `standardMeasure` tags in `src/content/indicators.json` are **our first guess** (sleep -> sleep, exercise -> activityLight, blood sugar -> biosample, everything uncertain -> none). Needs review against nasa.gov/reference/standard-measures.
- All indicator text (five challenge questions, HRP risk name, recommended action) is `[CONTENT TODO]` on purpose. Nothing clinical was invented. Fill from NASA HRP sources before the demo.
- Seeded extras: blood pressure, temperature, blood sugar, near acuity, weekly Amsler (no distortion). Values are invented, simulated, labeled "Simulated data". radiationDose and symptomReport are intentionally unseeded (they come from the radiation replay and the check-in).
- The most recent seeded day is damped toward each person's typical value so every seeded crew member starts green. Demo events (sleep decline etc.) then tell the story.
- Trend charts use straight lines (no smoothing) so they never overshoot the real data.
- To pick up a changed seed in an existing browser, press "Reset demo" on the landing page.

- rPPG (`src/lib/signal`): POS algorithm, 0.7 to 3.0 Hz zero-phase band-pass, Hann-windowed DFT peak. Heart rate is refused (quality failed, gray, retake prompt) when prominence of the spectral peak is below `MIN_PROMINENCE` = 0.4, or when face, lighting or motion checks fail first. The check order names the most fixable cause first.
- On synthetic signals (`synth.ts`, 30 s at 30 fps): exact bpm recovery up to ~1% relative sensor noise, refusal by ~2-4%; across 40 noise-only signals the worst prominence was 0.30 and none passed. **These are synthetic results only.** All constants in `src/lib/signal/constants.ts` (prominence, motion 3% of face width, luma 50-240, face-lost 10%, blink 0.5/0.3) are tunable guesses and must be calibrated with a real webcam against a pulse oximeter.
- **Heart-rate pass line recalibrated (first real webcam run).** A real run scored pulse strength 0.39 against the old 0.40 line with every other check passing and a plausible best guess of 73 bpm. Cause: a real pulse waveform has a strong second harmonic that the old score counted as noise. New score = averaged 10 s segment spectrum (Welch), peak plus second harmonic share of band power, peak frequency refined on the full capture, and a half-frequency rule so a strong harmonic is not read as double the heart rate. `MIN_PROMINENCE` is now 0.38. Measured on synthetic signals with a realistic waveform: 0 false passes in 200 noise-only signals (worst 0.33), every accepted reading within 2 bpm, all accepted up to about 1% sensor noise, about half at 1.5%. **Real-world noise has more structure than white noise, so this still needs checking against a pulse oximeter.**
- **Gamification** (`src/lib/scoring.ts`, `streak.ts`): points are 10 check-in, 15 symptom reported, 10 exercise, 5 retake after a failed reading; made-up pacing numbers. Points depend only on events (what people did), never on measurements; a randomized test checks that a worse health day never earns fewer points. One shared weekly crew goal (150 per crew member, invented pacing) and no per-person ranking. Streak forgives one missed day in any 7. The last ship-system threshold (1700) is tuned to the seeded crew total so a judge's second check-in unlocks it.
- **Demo panel** (Shift+D or the landing-page link, `src/components/DemoPanel.tsx`): injects ordinary records labeled `simulated` for the selected crew member: one more night of worse sleep (press twice: head yellow then red), a failed-quality heart-rate reading (never colors the heart), a central Amsler distortion, removal of the last 3 days of check-ins, and a jump to the radiation replay.
- The estimator assumes uniformly spaced frames; the capture code must resample by timestamp before calling it.
- Blink threshold: an eye counts as closed when the mean of the left/right `eyeBlink` blendshape score is >= 0.5, reopened below 0.3. Eyelid closure % = share of frames closed. This is not clinical PERCLOS.
- Data scripts run with Node 24's built-in TypeScript support (`node scripts/x.ts`), not vite-node (it does not ship with Vitest 5).

- Face model: `public/models/face_landmarker.task` (MediaPipe Face Landmarker, float16, 3,758,596 bytes, sha256 `64184e22...c9ff`), downloaded 2026-11-14 from `storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`. It bundles the face detector, 478-point landmarks and the blendshapes model. License: see the MediaPipe Face Landmarker model card (to confirm). WASM runtime copied from `@mediapipe/tasks-vision` 1.2.3 into `public/wasm/` (only `vision_wasm_internal.*`). Both are bundled so the app needs no network after first load.
- Face regions (`src/camera/rois.ts`) are axis-aligned boxes built from 8 well-known mesh anchor points (10, 168, 234, 454, 33, 263, 61, 291) rather than hand-picked polygon indices: forehead 30%x12% of face width centered 45% of the way from the hairline point to the bridge; cheeks 16% square midway between eye corner and mouth corner. Head tilt is ignored. **Needs a visual check with a real face (dev harness).**
- Webcam frames arrive unevenly, so traces are resampled onto a uniform 30 Hz clock by timestamp before the pulse estimator runs.

## Sources

Verified by reading the primary pages on 2026-11-14:
- NASA Human Research Program risks, https://www.nasa.gov/hrp/risks (page updated Jul 21, 2026). 17 risk titles; the ones we cite, verbatim: Risk of Cardiovascular Adaptations; Risk of Inadequate Sleep and Irregular Schedules; Risk of Behavioral Changes and Psychiatric Disorders; Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS); Risk of Spaceflight-Induced Bone Changes; Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness; Risk of Radiation-Induced Cancers; Risk of Inadequate Food and Nutrition; Risk of Host-Microorganism Interactions. The page does not mention blood pressure, body temperature, blood glucose, body mass, kidney or "fluid shift".
- NASA Spaceflight Standard Measures, https://www.nasa.gov/reference/standard-measures/ and https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/. Nine core measurements: Actigraphy; Biochemical markers (blood, urine); Carotid intima-media thickness; Cellular profile (blood, saliva); Cognition (10 computer tests); Microbiome (body, saliva, fecal samples); Personality questionnaire; Sleep quality/team questionnaire (mood before sleep); Sensorimotor (movement, balance, heart rate, blood pressure). Not mentioned: body mass, blood glucose, body temperature, vision.
- Body mass on the ISS: Body mass changes during long-duration spaceflight, https://www.ncbi.nlm.nih.gov/pubmed/25197887 (not a NASA page; found by search).
- Gut datasets (found through a data.gov catalog search, NOT yet opened on osdr.nasa.gov): SpaceX Inspiration4 stool metagenome OSD-630; MARS500 gut microbiota GLDS-191 (ground analog).

Mapping choices that are ours, not NASA's: blink rate and eyelid closure to the sleep risk (fatigue proxy); blood sugar to the nutrition risk; blood pressure to the cardiovascular risk (BP is not named there); heart rate and blood pressure tagged `sensorimotor` because the Standard Measures page lists them under sensorimotor tests; mood tagged `sleep` because the pre-sleep questionnaire covers mood; digestive comfort and appetite tagged `none` (they are self-reports, not the microbiome sample).

## Limitations

- **Webcam heart rate is not yet validated on a real face.** What is verified: the signal code on synthetic data (unit tests), and that the bundled model + WASM load locally in about 0.1 s with no CDN. What is NOT verified: ROI placement on a real face, real-world prominence/motion/light thresholds, GPU vs CPU delegate speed, and accuracy against a pulse oximeter. Calibrate using the mirror check on a laptop and a phone, then record results here.
- The sample recording (`public/sample/mirror.webm`) has not been recorded yet; the app shows "not available yet" until it exists.

## Status
