# FeverGate — UX Design Doc

**Designer:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-30

---

## 1. The design bet

We are betting the entire product on one screen, one age-band fork, and one transition. The triage form and the decision card are the same surface; the magic lives in two places: (1) progressive disclosure — selecting a pediatric age band keeps the form lean (fever + danger signs only), while selecting an adult band reveals the comorbidity block inline; and (2) the *snap* from routine tapping to a calm-but-urgent red REFER card the instant a danger sign is positive. We spend design effort on tap-target size, sunlight legibility, the age-band → pathway fork, and the timing/feel of that snap — and keep everything else nearly invisible.

## 2. The defining interaction

> The worker selects **5–15 years** — the pediatric pathway. Fever and nine danger-sign tiles are visible; no underlying-disease section appears. They tap the lightning-bolt tile for convulsions, then "Assess patient." The form does not fade or spin; the screen immediately replaces itself with a full-width red card that reads **REFER** in large type, and below it one line: "Convulsions — refer immediately." No animation, no celebration, no sound. Next patient: they select **18–64 years** — the adult pathway. The underlying-disease section appears below the danger signs. They tap **Chronic lung disease** under **Lungs**, leave danger signs off, and assess. The card shows the engine's decision with a named reason if referral is needed. The calm is the point: the worker's eyes land on the reason and the single primary button in under a second.

If you can't write this paragraph, you don't have a defining interaction yet.

## 3. Screen inventory

- **Triage form** — tap age band (routes to pediatric or adult pathway), fever, optional vitals (BP, SpO₂, RR), danger signs, pathway-specific comorbidities, and session clinic context (malaria endemicity, stock); one button to assess.
- **Result card** — the full-screen REFER / TREAT / TREAT_AND_MONITOR decision with guideline treatment plan, teleconsultation action, and a reset.

Two screens, and they are really two states of one surface. There is intentionally no third screen.

## 4. Screen-by-screen specs

### Triage form

**Purpose:** Capture the minimum facts needed for a safe treat-or-refer decision on the correct clinical pathway, fast, with one thumb.

**Layout (top to bottom):**
1. Title ("FeverGate") + one-line caption ("Point-of-care treat / refer — screening only").
2. Age band selector (6 options) — single choice, defaults to 2 months–5 years. Selecting a band sets the pathway:
   - **Pediatric pathway (<15):** Under 2 months · 2 months – 5 years · 5–15 years
   - **Adult pathway (15+):** 15–17 years · 18–64 years · 65+ years
3. Fever toggle (default on) + fever-duration number input, side by side — shown on both pathways.
4. **Vitals (optional, collapsible)** — systolic BP, SpO₂ (%), respiratory rate (breaths/min). Shown on both pathways when expanded; skipped when unavailable.
5. "Danger signs" section header.
6. Danger-sign grid — large icon+label tiles in two columns, each an independent on/off toggle (9 tiles, identical on both pathways).
7. **Underlying diseases** — pathway-specific:
   - **Pediatric pathway (<15):** compact block with two toggles only — **Sickle cell disease**, **Severe malnutrition** (visually distinct from adult organ-system layout).
   - **Adult pathway (15+):** full section with sub-headers by system: **Heart**, **Lungs**, **Kidneys**, **Immune**, **Blood**, **Nutrition**, **Other** — nine conditions total in a two-column toggle grid per system.
8. Primary button: "Assess patient", full width.

**Key interactions:**
- Tap a danger-sign tile → solid "on" state (both pathways).
- Select a pediatric age band → reduced comorbidity block (sickle cell, severe malnutrition) appears; adult organ-system block hides.
- Select an adult age band → full underlying-disease section expands inline below danger signs; pediatric comorbidity block hides.
- Tap "Assess patient" → build context (pathway-filtered comorbidities), run engine, switch to result card.

**States:**
- **Default:** All tiles off, age = under-5 (pediatric pathway), fever on, no comorbidity section visible.
- **Pediatric pathway selected:** Form shows fever + danger signs only — visually shorter, faster to scan.
- **Adult pathway selected:** Comorbidity section expands inline below danger signs.
- **Loading:** None — engine is local and synchronous.
- **Error:** Plain inline message ("Couldn't assess — check inputs and retry").
- **Edge / "too much":** Many danger signs and comorbidities selected at once is expected for very sick patients.

### Result card

**Purpose:** Deliver one unambiguous decision and one next action, with the clinical reason named — same card treatment regardless of pathway.

**Layout (top to bottom):**
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
- Tap "Call teleconsultation now" → dial-out or queue handoff to teleconsultation department (stub in demo).
- Tap "Start treatment" → acknowledgment; encounter logged locally.
- Tap "Schedule teleconsultation" → schedule call for re-check window (stub in demo).
- Tap "← New patient" → clears all state including comorbidity toggles and returns to default pediatric band; prior encounter retained in local registry.

**States:**
- **REFER (red):** Danger sign, neonate fever, or elevated screen — named reason, urgency, immediate teleconsultation CTA.
- **TREAT & MONITOR (amber):** Low-risk screen with re-check window, treatment plan, scheduled teleconsultation CTA.
- **TREAT (green):** Guideline treatment plan (e.g. presumptive ACT when endemic + in stock).
- **Error:** Falls back to form with inline message.

## 5. The user journey

> A worker opens FeverGate to a clean form: age band on under-5, fever on — pediatric pathway, no comorbidity block visible. A mother's child has convulsions. The worker taps the lightning-bolt tile, taps "Assess patient," and the screen snaps to **REFER**, "Convulsions — refer immediately."
>
> Next patient: a 58-year-old with fever and known lung disease. The worker selects **18–64 years** — the adult pathway. The underlying-disease section appears below the danger signs. They tap **Chronic lung disease** under **Lungs**, leave danger signs off, and tap "Assess patient." The engine weighs age and comorbidity; the card shows the appropriate decision with a named reason if referral is needed.
>
> Third patient: a 12-year-old with fever, no danger signs. The worker selects **5–15 years** — still pediatric pathway, still no comorbidity section. They assess and get **TREAT & MONITOR** with a three-day re-check note.
>
> By the fourth patient the worker isn't reading the interface anymore — they're reading the patient, picking the age band first, and tapping.

## 6. Component & visual notes

- **Typography:** Large, high-weight, high-contrast. System fonts — legibility over personality.
- **Color:** Red (#c0392b) = refer, amber (#d68910) = treat-and-monitor, green (#1e8449) = treat. Color never the only signal.
- **Motion:** Almost none. Form-to-card is an immediate replace. Comorbidity section appears/disappears inline without page transition.
- **The signature visual:** Age-band fork that reveals or hides the comorbidity block; danger-sign tiles in solid "on" state; immediate REFER snap on any positive sign.
- **Microcopy voice:** Plain, calm, clinical-but-human. System headers ("Heart", "Lungs") not ICD codes. Pathway is never labeled "pediatric/adult" to the worker — age bands carry the meaning.

## 7. Accessibility & inclusion

- **Low vision / screen reader:** Tiles and comorbidity toggles carry text labels, not icon-only meaning. Age band radio group announces all six options.
- **Motor difficulty:** Large tap targets; no precise gestures; no swipe-to-reveal for comorbidities.
- **Low connectivity:** Core flow needs no network.
- **Doesn't read English:** v1 English; all labels centralized for future translation.

## 8. What we are NOT designing

- **No separate "pathway picker" screen** — age band is the only fork; workers never choose "pediatric mode" explicitly
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

> Progressive disclosure of comorbidity blocks must key off `is_pediatric_pathway()` / `is_adult_pathway()` — pediatric shows sickle cell + severe malnutrition only; adult shows full organ-system grid. Comorbidity toggles map 1:1 to `Comorbidity` enum values via pathway-filtered option lists. Vitals map to `VitalSigns` on `PatientContext`. Result card renders `treatment_plan` from engine output plus teleconsultation CTA by decision type. Local registry write is fire-and-forget after card display.
