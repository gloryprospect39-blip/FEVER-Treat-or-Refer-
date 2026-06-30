"""Session clinic context — endemicity and today's drug stock."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class MalariaEndemicity(str, Enum):
    HIGH = "high"
    LOW = "low"


class ClinicContext(BaseModel):
    malaria_endemicity: MalariaEndemicity = MalariaEndemicity.HIGH
    act_in_stock: bool = True
    amoxicillin_in_stock: bool = False
    paracetamol_in_stock: bool = True


DEFAULT_CLINIC_CONTEXT = ClinicContext()
