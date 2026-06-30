"""Underlying-disease toggles grouped by organ system for the triage form."""

from __future__ import annotations

from dataclasses import dataclass

from decision_engine.models import Comorbidity

from ui.pathways import is_adult_pathway, is_pediatric_pathway


@dataclass(frozen=True)
class ComorbidityOption:
    comorbidity: Comorbidity
    system: str
    icon: str
    label: str


PEDIATRIC_COMORBIDITY_OPTIONS: list[ComorbidityOption] = [
    ComorbidityOption(
        Comorbidity.SICKLE_CELL,
        "Blood",
        "\U0001fa78",
        "Sickle cell disease",
    ),
    ComorbidityOption(
        Comorbidity.SEVERE_MALNUTRITION,
        "Nutrition",
        "\U0001f963",
        "Severe malnutrition",
    ),
]

COMORBIDITY_OPTIONS: list[ComorbidityOption] = [
    ComorbidityOption(
        Comorbidity.CHRONIC_HEART_DISEASE,
        "Heart",
        "\U0001fac0",
        "Chronic heart disease",
    ),
    ComorbidityOption(
        Comorbidity.CHRONIC_LUNG_DISEASE,
        "Lungs",
        "\U0001fac1",
        "Chronic lung disease",
    ),
    ComorbidityOption(
        Comorbidity.CHRONIC_KIDNEY_DISEASE,
        "Kidneys",
        "\U0001fa78",
        "Chronic kidney disease",
    ),
    ComorbidityOption(
        Comorbidity.HIV,
        "Immune",
        "\U0001f9ec",
        "HIV",
    ),
    ComorbidityOption(
        Comorbidity.IMMUNOSUPPRESSION,
        "Immune",
        "\U0001f9f4",
        "Immunosuppression",
    ),
    ComorbidityOption(
        Comorbidity.SICKLE_CELL,
        "Blood",
        "\U0001fa78",
        "Sickle cell disease",
    ),
    ComorbidityOption(
        Comorbidity.SEVERE_MALNUTRITION,
        "Nutrition",
        "\U0001f963",
        "Severe malnutrition",
    ),
    ComorbidityOption(
        Comorbidity.PREGNANCY,
        "Other",
        "\U0001f930",
        "Pregnancy",
    ),
    ComorbidityOption(
        Comorbidity.RECENT_SURGERY_OR_WOUND,
        "Other",
        "\U0001fa79",
        "Recent surgery or wound",
    ),
]


def comorbidity_options_for_band(age_band: str) -> list[ComorbidityOption]:
    """Pediatric pathway: sickle cell + severe malnutrition. Adult: full grid."""
    if is_adult_pathway(age_band):
        return list(COMORBIDITY_OPTIONS)
    if is_pediatric_pathway(age_band):
        return list(PEDIATRIC_COMORBIDITY_OPTIONS)
    return []


def filter_comorbidities_for_band(
    age_band: str, comorbidities: list[Comorbidity]
) -> list[Comorbidity]:
    allowed = {option.comorbidity for option in comorbidity_options_for_band(age_band)}
    return [comorbidity for comorbidity in comorbidities if comorbidity in allowed]


def options_by_system(age_band: str | None = None) -> dict[str, list[ComorbidityOption]]:
    options = (
        comorbidity_options_for_band(age_band)
        if age_band is not None
        else list(COMORBIDITY_OPTIONS)
    )
    grouped: dict[str, list[ComorbidityOption]] = {}
    for option in options:
        grouped.setdefault(option.system, []).append(option)
    return grouped
