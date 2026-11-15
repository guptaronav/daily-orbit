# Daily Orbit

**Thirty seconds a day keeps the crew flying.**

Daily Orbit is a health monitoring app for astronauts on long missions. A one-minute "mirror check" uses the laptop camera to read pulse and blinking, then runs two quick vision tests and asks how you feel. Every reading is compared with **your own baseline**, never a population average. When it cannot get a clean reading, it says so instead of guessing. The body map shows what changed and what to do about it, and an escalation ladder tells you when to involve a crewmate, the crew medical officer or the flight surgeon.

It runs entirely in the browser, with no network calls at runtime, and camera frames never leave the device.

> **Prototype. Not a medical device.** Colors are statistical comparisons with a person's own history, not clinical thresholds.

Built for the **2026 NASA Space Apps Challenge**, [*Create Health Monitoring Software for Astronauts on Space Missions*](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

---

## How it answers the challenge

| The brief asks for | Daily Orbit |
|---|---|
| Gather health indicators by keyboard, mouse or camera | **22 indicators**: camera (heart rate, blink rate, eyelid closure), on-screen vision tests (Amsler grid, near acuity), sliders (sleep, mood, stress, gut), manual entry (blood pressure, temperature, blood sugar, body mass, exercise), food and water logging |
| Help astronauts evaluate their own health | Every reading is compared with that person's own baseline: green, yellow, red, or gray when there is not enough good data |
| Guidance on treatments and improvements | Each indicator answers the brief's five questions plus a recommended action, written from NASA sources (47 pages, listed in [`src/content/sources.json`](src/content/sources.json)) |
| A clickable human figure | The **body map**: six regions (head, eyes, heart, skeleton, whole body, gut) with status, trends and an FAQ per indicator |
| Different environments (station, rover, planetary base) | ISS, lunar surface and Mars transit, each with its real communication delay (Mars: 3 to 22 minutes, adjustable). Mission banners show each environment |
| Prompt measurements as part of the routine | **Mission schedule**: a NASA-shaped crew day, duties only your role sees, your own blocks, and "due now" prompts |
| Gamification | Coins, streaks, levels, a mission pass, a cosmetic locker and hidden discoveries. Coins reward **what you did, never what your numbers were** |
| Dynamic charts | Per-indicator trend charts that break at untrusted readings, plus a 7-day water chart |
| Color coding | Semantic only, and never by color alone: every status also shows its word |
| Don't assume astronauts know how to assess their health | Plain-language explanations on every indicator, step-by-step instructions in each check, and an escalation ladder |

## What's in the app

| Screen | What it does |
|---|---|
| **Landing** | What the app is, a tour of the main features, the FAQ, and setup |
| **Mirror check** | About a minute of camera for pulse (remote photoplethysmography) and blinking, then an Amsler grid per eye, a near-vision test, and a symptom and gut check-in. It refuses a reading when light, framing or motion is bad and offers a retake |
| **Body map (Console)** | Six body regions colored by their worst indicator. A zoomable X-ray tour, trend charts, and each indicator's five questions and recommended action |
| **Log** | Manual entry for blood pressure, temperature, blood sugar, sleep, exercise and body mass, plus **Food and water**: a drink pouch that fills toward a goal set from NASA's fluid requirement, meal tiles, a 7-day chart and NASA nutrition tips |
| **Schedule** (in the header) | The shared crew day (morning and evening conferences with the ground, two hours of exercise, an 8.5-hour sleep period), duties only the crew member's role carries (commander, flight engineer, mission specialist), and blocks the astronaut adds. Health blocks tick themselves when the real thing is done |
| **Escalate** | Four rungs: self-care, crewmate, crew medical officer, flight surgeon. It builds a compact change summary for the ground (downloadable JSON) and simulates the comm delay |
| **Crew (Medical view)** | Everyone at once, people needing attention first. For the crew medical officer |
| **Rewards** | Streaks, levels, a mission pass, a daily supply drop, badges, and a locker of cosmetic gear including illustrated mission banners (Earthrise, Pale blue dot, Jezero dusk, Deep transit) with hidden NASA-fact discoveries |
| **Metrics** | Two numbers we cannot measure yet, modeled openly with editable inputs: crew time saved, and reporting completeness under effort-based scoring |
| **Radiation** | Replays a real historical solar particle event from NASA DONKI with measured dose rates, on a simulated vehicle |
| **Sources** | The NASA data and pages we use, and what we could not cover (in progress) |

**Demo controls:** press **Shift+D** anywhere (or use the link on the landing page) to inject a scripted story into the selected crew member's data, such as a run of worse sleep, then reset.

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
