"""Age-based clinical pathway constants (<15 vs 15+)."""

from __future__ import annotations

AGE_BANDS: dict[str, int] = {
    "Under 2 months": 1,
    "2 months \u2013 5 years": 24,
    "5\u201315 years": 96,
    "15\u201317 years": 192,
    "18\u201364 years": 480,
    "65+ years": 840,
}

PATHWAY_CHILD = "Child (under 15)"
PATHWAY_ADULT = "Adult (15+)"

CHILD_AGE_BANDS_ORDERED: tuple[str, ...] = (
    "Under 2 months",
    "2 months \u2013 5 years",
    "5\u201315 years",
)
ADULT_AGE_BANDS_ORDERED: tuple[str, ...] = (
    "15\u201317 years",
    "18\u201364 years",
    "65+ years",
)

PEDIATRIC_AGE_BANDS: frozenset[str] = frozenset(CHILD_AGE_BANDS_ORDERED)
ADULT_AGE_BANDS: frozenset[str] = frozenset(ADULT_AGE_BANDS_ORDERED)

# Backward-compatible alias for comorbidity gating.
COMORBIDITY_AGE_BANDS: frozenset[str] = ADULT_AGE_BANDS


def age_bands_for_pathway(pathway_label: str) -> tuple[str, ...]:
    if pathway_label == PATHWAY_ADULT:
        return ADULT_AGE_BANDS_ORDERED
    return CHILD_AGE_BANDS_ORDERED


def default_age_band_index(pathway_label: str) -> int:
    """Default to under-5 for children, 18–64 for adults."""
    return 1


def is_pediatric_pathway(age_band: str) -> bool:
    return age_band in PEDIATRIC_AGE_BANDS


def is_adult_pathway(age_band: str) -> bool:
    return age_band in ADULT_AGE_BANDS
