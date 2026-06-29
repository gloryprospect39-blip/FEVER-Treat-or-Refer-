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

- **Input:** A bedside tap-through form. Six age bands that route into two clinical pathways:
  - **Pediatric pathway (<15 years):** Under 2 months / 2 months–5 years / 5–15 years — fever yes/no plus duration; nine IMCI danger-sign toggles. No underlying-disease section.
  - **Adult pathway (15+ years):** 15–17 years / 18–64 years / 65+ years — same fever and danger-sign inputs, plus underlying-disease toggles grouped by organ system (heart, lungs, kidneys, immune, blood, nutrition, other).
- **Output:** One full-screen decision card. REFER (red, with the named reason and urgency), TREAT (green), or TREAT AND MONITOR (amber, re-check flag). One primary action button per card.
- **The loop:** One patient = one decision. Worker selects age band (which sets the pathway), taps signs and (if adult) comorbidities → gets the card → acts → taps "New patient" and the form resets. Repeat down the line of waiting patients.

## 3. The magical moment

> "I picked the right age band, tapped the signs, and it told me refer now — with exactly why."

If you can't write this sentence, the product doesn't have magic yet. Go back to section 1.

## 4. Scope: what we ARE building (v1)

- A mobile-friendly tap-through triage form completable in under 60 seconds
- **Two age-routed clinical pathways** split at 15 years: pediatric (IMCI-first) and adult (IMCI danger signs + comorbidity modifiers)
- Six age bands in the selector; pathway is derived automatically from band selection
- A deterministic rule engine (no LLM in the decision path) that returns REFER / TREAT / TREAT_AND_MONITOR
- A danger-sign grid where any positive sign hard-triggers an immediate REFER at any age and on either pathway
- System-wise underlying-disease toggles shown only on the adult pathway (15+)
- A full-screen result card with one primary action and the referral reason named in plain language
- A "New patient" reset so the worker can run patient after patient with zero friction

## 5. Scope: what we are NOT building

- **No lab or rapid-test input** — deciding without one is the entire point; adding test results is a different product
- **No SMS / push / notifications** — TREAT_AND_MONITOR is a decision flag in v1, not a delivery system
- **No cloud database or fever registry** — local only; a registry must never block the bedside decision
- **No accounts or login** — one worker, one device, zero friction
- **No vitals entry UI (BP, SpO2, RR)** — v1 triages on danger signs and comorbidities; numeric vitals screens are deferred
- **No comorbidity capture on the pediatric pathway** — sickle cell and severe malnutrition for under-15 are deferred; adult pathway owns comorbidities in v1
- **No malaria endemicity / presumptive ACT drug plan in v1 UI** — treat pathways come next
- **No LLM in the decision** — an AI may explain the rule output later, but it never decides or overrides a REFER

## 6. The signature detail

Age band selection is the fork in the road. Pick a pediatric band and the form stays lean: fever, duration, nine large icon-led danger-sign tiles — a lightning bolt for convulsions, a raised hand for "unable to drink." Pick an adult band and a second section slides in below: underlying diseases grouped by organ system — heart, lungs, kidneys — each a single tap, no medical jargon on the buttons. The moment a danger sign goes positive on either pathway, the screen does not celebrate or animate; it snaps to a calm, full-width red REFER card with the sign named in a single line: "Convulsions — refer immediately." The calm-to-urgent shift is the emotional design: routine taps until something is wrong, then zero ambiguity and one obvious next step.

## 7. Success: how we know it worked

- **Primary:** Zero cases where a positive danger sign produces anything other than a referral — on either pathway, at any age. This is a safety product; a single false negative is the failure that matters.
- **Secondary:** A clinic worker completes triage and reaches a decision screen in under 60 seconds in a timed walkthrough, for both a pediatric and an adult scenario.
- **What we're NOT measuring:** Total encounters logged, app installs, time-in-app, NPS — meaningless before real field deployment and a distraction from the safety bar.

## 8. Open questions

- [ ] Should the pediatric pathway gain a reduced comorbidity set (sickle cell, severe malnutrition) before field pilot?
- [ ] Who owns TREAT_AND_MONITOR follow-up — the same worker on a re-check, a district supervisor, or no one in v1?
- [ ] Is this a decision-support prototype for submission, or a field tool that needs MOH / clinician sign-off before use?

## 9. Handoff

- **For UX:** The age-band → pathway fork must be obvious without extra taps; the pediatric form must not flash the adult comorbidity block on load; the REFER snap transition must read as urgent-but-calm on both pathways.
- **For Eng:** Pathway routing (`is_pediatric_pathway` / `is_adult_pathway`) must gate UI sections and filter comorbidities at the context boundary; the rule engine's safety invariant (any danger sign → refer) must hold regardless of pathway.
