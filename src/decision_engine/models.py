from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ConsciousnessLevel(str, Enum):
    ALERT = "alert"
    IRRITABLE = "irritable"
    LETHARGIC = "lethargic"
    UNCONSCIOUS = "unconscious"


class TriageDecision(str, Enum):
    REFER_IMMEDIATE = "REFER_IMMEDIATE"
    REFER = "REFER"
    TREAT_AND_MONITOR = "TREAT_AND_MONITOR"
    TREAT = "TREAT"


class ReferralUrgency(str, Enum):
    IMMEDIATE = "immediate"
    SAME_DAY = "same_day"
    ROUTINE = "routine"


class Comorbidity(str, Enum):
    HIV = "hiv"
    IMMUNOSUPPRESSION = "immunosuppression"
    SEVERE_MALNUTRITION = "severe_malnutrition"
    SICKLE_CELL = "sickle_cell"
    CHRONIC_HEART_DISEASE = "chronic_heart_disease"
    CHRONIC_LUNG_DISEASE = "chronic_lung_disease"
    CHRONIC_KIDNEY_DISEASE = "chronic_kidney_disease"
    PREGNANCY = "pregnancy"
    RECENT_SURGERY_OR_WOUND = "recent_surgery_or_wound"


class VitalSigns(BaseModel):
    temperature_c: Optional[float] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    spo2_percent: Optional[int] = None
    weak_or_absent_radial_pulse: bool = False


class DangerSigns(BaseModel):
    unable_to_drink_or_breastfeed: bool = False
    vomits_everything: bool = False
    convulsions: bool = False
    chest_indrawing: bool = False
    stiff_neck: bool = False
    bulging_fontanelle: bool = False
    severe_palmar_pallor: bool = False


class PatientContext(BaseModel):
    age_months: int = Field(ge=0)
    has_fever: bool = True
    fever_duration_days: int = Field(default=1, ge=0)
    consciousness: ConsciousnessLevel = ConsciousnessLevel.ALERT
    toxic_appearance: bool = False
    comorbidities: list[Comorbidity] = Field(default_factory=list)
    vitals: VitalSigns = Field(default_factory=VitalSigns)
    danger_signs: DangerSigns = Field(default_factory=DangerSigns)


class SepsisScreenResult(BaseModel):
    score: int
    qsofa_score: Optional[int] = None
    news2_score: Optional[int] = None
    hard_referral_triggers: list[str] = Field(default_factory=list)
    score_components: list[str] = Field(default_factory=list)
    decision: TriageDecision
    urgency: ReferralUrgency
    rationale: list[str] = Field(default_factory=list)


class FebrileAssessment(BaseModel):
    sepsis: SepsisScreenResult
    decision: TriageDecision
    urgency: ReferralUrgency
    monitoring_days: int = 0
    referral_reasons: list[str] = Field(default_factory=list)
    rationale: list[str] = Field(default_factory=list)
