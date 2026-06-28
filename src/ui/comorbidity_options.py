"""Underlying-disease toggles grouped by organ system for the triage form."""

from __future__ import annotations

from dataclasses import dataclass

from decision_engine.models import Comorbidity


@dataclass(frozen=True)
class ComorbidityOption:
    comorbidity: Comorbidity
    system: str
    icon: str
    label: str


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

# Age bands where system-wise comorbidity capture is shown (adolescent / adult / elderly).
COMORBIDITY_AGE_BANDS: frozenset[str] = frozenset(
    {"15\u201317 years", "18\u201364 years", "65+ years"}
)


def options_by_system() -> dict[str, list[ComorbidityOption]]:
    grouped: dict[str, list[ComorbidityOption]] = {}
    for option in COMORBIDITY_OPTIONS:
        grouped.setdefault(option.system, []).append(option)
    return grouped
