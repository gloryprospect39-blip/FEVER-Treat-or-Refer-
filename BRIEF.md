# FeverGate — Product Brief

**Week:** 3 (Coding Jam)  
**Project:** FeverGate  
**Status:** Active brief — feeds `product.md`, `ui.md`, `engineering.md`

---

## One-liner

A border clinic worker taps a febrile patient's age band and danger signs, then gets an instant treat-or-refer answer — pediatric and adult pathways, no lab, in under a minute.

---

## The user & moment

- **Who:** Community health worker at a border clinic in a conflict-affected area. Basic triage training, not a doctor. Often alone. Spotty connectivity. Limited, unpredictable antimalarial and antibiotic stock.
- **When:** A febrile patient is in front of them now — child or adult. Thermometer and observation only. No lab, no rapid test, no specialist on call. ~2 minutes to decide: treat here or refer.
- **Why now:** Wrong decisions cost lives. WHO IMCI protocols exist on paper but cannot be held in memory under pressure. Adults need comorbidity-aware triage that IMCI alone does not cover.

---

## Contract (I/O)

**Input (bedside tap-through):**
- **Village / catchment (required)** — pick known village or type new; optional patient name; returning-patient revisit lookup
- Two-step age selector: Child (under 15) / Adult (15+), then one of six age bands
- Fever yes/no + duration in days
- Nine IMCI danger-sign toggles (icon + label tiles) — same on both pathways
- Optional vitals: systolic BP, SpO₂, respiratory rate (collapsible)
- **Pediatric pathway (<15):** sickle cell disease, severe malnutrition only
- **Adult pathway (15+):** nine underlying-disease toggles grouped by organ system
- Clinic context (session): malaria endemicity (high/low), ACT / amoxicillin / paracetamol in stock

**Output (full-screen decision card):**
- **REFER (red)** — named reason, urgency, treatment plan (no home treat), **Call teleconsultation now**
- **TREAT (green)** — guideline drug plan (presumptive ACT when endemic + in stock), **Start treatment**
- **TREAT AND MONITOR (amber)** — treat now + re-check window (3 days), **Schedule teleconsultation**

**Loop:** Confirm catchment → one patient → one decision → act → local encounter log (with catchment) → "New patient" reset → repeat.

---

## Magical moment

> "I picked the right age band, tapped the signs, and it told me exactly what to do — give ACT, call teleconsultation, or re-check in three days — with exactly why."

---

## Signature detail

Age band is the fork. Pediatric form stays lean; adult form reveals organ-system comorbidities. Any positive danger sign snaps instantly to a calm red REFER card — no animation, no celebration — with the sign named and one obvious teleconsultation button.

---

## v1 scope (build)

- Mobile-friendly Streamlit triage form (<60 seconds)
- Deterministic rule engine — **no LLM in the decision path**
- Age-routed pathways at 15 years (pediatric vs adult comorbidity capture)
- Danger sign → always REFER at any age (safety invariant)
- Neonate (<2 months) + fever → always REFER
- qSOFA / NEWS2 / composite score when vitals present (engine)
- Stock- and endemicity-aware treatment plans on result card
- Teleconsultation CTAs (dial / schedule stubs in demo)
- Local append-only fever registry (JSONL, top-level `catchment` on every row) — never blocks triage
- Optional Gemini explainer layer — narrates rule output only, never decides

---

## v1 cuts (do NOT build)

- No lab / RDT input
- No SMS / push notifications
- No cloud registry or sync
- No accounts or login
- No two-way in-app clinician chat
- No supply-chain / funding dashboard
- No LLM in the decision path

---

## Success bar

- **Primary:** Zero false negatives on danger signs — any positive sign → REFER, any age, either pathway
- **Secondary:** Triage completable in <60 seconds (pediatric + adult walkthrough)
- **Not measuring:** DAU, installs, NPS before field deployment

---

## Stack constraints

- **Backend:** Python 3.11+, `uv` + `pyproject.toml`
- **UI:** Streamlit (mobile-friendly single page)
- **Tests:** pytest in `tests/`, `pythonpath = ["src"]`
- **AI (optional):** Gemini for explainer only — mock in tests via `gemini_stub` fixture

---

## Open questions

- Teleconsultation handoff: `tel:` URI vs VoIP vs queue ticket?
- Drug scope beyond ACT: amoxicillin, paracetamol?
- Submission prototype vs field tool (MOH sign-off)?
- Who owns TREAT_AND_MONITOR follow-up in pilot?
