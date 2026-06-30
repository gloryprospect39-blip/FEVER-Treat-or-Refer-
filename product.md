# FeverGate — Product Design Doc

**Author:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-30
**One-liner:** A border clinic worker taps a febrile patient's age band and danger signs, then gets an instant treat-or-refer answer — pediatric and adult pathways, no lab, in under a minute.

---

## 1. The user & the moment

Who is this for, and what are they doing/feeling **right before** they open the app?

- **Who:** A community health worker at a border clinic in a conflict-affected area. Trained in basic triage, not a doctor. Frequently alone. Spotty connectivity. Antimalarial and antibiotic stock is limited and unpredictable.
- **When:** A febrile patient is in front of them right now — maybe a 3-year-old, maybe a 62-year-old with known lung disease. They have a thermometer and their own eyes — no lab, no rapid test, no specialist to phone. They have roughly two minutes to decide: treat here, or send this patient on a long, dangerous trip to a referral facility.
- **Why now:** Treating severe illness at home kills; referring every ordinary fever burns scarce transport and referral capacity that someone sicker will need tomorrow. WHO IMCI danger-sign protocols exist on laminated paper, but nobody can hold the full tree in their head while a sick child is crying in front of them — and for patients aged 15 and older, chronic heart, lung, or kidney disease raises the stakes in ways IMCI alone does not capture.

## 2. The contract (I/O)

- **Input:** A bedside tap-through form. **Village / catchment is required on every encounter** (for epidemiologic reporting); patient name is optional. Returning patients can be picked from a local revisit list — catchment is inherited from their record. Six age bands that route into two clinical pathways:
  - **Pediatric pathway (<15 years):** Under 2 months / 2 months–5 years / 5–15 years — fever yes/no plus duration; nine IMCI danger-sign toggles; optional numeric vitals (BP, SpO₂, RR) when available; reduced comorbidity block (sickle cell disease, severe malnutrition only).
  - **Adult pathway (15+ years):** 15–17 years / 18–64 years / 65+ years — same fever, danger-sign, and vitals inputs, plus full underlying-disease toggles grouped by organ system (heart, lungs, kidneys, immune, blood, nutrition, other).
  - **Clinic context (set once per session):** malaria endemicity (high / low) and which antimalarials and antibiotics are in stock today — stock is limited and unpredictable.
- **Output:** One full-screen decision card with the subsequent appropriate medical treatment according to guidelines:
  - **REFER (red)** — named reason, urgency (immediate / same day), and primary action to **call teleconsultation now** (connected to the clinic's teleconsultation department).
  - **TREAT (green)** — start the guideline-appropriate treatment plan (e.g. presumptive ACT in a malaria-endemic zone when stock allows; antibiotics or supportive care when indicated and available).
  - **TREAT AND MONITOR (amber)** — treat now per guidelines, re-check flag with window (e.g. 3 days), and primary action to **schedule a teleconsultation call**.
- **The loop:** One patient = one decision. Worker confirms village/catchment (or picks a returning patient), selects age band (which sets the pathway), taps signs, vitals, and comorbidities → gets the card → acts (treat, refer, or schedule follow-up) → encounter is saved locally as a fever-registry row with top-level catchment → taps "New patient" and the form resets. Repeat down the line of waiting patients. Catchment validation is one field; registry capture must never block or slow the bedside decision.

## 3. The magical moment

> "I picked the right age band, tapped the signs, and it told me exactly what to do — give ACT, call teleconsultation, or re-check in three days — with exactly why."

## 4. Scope: what we ARE building (v1)

- A mobile-friendly tap-through triage form completable in under 60 seconds
- **Mandatory village / catchment** on every encounter — pick from known villages or type a new one; blocks assess if empty; stored on every registry row for epidemiology
- **Optional patient registration** — name + revisit lookup by village; returning patients auto-fill catchment
- **Two age-routed clinical pathways** split at 15 years: pediatric (IMCI-first + reduced comorbidities) and adult (IMCI danger signs + full comorbidity modifiers)
- Six age bands in the selector; pathway is derived automatically from band selection
- Optional numeric vitals entry (BP, SpO₂, RR) — feasible when a cuff or pulse oximeter is available; engine already scores qSOFA/NEWS2 when vitals are present
- **Pediatric comorbidity capture:** sickle cell disease and severe malnutrition on the under-15 pathway (distinct from the adult organ-system block)
- **Malaria endemicity** and **presumptive ACT drug plan** on the TREAT branch when endemicity is high and stock allows
- Clinic stock context: antimalarials and antibiotics occasionally available — treatment recommendations respect what is on the shelf today
- A deterministic rule engine (no LLM in the decision path) that returns REFER / TREAT / TREAT_AND_MONITOR with guideline-linked treatment plans
- A danger-sign grid where any positive sign hard-triggers an immediate REFER at any age and on either pathway
- A full-screen result card: decision color, named reason, urgency, **guideline-appropriate treatment plan**, and one primary action (call teleconsultation / start treatment / schedule teleconsultation)
- **Teleconsultation integration:** REFER → immediate call to teleconsultation department; TREAT AND MONITOR → scheduled teleconsultation call
- **Local fever registry:** each encounter saved on-device (timestamp, **catchment**, optional registration, inputs, decision, action taken) — a side benefit that never blocks the core triage flow
- A "New patient" reset so the worker can run patient after patient with zero friction

## 5. Scope: what we are NOT building

- **No lab or rapid-test input** — deciding without one is the entire point; adding test results is a different product
- **No SMS / push / notifications** — teleconsultation is initiated from the card (call / schedule); automated reminders are phase 2
- **No cloud database or central fever registry in v1** — local on-device log only; sync to a district registry is phase 2 and must never block triage
- **No accounts or login** — one worker, one device, zero friction
- **No two-way clinician chat in v1** — teleconsultation is outbound call / scheduled call, not an in-app messaging thread
- **No antibiotics funding or logistics dashboard** — stock is a same-day toggle, not a supply-chain system
- **No LLM in the decision** — an AI may explain the rule output later, but it never decides or overrides a REFER

## 6. The signature detail

Village/catchment comes first — one required field, epidemiology without friction. Age band selection is the fork in the road. Pick a pediatric band and the form stays lean: fever, duration, optional vitals, nine large icon-led danger-sign tiles, and two comorbidity toggles (sickle cell, severe malnutrition) — visually distinct from the adult organ-system block. Pick an adult band and the full underlying-disease section slides in below. The moment a danger sign goes positive on either pathway, the screen does not celebrate or animate; it snaps to a calm, full-width red REFER card with the sign named, urgency stated, and a single obvious button: **Call teleconsultation now.** On a green TREAT card in a malaria-endemic clinic with ACT in stock, the worker sees the presumptive drug plan (drug, dose band by age/weight) — not just "treat." On amber TREAT AND MONITOR, they see the re-check window and **Schedule teleconsultation.** The calm-to-urgent shift is the emotional design: routine taps until something is wrong, then zero ambiguity, one treatment plan, and one obvious next step.

## 7. Success: how we know it worked

- **Primary:** Zero cases where a positive danger sign produces anything other than a referral — on either pathway, at any age. This is a safety product; a single false negative is the failure that matters.
- **Secondary:** A clinic worker completes triage and reaches a decision screen in under 60 seconds in a timed walkthrough, for both a pediatric and an adult scenario.
- **What we're NOT measuring:** Total encounters logged, app installs, time-in-app, NPS — meaningless before real field deployment and a distraction from the safety bar.

## 8. Open questions

- [ ] Teleconsultation handoff: phone number dial-out, VoIP link, or queue ticket to the district teleconsultation desk?
- [ ] Which drugs beyond ACT are in scope for v1 stock logic: amoxicillin, paracetamol, both?
- [ ] Geographic context: which malaria endemicity zone defines presumptive treatment rules for the demo?
- [ ] Who owns the scheduled teleconsultation on TREAT_AND_MONITOR — same worker, district clinician, or rotating teleconsultation roster?
- [ ] Is this a decision-support prototype for submission, or a field tool that needs MOH / clinician sign-off before use?

## 9. Handoff

- **For UX:** Catchment is the first substantive block — required, with revisit picker above the age fork; result card shows catchment when no named patient is linked; age-band → pathway fork must be obvious without extra taps; pediatric comorbidities (sickle cell, malnutrition) must look distinct from the adult organ-system block; vitals fields are optional and collapsible; result cards must show treatment plan + teleconsultation CTA, not decision color alone.
- **For Eng:** `require_catchment()` validates at assess and at log write; every JSONL row has top-level `catchment`; `registration` remains optional; pathway routing gates UI sections and filters comorbidities at the context boundary; engine returns treatment-plan payloads alongside decisions; local encounter log writes after card actions; teleconsultation actions are dial/schedule stubs in v1 demo, real integration in pilot.
