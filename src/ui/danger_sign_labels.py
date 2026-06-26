"""Tile metadata for the point-of-care danger-sign grid.

Each tile maps a human-facing checklist toggle onto the ``PatientContext`` model
consumed by the decision engine. A tile either flips a ``DangerSigns`` boolean
field (``danger_field``) or sets a ``ConsciousnessLevel`` (``consciousness``).
Human labels are reused from ``DANGER_SIGN_LABELS`` so wording stays consistent
with the engine's referral reasons.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from decision_engine.models import DANGER_SIGN_LABELS, ConsciousnessLevel


@dataclass(frozen=True)
class DangerSignTile:
    trigger_code: str
    icon: str
    label: str
    danger_field: Optional[str] = None
    consciousness: Optional[ConsciousnessLevel] = None


DANGER_SIGN_TILES: list[DangerSignTile] = [
    DangerSignTile(
        trigger_code="imci:convulsions",
        icon="\u26a1",
        label=DANGER_SIGN_LABELS["imci:convulsions"],
        danger_field="convulsions",
    ),
    DangerSignTile(
        trigger_code="imci:unable_to_drink_or_breastfeed",
        icon="\u270b",
        label=DANGER_SIGN_LABELS["imci:unable_to_drink_or_breastfeed"],
        danger_field="unable_to_drink_or_breastfeed",
    ),
    DangerSignTile(
        trigger_code="imci:vomits_everything",
        icon="\U0001f92e",
        label=DANGER_SIGN_LABELS["imci:vomits_everything"],
        danger_field="vomits_everything",
    ),
    DangerSignTile(
        trigger_code="imci:lethargic",
        icon="\U0001f634",
        label=DANGER_SIGN_LABELS["imci:lethargic"],
        consciousness=ConsciousnessLevel.LETHARGIC,
    ),
    DangerSignTile(
        trigger_code="imci:unconscious",
        icon="\U0001f4a4",
        label=DANGER_SIGN_LABELS["imci:unconscious"],
        consciousness=ConsciousnessLevel.UNCONSCIOUS,
    ),
    DangerSignTile(
        trigger_code="imci:chest_indrawing",
        icon="\U0001fac1",
        label=DANGER_SIGN_LABELS["imci:chest_indrawing"],
        danger_field="chest_indrawing",
    ),
    DangerSignTile(
        trigger_code="imci:stiff_neck",
        icon="\U0001f9b4",
        label=DANGER_SIGN_LABELS["imci:stiff_neck"],
        danger_field="stiff_neck",
    ),
    DangerSignTile(
        trigger_code="imci:bulging_fontanelle",
        icon="\U0001f476",
        label=DANGER_SIGN_LABELS["imci:bulging_fontanelle"],
        danger_field="bulging_fontanelle",
    ),
    DangerSignTile(
        trigger_code="imci:severe_palmar_pallor",
        icon="\U0001fa78",
        label=DANGER_SIGN_LABELS["imci:severe_palmar_pallor"],
        danger_field="severe_palmar_pallor",
    ),
]
