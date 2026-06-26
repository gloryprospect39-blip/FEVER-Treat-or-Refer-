# FeverGate — Opportunity Solution Tree

**Project:** [FeverGate Product Design Doc](product-design-doc.md)  
**Status:** Week 2 deliverable  
**Last updated:** 2026-06-25

---

## How to read this tree

This document follows the **Opportunity Solution Tree (OST)** framework (Teresa Torres). Each layer answers a different question:

| Layer | Question | FeverGate example |
|-------|----------|-------------------|
| **Outcome** | What product result are we driving? | Correct treat-or-refer decision without a lab |
| **Opportunity** | What unmet user need blocks that outcome? | "I can't hold the full protocol in my head under pressure" |
| **Solution** | What product idea addresses that need? | Deterministic WHO IMCI rule engine |
| **Experiment** | How do we quickly test whether the solution works? | 15 golden clinical test cases |

Opportunities are written in the **worker's voice** ("I…"). Solutions map to [v1 scope in the PRD](product-design-doc.md#4-scope-what-we-are-building-v1). Experiments align with [success criteria in PRD §7](product-design-doc.md#7-success-how-we-know-it-worked).

---

## Desired outcome

> **Workers at border clinics make the correct treat-or-refer decision for febrile patients in under 2 minutes — without a lab, rapid test, or phone consult.**

### Success signals (PRD §7)

| Metric | Target |
|--------|--------|
| Rule engine vs expert judgment | ≥90% agreement on 15 golden test cases |
| Triage completion time | Under 60 seconds (form → decision screen) |
| Danger-sign safety | Zero cases where a positive danger sign yields anything other than REFER |

---

## User & moment

Before opening FeverGate, the worker is alone at a border clinic with a febrile patient and roughly two minutes to decide.

- **Who:** Community health worker in a conflict-affected area. Basic triage training, not a doctor. Often alone. Spotty connectivity. Limited, unpredictable antimalarial and antibiotic stock.
- **When:** Patient arrives with fever. Only a thermometer and observation — no lab, no rapid test, no specialist on call.
- **Stakes:** Treating severe malaria at home kills. Referring every uncomplicated fever wastes scarce transport and referral capacity. WHO IMCI protocols exist on paper, but workers cannot hold the full decision tree in their head under pressure.

**Magical moment:** *"I didn't need the lab — I tapped the signs, it told me to give ACT, and I knew why."*

---

## v1 Opportunity Solution Tree

### Opportunity 1 — Protocol overload under time pressure

**"I cannot recall the full IMCI tree under pressure."**

| Solutions (v1) | Experiments |
|--------------|-------------|
| Deterministic WHO IMCI / iCCM rule engine — no LLM in the decision path (`evaluate_febrile_patient` in `src/decision_engine/engine.py`) | 15+ golden cases covering REFER, endemic TREAT, and TREAT_AND_MONITOR |
| Age-stratified fever logic: neonate hard-refer, under-5 IMCI, simplified adult qSOFA/NEWS2 | ≥90% agreement with expert clinical judgment |
| Malaria endemicity branch (high / low) for presumptive ACT in endemic zones | Golden cases for each age band and endemicity setting |

---

### Opportunity 2 — Fear of missing severe illness

**"I might miss a danger sign and treat at home."**

| Solutions (v1) | Experiments |
|--------------|-------------|
| 8 icon-only danger-sign tiles (unable to drink, vomits everything, convulsions, lethargic/unconscious, chest indrawing, stiff neck, bulging fontanelle, severe palmar pallor) | Automated test suite: every danger-sign-positive input → REFER |
| Any positive danger sign → immediate full-screen REFER card with named reason (no override, no celebration animation) | Neonate (&lt;2 months) with fever → always REFER (golden cases) |
| Infant &lt;2 months with fever → always REFER | Zero false negatives on danger signs across all test cases |

---

### Opportunity 3 — Unclear treat pathway without diagnosis

**"I am unsure which drug to give without a diagnosis."**

| Solutions (v1) | Experiments |
|--------------|-------------|
| Three outputs: REFER / TREAT / TREAT_AND_MONITOR with urgency (immediate / same day) | Golden case: endemic malaria, no danger signs → TREAT (presumptive ACT) |
| Stock-aware drug and dosing plan on TREAT result | Golden case: cough + fast breathing → amoxicillin pathway |
| Symptom toggles: cough, diarrhea, fever duration in days | Golden case: uncomplicated fever → TREAT_AND_MONITOR with 3-day flag |

---

### Opportunity 4 — Distrust of opaque or "AI" decisions

**"I do not trust a black-box answer — I need to explain my decision to the patient."**

| Solutions (v1) | Experiments |
|--------------|-------------|
| Auditable, deterministic rule engine output (referral reasons, score components logged) | Safety architecture test: LLM explainer cannot override or contradict a REFER trigger |
| AI explainer narrates rule-engine output in plain language — never invents clinical facts | Sample explainer outputs reviewed for accuracy against rule output |
| Local encounter log: timestamp, inputs, decision saved on device | Encounter log captures full audit trail per triage |

---

### Opportunity 5 — Speed and low-literacy UX at bedside

**"I need to triage fast with one thumb — no time to read paragraphs."**

| Solutions (v1) | Experiments |
|--------------|-------------|
| Mobile-friendly Streamlit triage form, completable in under 60 seconds | Timed walkthrough: worker or proxy completes form → decision screen in &lt;60s |
| Tap-based checklist only — no free text required for core triage | Usability review: icon tiles readable on cracked phone in bright sunlight |
| One primary action button on result screen ("Give ACT" / "Refer now" / "Treat and schedule check-in") | Walkthrough confirms single clear next step per decision type |

---

## Solution → PRD §4 mapping

Every v1 solution above traces to an item in [what we ARE building](product-design-doc.md#4-scope-what-we-are-building-v1):

| PRD §4 item | Opportunity | Solution |
|-------------|-------------|----------|
| Mobile-friendly triage form (Streamlit MVP, &lt;60s) | Opp 5 | Tap-based form, one primary action |
| Deterministic WHO IMCI / iCCM rule engine | Opp 1 | `evaluate_febrile_patient`, age bands, endemicity branch |
| Danger-sign checklist hard-triggers REFER | Opp 2 | 8 icon tiles, REFER snap, neonate rule |
| Age-stratified fever logic + malaria endemicity | Opp 1, Opp 3 | Age bands, presumptive ACT |
| Result screen with one primary action button | Opp 3, Opp 5 | TREAT / REFER / TREAT_AND_MONITOR + action CTA |
| AI explainer (plain language, rule-narration only) | Opp 4 | Colleague-tone explainer below decision |
| 15+ golden clinical test cases | Opp 1, 2, 3 | All experiment rows above |
| Local encounter log | Opp 4 | Device storage per triage |

---

## Future opportunities (not v1)

These needs are real but explicitly **deferred** per [PRD §5](product-design-doc.md#5-scope-what-we-are-not-building). v1 delivers the point-of-care decision only; follow-up and population layers come later.

### Future opportunity A — Continuity of care

**"I treated a borderline case but have no way to follow up if they worsen."**

- **Future solutions:** Auto-schedule check-ins after TREAT_AND_MONITOR; SMS/push to a dedicated supervisor; escalation loop when patient reports "worse" or no reply.
- **Why deferred:** No SMS or push in v1. TREAT_AND_MONITOR is a decision flag, not a delivery system. Twilio wiring and escalation workflows are phase 2.

### Future opportunity B — Population intelligence

**"NGOs have no visibility into fever patterns in conflict zones."**

- **Future solutions:** Anonymous fever registry (clinic, age, symptoms, decision); epidemic/outbreak signals by geography and week; evidence for protocol tuning from field data.
- **Why deferred:** No central registry or cloud database in v1. Local encounter log only; registry must not block the core decision flow. Cloud sync is phase 2+.

*(Logistics and funding — stock forecasting, reorder hooks, NGO dashboard — is phase 3 per PRD §5.)*

---

## ASCII tree (full view)

```
Correct treat/refer decision in under 2 min (no lab)
│
├── Opp 1: "I cannot recall the full IMCI tree under pressure"
│   ├── Solution: Deterministic WHO IMCI rule engine (no LLM in decision path)
│   ├── Solution: Age-stratified fever + malaria endemicity branches
│   └── Experiment: 15+ golden cases; ≥90% expert agreement
│
├── Opp 2: "I might miss a danger sign and treat at home"
│   ├── Solution: 8 icon-only danger-sign tiles
│   ├── Solution: Hard REFER snap on any positive sign; neonate <2mo always refer
│   └── Experiment: Zero danger-sign false negatives in test suite
│
├── Opp 3: "I am unsure which drug to give without a diagnosis"
│   ├── Solution: REFER / TREAT / TREAT_AND_MONITOR with urgency + drug plan
│   ├── Solution: Presumptive ACT in endemic zones; symptom-based pathways
│   └── Experiment: Golden cases for malaria, pneumonia, uncomplicated fever
│
├── Opp 4: "I do not trust a black-box answer"
│   ├── Solution: Auditable rule output + local encounter log
│   ├── Solution: AI explainer narrates rules only (never overrides REFER)
│   └── Experiment: LLM cannot contradict REFER; explainer accuracy review
│
├── Opp 5: "I need to triage fast with one thumb"
│   ├── Solution: Tap checklist, no free text; Streamlit mobile form
│   ├── Solution: One primary action on result screen
│   └── Experiment: Timed walkthrough <60s; icon readability review
│
├── [Future] Opp A: "No way to follow up if they worsen"
│   └── Deferred: SMS, escalation loop (phase 2)
│
└── [Future] Opp B: "NGOs lack fever visibility in conflict zones"
    └── Deferred: Cloud registry, outbreak signals (phase 2+)
```

---

## Open questions affecting tree branches

From [PRD §8](product-design-doc.md#8-open-questions). Resolving these may add or trim solutions under Opportunities 1 and 3.

| Question | Branch affected |
|----------|-----------------|
| Primary population: under-5 only vs all ages? | Opp 1 age-stratification depth; adult qSOFA/NEWS2 vs full IMCI |
| Which malaria endemicity zone for demo? | Opp 3 presumptive ACT golden cases and endemicity default |
| Who handles TREAT_AND_MONITOR follow-up? | Future Opp A only in v1; affects phase 2 escalation design |
| Prototype for submission vs field deployment? | Experiment rigor (walkthrough proxy vs real clinic worker) |
| Drug scope: ACT only vs amoxicillin + paracetamol? | Opp 3 stock-aware drug plan and golden case coverage |

---

## Related artifacts

- [Product Design Doc](product-design-doc.md) — user, I/O contract, v1 scope, success criteria
- [README](../README.md) — clinical basis and decision engine API
- [Week 2.0 - Opportunity - Solution tree.docx](../Week%202.0%20-%20Opportunity%20-%20Solution%20tree.docx) — earlier capability tree (clinical value → continuity → registry → logistics)
