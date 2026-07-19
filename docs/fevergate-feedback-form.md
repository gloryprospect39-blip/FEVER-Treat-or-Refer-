# FeverGate — Feedback Form (Four Audiences)

**Project:** FeverGate — treat-or-refer fever triage for border / conflict clinics  
**Purpose:** Collect structured feedback after a demo or 90-second pitch  
**Time:** ~5–8 minutes per respondent  
**Scale (unless noted):** 1 = Strongly disagree · 2 = Disagree · 3 = Neutral · 4 = Agree · 5 = Strongly agree

---

## Shared header (all audiences)

| Field | Response |
|-------|----------|
| Date | |
| Name (optional) | |
| Role / audience (circle one) | Expert · Medic · Computer science · General public |
| How you saw FeverGate | Live demo · Pitch only · Screen recording · Other: ____ |
| Country / context (optional) | |

---

## 1. For experts  
*(clinical / public-health / guideline reviewers)*

**Focus:** Clinical validity, safety limits, audit readiness.

### Ratings

| # | Statement | 1–5 |
|---|-----------|-----|
| E1 | The four outcomes (TREAT / TREAT_AND_MONITOR / REFER / REFER_IMMEDIATE) are clinically meaningful for fever triage without labs. | |
| E2 | The danger-sign → always-refer rule is an appropriate safety invariant. | |
| E3 | Age-routed pathways (pediatric vs adult comorbidities) match how you would want screening structured. | |
| E4 | Stock- and endemicity-aware treatment guidance is useful *if clearly labeled as screening support, not diagnosis*. | |
| E5 | I would recommend a formal clinical audit before any field pilot. | |

### Open questions

1. Which rule or pathway would you challenge first, and why?  
   _________________________________________________________________
2. What evidence would convince you the tool is safe enough for supervised pilot use?  
   _________________________________________________________________
3. What must be true about patient-data handling before you would endorse wider use?  
   _________________________________________________________________
4. Who should own clinical governance for TREAT_AND_MONITOR follow-up?  
   _________________________________________________________________
5. One change you would require before the next review:  
   _________________________________________________________________

**Overall expert verdict (circle one):** Not ready · Needs major revision · Ready for supervised audit · Ready for limited pilot

---

## 2. For medics  
*(community health workers, nurses, clinic staff who would use it at the bedside)*

**Focus:** Speed, clarity under pressure, fit to real clinic work.

### Ratings

| # | Statement | 1–5 |
|---|-----------|-----|
| M1 | I understood what to do after seeing the result card. | |
| M2 | I could complete a typical fever encounter in under one minute. | |
| M3 | The language and labels match how we talk about fever cases in clinic. | |
| M4 | This would help me miss fewer evaluation steps when the clinic is busy or unsafe. | |
| M5 | I would trust this enough to use it with a supervisor nearby. | |

### Open questions

1. In your setting, what usually causes a fever evaluation to be skipped or left unfinished?  
   _________________________________________________________________
2. Which part of the flow was hardest: age band, danger signs, vitals, comorbidities, or result card?  
   _________________________________________________________________
3. Would you use this offline / on a shared phone? What would block you?  
   _________________________________________________________________
4. Does the result tell you a clear next action (treat, re-check, call, refer)? What is still unclear?  
   _________________________________________________________________
5. One thing that would make you use this tomorrow:  
   _________________________________________________________________

**Would you use FeverGate in your next fever case? (circle one):** No · Maybe · Yes, with training · Yes

---

## 3. For people with computer science knowledge  
*(engineers, product/tech reviewers, CS students)*

**Focus:** Architecture trust, determinism, data safety, limits of the demo.

### Ratings

| # | Statement | 1–5 |
|---|-----------|-----|
| C1 | A deterministic rule engine (no LLM in the decision path) is the right architecture for this safety-critical triage. | |
| C2 | The decision outputs are clear enough to test with golden cases / automated checks. | |
| C3 | Local-only encounter logging is a reasonable v1 choice for conflict / low-connectivity settings. | |
| C4 | The demo makes its limits obvious (what it does *not* prove). | |
| C5 | Patient-data safety and auditability look designed in, not bolted on later. | |

### Open questions

1. What is the highest-risk failure mode you see (wrong refer, wrong treat, data leak, untestable rules, UI skip)?  
   _________________________________________________________________
2. What would you instrument or log to support clinical audit without blocking the bedside path?  
   _________________________________________________________________
3. How should versioning of clinical rules be handled (who changes them, how are diffs reviewed)?  
   _________________________________________________________________
4. What would you require before syncing any patient or encounter data off-device?  
   _________________________________________________________________
5. One technical debt item to fix before pilot:  
   _________________________________________________________________

**Tech readiness (circle one):** Prototype only · Demo-credible · Audit-ready · Pilot-ready (infra)

---

## 4. For general population  
*(patients’ families, community members, non-clinical / non-technical public)*

**Focus:** Plain understanding, trust, fairness, what “help” means.

### Ratings

| # | Statement | 1–5 |
|---|-----------|-----|
| G1 | I understand what FeverGate is for in simple words. | |
| G2 | I understand it helps a medic decide faster — it does not replace a doctor or a lab test. | |
| G3 | I would feel safer if my local clinic used a tool like this *with* a trained medic. | |
| G4 | I care that my / my family’s health details stay private on the clinic device. | |
| G5 | The pitch was clear about what still needs improvement. | |

### Open questions

1. In one sentence, what do you think FeverGate does?  
   _________________________________________________________________
2. What would worry you if a clinic used this tool?  
   _________________________________________________________________
3. What would make you trust it more (training, doctor review, government approval, community explanation)?  
   _________________________________________________________________
4. Should families be told when this tool was used in their care? Why or why not?  
   _________________________________________________________________
5. One question you still have:  
   _________________________________________________________________

**Trust level (circle one):** Do not trust · Unsure · Cautious trust · Trust with oversight

---

## Optional closing (all audiences)

| Question | Response |
|----------|----------|
| Most useful part of FeverGate | |
| Biggest risk or gap | |
| Who should we talk to next? | |
| May we contact you for a follow-up? | Yes / No · Contact: ________ |

**Thank you.** Your feedback informs clinical audit priorities, medic training, technical hardening, and public communication — not marketing claims.
