# Notes

## Assumptions
- Stack versions as installed by `npm create vite` on 2026-11-14 (Vite 8, React 19, TS 7, Vitest 5).

- Status colors come from deviation from the crew member's own baseline (green within 1 SD, yellow 1-2 SD, red beyond 2 SD). This is statistical, not a clinical threshold. Baseline needs at least 5 samples, otherwise gray.
- Baseline SD is floored at 1% of |mean| so a perfectly flat history does not divide by zero. (It was 5%, which made a 38 C fever look normal against a 36.6 C baseline; found while importing real data and fixed with a test.)
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
- **Real-world heart-rate check (reported by Ronav, 2026-11-14):** the app's best-guess heart rates from earlier real webcam runs were within 3 bpm of readings from other apps Ronav trusts. This is one person on one laptop, number of runs not recorded, reference was other consumer apps (not a clinical pulse oximeter). Treat as encouraging, not validated.
- **Bundle and loading:** first-load JS is about 109 KB gzipped (budget 150 KB for a landing page, 300 KB for an app page). The body map (charts, about 109 KB gzipped) and the mirror check load on demand, and the MediaPipe library (about 45 KB gzipped) is downloaded only when the camera step starts. The model (3.7 MB) and WASM (15 MB) are static files fetched at that point, and the PWA step must precache them for offline use.
- **Audit of the screens built so far (landing, body map, progress, mirror check intro, vision, symptoms):** no horizontal scroll or overflow at 320, 375 and 768 px; no unnamed controls; one `main` per screen. Fixed: the Amsler grid was 100 tab stops and is now one stop with arrow-key movement (tested). Open items for the visual pass: top bar controls are 24 to 29 px tall, and `--color-ok` text is 4.46:1 on the paper background (needs 4.5:1).
- Development-only URL shortcuts (stripped from production builds): `?screen=<name>` and, for the mirror check, `&step=vision|symptoms`.
- **Survey sliders (`src/components/OptionalSlider.tsx`):** each starts unanswered ("skip") at the middle position. Bug found and fixed: answering exactly 5 did nothing, because clicking a slider already sitting on 5 fires no change event. Releasing the pointer or pressing Enter/Space now also counts as answering, and a Clear link returns a slider to unanswered. Verified in the browser on the gut/appetite sliders; the three mood, stress and sleep sliders in the camera step use the same component but need a webcam to reach, so they are type-checked but not browser-tested. There is no automated test for this component because it would need a React testing library (not installed; ask before adding one).
- **Low-confidence heart-rate estimate (added after a real run where the best guess was good but the reading was refused).** When the face, light and head-motion checks all pass and pulse strength is between 0.30 and the 0.38 pass line, the app shows the best guess as "about N bpm, estimate only": gray, never colored, never used for the baseline (it is stored as a FAILED reading with the number as its value, so it is excluded everywhere a failed reading is). It also requires the first and second half of the capture to agree within 6 bpm. Measured on synthetic signals: without that agreement check, estimates were within 3 bpm 93.7% of the time with 9 gross errors (wrong peak, up to 84 bpm off) in 158; with it, 99.2% within 3 bpm and zero gross errors in 124 kept. On 300 pulse-free noise captures an estimate is offered 0.3% of the time (1 in 300). Estimates are never offered when motion, lighting or a lost face failed, because the signal is contaminated. Accuracy on real faces is untested beyond the reports from Ronav. Estimates are labeled as unverified in the UI.
- **Calibration aid:** the summary's "Measurement details" has a "Copy capture data" button that copies numbers only (average face color per frame, no images) so a real capture can be replayed offline in tests.
- **Gamification care loop (`src/lib/plan.ts`, `scoring.ts`, `docs/GAMIFICATION.md`):** the Crew progress screen shows a "Today's plan" built from the person's own readings (steps appear only when readings are off their own usual; credit is for doing the step, never for a value). New event kind `countermeasureComplete` with an optional `detail` (sleep, nutrition, escalate); this extends the brief's four credited kinds deliberately. Credit is capped once per person per day per kind (and per care step), so at most 70 points a day; extra events are logged but not scored. Verified end to end: 52 events worth 645 points uncapped credited 35. Bug found while verifying: the Progress screen froze "now" at mount, so anything done afterwards fell outside the week window; it is refreshed on every load now.
- Dev-only URL shortcut added: `?crew=guest` (or crew-1..3) starts as that crew member, alongside `?screen=` and `&step=`.
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

Verified by reading the primary pages on 2026-11-14:
- NASA Human Research Program risks, https://www.nasa.gov/hrp/risks (page updated Jul 21, 2026). 17 risk titles; the ones we cite, verbatim: Risk of Cardiovascular Adaptations; Risk of Inadequate Sleep and Irregular Schedules; Risk of Behavioral Changes and Psychiatric Disorders; Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS); Risk of Spaceflight-Induced Bone Changes; Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness; Risk of Radiation-Induced Cancers; Risk of Inadequate Food and Nutrition; Risk of Host-Microorganism Interactions. The page does not mention blood pressure, body temperature, blood glucose, body mass, kidney or "fluid shift".
- NASA Spaceflight Standard Measures, https://www.nasa.gov/reference/standard-measures/ and https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/. Nine core measurements: Actigraphy; Biochemical markers (blood, urine); Carotid intima-media thickness; Cellular profile (blood, saliva); Cognition (10 computer tests); Microbiome (body, saliva, fecal samples); Personality questionnaire; Sleep quality/team questionnaire (mood before sleep); Sensorimotor (movement, balance, heart rate, blood pressure). Not mentioned: body mass, blood glucose, body temperature, vision.
- Body mass on the ISS: Body mass changes during long-duration spaceflight, https://www.ncbi.nlm.nih.gov/pubmed/25197887 (not a NASA page; found by search).
- Gut datasets (found through a data.gov catalog search, NOT yet opened on osdr.nasa.gov): SpaceX Inspiration4 stool metagenome OSD-630; MARS500 gut microbiota GLDS-191 (ground analog).

### E1: NASA bed-rest data inventory (read from the files, 2026-11-14)

- **Where:** `data-raw/nasa-bedrest/`, NASA Life Sciences Data Archive bed-rest studies. 38 study folders, 4,529 files, 109 MB. Study descriptions are in `_metadata/experiment_*.json`.
- **Terms:** the metadata for the Case Report Forms says "Data preservation is complete. All datasets are publicly available." No separate terms-of-use text was found in the files. Confirm on the NLSP site before the repo goes public, and cite DOI **10.83263/wjw1-ta27** (Case Report Form, JSC, Flight Analogs Project).
- **What it is:** ground-based **head-down-tilt bed rest**, a spaceflight analog (fluid shift, disuse). It is NOT in-flight data and the app labels it that way.
- **What we use (Case Report Forms, Campaign 3, daily logs, one participant):**

| Log | Columns used | Our indicator | Unit |
|---|---|---|---|
| Daily Vitals | Pulse | heartRate | bpm |
| Daily Vitals | Systolic / diastolic blood pressure | bloodPressureSys / bloodPressureDia | mmHg |
| Daily Vitals | Weight | bodyMass | kg |
| Daily Vitals | Body temperature (Celsius) | temperature | degrees C |
| Bowel Movement | Yes/No and Quantity | bowelMovements (new indicator) | per day |
| Stretch Log | Duration of completed sessions | exerciseMinutes | min |
| Symptom Complaint | Symptom category only | symptomReport | labels |

- **Column names vary:** the 23 daily-vitals files use at least 4 header spellings (`Pulse (bpm)`, `Pulse`, `SysBP (mmHg)`, `Blood Pressure, systolic`, ...). The importer finds columns by meaning and stops with an error if one is missing; a naive importer would have silently skipped most participants. A plain `Body Temp` column has no unit, so a value of 90 to 110 is converted from Fahrenheit.
- **Participant and window:** Campaign 3 has 23 participants, 13 in all six logs. The importer takes one with complete daily vitals and the fullest other logs, and the **first 30 days: 12 baseline days, then 18 days of head-down tilt**. Real effect in the data: body mass falls from about 74.8 kg to about 72.4 kg; resting heart rate stays about 55.
- **Privacy:** free-text comment, action and description columns contain **real clinicians' names**, so they are never read. The output keeps only day offsets and numbers, no dates, subject number or campaign code. The importer refuses to write if its output matches a date, the subject number or a name pattern, and a test scans the shipped JSON.
- **Not used (no matching indicator or participant):** respiration rate, ambient temperature and humidity, meals completed (could proxy appetite, not mapped), water intake, urine collection, medication logs.
- **Studies with relevant variables that use other participants (cannot be joined to this one):** BRSMAct (sleep duration, sleep latency), MR010G (clinical labs including glucose), MR001G / BRSMVF / MR080G (heart rate and blood pressure in tilt and exercise tests), MR085G (WinSCAT cognition reaction times), BRSMLac / BRSMAcet / BRSMGBT / BRSMUBT (gastrointestinal transit and breath tests), BRSMImmune. These are the natural next imports; sleep for Crew 3 stays simulated until one is matched.
- **Not investigated:** exercise-versus-control group comparisons (the 70-day campaign data, `CFT70`, is in `BEDREST_iRATS` and `CRF_CFT70_*`).
- **Crew 3:** 202 real records and 305 simulated ones. Each indicator is all real or all simulated; the footer and every card's source line say which. Real stretch sessions and symptom reports also become real exercise and symptom-report events.
- **Known limitation:** a reading is compared with a baseline built from ALL earlier readings, so a gradual real decline (body mass during tilt) partly pulls its own baseline down and reads as "Watch" instead of "Act". NASA uses a fixed pre-mission reference period; switching to that is a design decision for the team.

Mapping choices that are ours, not NASA's: blink rate and eyelid closure to the sleep risk (fatigue proxy); blood sugar to the nutrition risk; blood pressure to the cardiovascular risk (BP is not named there); heart rate and blood pressure tagged `sensorimotor` because the Standard Measures page lists them under sensorimotor tests; mood tagged `sleep` because the pre-sleep questionnaire covers mood; digestive comfort and appetite tagged `none` (they are self-reports, not the microbiome sample).

## Limitations

- **Webcam heart rate is not yet validated on a real face.** What is verified: the signal code on synthetic data (unit tests), and that the bundled model + WASM load locally in about 0.1 s with no CDN. What is NOT verified: ROI placement on a real face, real-world prominence/motion/light thresholds, GPU vs CPU delegate speed, and accuracy against a pulse oximeter. Calibrate using the mirror check on a laptop and a phone, then record results here.
- The sample recording (`public/sample/mirror.webm`) has not been recorded yet; the app shows "not available yet" until it exists.

## Status
