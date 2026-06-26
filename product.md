# FeverGate — Product Design Doc

**Author:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-26
**One-liner:** A border clinic worker taps a febrile patient's danger signs and gets an instant treat-or-refer answer — no lab, in under a minute.

---

## 1. The user & the moment

Who is this for, and what are they doing/feeling **right before** they open the app?

- **Who:** A community health worker at a border clinic in a conflict-affected area. Trained in basic triage, not a doctor. Frequently alone. Spotty connectivity. Antimalarial and antibiotic stock is limited and unpredictable.
- **When:** A febrile patient is in front of them right now. They have a thermometer and their own eyes — no lab, no rapid test, no specialist to phone. They have roughly two minutes to decide: treat here, or send this patient on a long, dangerous trip to a referral facility.
- **Why now:** Treating severe illness at home kills; referring every ordinary fever burns scarce transport and referral capacity that someone sicker will need tomorrow. WHO IMCI danger-sign protocols exist on laminated paper, but nobody can hold the full tree in their head while a sick child is crying in front of them.

## 2. The contract (I/O)

- **Input:** A bedside tap-through form. Age band (under 2 months / 2 months–5 years / 5–15 years / adult). Fever yes/no plus duration in days. A grid of large danger-sign toggles (convulsions, unable to drink or breastfeed, vomits everything, lethargic, unconscious, chest indrawing, stiff neck, bulging fontanelle, severe palmar pallor). No free text required.
- **Output:** One full-screen decision card. REFER (red, with the named reason and urgency), TREAT (green), or TREAT AND MONITOR (amber, re-check flag). One primary action button per card.
- **The loop:** One patient = one decision. Worker taps signs → gets the card → acts → taps "New patient" and the form resets. Repeat down the line of waiting patients.

## 3. The magical moment

> "I didn't need the lab — I tapped the signs, it said refer now, and it told me exactly why."

If you can't write this sentence, the product doesn't have magic yet. Go back to section 1.

## 4. Scope: what we ARE building (v1)

- A mobile-friendly tap-through triage form completable in under 60 seconds
- A deterministic rule engine (no LLM in the decision path) that returns REFER / TREAT / TREAT_AND_MONITOR
- A danger-sign grid where any positive sign hard-triggers an immediate REFER at any age
- A full-screen result card with one primary action and the referral reason named in plain language
- A "New patient" reset so the worker can run patient after patient with zero friction

## 5. Scope: what we are NOT building

- **No lab or rapid-test input** — deciding *without* one is the entire point; adding test results is a different product
- **No SMS / push / notifications** — TREAT_AND_MONITOR is a decision flag in v1, not a delivery system
- **No cloud database or fever registry** — local only; a registry must never block the bedside decision
- **No accounts or login** — one worker, one device, zero friction
- **No stock/logistics dashboard or reorder hooks** — needs registry data first; not the v1 bet
- **No LLM in the decision** — an AI may *explain* the rule output later, but it never decides or overrides a REFER

## 6. The signature detail

The danger-sign grid is large, icon-led tiles a worker taps with one thumb on a cracked screen in bright sunlight — a lightning bolt for convulsions, a raised hand for "unable to drink." The moment a danger sign goes positive, the screen does not celebrate or animate; it snaps to a calm, full-width red REFER card with the sign named in a single line: "Convulsions — refer immediately." The emotional design is the calm-to-urgent shift: routine taps until something is wrong, then zero ambiguity and one obvious next step.

## 7. Success: how we know it worked

- **Primary:** Zero cases where a positive danger sign produces anything other than a referral. This is a safety product; a single false negative is the failure that matters.
- **Secondary:** The rule engine agrees with expert clinical judgment on the curated set of danger-sign and fever test cases.
- **What we're NOT measuring:** Total encounters, app installs, time-in-app, NPS — meaningless before real field deployment and a distraction from the safety bar.

## 8. Open questions

- [ ] Is the primary population under-5 only (full IMCI) or all ages with a simplified adult fever branch?
- [ ] Who owns TREAT_AND_MONITOR follow-up — the same worker on a re-check, a district supervisor, or no one in v1?
- [ ] Is this a decision-support prototype for submission, or a field tool that needs MOH / clinician sign-off before use?

## 9. Handoff

- **For UX:** The danger-sign grid must be tappable with one thumb on a cracked phone in direct sunlight, and the REFER snap transition must read as urgent-but-calm — that's the hardest design problem.
- **For Eng:** The rule engine must be deterministic, auditable, and exhaustively tested so any positive danger sign always refers; that safety guarantee is the architecture, and no LLM may sit in the decision path.
