# FeverGate — Product Design Doc

**Author:** TBD  
**Status:** Draft v0.1  
**Last updated:** 2026-06-21  
**One-liner:** A border clinic worker taps through danger signs and gets an instant treat-or-refer answer for a febrile patient — no lab required.

---

## 1. The user & the moment

Who is this for, and what are they doing/feeling **right before** they open the app?

- **Who:** A community health worker at a border clinic in a conflict-affected area. Trained in basic triage, not a doctor. Often alone. May have spotty connectivity. Stock of antimalarials and antibiotics is limited and unpredictable.
- **When:** A patient arrives with fever. The worker has a thermometer and their eyes — no lab, no rapid test, no phone call to a specialist available right now. They need to decide in the next two minutes: give presumptive treatment here, or send the patient on a dangerous journey to a referral facility.
- **Why now:** Border clinics in conflict zones see febrile patients daily with no diagnostic support. Wrong decisions cost lives — treating severe malaria at home kills; referring every uncomplicated fever wastes scarce transport and referral capacity. WHO IMCI protocols exist on paper, but workers cannot hold the full decision tree in their head under pressure.

---

## 2. The contract (I/O)

- **Input:** A short triage form the worker completes at bedside:
  - Patient age band (under 2 months / 2 months–5 years / 5–15 years / adult)
  - Temperature (number entry or tap: normal / warm / hot)
  - Danger-sign checklist — 8 yes/no toggles with icons (unable to drink, vomits everything, convulsions, lethargic/unconscious, chest indrawing, stiff neck, bulging fontanelle, severe palmar pallor)
  - Three symptom toggles (cough, diarrhea, fever duration in days)
  - Clinic context set once: malaria endemicity (high / low)
- **Output:** A single full-screen result with three possible decisions:
  - **REFER** (red) — with one-line reason and urgency (immediate / same day)
  - **TREAT** (green) — with specific drug and dosing plan based on available stock
  - **TREAT AND MONITOR** (amber) — treat now, flag for follow-up check in 3 days
  - Below the decision: a plain-language "why" paragraph (AI-generated from the rule output, not invented independently)
- **The loop:** One encounter = one decision. Worker confirms action taken (treated / referred / monitoring scheduled). Encounter is saved locally. Repeat for next patient.

---

## 3. The magical moment

> "I didn't need the lab — I tapped the signs, it told me to give ACT, and I knew why."

If you can't write this sentence, the product doesn't have magic yet. Go back to section 1.

---

## 4. Scope: what we ARE building (v1)

- A mobile-friendly triage form (Streamlit MVP) completable in under 60 seconds
- A deterministic WHO IMCI / iCCM rule engine that outputs TREAT, REFER, or TREAT_AND_MONITOR — no LLM in the decision path
- Danger-sign checklist that hard-triggers immediate REFER on any positive sign
- Age-stratified fever logic with malaria endemicity branch (presumptive ACT in endemic zones)
- A result screen with one primary action button ("Give ACT" / "Refer now" / "Treat and schedule check-in")
- An AI explainer that narrates the rule-engine output in plain language (local-language ready, English for v1)
- 15+ golden clinical test cases validating rule-engine output against expert judgment
- Local encounter log (device storage) — each triage saved with timestamp and decision

---

## 5. Scope: what we are NOT building

- **No lab integration or rapid diagnostic test input** — the whole point is deciding without one; adding test results is a different product
- **No SMS or push notifications in v1** — monitoring is a decision flag, not a delivery system yet; Twilio wiring is phase 2
- **No central fever registry or cloud database in v1** — local log only; registry is a side benefit that must not block the core decision flow
- **No antibiotics funding or logistics dashboard** — stock counter and reorder signals need registry data first; phase 3
- **No user accounts or login** — device-local, zero friction; one worker, one device
- **No offline PWA in v1** — Streamlit demo first; true offline sync is phase 3 when connectivity constraints are validated
- **No adult-specific clinical pathways beyond basic fever branch** — v1 optimizes for under-5 IMCI; adult logic is simplified
- **No two-way clinician chat** — escalation workflows require knowing who the "dedicated professional" is; unresolved

---

## 6. The signature detail

The danger-sign checklist uses large, icon-only tiles — a red hand for "unable to drink," a lightning bolt for convulsions — with no medical jargon on the buttons themselves. The worker taps yes or no with their thumb without reading paragraphs. When a danger sign is positive, the screen does not animate or celebrate; it snaps immediately to a full-screen red REFER card with the specific sign named in one line: "Convulsions — refer immediately." The calm-to-urgent shift is the product's emotional design: routine taps until something is wrong, then zero ambiguity. The AI explainer below the decision speaks like a colleague, not a textbook: "This child has fever in a malaria area with no danger signs. Give ACT now. No lab needed."

---

## 7. Success: how we know it worked

- **Primary:** Rule engine matches expert clinical judgment on ≥90% of 15 golden test cases (refer scenarios, endemic malaria treat, uncomplicated monitor).
- **Secondary:** A clinic worker completes triage and reaches a decision screen in under 60 seconds in a timed walkthrough.
- **Secondary:** Zero cases where a positive danger sign results in anything other than REFER.
- **What we're NOT measuring:** Total encounters logged, app downloads, time-in-app, or NPS — meaningless before real deployment.

---

## 8. Open questions

- [ ] Primary patient population: under-5 only (full IMCI) or all ages with simplified adult branch?
- [ ] Geographic context: which malaria endemicity zone defines presumptive treatment rules for the demo?
- [ ] Who is the "dedicated professional" for TREAT_AND_MONITOR — remote NGO clinician, district supervisor, or the same worker checking back?
- [ ] Is this a decision-support prototype for submission, or intended for field deployment (requires MOH / clinician sign-off)?
- [ ] Which drugs are in scope for v1 stock logic: ACT only, or also amoxicillin and paracetamol?

---

## 9. Handoff

- **For UX:** The danger-sign checklist must work with one thumb on a cracked phone screen in bright sunlight — icon size and the REFER snap transition are the hardest design problems.
- **For Eng:** The rule engine must be deterministic, auditable, and tested — the LLM explains the output but never overrides a REFER trigger; that separation is the safety architecture.
