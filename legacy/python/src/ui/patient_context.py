"""Map UI form selections to a PatientContext for the decision engine."""

from __future__ import annotations

from decision_engine.models import (
    Comorbidity,
    ConsciousnessLevel,
    DangerSigns,
    PatientContext,
    VitalSigns,
)
from ui.comorbidity_options import filter_comorbidities_for_band
from ui.danger_sign_labels import danger_sign_tiles_for_band
from ui.pathways import (
    ADULT_AGE_BANDS,
    AGE_BANDS,
    COMORBIDITY_AGE_BANDS,
    PEDIATRIC_AGE_BANDS,
    is_adult_pathway,
    is_pediatric_pathway,
)

__all__ = [
    "AGE_BANDS",
    "ADULT_AGE_BANDS",
    "COMORBIDITY_AGE_BANDS",
    "PEDIATRIC_AGE_BANDS",
    "build_patient_context",
    "is_adult_pathway",
    "is_pediatric_pathway",
]


def _danger_sign_tiles_for_pathway(pathway_label: str):
    from ui.danger_sign_labels import danger_sign_tiles_for_pathway

    return danger_sign_tiles_for_pathway(pathway_label)


def build_patient_context(
    age_band: str,
    has_fever: bool,
    fever_duration_days: int,
    selected_tiles: dict[str, bool],
    comorbidities: list[Comorbidity] | None = None,
    systolic_bp: int | None = None,
    spo2_percent: int | None = None,
    respiratory_rate: int | None = None,
    temperature_c: float | None = None,
    heart_rate: int | None = None,
    *,
    pathway: str | None = None,
) -> PatientContext:
    danger_kwargs: dict[str, bool] = {}
    consciousness = ConsciousnessLevel.ALERT

    tiles = (
        _danger_sign_tiles_for_pathway(pathway)
        if pathway is not None
        else danger_sign_tiles_for_band(age_band)
    )
    for tile in tiles:
        if not selected_tiles.get(tile.trigger_code):
            continue
        if tile.danger_field:
            danger_kwargs[tile.danger_field] = True
        if tile.consciousness == ConsciousnessLevel.UNCONSCIOUS:
            consciousness = ConsciousnessLevel.UNCONSCIOUS
        elif (
            tile.consciousness == ConsciousnessLevel.LETHARGIC
            and consciousness != ConsciousnessLevel.UNCONSCIOUS
        ):
            consciousness = ConsciousnessLevel.LETHARGIC

    allowed_comorbidities = filter_comorbidities_for_band(
        age_band, comorbidities or []
    )

    # A measured temperature is authoritative for fever when the worker recorded it.
    resolved_fever = has_fever
    if temperature_c is not None:
        resolved_fever = temperature_c >= 38.0

    return PatientContext(
        age_months=AGE_BANDS[age_band],
        has_fever=resolved_fever,
        fever_duration_days=fever_duration_days,
        consciousness=consciousness,
        comorbidities=allowed_comorbidities,
        danger_signs=DangerSigns(**danger_kwargs),
        vitals=VitalSigns(
            temperature_c=temperature_c,
            heart_rate=heart_rate,
            systolic_bp=systolic_bp,
            spo2_percent=spo2_percent,
            respiratory_rate=respiratory_rate,
        ),
    )
