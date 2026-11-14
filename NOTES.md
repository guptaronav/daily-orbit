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

## Sources

## Limitations

## Status
