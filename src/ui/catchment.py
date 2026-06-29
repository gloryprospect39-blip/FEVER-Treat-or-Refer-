"""Village / catchment normalization — required on every encounter for epidemiology."""

from __future__ import annotations


def normalize_catchment(value: str) -> str:
    return " ".join(value.strip().split())


def require_catchment(value: str) -> str:
    normalized = normalize_catchment(value)
    if not normalized:
        raise ValueError("village / catchment is required for every encounter")
    return normalized
