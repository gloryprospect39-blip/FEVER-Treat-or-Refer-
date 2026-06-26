"""Map UI form selections to a PatientContext for the decision engine."""

from __future__ import annotations

from decision_engine.models import ConsciousnessLevel, DangerSigns, PatientContext, VitalSigns
from ui.danger_sign_labels import DANGER_SIGN_TILES

AGE_BANDS: dict[str, int] = {
    "Under 2 months": 1,
    "2 months \u2013 5 years": 24,
    "5\u201315 years": 96,
    "Adult": 480,
}


def build_patient_context(
    age_band: str,
    has_fever: bool,
    fever_duration_days: int,
    selected_tiles: dict[str, bool],
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

    return PatientContext(
        age_months=AGE_BANDS[age_band],
        has_fever=has_fever,
        fever_duration_days=fever_duration_days,
        consciousness=consciousness,
        danger_signs=DangerSigns(**danger_kwargs),
        vitals=VitalSigns(),
    )
