"""Myanmar pathway labels mapped to engine age-band keys."""

from __future__ import annotations

from ui.i18n.mm import mm

PATHWAY_CHILD = mm.age.pathway_child
PATHWAY_ADULT = mm.age.pathway_adult

CHILD_BANDS_MM: tuple[str, ...] = (
    mm.age.under_2_months,
    mm.age.months_2_to_5,
    mm.age.years_5_to_15,
)

ADULT_BANDS_MM: tuple[str, ...] = (
    mm.age.years_15_to_17,
    mm.age.years_18_to_64,
    mm.age.years_65_plus,
)

MM_TO_ENGINE_BAND: dict[str, str] = {
    mm.age.under_2_months: "Under 2 months",
    mm.age.months_2_to_5: "2 months \u2013 5 years",
    mm.age.years_5_to_15: "5\u201315 years",
    mm.age.years_15_to_17: "15\u201317 years",
    mm.age.years_18_to_64: "18\u201364 years",
    mm.age.years_65_plus: "65+ years",
}

ENGINE_TO_MM_BAND: dict[str, str] = {v: k for k, v in MM_TO_ENGINE_BAND.items()}


def age_bands_for_pathway(pathway: str) -> tuple[str, ...]:
    if pathway == PATHWAY_ADULT:
        return ADULT_BANDS_MM
    return CHILD_BANDS_MM


def default_age_band(pathway: str) -> str:
    bands = age_bands_for_pathway(pathway)
    return bands[1]


def to_engine_band(display_band: str) -> str:
    return MM_TO_ENGINE_BAND[display_band]


def is_child_pathway(pathway: str) -> bool:
    return pathway == PATHWAY_CHILD
