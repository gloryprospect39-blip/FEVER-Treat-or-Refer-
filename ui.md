# FeverGate — UX Design Doc

**Designer:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-30

---

## 1. The design bet

We are betting the entire product on one screen, one age-band fork, and one transition. The triage form and the decision card are the same surface; the magic lives in two places: (1) progressive disclosure — selecting a pediatric age band keeps the form lean (fever + danger signs + two comorbidity toggles), while selecting an adult band reveals the full organ-system comorbidity block inline; and (2) the *snap* from routine tapping to a calm-but-urgent red REFER card the instant a danger sign is positive. We spend design effort on tap-target size, sunlight legibility, the age-band → pathway fork, and the timing/feel of that snap — and keep everything else nearly invisible.

## 2. The defining interaction

> The worker selects **Child (under 15)**, then **5–15 years** — the pediatric pathway. Fever and nine danger-sign tiles are visible; the high-risk conditions block shows only sickle cell and severe malnutrition. They tap the lightning-bolt tile for convulsions, then "Assess patient." The form does not fade or spin; the screen immediately replaces itself with a full-width red card that reads **REFER** in large type, and below it one line: "Convulsions — refer immediately." No animation, no celebration, no sound. Next patient: they select **Adult (15+)**, then **18–64 years** — the adult pathway. The underlying-disease section appears below the danger signs. They tap **Chronic lung disease** under **Lungs**, leave danger signs off, and assess. The card shows the engine's decision with a named reason if referral is needed. The calm is the point: the worker's eyes land on the reason and the single primary button in under a second.

## 3. Screen inventory

- **Triage form** — village/catchment (required) + optional revisit lookup, two-step age selector (Child/Adult then band), fever, optional vitals (BP, SpO₂, RR), danger signs, pathway-specific comorbidities, and session clinic context (malaria endemicity, stock); one button to assess.
- **Result card** — the full-screen REFER / TREAT / TREAT_AND_MONITOR decision with guideline treatment plan, teleconsultation action, and a reset.

Two screens, and they are really two states of one surface. There is intentionally no third screen.

## 4. Screen-by-screen specs

### Triage form

**Purpose:** Capture the minimum facts needed for a safe treat-or-refer decision on the correct clinical pathway, fast, with one thumb.

**Layout (top to bottom):**
1. Title ("FeverGate") + one-line caption ("Point-of-care treat / refer — screening only").
2. **Clinic context expander** — malaria endemicity (high / low); stock toggles for ACT, amoxicillin, paracetamol. Set once per session, collapsed by default.
3. **Village / catchment** (required) — section header + caption ("Required on every encounter for epidemiologic reporting"). Village filter for revisit list; "Returning patient?" selectbox (new patient or pick from recent); for new patients, catchment selectbox (known villages or "— Type new village —" → text input). Patient name text input (optional).
4. **Two-step age selector** — first `Child (under 15)` / `Adult (15+)`, then age band within that group (3 options each). Defaults: 2 months–5 years / 18–64 years. Selecting a band sets the pathway:
   - **Pediatric pathway (<15):** Under 2 months · 2 months – 5 years · 5–15 years
   - **Adult pathway (15+):** 15–17 years · 18–64 years · 65+ years
5. Fever toggle (default on) + fever-duration number input, side by side — shown on both pathways.
6. **Vitals (optional, collapsible)** — systolic BP, SpO₂ (%), respiratory rate (breaths/min). Shown on both pathways when expanded; skipped when unavailable (leave at 0).
7. "Danger signs" section header.
8. Danger-sign grid — large icon+label tiles in two columns, each an independent on/off toggle (9 tiles, identical on both pathways).
9. **Underlying diseases** — pathway-specific:
   - **Pediatric pathway (<15):** compact block titled "High-risk conditions" with two toggles only — **Sickle cell disease**, **Severe malnutrition** (visually distinct from adult organ-system layout).
   - **Adult pathway (15+):** full section with sub-headers by system: **Heart**, **Lungs**, **Kidneys**, **Immune**, **Blood**, **Nutrition**, **Other** — nine conditions total in a two-column toggle grid per system.
10. Primary button: "Assess patient", full width.

**Key interactions:**
- Empty catchment on assess → inline error: "Village / catchment is required for every encounter." Form stays visible.
- Pick returning patient → catchment and name auto-filled from registry; revisit caption shows village and visit count.
- New patient: pick known village or type new catchment; name optional.
- Tap a danger-sign tile → solid "on" state (both pathways).
- Select Child vs Adult → age band options update; comorbidity block swaps between pediatric and adult layouts.
- Select a pediatric age band → reduced comorbidity block (sickle cell, severe malnutrition) appears; adult organ-system block hides.
- Select an adult age band → full underlying-disease section expands inline below danger signs; pediatric comorbidity block hides.
- Tap "Assess patient" → validate catchment, build context (pathway-filtered comorbidities), run engine, build treatment plan, store catchment in session, switch to result card.

**States:**
- **Default:** Catchment empty (new patient), all tiles off, pathway = Child, age = under-5, fever on, clinic context collapsed.
- **Catchment missing:** Assess blocked with inline error; no engine run.
- **Pediatric pathway selected:** Form shows fever + danger signs + two comorbidity toggles — visually shorter, faster to scan.
- **Adult pathway selected:** Full comorbidity section expands inline below danger signs.
- **Loading:** None — engine is local and synchronous.
- **Error:** Plain inline message ("Couldn't assess — check inputs and retry").
- **Edge / "too much":** Many danger signs and comorbidities selected at once is expected for very sick patients.

### Result card

**Purpose:** Deliver one unambiguous decision and one next action, with the clinical reason named — same card treatment regardless of pathway.

**Layout (top to bottom):**
0. **Catchment caption** — when no registered patient: `Catchment: {village}`. When registered: `Name · Village (visit #N)`.
1. Full-width color card: red (REFER), amber (TREAT & MONITOR), or green (TREAT).
2. Decision word in large bold type.
3. One-line reason (referrals: named trigger + urgency; monitor: re-check window; treat: clinical indication).
4. **Treatment plan block** — guideline-appropriate next step in plain language:
   - REFER: transport / stabilization note if needed; no home treatment.
   - TREAT: drug name, dose band by age, duration (e.g. presumptive ACT in endemic zone when stock allows).
   - TREAT & MONITOR: same-day treatment + re-check date.
5. Primary action (one per card):
   - REFER → **"Call teleconsultation now"**
   - TREAT → **"Start treatment"** (acknowledges plan on screen)
   - TREAT & MONITOR → **"Schedule teleconsultation"**
6. Secondary: "← New patient" — resets form, saves encounter to local fever registry.

**Key interactions:**
- Tap "Call teleconsultation now" → dial-out link to teleconsultation desk (stub in demo); encounter logged.
- Tap "Start treatment" → acknowledgment toast; encounter logged.
- Tap "Schedule teleconsultation" → schedule note for re-check window (stub in demo); encounter logged.
- Tap "← New patient" → clears all state including catchment, comorbidity toggles, and revisit selection; returns to default pediatric band; prior encounter retained in local registry with catchment field.

**States:**
- **REFER (red):** Danger sign, neonate fever, or elevated screen — named reason, urgency, immediate teleconsultation CTA.
- **TREAT & MONITOR (amber):** Low-risk screen with re-check window, treatment plan, scheduled teleconsultation CTA.
- **TREAT (green):** Guideline treatment plan (e.g. presumptive ACT when endemic + in stock).
- **Error:** Falls back to form with inline message.

## 5. The user journey

> A worker opens FeverGate to a clean form: they enter **East Ridge** as catchment (or pick a returning patient whose village is already known), then Child pathway, age band on under-5, fever on — pediatric pathway, no adult comorbidity block visible. A mother's child has convulsions. The worker taps the lightning-bolt tile, taps "Assess patient," and the screen snaps to **REFER**, "Convulsions — refer immediately." They tap **Call teleconsultation now**, get the desk number, and arrange transport.
>
> Next patient: a 58-year-old with fever and known lung disease. The worker selects **Adult (15+)**, then **18–64 years** — the adult pathway. The underlying-disease section appears below the danger signs. They tap **Chronic lung disease** under **Lungs**, leave danger signs off, and tap "Assess patient." The engine weighs age and comorbidity; the card shows the appropriate decision with a named reason if referral is needed.
>
> Third patient: a 12-year-old with fever, no danger signs. The worker stays on Child pathway, selects **5–15 years**, assesses and gets **TREAT & MONITOR** with a three-day re-check note and **Schedule teleconsultation**.
>
> By the fourth patient the worker isn't reading the interface anymore — they're reading the patient, picking the age band first, and tapping.

## 6. Component & visual notes

- **Typography:** Large, high-weight, high-contrast. System fonts — legibility over personality.
- **Color:** Red (#c0392b) = refer, amber (#d68910) = treat-and-monitor, green (#1e8449) = treat. Color never the only signal.
- **Motion:** Almost none. Form-to-card is an immediate replace. Comorbidity section appears/disappears inline without page transition.
- **The signature visual:** Two-step age fork that reveals or hides the comorbidity block; danger-sign tiles in solid "on" state; immediate REFER snap on any positive sign.
- **Microcopy voice:** Plain, calm, clinical-but-human. System headers ("Heart", "Lungs") not ICD codes. Pathway is never labeled "pediatric/adult" to the worker — Child/Adult and age bands carry the meaning.

## 7. Accessibility & inclusion

- **Low vision / screen reader:** Tiles and comorbidity toggles carry text labels, not icon-only meaning. Age band radio groups announce all options.
- **Motor difficulty:** Large tap targets; no precise gestures; no swipe-to-reveal for comorbidities.
- **Low connectivity:** Core flow needs no network.
- **Doesn't read English:** v1 English; all labels centralized for future translation.

## 8. What we are NOT designing

- **No separate "pathway picker" screen** — Child/Adult + age band is the only fork; workers never choose "pediatric mode" explicitly
- **No central registry / sync UI** — local log only; no upload screen in v1
- **No history / encounter list screen** in v1 (registry is write-only background capture)
- **No settings screen** beyond session clinic context (endemicity, stock)
- **No onboarding flow**
- **No two-way in-app clinician chat**
- **No AI-explainer panel** in v1 (treatment plan text comes from the rule engine)

## 9. Open design questions

- [ ] Collapsed-by-default vitals section vs. always-visible numeric fields?
- [ ] Distinct visual treatment for neonate-fever referral vs danger-sign referral on the result card?
- [ ] Should switching from adult to pediatric band clear comorbidity toggles immediately, or only on assess?
- [ ] Teleconsultation CTA: `tel:` link, in-app dial pad, or ticket number to read aloud?

## 10. Handoff to engineering

> Catchment is validated via `require_catchment()` before assess and at `log_encounter()`; stored in `st.session_state["catchment"]` and passed on every card action. Progressive disclosure of comorbidity blocks must key off `is_pediatric_pathway()` / `is_adult_pathway()` — pediatric shows sickle cell + severe malnutrition only; adult shows full organ-system grid. Comorbidity toggles map 1:1 to `Comorbidity` enum values via pathway-filtered option lists. Vitals map to `VitalSigns` on `PatientContext`. Result card renders `treatment_plan` from engine output plus teleconsultation CTA by decision type. Local registry write is fire-and-forget after card actions via `log_encounter(..., catchment=...)`.
