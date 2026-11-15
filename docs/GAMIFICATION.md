# Daily Orbit gamification: questions and answers

The short version: **your own data decides what you are asked to do, and you earn credit for doing it. No number you measure ever earns or loses points.**

## 1. How does the game support health, using the data we collect?

It is a loop. The "Today's plan" panel on the Crew progress screen is built from your own readings:

| If your data shows... | The plan adds... | Credit for |
|---|---|---|
| (always) | **Take your mirror check** | completing it, even on a bad day |
| (always) | **Exercise** (shows your own usual minutes) | logging it |
| Sleep hours or quality off *your* usual | **Protect tonight's sleep** (quotes your numbers: "5.7 h, your usual is about 7 h") | confirming you did it |
| Appetite, digestive comfort or body mass off your usual | **Look after nutrition and digestion** | confirming you did it |
| Any body region flagged **Act** | **Tell someone** (first in the list) | confirming you did it |
| A reading from the last day failed quality | **Retake the reading we could not trust** | retaking it |
| Symptoms you report in a check-in | (reported in the check-in itself) | reporting, the highest single reward |

"Off your usual" means more than 1 standard deviation from your own baseline. It is a statistical comparison with yourself, not a clinical threshold. The baseline needs at least 5 earlier readings; until then nothing is flagged and the plan is just the two daily habits.

## 2. Which good practices are rewarded, and what is the NASA basis?

| Practice | NASA basis (read on nasa.gov/hrp/risks) |
|---|---|
| Regular check-ins and reporting symptoms early | Behavioral Changes and Psychiatric Disorders; the whole premise of crew self-monitoring far from Earth |
| Exercise | Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness ("counteract losses in bone density, muscle strength...") and Spaceflight-Induced Bone Changes |
| Protecting sleep | Risk of Inadequate Sleep and Irregular Schedules ("chronic sleep loss, constant work demands, and irregularities in their internal biological clocks") |
| Nutrition and digestion | Risk of Inadequate Food and Nutrition; Risk of Host-Microorganism Interactions ("skin and gut microbiomes can change in space") |
| Telling someone early | The escalation ladder (self-care, crewmate, crew medical officer, flight surgeon) |

## 3. Why do points never depend on health values?

- **Crews have a reason to under-report.** Our project brief states astronauts have historically under-reported symptoms for fear of losing flight status (we did not independently verify this). If a good number earned points, hiding a bad one would pay.
- **Numbers are outcomes, not behavior.** You can control whether you slept in a protected way, not entirely how well you slept.
- **Typed numbers can be faked.** Rewarding values would reward lying.

A test proves it: across 100 randomized "good day" and "bad day" check-ins, the bad day never earns fewer points. Another test proves worse data only ever *adds* chances to earn credit, never removes them.

## 4. Can it be gamed?

Mostly closed, honestly not entirely.

- **Farming is capped.** Each kind of credit counts **once per person per day**, and each care step once per day. In a test, 50 check-ins in a day are worth the same as one, and 52 spam events worth 645 points uncapped are worth 35. The most one person can earn in a day is **70 points**. Extra events are still logged, they just are not scored.
- **Fake symptoms** earn at most one report per day.
- **Self-attested steps** ("I did this") cannot be verified. The cap limits the damage to +10 per step, and faking a bad reading to unlock a step also drags your own baseline and can raise an escalation prompt, so it is a poor trade.
- Not covered: a person who fakes everything every day for the maximum. We treat the crew as honest adults; the cap and the shared goal keep the stakes low.

## 5. Is there competition?

No ranking between people anywhere. There is one **shared weekly crew goal** and ship systems that come online as the crew's total grows. A forgiving streak allows one missed day in any 7.

## 6. What does the person see?

Today's plan, the credit they just earned (and what was "already counted today"), a streak, their recent credit, the crew goal bar, and ship systems.

## Honest limits

- **Guidance text is a safe fallback for now:** "tell a crewmate or your crew medical officer and pick one small change". The sourced guidance per indicator (`recommendedAction` in `src/content/indicators.json`) is still `[CONTENT TODO]`. The plan uses it automatically the moment it is filled in.
- **Exercise target** is your own usual minutes, not a prescription.
- **Hydration, medication and food intake are not tracked**, so they are not rewarded.
- Point values and the weekly goal are invented pacing numbers, not science.
- The Manual entry screen shows "+10" for exercise even when that day's exercise credit was already counted.
