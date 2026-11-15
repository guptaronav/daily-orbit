# Daily Orbit data coverage: what we measure, where it comes from, what is missing

The source of truth is `src/lib/dataCoverage.ts`. A test (`dataCoverage.test.ts`) fails the build if any indicator has no collection channel. The same table is shown in the app on the **Sources** screen, so this page does not repeat it row by row.

## Where each indicator comes from

| Channel | Indicators |
|---|---|
| Mirror check, camera | heart rate, blink rate, eyelid closure |
| Mirror check, vision tests | Amsler distortion, near acuity |
| Mirror check, questions | sleep quality, sleep hours, mood, stress, symptom report, digestive comfort, appetite |
| Manual entry (Log screen) | sleep hours, blood pressure, temperature, body mass, blood sugar, exercise minutes, bowel movements, water intake, meals eaten |
| Reaction test (Log screen) | reaction time (the 3-minute PVT-B is kept as its own history) |
| Body checks (Log screen) | pain (pain map), heart-rate rise on standing (stand-up test), workload (NASA-TLX) and mood screen (PHQ-2, GAD-2) in the weekly check, grip strength |
| Radiation replay | radiation dose (a labeled simulation) |
| NASA bed-rest data (Crew 3 only) | heart rate, blood pressure, body mass, temperature, bowel movements, exercise (stretch) minutes, symptom reports |

The NASA basis for each indicator (Standard Measures category, HRP risk title) is in `dataCoverage.ts`. Where the mapping is ours rather than NASA's, the text says "our mapping". Temperature has no NASA page behind it; it is in the challenge brief.

## NASA data we use

| What | How we use it |
|---|---|
| NASA Life Sciences Data Archive, bed-rest Case Report Forms, Campaign 3 (doi:10.83263/wjw1-ta27) | Crew 3's history: one de-identified participant, 30 days (end of baseline, start of head-down tilt). Ground analog, not in-flight data. Built by `scripts/import-bedrest.ts` into `src/data/bedrest.json` |
| NASA DONKI solar energetic particle events | 494 events (2010 to 2026) fetched at build time; six are replayable. Built by `scripts/fetch-donki.ts` into `src/data/donki-sep.json` |
| LRO CRaTER dose rates and GOES proton flux, via NASA CCMC iSWA | Measured dose rate (lunar orbit) behind the replay, and proton flux for context. The dose on the simulated vehicle is a labeled simulation: one rate for every environment, 1 mGy counted as 1 mSv, no shielding model |
| NASA HRP risks and Spaceflight Standard Measures | Every indicator carries its HRP risk title and Standard Measures category |
| 83 pages in `src/content/sources.json` (59 NASA, 23 NIH, MedlinePlus, PubMed and Canadian Space Agency, 1 University of Washington) | Indicator explanations, equipment, fluid goal, crew-day schedule, nutrition tips |

All data is fetched at build time. The app makes no network calls at runtime.

## Standard Measures categories we do not cover

Cognition tests (we run one short reaction-time test only), carotid intima-media thickness (ultrasound), cellular profile (blood and saliva), biochemical markers beyond one blood sugar entry (blood and urine), microbiome samples (we collect only a self-reported digestive comfort score and a bowel movement count), personality questionnaire, strength test. We cover actigraphy only as exercise minutes, not as a wrist sensor. The Sources screen lists these too.

## Data we opened but did not use

NASA OSDR gut microbiome datasets (OSD-630, OSD-191), Mars rover and space station dose data, DONKI event intensity, bed-rest sleep and mood data for other participants, and clinical thresholds. The reasons are on the Sources screen ("What we could not use").

## Honest limits

- Digestive comfort and appetite are self-reports. They are early flags, not a microbiome measurement, and the app says so.
- Crews 1 and 2 are simulated and labeled "Simulated data". Crew 3's other indicators are simulated too, hence the label "NASA bed-rest analog data, de-identified (partly simulated)".
- The guest profile starts with no history and builds its own baseline instead of being compared to made-up numbers.
- No indicator has a clinical threshold. Status comes from each person's own baseline.
