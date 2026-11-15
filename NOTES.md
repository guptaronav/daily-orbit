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
- Radiation replay (E3, `src/lib/radiation.ts`): the dose ledger is a **simulation, not dosimetry**. Formula: dose = starting dose + sum over replay hours of (measured dose rate in mGy/h x 1 h x 1 mSv/mGy). Assumptions, all ours: (1) the dose rate LRO CRaTER measured in lunar orbit (detector pair D3/D4) is applied unchanged to the simulated vehicle in every environment, so vehicle shielding and location (ISS, Mars transit) are not modeled; (2) 1 mGy is counted as 1 mSv, no radiation quality factor, so the number is not a dose equivalent; (3) the starting dose is the quiet rate (median of the 24 h before onset) for an assumed 30 mission days; (4) an hour with no measurement repeats the last measured rate; (5) taking shelter does not change the ledger.
- Why D3/D4: it is the middle detector pair. Our understanding is that it sits between the two pieces of tissue-equivalent plastic and is the most shielded of the three, which is closer to a crew member inside a vehicle than the outward-facing D1/D2 pair (about 7x higher in the March 2012 event). **To confirm against the CRaTER instrument documentation.**
- Replay events: `scripts/fetch-donki.ts` keeps the 6 events with the largest measured dose above the pre-event level, among events reported by a GOES instrument (near Earth), with at least 85% hourly CRaTER coverage. DONKI reports within 72 h of each other are treated as one event; onset is the first GOES report. Window: 24 h before to 72 h after onset, hourly.
- Replay hours are stored as `radiationDose` measurements (`source: 'simulated'`, mSv) with timestamps remapped so the last replay hour is "now". Ids depend only on crew and hour, so a new replay replaces the previous one. Rewinding deletes the later hours (`removeMeasurements` added to `src/db/repo.ts`, Ronav's file, 3 lines).
- Whole body status during a replay comes from the same personal-baseline rule as every other indicator, so it turns red when the dose jumps and can relax again once the cumulative dose levels off. That is the statistical rule, not a statement that the dose stopped mattering.
- Shelter prompt wording and the follow-up steps are generic. The list of symptoms to watch for after a radiation event is `[CONTENT TODO]` until sourced from NASA.

### The UI overhaul runs the prototype itself (src/proto/)

The overhaul was designed as a set of `.dc.html` prototypes with their own logic and a shared
`data.js`. Instead of re-drawing them by hand, they are ported mechanically so the app renders
exactly what the prototypes render:

- `src/proto/*View.tsx` are generated from each prototype's markup with its inline styles verbatim
  (the converter lives outside the repo; regenerate rather than hand-edit). Prototype variable
  names (`--ink`, `--panel`...) are aliased to the app's tokens in `index.css`.
- `src/proto/logic/*.logic.ts` are each prototype's own logic class, run unchanged through a
  small `DCLogic` shim (`src/proto/dc.tsx`).
- `src/proto/data.ts` is `data.js` ported. Its presentation helpers are verbatim; its DATA is
  rewired to the real database: readings and their status come from the app's own
  `readIndicator`, coins are the real credited points from `scoring.ts`, and the ground packet,
  entry validation and both simulations are the tested `lib/` functions.

Deliberate departures from the prototype, all to keep it honest:

- The prototype's `earn()` minted coins freely. Here every earn is a real event (supply drop or
  streak milestone), so the once-per-day credit cap applies and nothing pays for a health value.
- The prototype let you tap a daily task "done". Here a task opens the screen where it is done,
  and its credit arrives from that real flow.
- The daily crate pays a fixed amount (the supply-drop rate), not a random 10 to 30.
- Spending coins on gear is cosmetic and local (localStorage); it never touches a reading.
- Screens the prototype had not drawn (mirror check, radiation, sources, crew progress) were
  disabled in its menu. They exist here, so they link, and they wear the same frame.
- Tailwind arbitrary values containing commas (h-[clamp(a,b,c)]) do not generate in this setup;
  the generated views use inline styles, which sidesteps it.

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

- NASA DONKI solar energetic particle events, https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP (fetched 2026-11-14 at build time, 494 events from 2010-08-14 to 2026-09-05). No API key needed on this host; it rejects date ranges over 60 days, so the script uses 30-day windows. `api.nasa.gov/DONKI/SEP` is tried first only when `NASA_API_KEY` is set. On 2026-11-14 three sample periods returned identical event ids from both hosts. DONKI SEP records carry time, instruments and linked events, no intensity.
- LRO CRaTER dose rates via NASA CCMC iSWA HAPI, https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi (dataset `CRaTER`, column `d3_4_dose_rate`, cGy/day, hourly, described there as "CRaTER (GCR+SEP) dose rates for individual and combined detectors with silicon to water correction"). Converted to mGy/h (x 10 / 24). The server allows at most 31 days per request.
- GOES primary >10 MeV proton flux via the same iSWA HAPI (dataset `goesp_part_flux_P5M`, column `P10`, 5-minute, averaged to hourly). GOES is a NOAA satellite; the copy we use is served by NASA CCMC. Shown for context only.

## Limitations

- **Webcam heart rate is not yet validated on a real face.** What is verified: the signal code on synthetic data (unit tests), and that the bundled model + WASM load locally in about 0.1 s with no CDN. What is NOT verified: ROI placement on a real face, real-world prominence/motion/light thresholds, GPU vs CPU delegate speed, and accuracy against a pulse oximeter. Calibrate using the mirror check on a laptop and a phone, then record results here.
- The sample recording (`public/sample/mirror.webm`) has not been recorded yet; the app shows "not available yet" until it exists.

## Status


## Indicator content, food and water, mission schedule (Arnav, 2026-11-14)

- `src/content/indicators.json`: the five challenge questions plus a recommended action are now filled for every indicator, each sentence from a NASA (or NIH/CSA) page that was opened; the pages are listed in `src/content/sources.json`. This overlaps Evode's task E4: Evode, please review rather than redo. No clinical thresholds were added; escalation text points at the app's own-baseline colors plus sourced warning signs.
- `temperature` hrpRisk is "Risk of Altered Immune System Responses" (a judgment call: that page covers infection but not fever). `symptomReport` hrpRisk is the in-flight medical conditions risk, from a separate nasa.gov page.
- Blink rate and eyelid closure have no NASA page; their text relies on NIH-hosted ground drowsiness research (PERCLOS).
- Water and meals: new indicators `waterIntake` (L/day) and `mealsEaten` (meals/day). Today's running total stays local and a finished day is committed as one reading, so a half-finished morning is never colored "low". The default fluid goal is 32 mL per kg of the latest body mass, at least 2.1 L, or 2.5 L with no body mass (NASA JSC-67378; that requirement counts food and drinks together, the log counts drinks).
- Mission schedule: the order and durations of the crew day follow NASA descriptions of an ISS day (two hours of exercise, 8.5-hour sleep period, morning and evening conferences, one-hour break after lunch); the exact clock times are our example layout. Role duties point at this app's screens and are not a claim about how NASA assigns work. The microbiome reminder interval (30 days) is a placeholder.
- Research caveats from the content pass:
- (A) No [CONTENT TODO] fields: all 36 fields are filled from opened pages. Some checklist items have no direct source, though: back/joint pain, trouble breathing and blurred vision. The back-pain coverage I found was not on a NASA, space agency or NIH page I opened, and the SANS page does not name blurred vision or headache. symptomReport therefore refers to them only generally.
- (A) No numeric clinical thresholds are included. The 'about 1 °C over 2.5 months' figure in temperature.hazardEffect is a research finding from Stahn et al. 2017, not an alarm threshold. The Artemis II page describes caution and shelter dose thresholds but gives no values.
- (A) hrpRisk for temperature is a judgment call. I chose 'Risk of Altered Immune System Responses' because a rise in temperature can go with infection. That page lists infections, rashes and cold sores but does not mention fever. The alternative is the Inflight Medical Conditions risk.
- (A) The Inflight Medical Conditions risk page is at nasa.gov/directorates/esdmd/hhp/ and is not in the main https://www.nasa.gov/hrp/risks list. Its exact title is used for symptomReport.
- (A) No NASA source found that describes webcam rPPG. The webcam method is described only as the app's own approach, with no claim about its accuracy.
- (A) The Artemis II shelter guidance (caution level and shelter recommendation) describes Orion operations. Applying it to other vehicles is a generalization.
- (A) The Bio-Monitor and CARDIOBREATH pages are from the Canadian Space Agency, which counts as an allowed 'other space agency' source.
- (B) No fields are [CONTENT TODO]. Every field is paraphrased from the pages listed in its sources.
- (B) The NIH pages (PMC10108649 and PubMed 12736840/29133149) blocked direct fetching with reCAPTCHA or cookie walls. Their text was read through NCBI E-utilities (efetch) for the same record IDs. The citations use the canonical PMC/PubMed URLs.
- (B) Blink rate and PERCLOS sources are ground-based drowsiness and fatigue research, not spaceflight studies. No NASA page opened in this task mentions blink rate or eyelid closure, so describe them as fatigue proxies only. The research evidence on blink rate is mixed: the PERCLOS review says blink-duration and PERCLOS comparisons are inconsistent across studies.
- (B) No page opened in this task links space radiation directly to sleep or to SANS. Radiation is only mentioned for mood (NASA HRP risks page) and as polyethylene shielding in sleeping quarters (sleep brief, not used in a field).
- (B) No NASA source was found that names a 0-10 mood, stress or sleep-quality slider as an operational in-flight tool. canMeasureInSpace describes the app's self-report method plus NASA's sourced monitoring (WinSCAT, private psychological conferences, actigraphy and questionnaires).
- (B) The yellow/red escalation wording refers to the app's own deviation from personal baseline (1 or 2 SD), not to clinical thresholds. No numeric clinical thresholds are included. The only numbers used are ones stated in the sources: about six hours of average sleep, 16 sunrises a day, and at least three pairs of glasses.
- (B) The humanresearchroadmap.nasa.gov behavioral risk page (risk.aspx?i=99) returned only navigation text, so it was not used as a source.
- (C) PDF sources (OCHMO briefs, JSC-67378, Living and Working fact sheet) were fetched with WebFetch, which could not read them; text was extracted from the saved PDFs with pdftotext and checked.
- (C) The 'Living and Working in Space' fact sheet is shuttle-era. Its timeline also says 'eight hours of sleep' and a 16-hour workday, which conflict with the newer 8.5-hour sleep standard (6.0 Medical Operations), so those figures were left out. Treat the day timeline as illustrative, not current.
- (C) Exercise duration differs by source: the risk page says 1.5 hours a day, 6-7 days a week; the 2024 Astronaut Exercise page and 2025 ISS blog say about two hours a day. The app uses the newer 'about two hours'.
- (C) No numeric clinical thresholds were found for blood sugar, appetite, bowel movements or body mass change. Escalation relies on the app's baseline colors plus sourced warning signs (dehydration from vomiting or diarrhea).
- (C) bloodSugar: NASA in-flight glucose testing practice and hazard effects beyond altered gravity and nutrition are not sourced ([CONTENT TODO]). bowelMovements: how NASA tracks bowel habits is not sourced ([CONTENT TODO]).
- (C) Radiation was not linked to any of these six indicators by the pages opened, so it is left out of hazardEffect. Isolation is only linked through menu fatigue (risk-nutrition page) and sleep/workload (isolation page).
- (C) Mission specialist: no current NASA ISS page describing this role was opened (it is mainly a shuttle-era title), so no roleFacts entry. Commander and flight engineer duties are not described beyond the crew listing.
- (C) JSC-67378 is written for Orion/Gateway exploration missions up to 365 days, not the ISS specifically. The OCHMO food brief URL fetched is the 2023 version (Rev D/E); a newer revision may exist.
- (C) SLAMMD: a secondary (non-NASA) source said the Russian device may now be primary with SLAMMD in reserve; not confirmed on a NASA page, so text says only that SLAMMD measures mass.


## Fixed reference, steady slides and patterns (Arnav, 2026-11-14)

- `src/lib/trend.ts`: each indicator gets a frozen reference from its first 14 days of readings (only once the history is longer than 14 days and the window holds at least 5 readings). Status is the worse of the reading against the recent rolling baseline and against that reference. This fixes the known limitation above: Crew 3's real bed-rest body-mass loss now reads Act ("2.4 kg below your first two weeks") instead of Watch. The 14-day window is our choice, modeled on NASA comparing in-flight results with a pre-flight reference.
- A steady slide (straight-line fit over the last 7 readings spanning at least 4 days, R² at least 0.6, total change at least 2 SD of the reference) turns a green reading into Watch. Thresholds are ours and statistical. Checked against 30 random seeds of the simulated crews: the reference and slide rules together add a flag to about 2% of steady, noise-only readings; seed 42 (the demo) stays all green for Crews 1 and 2.
- `src/lib/patterns.ts`: seven cross-indicator patterns (fatigue, mood and stress, possible infection, vision change, heart and blood pressure, under-fueling, gut upset). Each groups readings that already map to the same NASA HRP risk and fires when at least two groups are yellow or red in the worrying direction. A red pattern goes one escalation rung higher. The groupings and rungs are our mapping, not NASA rules, and the panel says "a prompt to look closer, not a diagnosis".


## Five hazards, mission environments, body functions, cabin air, reaction time, care plans (Arnav, 2026-11-14)

- Hazards panel (`src/lib/hazards.ts`, `src/content/hazards.json`): a reading is linked to one of NASA's five hazards only when its own NASA-sourced hazardEffect text names that hazard (keyword match). Hazard text is from the five NASA HRP hazard pages.
- New environment **Mars surface base** (same 3-22 min delay range as Mars transit). NASA's Mars page gives one-way delay as about 4 to 24 minutes; the app's adjustable range (3 to 22 min, set earlier from the brief) was left as it was. Mars gravity is shown as "about one-third", the wording on the NASA page that was opened; a sol is 24.6 h.
- Environment text (`src/content/environments.json`: gravity, radiation, distance, isolation, dayLength, equipment) is sourced; fields we could not source stay `[CONTENT TODO]` and are hidden in the UI. Radiation figures use different units (mSv/day vs micrograys/day) and are not compared with each other.
- Cabin air (`src/lib/sim/cabin.ts`) is **simulated** and labeled so. The limit is NASA-STD-3001 Vol 2 [V2 6004]: 1-hour average ppCO2 no more than 3 mmHg; keeping the 7-day average below 2.5 mmHg keeps headache risk under 1% (OCHMO-TB-004). The simulated typical level (2.3 mmHg) is our assumption.
- Body region "What it does" text (`src/content/regions.json`) is from NIH (MedlinePlus, NEI, NHLBI, NIDDK) and NASA HRP pages.
- Reaction time (new indicator `reactionTime`, head region): a one-minute test with 2-6 s random waits. NASA-funded ISS research used the 3-minute PVT-B (Reaction Self Test); a one-minute version is shorter than any validated one, so it is judged only against the person's own baseline, and the 500 ms "slow" count (the standard 10-minute PVT's lapse) is shown for context only. Slower reaction time also counts toward the fatigue pattern.
- Care plans on each pattern are assembled only from the involved readings' sourced recommendedAction and prevention text; the "move up" rule is this app's.
- Research caveats:
- All PDFs (CO2, acoustics, LSAH newsletter) were downloaded and read with pdftotext; HTML pages were read with WebFetch.
- The CO2 brief PDF file (URL path 2023/12) is now Rev D with a footer dated 10-Mar-26. It cites the 3 mmHg limit as NASA-STD-3001 Vol 2 Rev D [V2 6004], while its header lists Vol 2 Rev E. The number is the same.
- Mars gravity: the NASA HRP gravity page says 'approximately one-third of Earth's gravity'. The often-quoted 'three-eighths'/38% was NOT found on a page opened in this task, so it was not used.
- Mars sol: Mars Facts gives 24.6 hours and JPL says 39 minutes longer than an Earth day. The exact '24 h 39 min 35 s' figure appeared only in search snippets from non-NASA sites, so it was not used.
- No NASA page opened here described sleep or circadian mitigations specific to Mars time (e.g., blackout shades); those appeared only in non-NASA articles. The isolation hazard page's mention of light therapy research is generic, not Mars-specific.
- Lunar radiation: NASA sources disagree. The LSAH newsletter projects about 0.5 mSv/day (about ISS level). A NASA presentation seen only in search snippets said about 1.5x ISS. Only the newsletter figure is used, labeled as a projection.
- Radiation units differ: the Curiosity RAD figure (210 micrograys/day) is absorbed dose, while the mSv figures are effective dose. Don't compare them directly in the UI.
- ISS 'return within hours' was not found stated as a number on a NASA page opened here; the commercial crew page only says systems engage in minutes and covers emergency evacuation.
- The ISS exercise note (about 2 h/day) comes from NASA's Astronaut Exercise page. An older NTRS report mentions 2.5 h blocks but was not opened, so it was not used.
- Ultrasound appears on the Astronaut Exercise page only as a research use (Sprint study muscle scans), not as routine equipment.
- Distance hazard 'body' is left TODO: the NASA page names no specific health effects. Environment hazard 'selfCare' is left TODO: the page lists no crew actions.
- Cabin temperature/humidity: no numeric limits were sourced, only the requirement to record, display and alert on them.


## Alerts, Ask Orbit, validation, radiation budget, self-report gaps, tour (Arnav, 2026-11-14)

- Career radiation budget (`src/lib/radiationBudget.ts`): limit from NASA-STD-3001 Vol 1 [V1 4030], under 600 mSv per career. Daily rates: ISS about 0.5 mSv/day and lunar surface about 0.5 (NASA LSAH newsletter), beyond low Earth orbit about 1 mSv/day or more (same), Mars surface up to 0.9 mSv/day, the [V1 4033] design ceiling for planetary-surface habitats (an upper bound, not a measurement). Earlier-mission doses for crews 1 and 2 (150 and 80 mSv) are simulated. The yellow/red bands at 50% and 85% of the budget are our planning choice.
- Self-report gaps (`src/lib/selfReportGap.ts`): raised only when the self-rating is at or better than the person's usual AND a measured sign is yellow or red in the worrying direction.
- Alert loop (`src/lib/alerts.ts`): red readings and any pattern open an alert; the header banner re-announces every 5 minutes until acknowledged; closing needs a note; a newer reading reopens it. Crew 3's real bed-rest flags (blood pressure, body mass) open alerts on first load, which is accurate.
- Validation (`src/lib/validation.ts`): replays the real bed-rest participant day by day with only the readings available that day. Judged indicator-days need a baseline (5+ earlier readings). It measures false alarms in the 12 baseline days and catching the real body-mass loss during tilt. One participant, ground analog, six indicators; a sanity check, not clinical validation. Regenerate with `WRITE_VALIDATION=1 npx vitest run src/lib/validation.test.ts`.
- Ask Orbit (`src/lib/assistant.ts`): BM25 retrieval over the app's sourced passages, a synonym list from plain words to content words (ours), and a red-flag list (ours) that routes to the crew medical officer and Escalate. It never generates medical text and needs no network. A language-model mode was deliberately not added: it would need a server and key, break the no-network design, and could invent medical claims.
- Guided tour and scenarios (`src/proto/Tour.tsx`, `src/proto/scenarios.ts`): scenarios write ordinary records marked "simulated"; "Reset demo data" removes them.


## Today console, readiness, living body, ground link, weekly report, boot check, offline, dark theme (Arnav, 2026-11-14)

- Readiness (`src/lib/readiness.ts`) is a label with reasons, not a score: Not today on anything at Act (region, pattern or open red alert), Check first on any Watch, pattern or self-report gap, Ready otherwise, and Not enough data when every region is gray. The thresholds are ours; the screen says it is a prompt, not a medical clearance.
- Once set up, the app opens on Today; the landing page stays one click away (the logo). The header link "Console" was renamed "Body" so eight links fit on one row; Today is the console now.
- Living body figure: the heart beats at the latest measured heart rate (clamped 30 to 200 bpm for the animation only) and regions with an open alert glow. Respects reduced motion through the global rule.
- Ground link: transmissions are stored per crew member with send, arrival (one-way delay) and earliest-reply (round trip) times; "What Earth knows" is the newest packet whose arrival time has passed.
- Weekly report: every number comes from the same functions as the screens; print styles hide the app chrome.
- Offline: vite-plugin-pwa (already a dependency) precaches 21 files, about 19.5 MB, including the 3.8 MB face model and 14.7 MB vision WASM. Proven by serving the production build, letting the service worker install, stopping the server, and reloading: the app loaded and the model and WASM were served from cache. The Claude desktop browser pane cannot register service workers, so that test used Chrome. App icons (`public/icon-*.png`, `favicon.svg`) are drawn by a small script, replacing Vite's default logo. This overlaps Evode's E6 (deploy and offline); the deploy itself is still open.
- Dark theme pass: an automated contrast check over Today, Body, Schedule, Log, Crew, Escalate, Report, Rewards and Metrics found white text on bright status colors (readiness badge, pattern and alert chips, alert banner, Ask Orbit's urgent card) and the Crew cards' banner chips; all now use the theme's paper color or a solid backing.


## Clean-up: one home per feature (Arnav, 2026-11-15)

- Removed repeats: the Body page's streak/coins/level stats, "Today's check-ins", "Crew weekly goal" and duplicate action buttons; the Log page's "Today's quests"; the Crew page's "Crew weekly goal"; Today's separate mirror-check, alerts, hazards, radiation, food and ground-link cards (now one "needs a look" list that links to where each is handled) and its streak/coins (always in the top bar); the Schedule page's next-up card (Today has it); "Crew progress" in More (it was Rewards again); the alert banner on the Crew page (the full list is right there).
- One goal list (`todayTasks` in `src/proto/data.ts`): required goals are the mirror check, exercise, water and a meal; the alertness check and reporting a symptom are bonuses. Points come from `lib/scoring.ts`; "done" means the capped credit was really recorded today. Today, the dock and Rewards' earn table read it.
- One feedback: every earning action (readings, water, meals, alertness, mirror check, crate, milestones, pass tiers, discoveries) fires the same `chm:coins` event; the top-bar coin pop and the new goals toast respond. Rewards no longer shows its own coin toasts on top.
- Wording: the mirror check is "about a minute" everywhere (it was "thirty seconds" in some places and "about a minute" in others).
- The bottom dock is unchanged in layout (as asked earlier); its goal count now matches Today because both read the same list.
- Dock (2026-11-15): kept as asked, with the crew switcher and check-in pill. The four page links are gone (the top bar has them); in their place, the next block on the schedule ("Now · Free time", opens Schedule). The pill now shows the real next goal with its own coins (it said "+10 coins" whatever the goal) and opens that goal's page.

- Dock, report, footer, more gear (2026-11-15): Ask Orbit opens from the dock (no floating button). The weekly report has a page icon next to the mission button, with a gold dot once a week is complete (seven days since last read, or the first full week); Today shows a "your week is complete" prompt at the same time; it is no longer in More or the footer as a separate page link. The footer was rebuilt (brand, three link groups named as in the top bar, team, status rail). The locker has 21 new items, five of them Season 1 pass-only (never sold); the pass has 20 tiers (10 new, ending in the pass-only gear); eight new badges, each from data the app already keeps (14 and 30-day streaks, water goal on three days, three meals in a day, three alertness checks, a block added to the schedule, a ground packet sent, a first banner discovery).
