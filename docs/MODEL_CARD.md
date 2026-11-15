# Model card: Daily Orbit's flagging rules

The same content appears on the Metrics page (`src/proto/ModelCard.tsx`). Every number below comes from
`src/content/validation.json`, which a test regenerates from `src/lib/validation.ts` and checks.

## What it does

Daily Orbit compares each reading with **this person's own usual**, never a population average.

| Rule | Where | What it catches |
|---|---|---|
| Distance from the person's baseline: Watch beyond 1 SD, Act beyond 2 SD | `src/lib/status.ts` | A reading far from their recent usual |
| A frozen reference from the first 14 days | `src/lib/trend.ts` | A slow loss that would otherwise drag its own baseline down |
| A steady slide over the last seven readings (at least 4 days, a good straight-line fit, and a change of 2 SD or more) | `src/lib/trend.ts` | Small steps in one direction that each look normal |
| Related readings moving the wrong way together | `src/lib/patterns.ts` | Patterns tied to a NASA Human Research Program risk |
| A forecast for slides: days until the Act zone at the current rate | `slideForecast` in `src/proto/data.ts` | How long there is to act |

A baseline needs at least 5 readings that passed the quality check. Until then a reading stays gray rather than guessing.

## What it is not

It is not a diagnosis, not a clinical threshold and not a medical device. A flag is a prompt to look closer and, if needed, to climb the escalation ladder: self-care, a crewmate, the crew medical officer (or the backup when the medical officer is the patient), then the flight surgeon.

## How it was tested

The rules were replayed on one real participant from NASA's head-down-tilt bed-rest study, day by day, using only the readings available on each day:

- 12 baseline days, then 18 days of tilt
- 6 indicators: heart rate, systolic and diastolic blood pressure, body mass, temperature and bowel movements

| | Old rule (rolling baseline only) | Current rule |
|---|---|---|
| False alarms in baseline (any flag) | 6 of 42 indicator-days | 6 of 42 (14%) |
| …of which at Act | 2 | 2 |
| Weight loss flagged during tilt | 16 of 18 days | 16 of 18 days |
| Weight loss held at Act during tilt | 3 of 18 days | **12 of 18 days** |
| First tilt day flagged | day 3 | day 3 |

## Alertness

- **Quick test (1 minute):** shorter than any validated version, so it is only compared with the person's own past results.
- **PVT-B (3 minutes):** follows Basner, Mollicone and Dinges (2011). Targets appear every 1 to 4 seconds, and a lapse is a response of 355 ms or more. A response under 100 ms counts as a false start. Results are kept as their own history and never mixed with the quick test. A test with 3 or more lapses above the person's usual, while they rate their sleep or mood as fine, shows up as a self-report gap.

## Known limits

- The test covers one person, in a ground analog rather than flight, with six indicators. Everyone else in the demo is simulated.
- A person with a long, very stable history gets a narrow band, so small changes flag sooner.
- The thresholds are statistical, so a real clinical team would have to review them before any use.

## Rewards and honesty

Coins, streaks, levels and the mission pass pay for **doing** things: checking in, logging a reading, following an alert's care steps, reporting early, and the 3-minute alertness test. They never pay for a health value, so nobody gains by hiding a bad day. Privacy choices (what Earth receives) are deliberately not rewarded.
