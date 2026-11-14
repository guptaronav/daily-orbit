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

## Sources

## Limitations

## Status
