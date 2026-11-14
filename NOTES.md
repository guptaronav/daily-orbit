# Notes

## Assumptions
- Stack versions as installed by `npm create vite` on 2026-11-14 (Vite 8, React 19, TS 7, Vitest 5).

- Status colors come from deviation from the crew member's own baseline (green within 1 SD, yellow 1-2 SD, red beyond 2 SD). This is statistical, not a clinical threshold. Baseline needs at least 5 samples, otherwise gray.
- Baseline SD is floored at 5% of |mean| so a perfectly flat history does not make every tiny change red.
- All clinical thresholds in `src/config/thresholds.ts` are `value: null` until sourced from NASA HRP / NASA-STD-3001; the UI shows "threshold not set".
- Status never colors a reading whose quality check failed (gray).

- Seeded crew (`crew-1..3`) and the guest profile all start with 30 days of simulated history, labeled "Simulated data". The guest gets a simulated baseline so a judge's first check-in can be compared against something; their own check-ins are added on top.
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
- The estimator assumes uniformly spaced frames; the capture code must resample by timestamp before calling it.
- Blink threshold: an eye counts as closed when the mean of the left/right `eyeBlink` blendshape score is >= 0.5, reopened below 0.3. Eyelid closure % = share of frames closed. This is not clinical PERCLOS.
- Data scripts run with Node 24's built-in TypeScript support (`node scripts/x.ts`), not vite-node (it does not ship with Vitest 5).

- Face model: `public/models/face_landmarker.task` (MediaPipe Face Landmarker, float16, 3,758,596 bytes, sha256 `64184e22...c9ff`), downloaded 2026-11-14 from `storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`. It bundles the face detector, 478-point landmarks and the blendshapes model. License: see the MediaPipe Face Landmarker model card (to confirm). WASM runtime copied from `@mediapipe/tasks-vision` 1.2.3 into `public/wasm/` (only `vision_wasm_internal.*`). Both are bundled so the app needs no network after first load.
- Face regions (`src/camera/rois.ts`) are axis-aligned boxes built from 8 well-known mesh anchor points (10, 168, 234, 454, 33, 263, 61, 291) rather than hand-picked polygon indices: forehead 30%x12% of face width centered 45% of the way from the hairline point to the bridge; cheeks 16% square midway between eye corner and mouth corner. Head tilt is ignored. **Needs a visual check with a real face (dev harness).**
- Webcam frames arrive unevenly, so traces are resampled onto a uniform 30 Hz clock by timestamp before the pulse estimator runs.

### Arnav (A1-A5)

- Status colors now come in two tokens each: a swatch value for fills (`--color-ok` etc.) and a darker `-ink` value for text (`--color-ok-ink` etc.), because the swatch hues do not reach AA contrast as small text on paper. Status text uses the ink variant; swatches stay the original hues.
- Trend charts break the line at readings that failed quality instead of joining across them, so a gap on the chart means "we did not trust that reading", never "nothing happened". The count of skipped readings is printed under the chart.
- Body figure is one front-view silhouette drawn limbs-first so the shoulder and hip seams are hidden by the torso. The small regions (eyes, heart, gut) carry an invisible hit rect; even so, the eye target is under 44 px at the default size, and the region list below the figure is the full-size path to the same regions.
- Manual-entry ranges (`src/lib/manualEntry.ts`) are **input guards against typos only** and the error text says so: BP 40-300 / 20-200 mmHg, temperature 25-45 C, blood sugar 10-900 mg/dL, sleep 0-24 h, exercise 0-1440 min. A cuff reading with systolic at or below diastolic is rejected as a swap. None of these are clinical limits; `src/config/thresholds.ts` is still all nulls.
- A manually typed number is stored with `quality: { score: 1, passed: true }`: there is no signal to score, so we take the person at their word rather than inventing a confidence.
- Ground packet (`src/lib/packet.ts`): an indicator is included when its latest quality-passed reading is yellow or red against that person's own baseline. `sinceDays` is found by walking back over consecutive deviating readings (each compared with the baseline of everything before it, as `readIndicator` does) and taking whole days from the oldest of that run. Non-numeric indicators (Amsler, symptom report) are not in the packet because there is no baseline mean to compare against. `bytes` is the UTF-8 length of the exact JSON string shown on screen.
- The escalation countdown is a simulation of the one-way link only. Nothing is transmitted; no network call is made.

### Simulated metrics (A5, `src/lib/sim/metrics.ts`)

Both numbers on the Metrics screen are models, not observations, and every input is editable on the screen.

- Crew minutes per day: `manual = setupMin + perIndicatorMin x indicatorCount` against `mirror = mirrorCheckMin`. Defaults: mirror check 3 min, 1.5 min per indicator, 9 indicators, 2 min setup, 4 crew, 180 days. All four defaults are invented; none is measured or sourced.
- Reporting completeness: per person-day, draw (a) whether the person does the check (default 0.85), (b) whether it is a day worth reporting (0.25), (c) whether they would hide it under value-based scoring (0.4). Effort-based scoring counts every check; value-based scoring drops the hidden bad days. Both arms use the same three draws, so effort >= value always, with equality exactly when nobody hides anything. Deterministic in the seed (`mulberry32`).
- The claim that people under-report when bad values are punished is an **assumption we made**, not a result we found. The model exists to make that assumption arguable, not to prove it.

### Arnav: flight-deck visual system (A1, second pass)

- The app now ships **two themes built from the same token names**: `deck` (dark instrument console, the default) and `paper` (the original warm flight-manual look, `<html data-theme="paper">`). No component, including the ones other people own, knows which theme is on: everything reads `--color-ink`, `--color-panel`, `--color-accent` and so on. The mirror-check screens picked up the dark theme with no change because they already used only semantic tokens.
- The choice is remembered in `localStorage` under `chm-theme`, inside try/catch: blocked storage falls back to the default rather than throwing.
- Both themes are contrast-checked in the live page. Every text token measures at least 6.1:1 against both the page and the panel background in deck, and at least 5.4:1 in paper.
- Micro-labels, values, deltas, timers and byte counts are set in the **system monospace stack** (`--font-mono`). No web font is loaded: the offline guarantee in E6 stays intact and there is no new dependency.
- Motion is CSS only (`rise`, `sweep`, `blip`, `trace`) and touches transform/opacity/stroke-dashoffset only. A global `prefers-reduced-motion` block switches all of it off, and the count-up `Counter` subscribes to that media query rather than sampling it, so changing the OS setting takes effect without a reload.
- Design direction note: the task doc asked to push the paper look rather than replace it. The dark console is a deliberate alternative aimed at the visual-impact judging criterion, not a generic template; the paper direction is kept intact behind the switch so the team can still demo it.

### Arnav: the component kit (`src/components/kit/`)

Hand-rolled rather than pulled from a component library, because the rule is no new dependencies without asking, and because a console look is mostly tokens and hairlines rather than widgets.

- `Panel` — the console panel: hairline border, mono label rail, corner brackets, optional staggered entrance.
- `Icon` — 18 inline SVG glyphs at a 1.5 px hairline weight, inheriting `currentColor`. Replaces an icon package.
- `Readout` — `Counter` (count-up), `Gauge` (270-degree arc), `Sparkline` (flat-line safe), `Bar`, and `Sigma` (signed deviation in SD).
- `Chrome` — `Starfield` (deterministic, seeded from the existing `mulberry32`, so it never differs between two people looking at the same demo), `ThemeToggle`, `Segmented`, `StatusRail`.
- Body map callouts are connected to the figure by CSS leader lines. They are decorative: each card names its own region, so nothing is lost when the layout collapses to one column below 1024 px and the lines are hidden.
- The figure's scan line and aura are decorative, dimmed to near-nothing on the paper theme (`--scan-opacity`, `--aura-opacity`), and carry no information.
- `Sigma` (for example "-7.4σ") is the existing z-score from `src/lib/status.ts` shown directly. It is a statistical distance from that person's own baseline, never a clinical severity.

## Sources

## Limitations

- **Webcam heart rate is not yet validated on a real face.** What is verified: the signal code on synthetic data (unit tests), and that the bundled model + WASM load locally in about 0.1 s with no CDN. What is NOT verified: ROI placement on a real face, real-world prominence/motion/light thresholds, GPU vs CPU delegate speed, and accuracy against a pulse oximeter. Calibrate using the mirror check on a laptop and a phone, then record results here.
- The sample recording (`public/sample/mirror.webm`) has not been recorded yet; the app shows "not available yet" until it exists.

## Status
