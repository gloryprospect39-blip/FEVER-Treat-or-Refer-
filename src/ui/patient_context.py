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
from ui.danger_sign_labels import DANGER_SIGN_TILES
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


def build_patient_context(
    age_band: str,
    has_fever: bool,
    fever_duration_days: int,
    selected_tiles: dict[str, bool],
    comorbidities: list[Comorbidity] | None = None,
) -> PatientContext:
    danger_kwargs: dict[str, bool] = {}
    consciousness = ConsciousnessLevel.ALERT

    for tile in DANGER_SIGN_TILES:
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

    return PatientContext(
        age_months=AGE_BANDS[age_band],
        has_fever=has_fever,
        fever_duration_days=fever_duration_days,
        consciousness=consciousness,
        comorbidities=allowed_comorbidities,
        danger_signs=DangerSigns(**danger_kwargs),
        vitals=VitalSigns(),
    )
