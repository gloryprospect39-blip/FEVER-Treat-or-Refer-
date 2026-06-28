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
uv sync
uv run streamlit run app.py
uv run pytest tests/ -v
```

Dependencies are managed with [uv](https://docs.astral.sh/uv/) via `pyproject.toml`.

The Streamlit app (`app.py`) is the point-of-care triage UI: a mobile-first
single page with the 8 IMCI danger-sign tiles, an age band selector, and a fever
toggle. On submit it calls the decision engine and shows a full-width **REFER
snap screen** (red card with a named reason for referral, amber for treat &
monitor, green for treat).

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

The Streamlit form uses six age bands (including split adolescent / adult / elderly) and shows **underlying disease** toggles by organ system (heart, lungs, kidneys, etc.) for patients aged 15 and older.

## Output decisions

- `REFER_IMMEDIATE` — danger sign or critical vitals
- `REFER` — elevated sepsis screen (qSOFA, NEWS2, composite, comorbidity)
- `TREAT_AND_MONITOR` — low-risk; schedule 3-day check-ins
- `TREAT` — no fever and low risk
