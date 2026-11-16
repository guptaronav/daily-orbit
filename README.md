# Daily Orbit

**A minute a day keeps the crew flying.**

### ▶ [Open the live app](https://guptaronav.github.io/daily-orbit/)

Nothing to install. It runs in the browser, works offline after the first visit, and keeps all data on your device.

<!-- Screenshot goes here: ![Daily Orbit](docs/screenshot.png) -->

Daily Orbit is a one-minute daily health check for astronauts on long missions. Built for the **2026 NASA Space Apps Challenge**: [*Create Health Monitoring Software for Astronauts on Space Missions*](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

> **Prototype, not a medical device.** Colors compare a person with their own history, not with clinical thresholds.

## How it works

1. **Mirror check (about a minute).** The webcam reads pulse and blinking, two quick vision tests check each eye, and a few taps record sleep, mood and symptoms. If the light or framing is bad, it asks for a retake instead of guessing.
2. **Compared with your own normal.** Every reading is checked against that person's own baseline, never a population average: green, yellow (Watch), red (Act), or gray (not enough good data).
3. **Go, Go with limits, or No-go.** Today makes one mission call from your own readings, patterns and alerts, shows the checks behind it, and gives one next step. Related readings that drift together raise a pattern with a care plan.
4. **Whose change is it?** Before anyone escalates, each reading alert checks whether the change is yours, shared by the whole crew (air, food, schedule), or a faulty sensor, so a broken cuff never climbs the ladder.
5. **Who to tell.** Ask Orbit "What should I do?" and it walks a four-step ladder: self-care, crewmate, crew medical officer, flight surgeon. If the medical officer is the one who is sick, a backup takes over. You choose what gets sent to Earth, and on Mars it takes today's real light time to arrive.

## What's in it

| Page | What it does |
|---|---|
| **Today** | Today's Go / No-go call, your next step, today's goals and what needs attention |
| **Check in** | The one-minute mirror check |
| **Log** | Readings (blood pressure, temperature, blood sugar, sleep, exercise, body mass), food and water, the alertness test, and body checks (pain map, stand-up test, weekly workload and mood, grip strength) |
| **Body** | A clickable body map of six regions, patterns with care plans, NASA's five hazards (with a replay of a real solar storm), and a **mission forecast** of bone loss and career radiation to the end of the mission |
| **Crew** | Everyone at once, the alert loop for the crew medical officer, who to tell, and the ground link: Earth and Mars where they really are today, and the next solar-conjunction blackout |
| **Rewards** | Streaks, levels, mission pass and locker. Coins pay for showing up, never for a health value, so nobody has a reason to hide a bad day |
| **More** | Mission schedule, metrics, sources. The page icon in the header opens the weekly report for the flight surgeon |

**28 indicators**, including all six the brief names (blood pressure, heart rate, blood sugar, body temperature, sleep hours, mood). Missions: ISS, the lunar surface, a **lunar pressurized rover**, Mars transit and a Mars surface base. On Mars, the message delay is today's real light time, computed from JPL's planet positions (10.9 minutes on 16 Nov 2026), with the next blackout when the Sun sits between Earth and Mars.

**Tested on real NASA data.** We replayed one participant from a NASA bed-rest study day by day. The current rules hold their real weight loss at Act on **12 of 18** days (the old rules: 3), with no extra false alarms. One person on a ground analog: a sanity check, not clinical validation. See the Metrics page.

**Proof on every page.** Every section that rests on a source has a *Sources used here* strip above it, with the links and a jump to the Sources page, which is grouped the same way as the site (a test checks that every one of the 87 sources is used somewhere).

**Always know what's next.** Hover or tap the dock's goal button for today's list with a button for each, and from 6 pm Today opens with a wrap-up: what got done, what's still open, and how tomorrow starts. No webcam? *Use sample recording* runs the real analysis on a recorded check.

**Try it fast (judges):** press **J** or click *Open judge mode* on the landing page. One click runs a story and shows where it lands: a fever, a cabin CO2 build-up, "says fine, measures tired", a faulty blood-pressure cuff, a crew-wide bad night, a real solar storm, and the Mars link. Or take the guided tour from the landing page.

## NASA data in the app

| Dataset | Where and how it is used |
|---|---|
| [NASA bed-rest case report forms](https://doi.org/10.83263/wjw1-ta27) (Life Sciences Data Archive) | Crew 3's 30-day history on Body, and the real-data test on Metrics |
| [NASA DONKI solar particle events](https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP) | Body, Five hazards: the storms you can replay and when the shelter alert fires |
| [LRO CRaTER dose rates](https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi/info?id=CRaTER) (NASA iSWA) | The hour-by-hour dose in the solar storm replay |
| [GOES proton flux](https://iswa.gsfc.nasa.gov/IswaSystemWebApp/hapi/info?id=goesp_part_flux_P5M) (NASA iSWA) | Storm strength shown in the replay (context only, not used in the dose) |
| [JPL planet positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html) (Keplerian elements, 1800 to 2050) | Today's real Earth-Mars distance and light time, and the next solar-conjunction blackout (tested against the January 2025 closest approach and the November 2023 conjunction) |

All data is bundled when the app is built; the app makes no network calls while you use it. Crews 1 and 2 are simulated, and every screen says so.

## Sources

Every health explanation in the app cites one of these **87 sources: 63 NASA pages**, plus 24 from NIH, MedlinePlus, PubMed, the Canadian Space Agency and the University of Washington. Click a group to open it. The same list is in the app under More, Sources, and in [`src/content/sources.json`](src/content/sources.json).

<details>
<summary><b>NASA Human Research Program: risks and hazards</b> (25)</summary>

| Source | Where and how it is used |
|---|---|
| [NASA Human Research Program - Risks](https://www.nasa.gov/hrp/risks) | Every indicator: names its NASA risk |
| [NASA HRP - Five Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | Body, Five hazards: the hazard framing |
| [NASA HRP: Five Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards) | Body, Five hazards: background |
| [Gravity Fields hazard (NASA HRP)](https://www.nasa.gov/hrp/hazard-gravity-fields/) | Five hazards: bone loss, fluid shift |
| [Hostile/Closed Environments hazard (NASA HRP)](https://www.nasa.gov/hrp/hazard-hostile-closed-environments/) | Five hazards: microbes, immune changes |
| [Distance from Earth hazard (NASA HRP)](https://www.nasa.gov/hrp/hazard-distance-from-earth/) | Five hazards: resupply, comm delay |
| [Isolation and Confinement hazard (NASA HRP)](https://www.nasa.gov/hrp/hazard-isolation-and-confinement/) | Five hazards: sleep and workload context |
| [Space Radiation hazard (NASA HRP)](https://www.nasa.gov/hrp/hazard-space-radiation/) | Five hazards: radiation tile |
| [Risk of Cardiovascular Adaptations](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/) | Heart rate, blood pressure: why check, when to escalate |
| [Risk of Altered Immune System Responses](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/) | Temperature, symptoms: infection risk |
| [Risk of Host-Microorganism Interactions](https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/) | Temperature, gut: prevention |
| [Risk of Adverse Health Outcomes and Decrements in Performance due to Inflight Medical Conditions](https://www.nasa.gov/directorates/esdmd/hhp/risk-of-adverse-health-outcomes-and-decrements-in-performance-due-to-inflight-medical-conditions) | Symptom report: why check, when to escalate |
| [Risk of Altered Sensorimotor and Vestibular Function](https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/) | Symptom report: motion sickness |
| [Risk of Behavioral Changes and Psychiatric Disorders](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/) | Symptom report: low mood, isolation |
| [Risk of Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) | Sleep and symptoms: lighting, schedules |
| [Risk of Hypoxia](https://www.nasa.gov/reference/risk-of-hypoxia/) | Symptom report: warning signs to escalate |
| [Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) | Eyes: background on fluid shift and vision |
| [Risk of Radiation-Induced Cancers](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/) | Radiation dose: every answer |
| [Risk of Inadequate Food and Nutrition (NASA)](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) | Food and water, body mass, appetite |
| [Risk of Spaceflight-Induced Bone Changes (NASA)](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) | Forecast, exercise, skeleton: 1 to 1.5% bone loss a month |
| [Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness (NASA)](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/) | Exercise, grip strength: fitness loss |
| [Risk of Reduced Physical Performance Capabilities Due to Reduced Muscle Size, Strength, and Endurance (NASA)](https://www.nasa.gov/directorates/esdmd/hhp/muscle-risk/) | Grip strength, pain map: muscle loss |
| [Evidence Report: Risk of Cardiovascular Adaptations (NASA HRP, 2022)](https://humanresearchroadmap.nasa.gov/evidence/reports/Cardio%20Risk%20EB%202022%20FINAL_4-3-2023.pdf) | Stand-up test: dizziness after landing |
| [HRR: Concern of Intervertebral Disc Damage upon and immediately after re-exposure to Gravity](https://humanresearchroadmap.nasa.gov/risks/?i=78) | Pain map: back pain in space |
| [HRR: Risk of Adverse Health Outcomes Due to Medical Conditions that occur in Mission](https://humanresearchroadmap.nasa.gov/risks/risk.aspx?i=95) | Pain map: its NASA risk |

</details>

<details>
<summary><b>NASA standards and technical briefs</b> (14)</summary>

| Source | Where and how it is used |
|---|---|
| [NASA-STD-3001 Technical Brief: Sleep Accommodations (OCHMO)](https://www.nasa.gov/wp-content/uploads/2023/03/sleep-accomodations-technical-brief-ochmo.pdf) | Sleep hours and quality: every answer |
| [NASA-STD-3001 Technical Brief: Behavioral Health and Performance (OCHMO-TB-016 Rev B)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-016-behavioral-health.pdf) | Mood and stress: every answer |
| [NASA Medical Technical Brief: Spaceflight Associated Neuro-ocular Syndrome (SANS) (OCHMO-MTB-001, 02/21/2024)](https://www.nasa.gov/wp-content/uploads/2024/02/ochmo-mtb-001-sans.pdf) | Mirror check: Amsler grid and near-vision tests |
| [NASA-STD-3001 Technical Brief: Food and Nutrition (OCHMO-TB-013)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf) | Food and water: meals, under-eating |
| [NASA-STD-3001 Medical Technical Brief: Space Adaptation Sickness (OCHMO-MTB-004)](https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf) | Appetite, gut, blood sugar, water |
| [OCHMO-TB-004 Carbon Dioxide (CO2) Technical Brief, Rev D](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) | Five hazards: cabin CO2 chart and limit |
| [OCHMO-TB-035 Acoustics Technical Brief, Rev C](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-035-acoustics.pdf) | Five hazards: cabin noise |
| [Nutritional Requirements for Exploration Missions up to 365 days (JSC-67378 Rev 1)](https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf) | Food and water: the daily fluid goal |
| [6.0 Medical Operations (NASA-STD-3001 reference)](https://www.nasa.gov/reference/6-0-medical-operations/) | Schedule: 8.5 h sleep, private medical conferences |
| [5.0 Training (NASA-STD-3001 reference)](https://www.nasa.gov/reference/5-0-training/) | Crew: the crew medical officer role |
| [NASA Task Load Index (NASA-TLX), NASA Ames Human Systems Integration](https://humansystems.arc.nasa.gov/groups/TLX/) | Body checks: weekly workload (NASA-TLX) |
| [Fatigue Countermeasures Laboratory (NASA Ames)](https://www.nasa.gov/human-systems-integration-division/human-performance/fatigue-countermeasures-laboratory/) | Blink rate: fatigue tracking in space |
| [NASA Spaceflight Standard Measures](https://www.nasa.gov/reference/standard-measures/) | Every indicator: its NASA Standard Measures category |
| [NASA-STD-3001 Technical Brief: Radiation Protection (OCHMO-TB-020)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-020-radiation-protection.pdf) | Radiation: the 600 mSv career limit and forecast |

</details>

<details>
<summary><b>NASA station, mission and science pages</b> (24)</summary>

| Source | Where and how it is used |
|---|---|
| [Human Research on Station Helping Keep Long-Term Crews Healthy (NASA Space Station blog)](https://www.nasa.gov/blogs/spacestation/2025/07/17/human-research-on-station-helping-keep-long-term-crews-healthy/) | Blood pressure: crews measure their own |
| [Astronaut Exercise (NASA, 2024)](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/) | Exercise: two hours a day on ARED, T2, CEVIS |
| [Muscle and Exercise Studies to Maintain Crew Health in Space (ISS blog, 2025)](https://www.nasa.gov/blogs/spacestation/2025/07/16/muscle-and-exercise-studies-to-maintain-crew-health-in-space/) | Exercise, grip strength: plans adjusted from data |
| [Nutritional Biochemistry (NASA JSC)](https://www.nasa.gov/directorates/esdmd/hhp/nutritional-biochemistry/) | Food and water: weekly review, vitamin D |
| [Space Food Systems (NASA JSC)](https://www.nasa.gov/centers-and-facilities/johnson/space-food-systems/) | Food and water: personal food choices |
| [NASA Achieves Water Recovery Milestone on International Space Station](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Food and water: water recycling on the ISS |
| [NASA's Twins Study Results Published in Science Journal](https://www.nasa.gov/humans-in-space/nasas-twins-study-results-published-in-science-journal/) | Body mass, gut, meals: Twins Study findings |
| [Advanced Science in Full Gear Today as Cosmonauts Relax (ISS blog, 2020)](https://www.nasa.gov/blogs/spacestation/2020/11/23/advanced-science-in-full-gear-today-as-cosmonauts-relax/) | Body mass: how it is weighed in orbit |
| [NASA Facts: Living and Working in Space](https://www.nasa.gov/wp-content/uploads/2015/05/167746main_fs_livingandworkinginspace508c.pdf) | Schedule: the shape of a crew day |
| [A Day in Space (NASA Curious Universe podcast)](https://www.nasa.gov/podcasts/curious-universe/a-day-in-space/) | Schedule: ground calls through the day |
| [Expedition 74 (NASA)](https://www.nasa.gov/mission/expedition-74/) | Schedule: commander and flight engineer roles |
| [Space Radiation Won't Stop NASA's Human Exploration](https://www.nasa.gov/missions/station/space-radiation-wont-stop-nasas-human-exploration/) | Radiation: dosimeters and sheltering |
| [To Protect Artemis II Astronauts, NASA Experts Keep Eyes on Sun (NASA Science)](https://science.nasa.gov/missions/artemis/artemis-2/to-protect-artemis-ii-astronauts-nasa-experts-keep-eyes-on-sun/) | Radiation: storm warnings and shelter |
| [LSAH Newsletter 2023 Vol 28 Issue 2 (NASA Space Radiation Health Standard article)](https://www.nasa.gov/wp-content/uploads/2023/10/lsah-newsletter-2023-vol28-issue2.pdf) | Radiation: daily dose rate for each mission |
| [NASA Science: Moon Facts](https://science.nasa.gov/moon/facts/) | Mission menu: Moon gravity and distance |
| [NASA Science: Mars Facts](https://science.nasa.gov/mars/facts/) | Mission menu: Mars day and atmosphere |
| [NASA Science: Radiation Measurements on Mars (Curiosity RAD)](https://science.nasa.gov/resource/radiation-measurements-on-mars/) | Mission menu: Mars surface radiation |
| [JPL video: Living on Mars Time](https://www.jpl.nasa.gov/videos/living-on-mars-time/) | Mission menu: living on Mars time |
| [Space Communications: 7 Things You Need to Know](https://www.nasa.gov/centers-and-facilities/goddard/space-communications-7-things-you-need-to-know/) | Mission menu, ground link: message delay |
| [Approximate Positions of the Planets (JPL Solar System Dynamics, E. M. Standish)](https://ssd.jpl.nasa.gov/planets/approx_pos.html) | Mars missions: today's real distance and message delay |
| [Mars Missions to Pause Commanding in June, Due to Sun (NASA JPL, 2015)](https://www.jpl.nasa.gov/news/mars-missions-to-pause-commanding-in-june-due-to-sun/) | Ground link: the solar conjunction blackout |
| [NASA, Japan Advance Space Cooperation, Sign Agreement for Lunar Rover (NASA, 2024)](https://www.nasa.gov/news-release/nasa-japan-advance-space-cooperation-sign-agreement-for-lunar-rover/) | Rover mission: two crew, up to 30 days |
| [Habitability Considerations for a Notional Five-Day Small Pressurized Rover Excursion (NASA NTRS)](https://ntrs.nasa.gov/citations/20210021307) | Rover mission: cabin life, medical conferences, fatigue |
| [Commercial Crew Spacecraft Will Offer a Quick Escape from Station](https://www.nasa.gov/humans-in-space/commercial-crew-spacecraft-will-offer-a-quick-escape-from-station/) | Escalation: emergency return from the ISS |

</details>

<details>
<summary><b>NIH, MedlinePlus, PubMed, Canadian Space Agency and University of Washington</b> (24)</summary>

| Source | Where and how it is used |
|---|---|
| [CARDIOBREATH: Taking a deep dive into astronaut health (Canadian Space Agency)](https://asc-csa.gc.ca/eng/sciences/cardiobreath.asp) | Heart rate, blood pressure: what changes in space |
| [Bio-Monitor (Canadian Space Agency)](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp) | Heart rate, blood pressure: measuring in space |
| [Increased core body temperature in astronauts during long-duration space missions (Stahn et al., Sci Rep 2017, NIH PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5701078) | Temperature: core temperature rises in space |
| [PERCLOS-based technologies for detecting drowsiness: current evidence and future directions (Sleep Advances 2023; NIH PMC10108649)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10108649/) | Eyelid closure: drowsiness from the camera |
| [Experimental evaluation of eye-blink parameters as a drowsiness measure (Eur J Appl Physiol; PubMed 12736840)](https://pubmed.ncbi.nlm.nih.gov/12736840/) | Eyelid closure: supporting study |
| [Spontaneous eye blink rate: An index of dopaminergic component of sustained attention and fatigue (Int J Psychophysiol; PubMed 29133149)](https://pubmed.ncbi.nlm.nih.gov/29133149/) | Blink rate: blinking and fatigue |
| [MedlinePlus: Brain Diseases](https://medlineplus.gov/braindiseases.html) | Body tour: what the head does |
| [MedlinePlus: Healthy Sleep](https://medlineplus.gov/healthysleep.html) | Body tour: sleep and thinking |
| [NEI (NIH): How the Eyes Work](https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work) | Body tour: what the eyes do |
| [NHLBI (NIH): Heart](https://www.nhlbi.nih.gov/health/heart) | Body tour: what the heart does |
| [MedlinePlus: Bone Diseases](https://medlineplus.gov/bonediseases.html) | Body tour: what the skeleton does |
| [MedlinePlus: Muscle Disorders](https://medlineplus.gov/muscledisorders.html) | Body tour: muscles |
| [MedlinePlus: Immune System and Disorders](https://medlineplus.gov/immunesystemanddisorders.html) | Body tour: the immune system |
| [MedlinePlus Encyclopedia: Body temperature norms](https://medlineplus.gov/ency/article/001982.htm) | Body tour: normal body temperature |
| [MedlinePlus: Digestive Diseases](https://medlineplus.gov/digestivediseases.html) | Body tour: what the gut does |
| [NIDDK (NIH): Your Digestive System & How It Works](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works) | Body tour, gut: digestion and water |
| [Basner, Mollicone & Dinges 2011, Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation, Acta Astronautica (NIH PMC3197786)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786) | Alertness: how the reaction-time test works |
| [Jones et al. 2022, Sleep deficiency in spaceflight... six-month missions aboard the ISS, Sleep (NIH PMC8919197)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197) | Alertness: sleep loss slows reactions on the ISS |
| [Nasrini et al. 2020, Cognitive Performance During Confinement and Sleep Restriction in NASA's HERA, Front Physiol (NIH PMC7198903)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7198903) | Alertness: NASA Cognition test in analogs |
| [Spinal Health during Unloading and Reloading Associated with Spaceflight (PMC5778142)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5778142/) | Pain map: how common back pain is |
| [MedlinePlus Genetics: Orthostatic hypotension](https://medlineplus.gov/genetics/condition/orthostatic-hypotension/) | Stand-up test: when a drop needs care |
| [Kroenke, Spitzer, Williams. The Patient Health Questionnaire-2: validity of a two-item depression screener. Med Care 2003](https://pubmed.ncbi.nlm.nih.gov/14583691/) | Body checks: mood questions (PHQ-2) |
| [Kroenke et al. Anxiety disorders in primary care: prevalence, impairment, comorbidity, and detection. Ann Intern Med 2007](https://pubmed.ncbi.nlm.nih.gov/17339617/) | Body checks: anxiety questions (GAD-2) |
| [Generalized Anxiety Disorder 2-item (GAD-2), University of Washington](https://www.hiv.uw.edu/page/mental-health-screening/gad-2) | Body checks: GAD-2 scoring |

</details>

## Privacy and limits

- Camera frames are processed in the browser and thrown away. Nothing is recorded or uploaded.
- Webcam heart rate is a prototype and has not been clinically validated. The vision tests are self-checks, not eye exams.
- Every assumption and limitation is in [NOTES.md](NOTES.md).

## Run it yourself

You only need this to change the code. Requires Node 24 or newer.

```bash
npm install
npm run dev
```

`npm test` runs the tests. `npm run build:pages` builds the GitHub Pages version.

Built with React 19, TypeScript, Vite, Dexie (IndexedDB) and MediaPipe Face Landmarker. Much of the code was written with Claude Code, an AI coding assistant, from the team's direction. No NASA logos or branding are used.

## Team: Our Apollo-gies

| Name | Role |
|---|---|
| **[Ronav Gupta](https://github.com/guptaronav)** | Team lead: webcam mirror check, heart-rate and blink signal code, scoring, data layer |
| **[Arnav Jain](https://github.com/arnavjain415)** | Design and front end: every screen, body checks, escalation, rewards and mission banners |
| **[Evode Manirahari](https://github.com/Evode-Manirahari)** | NASA data and research: bed-rest import, radiation replay, Sources screen |
| **[Jingbo Xia](https://github.com/Lemonz-13223)** | Presentation and pitch, demo deck |
