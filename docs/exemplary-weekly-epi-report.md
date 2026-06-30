# FeverGate — Exemplary Weekly Epidemiologic Report

**Clinic:** Border Outpost Clinic B  
**Catchment:** Upper Kivu corridor (7 villages reporting)  
**Reporting week:** 23–29 June 2026 (ISO week 26)  
**Prepared by:** Community health worker team  
**Data source:** Local encounter log (`data/encounters.jsonl`) + patient registry (`data/fevergate.db`)  
**Note:** Screening counts only — not confirmed diagnoses. No lab/RDT in this workflow.

---

## 1. Executive summary

| Indicator | This week | Prior week | Change |
|-----------|-----------|------------|--------|
| Total febrile encounters | **84** | 71 | +18% |
| Unique catchments reporting | **7** | 6 | +1 |
| Referral rate (REFER + REFER_IMMEDIATE) | **29%** (24/84) | 24% | +5 pp |
| Danger-sign–triggered referrals | **12** | 9 | +3 |
| Treat & monitor (3-day re-check) | **38%** (32/84) | 41% | −3 pp |
| Encounters with patient name linked | **61%** (51/84) | — | — |
| Return visits (linked registry id) | **14** | 11 | +3 |

**Signal this week:** Referral rate rose in **Hill Settlement** and **River Crossing**; convulsions and neonate fever referrals clustered in pediatric under-5s. No stock-out of ACT; amoxicillin was out of stock Tue–Thu.

---

## 2. Encounters by village / catchment

| Village / catchment | Encounters | % of total | Referrals | Referral rate | TREAT & MONITOR |
|---------------------|------------|------------|-----------|---------------|-----------------|
| Hill Settlement | 22 | 26% | 9 | 41% | 8 |
| River Crossing | 18 | 21% | 6 | 33% | 7 |
| Border Camp A | 15 | 18% | 3 | 20% | 6 |
| East Ridge | 12 | 14% | 2 | 17% | 5 |
| Valley Hamlet | 9 | 11% | 2 | 22% | 4 |
| North Fields | 5 | 6% | 1 | 20% | 1 |
| Zulu Camp | 3 | 4% | 1 | 33% | 1 |
| **Total** | **84** | **100%** | **24** | **29%** | **32** |

**Interpretation:** Hill Settlement contributed more than a quarter of volume and had the highest referral rate — worth a supervisor call-down, not necessarily an outbreak (small denominators).

---

## 3. Age pattern (clinical age from triage)

| Age group | Encounters | Referrals | Referral rate | Top trigger |
|-----------|------------|-----------|---------------|-------------|
| Neonate (&lt;2 months) | 4 | 4 | 100% | Neonate with fever (policy) |
| Under 5 (2 mo–5 yr) | 38 | 11 | 29% | Convulsions (4), chest indrawing (3) |
| Child 5–15 yr | 14 | 3 | 21% | Lethargic (2) |
| Adolescent / adult 15+ | 28 | 6 | 21% | qSOFA / NEWS2 screen (4) |

---

## 4. Syndrome screen (danger signs — any age)

| Danger sign (positive) | Count | % of all encounters | Always referred? |
|----------------------|-------|---------------------|------------------|
| Convulsions | 5 | 6% | Yes (12/12 policy checks passed) |
| Chest indrawing | 4 | 5% | Yes |
| Unable to drink / breastfeed | 3 | 4% | Yes |
| Lethargic | 2 | 2% | Yes |
| Severe palmar pallor | 2 | 2% | Yes |
| *No danger sign* | 68 | 81% | — |

---

## 5. Decision mix

```
REFER_IMMEDIATE  ████████░░░░░░░░░░░░  14  (17%)
REFER            ██████░░░░░░░░░░░░░░  10  (12%)
TREAT & MONITOR  ████████████████░░░░  32  (38%)
TREAT            ████████░░░░░░░░░░░░  28  (33%)
```

---

## 6. Malaria-endemic context (clinic session setting)

| Setting | Encounters | Presumptive ACT on treat/monitor path |
|---------|------------|--------------------------------------|
| High endemicity + ACT in stock | 79 | 41 plans included ACT |
| High endemicity + ACT out of stock | 0 | 0 |
| Low endemicity | 5 | 0 ACT plans |

---

## 7. Revisit / registration linkage

| Metric | Count |
|--------|-------|
| Encounters with catchment only (no name) | 33 |
| Encounters with name + catchment | 51 |
| Linked to registry patient id | 14 |
| New registry patients this week | 19 |
| Patients with ≥2 visits (ever) | 8 |

**Revisit example:** Amina Yusuf · Border Camp A — visit #3 on 28 Jun (TREAT & MONITOR after visit #2 refer).

---

## 8. Referral reasons (top codes)

| Reason code | Label | Count |
|-------------|-------|-------|
| `imci:convulsions` | Convulsions | 5 |
| `neonate_fever` | Neonate with fever | 4 |
| `imci:chest_indrawing` | Chest indrawing | 4 |
| `qsofa>=2` | Elevated qSOFA | 4 |
| `composite_sepsis_score>=3` | Composite screen | 3 |

---

## 9. Data quality & limitations (honest footer)

- **Catchment recorded:** 84/84 (100%) — required field  
- **Name recorded:** 51/84 (61%) — optional; improves revisit linkage  
- **No lab confirmation:** counts reflect *triage screens*, not malaria/typhoid incidence  
- **Duplicate persons:** same name in two villages may be two people or one error — use registry id when available  
- **Coverage:** only patients who reached this clinic; not population denominators → rates are *clinic-based*, not true community incidence  
- **Privacy:** report aggregated for supervision; raw log stays on device  

---

## 10. Suggested actions for next week

1. **Supervisor review** of Hill Settlement referral cluster (9/22).  
2. **Restock amoxicillin** before rainy-season cough/fever peak.  
3. **Re-check cohort:** 32 patients flagged TREAT & MONITOR — 14 named; prioritize named returns for teleconsultation scheduling.  
4. **Continue** requiring catchment on every encounter; encourage name when worker has time (improves revisit epi).

---

*Generated from FeverGate local logs. Example numbers are illustrative for training and supervision layout.*
