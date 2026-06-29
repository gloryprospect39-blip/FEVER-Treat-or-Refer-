# FeverGate — Engineering Design Doc

**Author:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-30
**Reviewers:** TBD

---

## 1. Summary

FeverGate is a non-laboratory treat-or-refer decision aid for febrile patients of all ages. The system is a deterministic Python rule engine (`evaluate_febrile_patient`) wrapped in a single-page Streamlit UI, managed with **uv** via `pyproject.toml`. There is no LLM in the decision path — the entire decision is a pure function over a typed `PatientContext`. The single most interesting engineering choices are **age-routed clinical pathways** (pediatric vs adult comorbidity capture), **guideline-linked treatment plans** on the result card (presumptive ACT, antibiotics when in stock), and **local encounter logging** as a non-blocking fever registry. Teleconsultation handoff (immediate call on REFER, scheduled call on TREAT_AND_MONITOR) is a UI integration layer on top of the deterministic engine.

## 2. Assumptions

- **Target scale:** Single worker on a single device per session; low hundreds of encounters/day per device. No concurrency, no multi-tenant load.
- **Latency budget:** The decision is a local pure function; p99 well under 10ms. The only perceptible latency is Streamlit's rerun, not the engine.
- **Platform:** Mobile-friendly web via Streamlit, run from a phone browser or a hosted demo. Not a native app; not yet an offline PWA.
- **Cost ceiling:** Effectively zero marginal cost per decision (no model calls, no cloud DB). Hosting a Streamlit demo is the only cost.
- **Pathway split:** 15 years is the product boundary between pediatric and adult pathways in the UI; engine uses finer age bands internally (neonate, under-5, 5–12, adolescent, adult, elderly).
- **Out of scope:** Multi-region real-time sync, accounts, lab/RDT integration, SMS/push notifications, central cloud registry, two-way in-app chat.

## 3. Goals & non-goals

**Goals (v1):**
- Deterministic, auditable engine returning `REFER_IMMEDIATE` / `REFER` / `TREAT_AND_MONITOR` / `TREAT` with referral reasons and **treatment-plan payloads** (drug, dose band, duration; stock- and endemicity-aware).
- Any positive IMCI danger sign, at any age and on either pathway, always yields a referral decision (the safety invariant).
- Neonate (<2 months) with fever always refers immediately.
- **Two UI pathways** derived from six age bands: pediatric (<15) with sickle cell + severe malnutrition; adult (15+) with full comorbidity grid.
- Optional vitals entry UI (BP, SpO₂, RR) feeding `VitalSigns` — engine already scores qSOFA/NEWS2 when present.
- Malaria endemicity + clinic stock context driving presumptive ACT on the TREAT branch.
- `build_patient_context()` filters comorbidities at the boundary per pathway.
- Result card with teleconsultation CTAs: immediate call (REFER), schedule call (TREAT_AND_MONITOR), start treatment (TREAT).
- **Local fever registry** — append-only SQLite or JSONL on device; write after card render, never on the critical path.
- A Streamlit triage form → result-card flow usable end-to-end in under 60 seconds on both pathways.
- Decision latency p99 < 10ms (local pure function); UI swap form→card with no wrong-color flash on referral.

**Non-goals (v1):**
- No LLM anywhere in the decision path — explanation narration is a later, non-deciding layer.
- No cloud sync or central registry — local log only.
- Designed for single-device use; will not scale to a shared multi-user backend without rework — and that's fine.
- No two-way clinician chat — teleconsultation is outbound call / schedule only.
- No separate engine binaries per pathway — one engine, pathway-aware inputs.

## 4. Architecture

```mermaid
flowchart TD
    worker["Health worker (phone browser)"]
    form["Streamlit form (app.py)"]
    pathways["pathways.py\nis_pediatric / is_adult"]
    comorb["comorbidity_options.py\ncomorbidity_options_for_band()"]
    tiles["danger_sign_labels.py\ndanger_sign_tiles_for_band()"]
    builder["build_patient_context()\nfilter_comorbidities_for_band()"]
    ctx["PatientContext (pydantic)"]
    engine["evaluate_febrile_patient()"]
    screen["assess_sepsis_risk()"]
    hard["_hard_referral_triggers()"]
    score["_composite_score / qSOFA / NEWS2"]
    decide["_decide_from_screen()"]
    result["FebrileAssessment"]
    reason["build_refer_reason()"]
    plan["build_treatment_plan()"]
    tele["teleconsultation CTA"]
    registry["local encounter log"]
    card["Result card"]

    worker --> form
    form --> pathways
    pathways -->|adult band| comorb
    pathways -->|any band| tiles
    comorb --> form
    tiles --> form
    form --> builder
    builder --> ctx
    ctx --> engine
    engine --> screen
    screen --> hard
    screen --> score
    hard --> decide
    score --> decide
    decide --> result
    result --> reason
    result --> plan
    reason --> card
    plan --> card
    card --> tele
    card --> registry
    tele --> worker
    registry --> worker
```

**What's here:**
- **Pathway router (`src/ui/pathways.py`)** — `PEDIATRIC_AGE_BANDS`, `ADULT_AGE_BANDS`, `is_pediatric_pathway()`, `is_adult_pathway()`; single source of truth for the <15 / 15+ split.
- **Streamlit app (`app.py`)** — renders form/result; shows comorbidity section only when `is_adult_pathway(band)`.
- **UI helpers (`src/ui/`)** — `danger_sign_labels.py` (tile metadata, same nine tiles per band), `patient_context.py` (form→model), `comorbidity_options.py` (organ-system toggles for adult pathway), `refer_reason.py` (human reason lines).
- **Decision engine (`src/decision_engine/`)** — `engine.py` orchestrator + `sepsis_screen.py` rules over `models.py`.

**What's deliberately NOT here:**
- No backend API or server — the engine is imported in-process.
- No cloud database — encounter state in `st.session_state` for the session; fever registry is local SQLite/JSONL only.
- No LLM / model service — the decision is a pure function.
- No auth / session service — one worker, one device, zero accounts.
- No duplicate engines per pathway — pathway differences are input gating + age-stratified scoring inside one engine.

## 5. Key components

### Pathway router — `src/ui/pathways.py`

- **Responsibility:** Define which age bands belong to the pediatric vs adult clinical pathway and expose predicate helpers for UI gating.
- **Tech choice:** Plain Python constants + functions.
- **Why this choice:** One module prevents drift between `app.py`, `comorbidity_options.py`, and `patient_context.py` on the 15-year boundary.
- **Interface:**

```python
PEDIATRIC_AGE_BANDS: frozenset[str]  # Under 2 mo, 2 mo–5 yr, 5–15 yr
ADULT_AGE_BANDS: frozenset[str]      # 15–17, 18–64, 65+
def is_pediatric_pathway(age_band: str) -> bool
def is_adult_pathway(age_band: str) -> bool
```

### Decision orchestrator — `src/decision_engine/engine.py`

- **Responsibility:** Turn a `PatientContext` into a `FebrileAssessment` (decision, urgency, monitoring days, deduped referral reasons, rationale).
- **Tech choice:** Plain Python + pydantic v2.
- **Why this choice:** Already in the stack; pydantic gives typed, validated inputs for free.
- **Interface:** `evaluate_febrile_patient(ctx: PatientContext) -> FebrileAssessment`.

### Sepsis / danger-sign screen — `src/decision_engine/sepsis_screen.py`

- **Responsibility:** Compute hard-referral triggers, age-stratified qSOFA/NEWS2, and a composite score, then resolve a decision + urgency.
- **Tech choice:** Pure functions, no I/O.
- **Why this choice:** Determinism and testability — every branch is reachable from a constructed `PatientContext`.
- **Interface:** `assess_sepsis_risk(ctx)`; internals `_hard_referral_triggers`, `_imci_danger_signs`, `_compute_qsofa`, `_compute_news2`, `_composite_score`, `_decide_from_screen`, `_age_band`.

### Comorbidity options — `src/ui/comorbidity_options.py`

- **Responsibility:** Define underlying-disease toggles grouped by organ system for adult pathway; reduced set (sickle cell, severe malnutrition) for pediatric pathway; filter submitted comorbidities at context build.
- **Tech choice:** Frozen dataclass list + `comorbidity_options_for_band()` / `filter_comorbidities_for_band()`.
- **Why this choice:** Keeps UI metadata out of `app.py`; enforces pathway-appropriate comorbidity capture even if Streamlit session state is stale.
- **Interface:** `COMORBIDITY_OPTIONS`, `PEDIATRIC_COMORBIDITY_OPTIONS`, `comorbidity_options_for_band(age_band) -> list[ComorbidityOption]`, `filter_comorbidities_for_band(age_band, comorbidities) -> list[Comorbidity]`, `options_by_system(age_band) -> dict[str, list[ComorbidityOption]]`.

### Patient context builder — `src/ui/patient_context.py`

- **Responsibility:** Map form selections (tiles, age band, fever) to a validated `PatientContext`; strip disallowed comorbidities for pediatric bands.
- **Tech choice:** Plain Python calling `filter_comorbidities_for_band()`.
- **Why this choice:** Boundary between UI state and engine input — the last place to enforce pathway rules.
- **Interface:** `build_patient_context(age_band, has_fever, fever_duration_days, selected_tiles, comorbidities=None) -> PatientContext`.

### Streamlit UI — `app.py` + `src/ui/`

- **Responsibility:** Render form/result, gate comorbidity block on `is_adult_pathway(band)`, build human reason line, manage form↔card state.
- **Tech choice:** Streamlit; `DANGER_SIGN_TILES` dataclass list for tile metadata.
- **Why this choice:** Fastest path to a mobile-friendly, deployable demo with no frontend build chain.
- **Interface:** `render_form()`, `render_result()`, `reset_to_form()`.

## 6. Data model

```python
# src/ui/pathways.py
AGE_BANDS: dict[str, int] = {
    "Under 2 months": 1,
    "2 months – 5 years": 24,
    "5–15 years": 96,
    "15–17 years": 192,
    "18–64 years": 480,
    "65+ years": 840,
}
PEDIATRIC_AGE_BANDS = frozenset({"Under 2 months", "2 months – 5 years", "5–15 years"})
ADULT_AGE_BANDS = frozenset({"15–17 years", "18–64 years", "65+ years"})

class Comorbidity(str, Enum):
    HIV = "hiv"
    IMMUNOSUPPRESSION = "immunosuppression"
    SEVERE_MALNUTRITION = "severe_malnutrition"
    SICKLE_CELL = "sickle_cell"
    CHRONIC_HEART_DISEASE = "chronic_heart_disease"
    CHRONIC_LUNG_DISEASE = "chronic_lung_disease"
    CHRONIC_KIDNEY_DISEASE = "chronic_kidney_disease"
    PREGNANCY = "pregnancy"
    RECENT_SURGERY_OR_WOUND = "recent_surgery_or_wound"

class DangerSigns(BaseModel):
    unable_to_drink_or_breastfeed: bool = False
    vomits_everything: bool = False
    convulsions: bool = False
    chest_indrawing: bool = False
    stiff_neck: bool = False
    bulging_fontanelle: bool = False
    severe_palmar_pallor: bool = False

class PatientContext(BaseModel):
    age_months: int = Field(ge=0)
    has_fever: bool = True
    fever_duration_days: int = Field(default=1, ge=0)
    consciousness: ConsciousnessLevel = ConsciousnessLevel.ALERT
    toxic_appearance: bool = False
    comorbidities: list[Comorbidity] = Field(default_factory=list)
    vitals: VitalSigns = Field(default_factory=VitalSigns)
    danger_signs: DangerSigns = Field(default_factory=DangerSigns)

class FebrileAssessment(BaseModel):
    sepsis: SepsisScreenResult
    decision: TriageDecision
    urgency: ReferralUrgency
    monitoring_days: int = 0
    referral_reasons: list[str] = Field(default_factory=list)
    rationale: list[str] = Field(default_factory=list)
```

**Notes:**
- No indexing / no tables — `st.session_state` holds the current `FebrileAssessment` only.
- Retention: session-scoped; cleared on "New patient" or browser close. No PII leaves the device.
- Pediatric pathway: `comorbidities` is always `[]` after `filter_comorbidities_for_band()`.
- Adult pathway: up to nine comorbidities flow into `_composite_score()`.
- `referral_reasons` are stable string codes (e.g. `imci:convulsions`, `neonate_fever`); human wording via `DANGER_SIGN_LABELS`.

## 7. API surface

FeverGate has no network API. The internal call graph:

### `evaluate_febrile_patient(ctx: PatientContext) -> FebrileAssessment`

- **Input:** A validated `PatientContext` (comorbidities empty on pediatric pathway).
- **Output:** `FebrileAssessment` with `decision`, `urgency`, `monitoring_days`, sorted/deduped `referral_reasons`, and `rationale`.
- **Errors:** Invalid inputs rejected at construction by pydantic.
- **Latency budget:** Pure CPU, no I/O; p99 < 10ms.

### `build_patient_context(...) -> PatientContext`

- **Input:** Age band label, fever flags, danger-sign tile map, optional `list[Comorbidity]`.
- **Output:** Validated `PatientContext` with pathway-filtered comorbidities.
- **Errors:** Unknown age band raises `KeyError` (Streamlit selectbox prevents this in normal use).
- **Latency budget:** Negligible.

### `is_adult_pathway(age_band: str) -> bool` / `comorbidity_options_for_band(age_band) -> list`

- **Input:** UI age band string.
- **Output:** Boolean gate for comorbidity UI; empty list for pediatric bands.
- **Errors:** Unknown band returns `False` / `[]` (no match in frozensets).
- **Latency budget:** Negligible.

### `build_refer_reason(referral_reasons: list[str], urgency: ReferralUrgency) -> str`

- **Input:** Engine reason codes + urgency enum.
- **Output:** One human line, e.g. `"Convulsions — refer immediately."`
- **Errors:** Unknown codes skipped; empty result falls back to `"Elevated severe-illness screen — refer immediately."`
- **Latency budget:** Negligible (string assembly).

## 8. Key trade-offs (with rejected alternatives)

### Decision: Pathway split at 15 years in UI vs. per-band bespoke forms

- **Chose:** Two pathways (`<15` pediatric, `15+` adult) over six age bands; comorbidity UI gated to adult only.
- **Considered:** Separate screens per age band; comorbidities on all bands; a manual "child/adult" toggle.
- **Why we picked this:** Matches clinical practice (IMCI for children, chronic-disease modifiers for adolescents/adults) without six different forms. A manual toggle duplicates what age band already communicates.

### Decision: Filter comorbidities at context build vs. trust UI gating alone

- **Chose:** `filter_comorbidities_for_band()` in `build_patient_context()` strips disallowed comorbidities.
- **Considered:** Rely on Streamlit not rendering the comorbidity block for pediatric bands.
- **Why we picked this:** Session state can be stale if a worker switches from adult to pediatric without resetting toggles. Defense in depth at the engine boundary.

### Decision: Deterministic rule engine vs. LLM-in-the-loop

- **Chose:** Pure-function rule engine; no model in the decision path.
- **Considered:** LLM that reads inputs and recommends treat/refer; hybrid where LLM adjusts rule output.
- **Why we picked this:** Safety must be auditable and reproducible on both pathways. An LLM can hallucinate "treat" over a danger sign.

### Decision: Apply IMCI danger signs at all ages vs. under-5 only

- **Chose:** Any positive IMCI danger sign hard-refers at every age on both pathways.
- **Considered:** Gating IMCI signs to neonate/under-5 (original protocol scope).
- **Why we picked this:** The safety promise is "a positive danger sign always refers." An age gate let a school-age child with chest indrawing fall through to TREAT_AND_MONITOR.

### Decision: Streamlit vs. custom web frontend

- **Chose:** Streamlit single-page app with conditional `st.subheader` for comorbidities.
- **Considered:** React/Next PWA; native mobile.
- **Why we picked this:** Ships a mobile-friendly UI with zero build chain for a submission timeline. We give up fine-grained snap animation control — acceptable for v1.

## 9. Risks & unknowns

- **Clinical correctness of thresholds** — Likelihood: med — Mitigation: pin behavior with golden tests; flag for clinician review before field use.
- **Pediatric pathway misses sick child with sickle cell** — Likelihood: low once pediatric comorbidity toggles ship — Mitigation: sickle cell + severe malnutrition on under-15 pathway; engine already scores these comorbidities.
- **Stale comorbidity session state after band switch** — Likelihood: low — Mitigation: `filter_comorbidities_for_band()` at context build.
- **Streamlit rerun flicker on form→card snap** — Likelihood: low — Mitigation: gate rendering on single `show_result` flag.
- **Reason wording drifts from engine codes** — Likelihood: low — Mitigation: `DANGER_SIGN_LABELS` consumed by both UI and tests.
- **Misuse as a diagnosis tool** — Likelihood: med — Mitigation: explicit "screening only" caption in UI.

## 10. Testing strategy

Runner: **pytest** via `uv run pytest tests/ -v`. Tests live in `tests/` with `pythonpath = ["src"]` in `pyproject.toml`. No browser automation, no visual regression.

**Unit tests (must have):**
- `is_pediatric_pathway()` / `is_adult_pathway()` in `pathways.py` — each of the three pediatric bands returns pediatric-only; each of the three adult bands returns adult-only; bands are mutually exclusive. **File:** `tests/test_pathways.py`
- `comorbidity_options_for_band()` — pediatric band returns sickle cell + severe malnutrition only; adult band returns all nine options. **File:** `tests/test_pathways.py`
- `filter_comorbidities_for_band()` — pediatric band drops `CHRONIC_HEART_DISEASE`; adult band preserves allowed values; pediatric band preserves `SICKLE_CELL`. **File:** `tests/test_pathways.py`
- `danger_sign_tiles_for_band()` — all six age bands return the same nine IMCI tiles. **File:** `tests/test_pathways.py`
- `_hard_referral_triggers(ctx)` in `sepsis_screen.py` — every IMCI danger sign produces its `imci:*` trigger at pediatric (24 mo, 96 mo) and adult (480 mo) ages. **File:** `tests/test_sepsis_internals.py`
- `_imci_danger_signs(ctx)` — each `DangerSigns` boolean and `ConsciousnessLevel.LETHARGIC` / `UNCONSCIOUS` maps to the expected trigger code. **File:** `tests/test_sepsis_internals.py`
- `_age_band(age_months)` — boundaries: 1→neonate, 2→under5, 59/60, 144, 216, 780→elderly. **File:** `tests/test_sepsis_internals.py`
- `_compute_qsofa(ctx)` — returns `None` under 12 years (pediatric engine band); for adults, ≥2 when lethargic + low SBP + high RR combine. **File:** `tests/test_sepsis_internals.py`
- `_compute_news2(ctx)` — returns `None` when RR missing or under 12 years; high derangement pushes score ≥7 for adults. **File:** `tests/test_sepsis_internals.py`
- `_composite_score(ctx)` — neonate age points, hypothermia, lethargy, comorbidities (HIV + pregnancy on adult pathway), prolonged fever, toxic appearance surface in `score_components`. **File:** `tests/test_sepsis_internals.py`
- `evaluate_febrile_patient(ctx)` — `monitoring_days == 3` only for `TREAT_AND_MONITOR`; `referral_reasons` sorted and deduplicated. **File:** `tests/test_engine.py`
- `build_refer_reason(reasons, urgency)` — `["imci:convulsions"]` + IMMEDIATE → `"Convulsions — refer immediately."`; dedupe; unknown-only fallback. **File:** `tests/test_refer_reason.py`
- `DANGER_SIGN_LABELS` — every `imci:*` code emitted by `_imci_danger_signs` has a label entry. **File:** `tests/test_sepsis_internals.py`
- Parametrized danger-sign safety net — 9 signs × 2 age bands (pediatric 96 mo + adult 480 mo) → always REFER/REFER_IMMEDIATE. **File:** `tests/test_danger_signs.py`

**Integration tests (one per major flow):**
- **Pediatric danger-sign refer flow** — convulsions at age 24 mo via `build_patient_context(age_band="2 months – 5 years", ...)` → `REFER_IMMEDIATE` with `imci:convulsions`. **File:** `tests/test_integration_flows.py`
- **Neonate fever refer flow** — age 1 with fever → `REFER_IMMEDIATE` with `neonate_fever`. **File:** `tests/test_integration_flows.py`
- **Pediatric uncomplicated fever monitor flow** — under-5, mild vitals, no danger signs, no comorbidities → `TREAT_AND_MONITOR`, `monitoring_days == 3`. **File:** `tests/test_integration_flows.py`
- **Adult comorbidity + deterioration flow** — `build_patient_context(age_band="18–64 years", comorbidities=[CHRONIC_LUNG_DISEASE])` with qSOFA-positive vitals → `REFER` or `REFER_IMMEDIATE`. **File:** `tests/test_integration_flows.py`
- **Pediatric pathway strips stale comorbidities** — `build_patient_context(age_band="5–15 years", comorbidities=[CHRONIC_HEART_DISEASE])` → `ctx.comorbidities == []`. **File:** `tests/test_integration_flows.py` (or `tests/test_pathways.py`)

**Deliberately not tested (and why):**
- Streamlit rendering, CSS, comorbidity progressive-disclosure visibility, and the snap transition — visual/runtime UI; verified by human walkthrough.
- `options_by_system()` grouping order and emoji icons — presentational; enum mapping is what matters clinically.
- Exact composite-score arithmetic beyond documented thresholds — we test decision boundaries and component presence, not every internal point value.
- pydantic's own validation internals — trust the library.
- Clinical accuracy of WHO thresholds — clinician review, not a unit test.
- Gemini / LLM API calls — no LLM in v1 decision path; nothing to mock.

**Stack default:** Python → `pytest`. Run: `uv run pytest tests/ -v`. Current suite: **100 tests, all passing**.

## 11. Rollout & monitoring

- **Rollout:** Hosted Streamlit demo for submission/review first; supervised pilot only after clinician sign-off.
- **Feature flags:** None in v1 — both pathways ship together.
- **Monitoring:** In a pilot: refer-rate by pathway (pediatric vs adult), any human-reported false negative (page-worthy), form-completion time (<60s UX bar).
- **Rollback plan:** Redeploy previous commit or take demo offline. No data migration.

## 12. Cost & capacity

- **Per-decision cost:** ~$0 — pure local computation, no model calls.
- **Monthly budget at v1 scale:** Cost of hosting one Streamlit instance only. Effectively negligible.
- **What breaks at 10× scale:** Nothing about the decision (CPU-trivial). Multi-clinic shared encounter data is the first revisit — deliberately not designed now.

## 13. Open questions

- [ ] Teleconsultation integration: `tel:` URI, third-party VoIP SDK, or manual queue number? — Product + Eng
- [ ] Local registry format: SQLite vs JSONL vs browser IndexedDB wrapper — Eng
- [ ] Should switching age band clear comorbidity session state immediately? — UX + Eng
- [ ] Which malaria-endemicity / presumptive-treatment rules and stock drugs enter the TREAT branch? — Clinical reviewer
- [ ] Vitals UI: collapsed expander vs always-visible fields? — UX

## 14. Out of scope (will not do)

- **No backend service or REST API** — engine imported in-process.
- **No cloud registry or sync** — local fever log only; must not block the bedside decision.
- **No LLM in the decision** — only ever a non-deciding explanation layer, later.
- **No lab/RDT input, SMS/push notifications, accounts** — explicit product non-goals.
- **No two-way in-app clinician chat** — teleconsultation is call/schedule only.
- **No separate pediatric/adult engine forks** — one engine, pathway-aware inputs.
- **No offline-installable PWA in v1** — Streamlit demo first.
