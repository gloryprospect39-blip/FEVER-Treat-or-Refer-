# FeverGate — UX Design Doc

**Designer:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-26

---

## 1. The design bet

We are betting the entire product on one screen and one transition. The triage form and the decision card are the same surface, and the magic lives in the *snap* between them: routine, low-stakes tapping that, the instant a danger sign is positive, collapses into a single calm-but-urgent red card with one obvious action. We spend design effort on tap-target size, sunlight legibility, progressive disclosure (comorbidities only when age warrants them), and the timing/feel of that snap — and keep everything else nearly invisible.

## 2. The defining interaction

> The worker taps a danger-sign tile — say the lightning bolt for convulsions. The tile fills with a solid state so it's unmistakable it's "on." They tap "Assess patient." The form does not fade or spin; the screen immediately replaces itself with a full-width red card that reads **REFER** in large type, and below it one line: "Convulsions — refer immediately." No animation, no celebration, no sound. The calm is the point: the worker's eyes land on the reason and the single "Refer now" button in under a second.

If you can't write this paragraph, you don't have a defining interaction yet.

## 3. Screen inventory

- **Triage form** — tap age band, fever, danger signs, and (for 15+) underlying diseases; one button to assess.
- **Result card** — the full-screen REFER / TREAT / TREAT_AND_MONITOR decision with one primary action and a reset.

Two screens, and they are really two states of one surface. There is intentionally no third screen.

## 4. Screen-by-screen specs

### Triage form

**Purpose:** Capture the minimum facts needed for a safe treat-or-refer decision, fast, with one thumb.

**Layout (top to bottom):**
1. Title ("FeverGate") + one-line caption ("Point-of-care treat / refer — screening only").
2. Age band selector (6 options) — single choice, defaults to 2 months–5 years:
   - Under 2 months
   - 2 months – 5 years
   - 5–15 years
   - 15–17 years
   - 18–64 years
   - 65+ years
3. Fever toggle (default on) + fever-duration number input, side by side.
4. "Danger signs" section header.
5. Danger-sign grid — large icon+label tiles in two columns, each an independent on/off toggle (9 tiles).
6. **Underlying diseases** section (visible only when age band is 15–17, 18–64, or 65+):
   - Section header + caption ("Tap any that apply — grouped by organ system.")
   - Sub-headers by system: **Heart**, **Lungs**, **Kidneys**, **Immune**, **Blood**, **Nutrition**, **Other**
   - Two-column toggle grid per system (heart disease, lung disease, kidney disease, HIV, immunosuppression, sickle cell, severe malnutrition, pregnancy, recent surgery/wound)
7. Primary button: "Assess patient", full width.

**Key interactions:**
- Tap a danger-sign tile → solid "on" state.
- Select an older age band → underlying-disease section appears below danger signs.
- Select a younger age band → underlying-disease section hides (progressive disclosure).
- Tap "Assess patient" → build context, run engine, switch to result card.

**States:**
- **Default:** All tiles off, age = under-5, fever on, no comorbidity section visible.
- **Adolescent/adult/elderly selected:** Comorbidity section expands inline; no page navigation.
- **Loading:** None — engine is local and synchronous.
- **Error:** Plain inline message ("Couldn't assess — check inputs and retry").
- **Edge / "too much":** Many danger signs and comorbidities selected at once is expected for very sick patients.

### Result card

**Purpose:** Deliver one unambiguous decision and one next action, with the clinical reason named.

**Layout (top to bottom):**
1. Full-width color card: red (REFER), amber (TREAT & MONITOR), or green (TREAT).
2. Decision word in large bold type.
3. One-line reason (referrals: named trigger + urgency; monitor: re-check window; treat: low-risk note).
4. Primary action: "Refer now" on referral only.
5. Secondary: "← New patient" — resets form.

**Key interactions:**
- Tap "Refer now" → acknowledgment (no-op in v1).
- Tap "← New patient" → clears all state including comorbidity toggles.

**States:** Same as prior spec (REFER red, TREAT & MONITOR amber, TREAT green; error falls back to form).

## 5. The user journey

> A worker opens FeverGate to a clean form: age band on under-5, fever on. A mother's child has convulsions. The worker taps the lightning-bolt tile, taps "Assess patient," and the screen snaps to **REFER**, "Convulsions — refer immediately."
>
> Next patient: a 58-year-old with fever and known lung disease. The worker selects **18–64 years**. The underlying-disease section appears. They tap **Chronic lung disease** under **Lungs**, leave danger signs off, and tap "Assess patient." The engine weighs age and comorbidity; the card shows the appropriate decision with a named reason if referral is needed.
>
> By the third patient the worker isn't reading the interface anymore — they're reading the patient and tapping.

## 6. Component & visual notes

- **Typography:** Large, high-weight, high-contrast. System fonts — legibility over personality.
- **Color:** Red (#c0392b) = refer, amber (#d68910) = treat-and-monitor, green (#1e8449) = treat. Color never the only signal.
- **Motion:** Almost none. Form-to-card is an immediate replace.
- **The signature visual:** Danger-sign tiles in "on" state + progressive comorbidity section for older patients.
- **Microcopy voice:** Plain, calm, clinical-but-human. System headers ("Heart", "Lungs") not ICD codes.

## 7. Accessibility & inclusion

- **Low vision / screen reader:** Tiles and comorbidity toggles carry text labels, not icon-only meaning.
- **Motor difficulty:** Large tap targets; no precise gestures.
- **Low connectivity:** Core flow needs no network.
- **Doesn't read English:** v1 English; all labels centralized for future translation.

## 8. What we are NOT designing

- **No history / encounter list screen**
- **No settings screen**
- **No onboarding flow**
- **No vitals-entry UI**
- **No AI-explainer panel**
- **No comorbidity section for under-15** in v1 (deferred — may add sickle cell / malnutrition for children later)

## 9. Open design questions

- [ ] Should under-15 patients get a reduced comorbidity set (sickle cell, malnutrition)?
- [ ] Distinct visual treatment for neonate-fever referral vs danger-sign referral?
- [ ] "Refer now" — no-op or logged tap?

## 10. Handoff to engineering

> Progressive disclosure of the comorbidity block must be keyed off age-band selection without a full-page reload flicker. Comorbidity toggles map 1:1 to `Comorbidity` enum values in `src/ui/comorbidity_options.py` and flow through `build_patient_context()` into the engine.
