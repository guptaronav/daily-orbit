# Data coverage: what we measure, where it comes from, what is still missing

The source of truth is `src/lib/dataCoverage.ts`, and a test (`dataCoverage.test.ts`) fails the build if any indicator has no collection channel or no body region. This page explains it in words.

**Live** = a screen collects it today. **Planned** = assigned in `docs/TEAM_TASKS.md`, not built yet.

## Indicator by indicator

| Indicator | Live today | Planned | NASA basis (verified wording) |
|---|---|---|---|
| Heart rate | Mirror check, camera | | Standard Measures: sensorimotor tests record heart rate. HRP: Cardiovascular Adaptations |
| Blink rate, eyelid closure | Mirror check, camera | | HRP: Inadequate Sleep and Irregular Schedules (fatigue proxy, our mapping) |
| Amsler distortion, near acuity | Mirror check, vision | | HRP: Spaceflight Associated Neuro-ocular Syndrome (SANS). Acuity is an uncalibrated self-test |
| Sleep quality | Mirror check, sliders | | Standard Measures: sleep quality questionnaire |
| **Sleep hours** | Mirror check, number box | Manual entry | Standard Measures: actigraphy and sleep questionnaire. HRP: Inadequate Sleep |
| Mood | Mirror check, sliders | | Standard Measures: pre-sleep questionnaire covers mood. HRP: Behavioral Changes and Psychiatric Disorders |
| Stress | Mirror check, sliders | | HRP: Behavioral Changes and Psychiatric Disorders |
| Symptom report | Mirror check | Radiation replay follow-ups | Early-reporting design goal |
| **Digestive comfort** (gut) | Mirror check | | HRP: Host-Microorganism Interactions ("Skin and gut microbiomes can change in space"). Standard Measures: microbiome from fecal samples (we do not collect samples) |
| **Appetite** (nutrition) | Mirror check | | HRP: Inadequate Food and Nutrition |
| **Bowel movements** (gut) | NASA bed-rest data (Crew 3) | Manual entry | NASA bed-rest Case Report Forms, daily log (doi:10.83263/wjw1-ta27). HRP: Host-Microorganism Interactions (our mapping) |
| **Body mass** | Manual entry, NASA bed-rest data (Crew 3) | | HRP: Inadequate Food and Nutrition. ISS crews measure body mass regularly (PubMed 25197887) |
| Blood sugar | | Manual entry | HRP: Inadequate Food and Nutrition (our mapping). Standard Measures: biochemical markers from blood |
| Blood pressure (sys, dia) | | Manual entry | Standard Measures: sensorimotor tests record blood pressure. HRP: Cardiovascular Adaptations (BP itself is not named on the risks page) |
| Body temperature | | Manual entry | Named in the challenge. We found no NASA page that mentions it |
| Exercise minutes | | Manual entry | Standard Measures: actigraphy (activity). HRP: Spaceflight-Induced Bone Changes; Reduced Cardiorespiratory and Musculoskeletal Fitness |
| Radiation dose | | Radiation replay | HRP: Radiation-Induced Cancers. NASA DONKI solar particle events. The dose is a labeled simulation |

Gut health was a real gap: the "gut" region used to hold only blood sugar, which is a metabolic marker, not gut health. It now holds digestive comfort, appetite, body mass and blood sugar.

## NASA data and practice we use or can use

| What | Where | How we use it | Status |
|---|---|---|---|
| Spaceflight Standard Measures (nine core measurements) | nasa.gov/reference/standard-measures and the article it links | Every indicator is tagged with its category; uncovered ones are listed on the Sources screen | Tags done (first pass), Sources screen: Evode |
| HRP risk names (17 risks) | nasa.gov/hrp/risks | Exact titles are on every indicator card (`hrpRisk` in `src/content/indicators.json`) | Done. Remaining text fields still need writing (Evode, E4) |
| NASA Life Sciences Portal bed-rest data | nlsp.nasa.gov | Real de-identified history for Crew 3 | E1 and E2 (Evode) |
| NASA DONKI solar particle events | api.nasa.gov/DONKI or ccmc.gsfc.nasa.gov/DONKI-API | Radiation replay and dose ledger | E3 (Evode) |
| NASA OSDR human gut datasets | osdr.nasa.gov | Gut microbiome reference panel: SpaceX Inspiration4 stool metagenome (OSD-630, pre- and post-flight) and the MARS500 520-day confinement analog (GLDS-191). Found through a catalog search, **not yet opened**: confirm access, files and terms first | Stretch (Evode, E7) |

## Standard Measures categories we do NOT cover (the Sources screen must say so)

Cognition tests (10 computer tests), carotid intima-media thickness (ultrasound), cellular profile (blood and saliva), biochemical markers beyond the single glucose entry (blood and urine), microbiome samples (we only collect a self-reported digestive comfort score), personality questionnaire, and the strength test. We cover actigraphy only as exercise minutes, not as a wrist sensor.

## Open gaps worth doing if time allows

1. **Scheduled sample and check-in prompts** (brief, P1): for example a reminder when a microbiome sample or a body-mass reading is due. NASA collects fecal samples for the microbiome and takes body mass regularly, so a prompt follows real practice.
2. **A short cognition check** (for example a one-minute reaction-time test) to cover the Standard Measures cognition category. Optional, and it would need a new indicator.
3. **Hydration and food intake**: the "Inadequate Food and Nutrition" risk is about diet, and we only have appetite and body mass.

## Honest limits

- Digestive comfort and appetite are self-reports. They are early flags for a gut or nutrition problem, **not** a microbiome measurement, and the app says so.
- Seeded crew values (including gut and body mass) are invented and labeled "Simulated data".
- The guest profile starts with no history and builds its own baseline (5 earlier readings) instead of being compared to made-up numbers.
