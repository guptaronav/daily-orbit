# Where things live

A map of the code, so each thing has one home and is easy to find. If you add something, put it
next to its siblings below, and reuse the shared pieces instead of copying them.

## The rules

- **One body drawing.** The silhouette is in `src/proto/bodyOutline.ts`. The Body page figure
  (`BodyFigureView.tsx` with `logic/BodyFigure.logic.ts`) and the pain map (`BodyFigureMap.tsx`)
  both draw it. Do not draw another body.
- **One goal list.** Today's goals come from `todayTasks()` in `src/proto/data.ts`; Today, the dock
  and Rewards all read it.
- **One feedback event.** Anything that pays coins calls `announce()` (or the save helpers that
  call it); the goal toast and the header coin pop listen.
- **Shared React helpers** are in `src/proto/shared.ts`: `useStoreTick()` (re-render on data
  changes), `useCrewId()`, `timeAgo()`, `painColor()`. Use them instead of copying the code.
- **Medical text is never written in a component.** It comes from `src/content/indicators.json`,
  and every field is listed against a source in `src/content/sources.json`.
- **Rules and maths are in `src/lib/`**, pure and tested. Screens only call them.
- **Escalation is built in, not a destination.** "What should I do?" is `escalationAdvice()` in
  `data.ts`, shown by `EscalationAdvice.tsx` inside Ask Orbit. Any "who to tell" button calls
  `openEscalation({ title, detail, status })`; it can raise an alert (`raiseAlert()`) or send the
  summary to Earth (`queuePacket()`) right there. The full ladder page is under More.
- **The launch screen** (`BootScreen.tsx`) plays the "Our Apollo-gies presents Daily Orbit" title
  card, then the systems check; its styles are the `.intro` rules in `proto.css`.

## Screens (the top bar)

| Tab or link | Screen file | What it holds |
|---|---|---|
| Today | `proto/TodayPage.tsx` | Mirror-check call to action, stats, readiness, live body, your day, goals, your week, needs a look, body-check shortcuts, ground link |
| Check in | `screens/mirror/` | The camera mirror check |
| Log | `proto/ManualView.tsx` | Food and water (`FoodWater.tsx`), alertness test (`ReactionTest.tsx`), body checks (`BodyChecks.tsx`), manual forms |
| Body | `proto/BodyMapView.tsx` | Body figure, patterns (`PatternsPanel.tsx`), five hazards (`HazardsPanel.tsx`), region details |
| Crew | `proto/MedicalView.tsx` | Alerts (`Alerts.tsx`, `AlertCare.tsx`), the medical officer and backup, crew cards |
| Rewards | `proto/RewardsView.tsx` | Mission pass, this week, sets and levels (`RewardsExtras.tsx`), locker, badges |
| Report icon | `proto/ReportPage.tsx` | The weekly report, print and CSV (button: `ReportButton.tsx`) |
| More: Schedule | `proto/SchedulePage.tsx` | Crew day and reminder setting |
| More: Escalation ladder | `proto/EscalationView.tsx` | The full ladder, ground packet, what Earth receives (`ShareChoices.tsx`), ground link (`GroundLink.tsx`) |
| More: Radiation | `screens/Radiation.tsx` | Solar event replay (Evode) |
| More: Metrics | `proto/MetricsView.tsx` | Real-data validation (`ValidationCard.tsx`), model card (`ModelCard.tsx`), models |
| More: Sources | `screens/Sources.tsx` | Every dataset and page used (Evode) |

Around every screen: `TopBarView.tsx` (header), `CrewDockView.tsx` (bottom dock), `AskOrbit.tsx`,
`SiteFooterView.tsx`, `Tour.tsx`, `BootScreen.tsx`, `GoalToast.tsx`, `Moments.tsx`, `Reminder.tsx`.

## Data

| What | Where |
|---|---|
| The data the screens read (readings, alerts, coins, locker, schedule, body checks, sharing) | `src/proto/data.ts`, in sections with a `/* ---- ... ---- */` header |
| Measurements and events in the browser database | `src/db/` |
| The list of indicators and the shape of a measurement | `src/contract/types.ts` (shared by the whole team) |
| Statuses, baselines, slides, patterns, alerts, scoring, packets | `src/lib/` |
| Text, sources, hazards, regions, environments, validation numbers | `src/content/` |
| Demo scenarios (fever, solar storm...) | `src/proto/scenarios.ts` |

## Adding a new indicator

1. Add it to `INDICATORS` in `src/contract/types.ts`.
2. Give it a unit in `src/config/thresholds.ts`, a region in `src/lib/regions.ts` and a channel in
   `src/lib/dataCoverage.ts`.
3. Write its card in `src/content/indicators.json`, and list the source for each field in
   `src/content/sources.json`.
4. Say how to judge it: numbers use the person's baseline automatically; anything else needs a
   rule in `src/lib/status.ts` (with a test).
5. If it can be shared with Earth, put it in a group in `SHARE_GROUPS` (`src/proto/data.ts`).

The tests in `src/lib/content.test.ts` and `src/lib/dataCoverage.test.ts` fail if a step is missed.
