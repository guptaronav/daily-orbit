# Team tasks: who builds what, in parallel

Deadline: **Sunday Nov 15, midday**, deployed and demo-ready. Today is Saturday. Everything below can be worked on **at the same time** with no waiting on anyone else.

- **Ronav** (lead): webcam mirror check, heart rate and blink signal code, gamification scoring, demo control panel, database layer.
- **Arnav**: UI and visuals, plus the manual-entry, escalation, medical-view and metrics screens. Tasks `A1` to `A5`.
- **Evode**: NASA data, research and content, the radiation replay, the Sources screen, and deployment. Tasks `E1` to `E6`.

## Get started (5 minutes)

Accept your GitHub invitation first (check your email, or https://github.com/guptaronav/nasa-space-apps-health-monitor/invitations).

```bash
git clone git@github.com:guptaronav/nasa-space-apps-health-monitor.git
cd nasa-space-apps-health-monitor
git checkout feat/scaffold-and-foundation
git checkout -b <yourname>/<task>        # e.g. arnav/manual-entry, evode/bedrest-import
npm install
npm run dev                              # opens http://localhost:5173
npm test                                 # must be green
npx tsc -b                               # must print nothing
```

Node 24 is required for the data scripts (`node scripts/foo.ts` runs TypeScript directly).

## How we avoid stepping on each other

1. **One owner per file.** Each task below lists the files it owns. Only edit files outside your list if it is a tiny fix, and tell the owner.
2. **Your screen already has a stub.** `Manual`, `Escalation`, `Medical`, `Metrics`, `Radiation` and `Sources` exist as placeholder files in `src/screens/` and are already routed. Replace the body of your file, keep the exported name, and you never need to touch `App.tsx`.
3. **Small branches, small PRs.** Open a pull request into `feat/scaffold-and-foundation` for each finished task and tag Ronav. Merge often. Pull before you start each task.
4. **Green before you push:** `npm test` passes and `npx tsc -b` prints nothing.
5. **Commit messages:** `type: description` (types: feat, fix, refactor, docs, test, chore).
6. **Tests first for logic.** Anything that computes something goes in `src/lib/` as a pure function with a `*.test.ts` next to it. Screens only render and wire.
7. **No new dependencies** without asking Ronav. Everything you need is installed.
8. **Never invent medical or clinical content or numbers.** If a fact is not from a NASA source you have opened, leave it as `[CONTENT TODO]`. Thresholds stay `null` until sourced.
9. **Log every assumption in `NOTES.md`** as you make it (it feeds our limitations slide). Append lines; don't rewrite others'.

## Hard rules from the challenge brief (apply to every screen)

- Footer on every screen already exists ("Prototype. Not a medical device." plus the crew data label). Don't remove it.
- One typeface (the system font stack in `src/index.css`), consistent sizes and colors. No emoji, confetti, or decorative badges. Our users are test pilots and scientists.
- A reading that failed quality is **never** colored. Gray means "not enough good data".
- Camera frames never leave the browser. No network calls at runtime: NASA data is fetched at build time into `src/data/*.json` and bundled.
- Colors are semantic only: green within baseline, yellow watch, red act, gray no good data. Never rely on color alone: show the status word too (see `StatusDot`).
- Keyboard accessible, visible focus, respects `prefers-reduced-motion`.

## What already exists (use it, don't rebuild it)

| You need | Use |
|---|---|
| Current crew member, environment, comm delay, navigation | `useApp()` from `src/state/AppContext.tsx` (`crewId`, `crew`, `environment`, `delaySec`, `go('bodymap')`, `refresh()`, `dataVersion`) |
| Read or write data | `listMeasurements(crewId, indicator?)`, `listEvents(crewId)`, `addMeasurement(m)`, `addEvent(e)` in `src/db/repo.ts` |
| Types | `Measurement`, `GameEvent`, `Quality`, `Status`, `Indicator` in `src/contract/types.ts` |
| Status of every indicator and body region | `readAll(measurements)`, `readIndicator`, `regionStatus` in `src/lib/bodyStatus.ts`; `REGIONS` in `src/lib/regions.ts` |
| Indicator labels, text, units | `getContent(indicator)` in `src/lib/content.ts` (data in `src/content/indicators.json`) |
| Number formatting | `formatValue(measurement)` in `src/lib/format.ts` |
| UI pieces | `BodyFigure`, `IndicatorCard`, `TrendChart`, `StatusDot`, button classes in `src/components/ui.ts` |
| Comm delay formatting | `ENVIRONMENTS`, `formatDelay` in `src/lib/environments.ts` |
| Design tokens | CSS variables and Tailwind theme in `src/index.css` (`ink`, `paper`, `panel`, `rule`, `muted`, `accent`, `ok`, `watch`, `act`, `nodata`) |

---

## Arnav: UI, visuals, and four screens

### A1. Visual design pass (start here, runs the whole time)  ~4 h, in slices

**Goal:** make it look intentional and specific to this product, not like a template. The current look is a deliberate "flight manual" direction (warm paper, ink, one NASA-blue accent, hairline rules). Push it further; don't replace it with something generic.

**Files you own:** `src/index.css`, `src/components/BodyFigure.tsx`, `src/components/TopBar.tsx`, `src/components/StatusDot.tsx`, `src/components/IndicatorCard.tsx`, `src/components/TrendChart.tsx`, `src/components/Footer.tsx`, `src/screens/Landing.tsx`, `src/screens/BodyMap.tsx`.

**Do, in this order (commit after each):**
1. **Body figure.** The limbs currently float apart from the torso. Redraw as one coherent front-view silhouette with the six regions (`head`, `eyes`, `heart`, `skeleton`, `body`, `gut`) still clickable, keyboard-focusable, and keeping the same `id`s and `aria-label`s. Keep region colors driven by the `statuses` prop.
2. **Hierarchy and rhythm.** Stronger scale contrast between headings, values, and labels. Vary spacing deliberately instead of uniform padding. Make the big numeric value on each indicator card the clear hero.
3. **States.** Designed hover, focus, active and disabled states for every button, region and card. Subtle motion only on `transform` and `opacity`, and none under `prefers-reduced-motion`.
4. **Charts.** Style `TrendChart`: baseline band, axis labels, tooltip, so a gradual decline is obvious at a glance. Keep straight lines (no smoothing).
5. **Landing page.** Make the first screen memorable. It must still explain the app in two sentences and offer the two buttons ("Take the mirror check", "Explore the crew dashboard").
6. **Responsive.** Verify at widths 320, 375, 768, 1024, 1440. No horizontal scroll. Touch targets at least 44 px.
7. **Accessibility.** Check keyboard-only use of the whole app, visible focus, and color contrast of all text and status colors. Known findings from an audit: (a) `--color-ok` text on the paper background is 4.46:1, just under the 4.5:1 needed for small text (used by "Online" and the position checks), so darken it a little; (b) the top bar's title button and its two dropdowns are 24 to 29 px tall, below the 44 px touch target. The rest of the screens had no overflow at 320, 375 or 768 px and no unnamed controls. Dev shortcuts: `?screen=progress` and `?screen=mirror&step=vision` (or `symptoms`) open a screen directly in `npm run dev`.

**Done when:** every screen looks consistent at all five widths and you can complete the body-map flow with only a keyboard.

### A2. Manual entry screen  ~2 h

**Files you own:** `src/screens/Manual.tsx`, new `src/lib/manualEntry.ts` and `src/lib/manualEntry.test.ts`.

**Spec:** six small forms: blood pressure (systolic and diastolic), temperature, blood sugar, sleep hours, exercise minutes, and **body mass (kg)**. Body mass and blood sugar feed the new "Gut and nutrition" region. See `docs/DATA_COVERAGE.md`.
- `manualEntry.ts` exports pure `validateEntry(kind, rawInput)` returning `{ ok: true, values } | { ok: false, error }`. Numeric sanity bounds are **input guards only** (reject obviously impossible typos like 9000 mmHg), not clinical thresholds. Write the test first, including: empty, non-numeric, negative, out of range, boundary values.
- On submit build `Measurement` objects: `source: 'manual'`, `quality: { score: 1, passed: true }`, `crewId` from `useApp()`, `timestamp: new Date().toISOString()`, `id: crypto.randomUUID()`, `unit` from `getThreshold(indicator).unit`. Save with `addMeasurement`, then call `refresh()` from `useApp()`.
- Exercise minutes also writes one `GameEvent` of kind `exerciseComplete` via `addEvent` (points come from effort, never values).
- Show a clear success message and the saved value. Show validation errors next to the field.

**Done when:** entering a blood sugar value turns the gut region from gray to colored on the body map for that crew member.

### A3. Escalation ladder and ground packet  ~3 h

**Files you own:** `src/screens/Escalation.tsx`, new `src/lib/packet.ts` and `src/lib/packet.test.ts`.

**Spec:**
- `buildPacket({ crewId, measurements, now })` returns `{ changed, bytes, json }`. `changed` lists each indicator whose **latest quality-passed** reading deviates from the person's baseline (use `readAll`), with `{ indicator, from (baseline mean), to (latest), deltaPct, sinceDays, quality }`. `bytes` is `new TextEncoder().encode(json).length`. Indicators with no good data or no deviation are left out. Test: empty when nothing changed; failed-quality readings never appear; `bytes` matches the encoded JSON.
- Screen shows four rungs, plain language: **Self-care**, **Crewmate check**, **Crew medical officer**, **Flight surgeon**, with a short "when" for each. Write generic wording only, no clinical thresholds.
- The Flight surgeon rung shows the packet, its size in bytes, the one-way delay for the selected environment (from `useApp()`), a **countdown** to when it would arrive (`formatDelay`), and a **Download JSON** button.

**Done when:** after the demo "gradual sleep decline" event (Ronav is adding it), the packet lists sleep with a delta, and on Mars the countdown starts at 20 min.

### A4. Medical officer view  ~1.5 h

**Files you own:** `src/screens/Medical.tsx`.

**Spec:** one grid showing every crew member's body map (`BodyFigure`, use a small `className`) with name, data label, and worst status word. Load with `listMeasurements` per crew member, compute with `readAll` and `regionStatus` (same as `BodyMap.tsx`). Click a figure to switch to that crew member (`setCrewId` then `go('bodymap')`). Show a loading state until data arrives, never "not enough data" while loading.

**Done when:** all four profiles are visible at once and clicking one opens its body map.

### A5. Metrics screen (do last, P1)  ~2 h

**Files you own:** `src/screens/Metrics.tsx`, new `src/lib/sim/metrics.ts` and `src/lib/sim/metrics.test.ts`.

**Spec:** two **simulated** numbers, clearly labeled "SIMULATION", with the assumptions visible and editable:
1. Crew minutes per day: our single mirror check vs separate manual logging of each indicator.
2. Reporting completeness over 30 days when rewarding **health values** vs rewarding **effort**, using a simple documented behavior model (some crew under-report when "bad" values are punished). Deterministic for a given seed (use `mulberry32` from `src/lib/sim/rng.ts`). Test: effort-based completeness is greater than or equal to value-based when under-report probability is above zero.
- Write the model's assumptions in plain text on the screen and in `NOTES.md`.

---

## Evode: NASA data, research, content, deployment

### E1. Download the NASA open-access bed-rest data  ~45 min, **start now**

> **Status: done** on branch `feat/bedrest-import` (inventory in `NOTES.md`, section "E1"). Raw data is already in `data-raw/`.

The NASA Life Sciences Portal renders with JavaScript, so a script can't fetch it. Do this by hand in a real browser.
1. Open https://nlsp.nasa.gov. Find the open-access head-down-tilt bed-rest datasets from UTMB (Campaign 1, Campaign 3, and the 70-day Campaign 11 on exercise and performance).
2. Download every file offered into a local folder `data-raw/nasa-bedrest/` (it is gitignored; do not commit raw data).
3. In `NOTES.md` under **Sources**, record exactly: dataset IDs, file names, the real column names and units, group labels (exercise vs control, if any), and the license or use terms shown. Don't guess variables, only list what is in the files.

**Done when:** `NOTES.md` has a complete, accurate inventory. If there is **no** usable data, tell Ronav immediately; it changes the demo plan.

### E2. Bed-rest import  ~3 h (needs E1)

> **Status: done** on branch `feat/bedrest-import`: `scripts/import-bedrest.ts`, `src/data/bedrest.json`, `src/lib/sim/bedrest.ts`, parser in `src/lib/bedrest/`. Crew 3 now runs on it. Remaining for E2: the exercise-versus-control comparison (not investigated) and importing sleep, glucose and cognition from the other studies.

**Files you own:** `scripts/import-bedrest.ts`, `src/data/bedrest.json`, new `src/lib/sim/bedrest.ts`.

**Spec:** write `scripts/import-bedrest.ts` (run with `node scripts/import-bedrest.ts`) that maps **only variables actually present** into our `Measurement` records (see `src/contract/types.ts`) with `source: 'nasa-bedrest'`, `sourceDatasetId` set to the real dataset ID, `standardMeasure` from the NASA Standard Measures category, and `quality: { score: 1, passed: true }`. Choose **one participant** with the most complete timeline, strip any identifiers, and remap their dates onto a 30-day "mission" ending today (document the remapping). If Campaign 11 has exercise and control groups, also output group means for the exercise comparison. Write `src/data/bedrest.json`.
- Add `src/lib/sim/bedrest.ts` exporting `loadBedrestCrew()` and a test that checks every record has `sourceDatasetId`, valid indicator names, and 30 days or fewer.
- **Hook-up:** once the JSON exists, tell Ronav. The one-line change in `src/lib/sim/seed.ts` that makes `crew-3` use it (with the label "NASA bed-rest analog data, de-identified") is made together.

**Done when:** the body map for Crew 3 shows data traceable to a real NASA dataset ID, labeled on screen.

### E3. Radiation replay from NASA DONKI  ~4 h

**Files you own:** `scripts/fetch-donki.ts`, `src/data/donki-sep.json`, `src/screens/Radiation.tsx`, new `src/lib/radiation.ts` and `src/lib/radiation.test.ts`.

**Spec:**
- `scripts/fetch-donki.ts`: fetch historical solar energetic particle events at **build time** (never at runtime). Try `https://api.nasa.gov/DONKI/SEP?startDate=...&endDate=...&api_key=$NASA_API_KEY` first and `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP...` as the second option (a report says DONKI moved there on Sep 30, 2026). Log which one worked. Read the key from the env var `NASA_API_KEY`; **never commit a key**. Write `src/data/donki-sep.json`. If both fail, fail loudly.
- `radiation.ts` (pure, test first): `buildLedger(replay, steps)` accumulates a **simulated** dose over time (never decreases) and `shelterPromptAt(replay)` returns the first step at event onset. State the dose formula and its assumptions plainly in `NOTES.md` and on screen. This is a labeled simulation, **not** real dosimetry.
- While replaying, **write `radiationDose` measurements** with `addMeasurement` (`source: 'simulated'`, unit `mSv`, the cumulative simulated dose) so the "Whole body" region on the body map reacts. Nothing else in the app produces this indicator.
- `Radiation.tsx`: pick a real historical event from the JSON, replay it with a timeline control. At onset show a shelter prompt, the dose ledger, and follow-up symptom prompts. Label it as a replay of a historical event on a simulated vehicle.

**Done when:** replaying an event triggers the shelter prompt and updates the dose ledger (acceptance criterion 5).

### E4. Fill in the content  ~3 h, in parallel with everything

**Files you own:** `src/content/indicators.json`, `src/content/environments.json`, new `src/content/sources.json`.

**Spec:** the exact HRP risk titles (`hrpRisk`) and a first-pass Standard Measures tag are already filled in from nasa.gov/hrp/risks and the Standard Measures pages (see `docs/DATA_COVERAGE.md`); check them, don't redo them. Now replace the remaining `[CONTENT TODO]` text with **cited** content, from NASA pages you have opened. Three indicators are new and need full text: `digestiveComfort`, `appetite`, `bodyMass` (gut and nutrition):
- For each indicator: the named NASA Human Research Program risk (https://www.nasa.gov/hrp/risks) in `hrpRisk`, and plain-language answers to the challenge's five questions (can it be measured in space, why check it, how spaceflight hazards affect it, when it needs crew or flight-surgeon attention, what prevents a critical condition) plus one `recommendedAction`. Write for people who **don't know how to assess their own health** (that is in the brief). Keep each answer short.
- Review the `standardMeasure` tag on each indicator against https://www.nasa.gov/reference/standard-measures (our current tags are a first guess, mostly `none`). Correct them.
- Fill the `equipment` lists in `environments.json` for ISS, lunar surface and Mars transit **only with facts you can cite**.
- Keep a source URL per entry in `sources.json` (`{ id, title, url, usedFor }`). Add anything uncertain to `NOTES.md` instead of guessing.
- Leave the literal text `[CONTENT TODO]` for anything you cannot source. Never invent.

**Done when:** every indicator card has real, cited text or an honest placeholder.

### E5. Sources screen  ~1 h (needs E4's `sources.json`, can stub first)

**Files you own:** `src/screens/Sources.tsx`.

**Spec:** also render the indicator coverage table from `COVERAGE` in `src/lib/dataCoverage.ts` and the list of **Standard Measures categories we do not cover** from `docs/DATA_COVERAGE.md`. A table of every NASA dataset and page we use, which screens or records each drives, and a **"couldn't use"** section (uncovered Standard Measures categories, OSDR if skipped, anything that didn't work). Read from `src/content/sources.json`. This screen is a judging criterion (Relevance), so make it accurate and easy to scan.

### E6. Deploy and offline  ~2 h

**Files you own:** `vite.config.ts` (PWA part only), `public/` assets, deployment settings.

**Spec:**
1. **Deploy a first version now** so we always have a live link. The repo is private, and GitHub Pages on a private repo needs a paid plan, so use **Vercel**: import the GitHub repo, framework Vite, build `npm run build`, output `dist`. Put the live URL at the top of `README.md`. Deploy from `feat/scaffold-and-foundation` until we merge to `main`.
2. **Later (after Ronav's webcam code lands):** add the PWA service worker with `vite-plugin-pwa` (already installed) precaching **everything**, including the MediaPipe model and WASM files, with `maximumFileSizeToCacheInBytes` high enough. Verify in Chrome DevTools: load once, go **Offline**, hard reload, and the whole app (including the mirror check with the bundled sample video) must still work. This is acceptance criterion 9.

### E7. Stretch: NASA OSDR gut data  only if everything above is done

First look at these two human gut datasets (found through a catalog search, **not yet opened**, so confirm they exist, are open access, and what files they offer): SpaceX Inspiration4 stool metagenome (`OSD-630`, samples before and after a 3-day flight) and the MARS500 gut microbiota study (`GLDS-191`, a 520-day ground confinement analog, **not** spaceflight and must be labeled that way). If either is usable, add a small reference panel to the Digestive comfort card. Otherwise search https://osdr.nasa.gov/bio/repo with filters Human, Spaceflight, Physiological. If a dataset has usable physiological measurements at pre-, in-, and post-flight timepoints, add a small reference panel to the relevant indicator card. If not usable in time, **skip it and list it under "couldn't use" on the Sources screen**. Don't fake it.

---

### A6. Scheduled prompts (P1, after A2 to A4)  ~2 h

**Files you own:** new `src/lib/schedule.ts` and `src/lib/schedule.test.ts`, a banner in `src/components/TopBar.tsx` or `src/screens/BodyMap.tsx`.

**Spec:** pure `dueItems(measurements, events, now)` returning what is overdue: the next mirror check, a body-mass reading (weekly), and a microbiome sample (placeholder interval, labeled as an assumption). NASA collects fecal samples for the microbiome and takes body mass regularly, so a reminder follows real practice. Show due items as a quiet in-app banner with a link to the right screen. Test first: nothing due right after a check-in, due after the interval, never due for an indicator with no data yet.

### A7. Optional: short cognition check (only if everything else is done)

The Standard Measures include computer-based cognition tests and we cover none. A 60-second reaction-time test would close that gap. It needs a new indicator, so talk to Ronav before starting.

## Ronav (for reference)

Mirror check webcam capture (Tasks 7 and 8), gamification scoring and progress screen, demo control panel, and wiring everything together. Files: `src/lib/signal/`, `src/camera/`, `src/screens/mirror/`, `src/lib/scoring.ts`, `src/lib/streak.ts`, `src/lib/session.ts`, `src/db/`, `src/state/`, `src/App.tsx`.

## Cut line

If we are behind by Saturday 6 pm, drop in this order: `A7`, `A6`, `A5` (Metrics), `A4` (Medical view), the exercise-group comparison in `E2`, `E7`. **Never drop:** quality gating, offline mode, the Sources screen, the labeled bed-rest crew member, the sample-video fallback.

## Acceptance checklist (what the judges will try)

1. Mirror check heart rate lands within a few bpm of a pulse oximeter in good light, and refuses to judge in poor light or with motion.
2. A judge with no webcam can run the check using the sample recording.
3. Amsler grid and acuity check complete and save. (Done.)
4. A gradual sleep decline turns the head yellow then red; escalation shows the 20-minute delay and a ground packet.
5. Replaying a NASA solar particle event triggers the shelter prompt and updates the dose ledger.
6. The gamification panel shows points for a check-in that reported a bad day.
7. The Sources screen lists every NASA dataset and page used.
8. At least one crew member's history comes from NASA open-access bed-rest data, labeled on screen.
9. With the network off after first load, the site still works.
