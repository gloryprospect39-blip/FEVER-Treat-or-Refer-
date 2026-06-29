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

PEDIATRIC_AGE_BANDS: frozenset[str] = frozenset(
    {"Under 2 months", "2 months \u2013 5 years", "5\u201315 years"}
)
ADULT_AGE_BANDS: frozenset[str] = frozenset(
    {"15\u201317 years", "18\u201364 years", "65+ years"}
)

# Backward-compatible alias for comorbidity gating.
COMORBIDITY_AGE_BANDS: frozenset[str] = ADULT_AGE_BANDS


def is_pediatric_pathway(age_band: str) -> bool:
    return age_band in PEDIATRIC_AGE_BANDS


def is_adult_pathway(age_band: str) -> bool:
    return age_band in ADULT_AGE_BANDS
