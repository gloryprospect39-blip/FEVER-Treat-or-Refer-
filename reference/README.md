# Reference patterns — FeverGate

Engineering conventions for this project. The eng-design-doc skill and implementation prompts use these as guidance.

## Layout

```
app.py                    # Streamlit entry — form ↔ result state machine
src/
  decision_engine/        # Pure rule engine (no I/O, no UI imports)
    engine.py             # evaluate_febrile_patient() orchestrator
    sepsis_screen.py      # Hard-refer triggers, qSOFA, NEWS2, composite
    models.py             # pydantic types + DANGER_SIGN_LABELS
  ui/                     # Form → model mapping, labels, plans, logging
    pathways.py           # <15 / 15+ split — single source of truth
    patient_context.py    # build_patient_context() boundary
    danger_sign_labels.py # Tile metadata → DangerSigns / consciousness
    comorbidity_options.py
    treatment_plan.py
    encounter_log.py
    teleconsultation.py
    clinic_context.py
  explainer/              # Optional Gemini narration — NOT in decision path
tests/                    # pytest; one integration test per major flow
```

## Rules

1. **Decision path is pure.** `evaluate_febrile_patient(ctx)` takes `PatientContext`, returns `FebrileAssessment`. No network, no LLM, no Streamlit.
2. **Pathway gating at the boundary.** UI may hide comorbidities for pediatric bands, but `filter_comorbidities_for_band()` in `build_patient_context()` is the defense-in-depth layer.
3. **Stable reason codes.** Engine emits codes like `imci:convulsions`, `neonate_fever`. Human wording lives in `DANGER_SIGN_LABELS` and `build_refer_reason()`.
4. **One label map.** Tile labels, referral reasons, and tests all consume `DANGER_SIGN_LABELS` — never duplicate strings.
5. **Session state is UI-only.** `st.session_state` holds the current assessment; persistent registry is append-only JSONL via `log_encounter()`.

## Module pattern — pure engine function

```python
def evaluate_febrile_patient(ctx: PatientContext) -> FebrileAssessment:
    sepsis = assess_sepsis_risk(ctx)
    referral_reasons = list(sepsis.hard_referral_triggers)
    # ... enrich reasons, build rationale ...
    return FebrileAssessment(
        sepsis=sepsis,
        decision=sepsis.decision,
        urgency=sepsis.urgency,
        monitoring_days=MONITORING_DAYS[sepsis.decision],
        referral_reasons=sorted(set(referral_reasons)),
        rationale=rationale,
    )
```

## Module pattern — UI boundary builder

```python
def build_patient_context(
    age_band: str,
    has_fever: bool,
    fever_duration_days: int,
    selected_tiles: dict[str, bool],
    comorbidities: list[Comorbidity] | None = None,
    systolic_bp: int | None = None,
    spo2_percent: int | None = None,
    respiratory_rate: int | None = None,
) -> PatientContext:
    # Map tiles → DangerSigns + ConsciousnessLevel
    allowed = filter_comorbidities_for_band(age_band, comorbidities or [])
    return PatientContext(
        age_months=AGE_BANDS[age_band],
        has_fever=has_fever,
        fever_duration_days=fever_duration_days,
        consciousness=consciousness,
        comorbidities=allowed,
        vitals=VitalSigns(...),
        danger_signs=DangerSigns(**danger_kwargs),
    )
```

## Module pattern — pathway constants

```python
PEDIATRIC_AGE_BANDS: frozenset[str] = frozenset({...})
ADULT_AGE_BANDS: frozenset[str] = frozenset({...})

def is_pediatric_pathway(age_band: str) -> bool:
    return age_band in PEDIATRIC_AGE_BANDS
```

## Test pattern — unit (pure function)

```python
def test_filter_comorbidities_for_band_pediatric_drops_adult_only():
    result = filter_comorbidities_for_band(
        "5–15 years",
        [Comorbidity.CHRONIC_HEART_DISEASE, Comorbidity.SICKLE_CELL],
    )
    assert result == [Comorbidity.SICKLE_CELL]
```

## Test pattern — integration (major flow)

```python
def test_pediatric_pathway_strips_stale_adult_comorbidities():
    ctx = build_patient_context(
        age_band="5–15 years",
        has_fever=True,
        fever_duration_days=1,
        selected_tiles={},
        comorbidities=[Comorbidity.CHRONIC_HEART_DISEASE],
    )
    assert ctx.comorbidities == []
    result = evaluate_febrile_patient(ctx)
    assert result.decision == TriageDecision.TREAT_AND_MONITOR  # or as scenario dictates
```

## Test pattern — parametrized safety net

```python
@pytest.mark.parametrize("sign_field", DANGER_SIGN_FIELDS)
@pytest.mark.parametrize("age_months", [96, 480])
def test_any_danger_sign_always_refers(sign_field, age_months):
    ctx = PatientContext(age_months=age_months, danger_signs=DangerSigns(**{sign_field: True}))
    assert evaluate_febrile_patient(ctx).decision in {TriageDecision.REFER, TriageDecision.REFER_IMMEDIATE}
```

## Test pattern — mock external API

```python
@pytest.fixture
def gemini_stub():
    stub = MagicMock()
    stub.generate_content.return_value = MagicMock(text="...")
    return stub

def test_narrate_assessment(monkeypatch, gemini_stub):
    monkeypatch.setattr("explainer.narrate.get_client", lambda: gemini_stub)
    assert "Treat" in narrate_assessment(sample_assessment)
```

## Deliberately not tested

- Streamlit rendering, CSS, animations
- Third-party SDK internals
- Clinical accuracy of WHO thresholds (clinician review)
- Generated AI content quality (test the call, not the prose)

## Commands

```bash
uv sync
uv run streamlit run app.py
uv run pytest tests/ -v
```
