# Daily Orbit

**Thirty seconds a day keeps the crew flying.**

Daily Orbit is a health monitoring app for astronauts on long missions. A one-minute "mirror check" uses the laptop camera to read pulse and blinking, then runs two quick vision tests and asks how you feel. Every reading is compared with **your own baseline**, never a population average. When it cannot get a clean reading, it says so instead of guessing. The body map shows what changed and what to do about it, and an escalation ladder tells you when to involve a crewmate, the crew medical officer or the flight surgeon.

It runs entirely in the browser, with no network calls at runtime, and camera frames never leave the device.

> **Prototype. Not a medical device.** Colors are statistical comparisons with a person's own history, not clinical thresholds.

Built for the **2026 NASA Space Apps Challenge**, [*Create Health Monitoring Software for Astronauts on Space Missions*](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

---

## Challenge requirements, mapped to the app

Every requirement and suggestion in the challenge brief, where Daily Orbit answers it, and how to see it. The fastest way through all of it is the **60-second guided tour**: the yellow button on the landing page, or open the app with `?tour=1`.

| The brief asks for | Where in Daily Orbit | How to see it |
|---|---|---|
| Gather health indicators by keyboard, mouse or camera | **23 indicators**: camera (heart rate, blink rate, eyelid closure), on-screen vision tests (Amsler grid, near acuity), a one-minute reaction-time test, sliders (sleep, mood, stress, gut), manual entry (blood pressure, temperature, blood sugar, body mass, exercise), food and water | Mirror check; Log |
| Indicators named in the brief: blood pressure, heart rate, blood sugar, body temperature, sleep hours, mood | All six, plus 17 more | Log; Mirror check |
| Help astronauts evaluate their own health | Each reading is compared with that person's own baseline and a fixed reference from their first two weeks; steady slides are caught; related readings combine into patterns; ratings that disagree with measurements are pointed out | Console (body map) |
| Guidance on treatments and health improvements | Every indicator answers the brief's five questions plus a recommended action, from NASA sources; each pattern has a care plan (do now, prevent, re-check, when to escalate) | Console: indicator FAQ, Patterns, Care plan |
| Which measurements can be performed in space? Why is an exam needed? How do hazards affect them? When does a result need the crew or flight surgeons? What prevents a critical condition? | Answered for all 23 indicators, from the 71 NASA and NIH pages listed in [`src/content/sources.json`](src/content/sources.json) | Console: each indicator's FAQ; Ask Orbit |
| NASA HRP resources and the five hazards | Each indicator names its HRP risk; a five-hazards panel colors each hazard by the readings it affects, with the career radiation budget and cabin air | Console: The five hazards |
| A visual tool; a clickable human figure showing function and health status | Body map with an X-ray tour; each region says what it does in the body and why spaceflight matters for it | Console |
| Animations and interactivity | Animated body tour, mission banners with discoveries, drifting crew, live schedule | Console; Rewards |
| Different environments (spacecraft, station, rover, base on another planet or moon) | ISS, lunar surface, Mars transit and a Mars surface base, each with its comm delay and NASA notes on gravity, radiation, distance and day length | Top bar: mission menu |
| Prompt measurements as part of the mission routine | Role-based mission schedule with self-ticking health blocks and "due now" prompts | Schedule |
| Gamification | Coins for effort, never for values; streaks, levels, mission pass, locker, mission banners with NASA-fact discoveries | Rewards |
| Dynamic charts over time | Trend charts per indicator, 7-day water chart, cabin CO2 chart | Console; Log |
| Color coding at a glance | Green, yellow, red, gray, always with a status word | Everywhere |
| Simple instructions and explanations | Step-by-step checks, plain-language FAQ, Ask Orbit for questions | Ask Orbit (button on every page) |
| When a result warrants attention from the crew or flight surgeons | Escalation ladder (self-care, crewmate, crew medical officer, flight surgeon) with a ground packet; alerts stay open until the medical officer acknowledges them and only close with a note | Escalate; Crew |

## Proof, not just claims

- **Tested on real NASA data.** The flagging rules were replayed day by day on a real NASA head-down-tilt bed-rest participant (12 baseline days, then 18 days of tilt). Both the old and current rules first flag the participant's real weight loss on tilt day 3. The current rule keeps it at Act on **12 of 18** tilt days, against 3 for the old rule, with the same false-alarm count in the baseline (6 of 42 indicator-days, 2 at Act). One participant on a ground analog: a sanity check, not a clinical validation. The numbers are in [`src/content/validation.json`](src/content/validation.json), and a test fails if they drift from the code. See the Metrics page.
- **Sourced, or labeled.** Every health statement cites a NASA (or NIH) page. Anything simulated (crews 1 and 2, cabin CO2, earlier-mission radiation dose) says so on screen, and every assumption is logged in [NOTES.md](NOTES.md).
- **No language model writes medical text.** Ask Orbit retrieves sourced passages and shows their links; warning signs (chest pain, trouble breathing, fainting, sudden vision loss and others) go straight to escalation.

## What's in the app

| Screen | What it does |
|---|---|
| **Landing** | What the app is, a tour of the main features, the FAQ, and setup |
| **Mirror check** | About a minute of camera for pulse (remote photoplethysmography) and blinking, then an Amsler grid per eye, a near-vision test, and a symptom and gut check-in. It refuses a reading when light, framing or motion is bad and offers a retake |
| **Body map (Console)** | Six body regions colored by their worst indicator. A zoomable X-ray tour, trend charts, and each indicator's five questions and recommended action |
| **Five hazards** (on the body map) | NASA's five hazards of spaceflight, each colored by the readings its sourced text links to, with what it means on the current mission. The closed-environment tile shows simulated cabin CO₂ against NASA's limit |
| **Patterns and care plans** (on the body map) | Related readings moving the wrong way together (fatigue, infection, vision change and more), each with a care plan: do now, prevent, re-check tomorrow (one tap adds it to the schedule), and when to move up the escalation ladder |
| **Log** | Manual entry for blood pressure, temperature, blood sugar, sleep, exercise and body mass, a one-minute **alertness (reaction-time) check**, plus **Food and water**: a drink pouch that fills toward a goal set from NASA's fluid requirement, meal tiles, a 7-day chart and NASA nutrition tips |
| **Schedule** (in the header) | The shared crew day (morning and evening conferences with the ground, two hours of exercise, an 8.5-hour sleep period), duties only the crew member's role carries (commander, flight engineer, mission specialist), and blocks the astronaut adds. Health blocks tick themselves when the real thing is done |
| **Ask Orbit** (button on every page) | A chat window for questions about symptoms and readings. It answers from the app's NASA-sourced content with links, shows the person's own related readings and patterns, and routes warning signs straight to escalation. Works offline; it does not diagnose |
| **Escalate** | Four rungs: self-care, crewmate, crew medical officer, flight surgeon. It builds a compact change summary for the ground (downloadable JSON) and simulates the comm delay |
| **Crew (Medical view)** | Everyone at once, people needing attention first, and the alert loop: a red reading or a pattern opens an alert that is announced on every page until the crew medical officer acknowledges it, and only clears with a note |
| **Rewards** | Streaks, levels, a mission pass, a daily supply drop, badges, and a locker of cosmetic gear including illustrated mission banners (Earthrise, Pale blue dot, Jezero dusk, Deep transit) with hidden NASA-fact discoveries |
| **Metrics** | Two numbers we cannot measure yet, modeled openly with editable inputs: crew time saved, and reporting completeness under effort-based scoring |
| **Radiation** | Replays a real historical solar particle event from NASA DONKI with measured dose rates, on a simulated vehicle |
| **Sources** | The NASA data and pages we use, and what we could not cover (in progress) |

**Guided tour:** the yellow "Take the 60-second tour" button on the landing page (or `?tour=1`) walks through ten stops and fires live scenarios along the way.

**Demo controls:** press **Shift+D** anywhere (or use the link on the landing page) to inject a scripted story into the selected crew member's data, then reset. Stories include a run of worse sleep, a fever with symptoms, a cabin CO2 build-up, and "says fine, measures tired" (a self-report gap).

## How a reading becomes a color

- **Baseline:** the mean and spread of that person's earlier quality-passed readings, needing at least 5. The latest reading is left out of its own baseline.
- **Green** within 1 SD, **yellow** 1 to 2 SD, **red** beyond 2 SD. This is a statistical flag, not a diagnosis.
- **Gray** means not enough good data. A reading that failed its quality check is **never** colored.
- **Fixed reference:** each indicator also keeps a frozen reference from its first two weeks, the way NASA compares in-flight results with a pre-flight reference, so a slow decline cannot drag its own baseline down. The worse of the two comparisons wins.
- **Steady slides:** a consistent trend over the last week turns a still-normal reading into Watch.
- **Patterns:** related readings moving the wrong way together (for example less sleep and worse sleep quality, or a raised temperature with symptoms) raise a pattern flag tied to its NASA risk and the escalation rung to go to.
- A region takes the worst status among its indicators that have good data.
- Food and water count only finished days, so a half-finished morning is never flagged as "low".

## Gamification, and why it can't be gamed

- **Earned coins** come only from doing healthy things: a check-in, logging exercise or a reading, reporting a symptom early, retaking a bad reading. They drive XP, levels and the crew goal.
- **A bad day pays the same as a good one.** Coins never depend on health values, so there is no reason to hide a bad reading.
- Each kind of credit counts **once per day**. Hand-ticking a schedule block pays nothing; only the linked action does.
- **Bonus coins** (mission-pass tiers, the setup welcome, finishing a banner's discoveries) are one-off, can only buy cosmetic gear, and never add XP.

The reasoning, with its NASA basis, is in [docs/GAMIFICATION.md](docs/GAMIFICATION.md).

## NASA data and sources

| Source | Used for |
|---|---|
| [NASA Human Research Program risks](https://www.nasa.gov/hrp/risks) | The named HRP risk on every indicator |
| [Spaceflight Standard Measures](https://www.nasa.gov/reference/standard-measures/) | Tagging each indicator with the NASA measurement category it relates to |
| NASA Life Sciences Data Archive **bed-rest case report forms** (doi:10.83263/wjw1-ta27) | Crew 3's real, de-identified history: pulse, blood pressure, weight, temperature, bowel movements, stretching and symptoms from a head-down-tilt bed-rest analog |
| [NASA DONKI](https://ccmc.gsfc.nasa.gov/DONKI-API/) solar energetic particle events | The radiation replay (494 events, 2010 to 2026) |
| LRO CRaTER dose rates and GOES proton flux via NASA CCMC iSWA | Measured dose rates and context for the replay |
| NASA OCHMO technical briefs, NASA nutrition requirements (JSC-67378), ISS and HRP pages | The indicator explanations, fluid goal, crew-day schedule and nutrition tips (47 pages in [`src/content/sources.json`](src/content/sources.json)) |

All NASA data is fetched at build time into `src/data/*.json`. The app makes **no network calls at runtime**. Crews 1 and 2 use simulated data, and every screen labels it that way. Coverage per indicator, and the Standard Measures categories we do not cover, are in [docs/DATA_COVERAGE.md](docs/DATA_COVERAGE.md).

## Privacy and offline

- Camera frames are processed in the browser and discarded. Nothing is recorded or uploaded.
- The face model and its WASM runtime are bundled (`public/models`, `public/wasm`), so the camera check works with no internet.
- Data lives in the browser's IndexedDB, on the device.
- Installable offline mode (a PWA) is planned as part of deployment (task E6); `vite-plugin-pwa` is installed but not configured yet.

## Getting started

Requires **Node 24 or newer**.

```bash
npm install
```

```bash
npm run dev
```

Open the printed localhost URL. Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs the unit tests (Vitest) |
| `npm run build` | Typechecks (`tsc -b`) and builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm run lint` | Lints with oxlint |
| `node scripts/fetch-donki.ts` | Refreshes `src/data/donki-sep.json` from NASA DONKI and CCMC (optional `NASA_API_KEY`) |
| `node scripts/import-bedrest.ts` | Rebuilds `src/data/bedrest.json` from the raw bed-rest files in `data-raw/` |

Development-only URL shortcuts: `?screen=<name>` (for example `bodymap`, `manual`, `schedule`), `?crew=guest` or `crew-1` to `crew-3`, and `?screen=mirror&step=vision` to test the mirror check without a webcam.

## Tech stack

React 19, TypeScript, Vite 8, Tailwind CSS 4, Dexie (IndexedDB), MediaPipe Face Landmarker, Recharts, Vitest.

## Project structure

```
src/
  proto/        The UI: each page's markup and logic, plus the data layer that reads the real database
  screens/      Mirror check, radiation replay, sources
  lib/          Pure, tested logic: baselines, status, scoring, streaks, daily plan, schedule,
                ground packet, radiation, rPPG signal processing (lib/signal), vision tests
  camera/       Webcam capture and face regions
  content/      Indicator text (indicators.json), environments, sources.json
  contract/     Shared types (indicators, measurements, events)
  data/         NASA data bundled at build time (bed rest, DONKI)
  db/           IndexedDB schema and repository
scripts/        Build-time NASA data fetch and import
docs/           Team tasks, data coverage, gamification rationale
NOTES.md        Every assumption and limitation, as we made it
```

## Honest limitations

- **Webcam heart rate is a prototype.** The signal code is tested on synthetic data. On one person's laptop, its best guesses landed within 3 bpm of trusted apps. It has not been clinically validated.
- **Near-vision and Amsler tests are uncalibrated self-tests**, not eye exams.
- Crews 1 and 2 are **simulated**. Crew 3 mixes real bed-rest data (a ground analog, not flight data) with clearly labeled simulated indicators.
- No clinical thresholds: colors compare a person with their own past only.
- The schedule's clock times are an example layout; the order and durations follow NASA's description of an ISS day.
- The sample recording for people without a webcam has not been recorded yet.

The full list is in [NOTES.md](NOTES.md).

## Team

- **Ronav Gupta** (lead): webcam mirror check, heart rate and blink signal code, gamification scoring, demo control panel, database layer
- **Arnav Jain**: UI and visual design, manual entry, escalation, medical view, metrics, rewards and mission banners, food and water, mission schedule
- **Evode Manirahari**: NASA data and research, the radiation replay, the Sources screen, deployment

Who builds what: [docs/TEAM_TASKS.md](docs/TEAM_TASKS.md).
