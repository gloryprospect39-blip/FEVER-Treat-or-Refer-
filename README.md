# Border clinic febrile triage

Non-laboratory **treat / refer** decision support for febrile patients of **all ages**, with a sepsis screening layer based on age, vitals, danger signs, and comorbidities.

## Clinical basis (screening only)

- **Under 5:** WHO IMCI danger signs
- **Neonates (<2 months):** any fever → immediate referral
- **Adolescents / adults:** qSOFA and NEWS2 (when vitals available)
- **All ages:** composite border-clinic score + comorbidity modifiers

This tool **does not diagnose sepsis**; it flags likely severe illness for referral.

## Setup

```bash
pip install -r requirements.txt
pytest tests/test_sepsis_screen.py -v
```

## Usage

```python
from decision_engine import evaluate_febrile_patient
from decision_engine.models import PatientContext, VitalSigns, DangerSigns

result = evaluate_febrile_patient(
    PatientContext(
        age_months=480,
        vitals=VitalSigns(temperature_c=39.2, respiratory_rate=24, systolic_bp=98),
    )
)
print(result.decision, result.sepsis.score, result.referral_reasons)
```

## Age bands

| Band | Age | Primary screen |
|------|-----|----------------|
| Neonate | <2 months | Hard refer if fever |
| Under 5 | 2–59 months | IMCI danger signs |
| Child | 5–12 years | Age-adjusted vitals + composite score |
| Adolescent | 12–18 years | qSOFA / NEWS2 + composite |
| Adult | 18–64 years | qSOFA / NEWS2 + composite |
| Elderly | ≥65 years | As adult + age risk points |

## Output decisions

- `REFER_IMMEDIATE` — danger sign or critical vitals
- `REFER` — elevated sepsis screen (qSOFA, NEWS2, composite, comorbidity)
- `TREAT_AND_MONITOR` — low-risk; schedule 3-day check-ins
- `TREAT` — no fever and low risk
