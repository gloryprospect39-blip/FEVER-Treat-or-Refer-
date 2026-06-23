"""Non-lab sepsis screening for all ages (border clinic / resource-limited settings)."""

from __future__ import annotations

from .models import (
    ConsciousnessLevel,
    PatientContext,
    ReferralUrgency,
    SepsisScreenResult,
    TriageDecision,
)


def _age_band(age_months: int) -> str:
    if age_months < 2:
        return "neonate"
    if age_months < 60:
        return "under5"
    if age_months < 144:
        return "child_5_12"
    if age_months < 216:
        return "adolescent"
    if age_months >= 780:
        return "elderly"
    return "adult"


def _heart_rate_threshold(age_months: int) -> int:
    band = _age_band(age_months)
    return {
        "neonate": 160,
        "under5": 140,
        "child_5_12": 120,
        "adolescent": 100,
        "adult": 100,
        "elderly": 100,
    }[band]


def _respiratory_rate_threshold(age_months: int) -> int:
    band = _age_band(age_months)
    return {
        "neonate": 60,
        "under5": 40,
        "child_5_12": 30,
        "adolescent": 20,
        "adult": 20,
        "elderly": 20,
    }[band]


def _compute_qsofa(ctx: PatientContext) -> int | None:
    if ctx.age_months < 144:
        return None

    score = 0
    if ctx.consciousness in {
        ConsciousnessLevel.LETHARGIC,
        ConsciousnessLevel.UNCONSCIOUS,
    }:
        score += 1
    if ctx.vitals.systolic_bp is not None and ctx.vitals.systolic_bp <= 100:
        score += 1
    if ctx.vitals.respiratory_rate is not None and ctx.vitals.respiratory_rate >= 22:
        score += 1
    return score


def _news2_respiratory_score(rr: int, age_months: int) -> int:
    if age_months >= 144:
        if rr <= 8:
            return 3
        if rr <= 11:
            return 1
        if rr <= 20:
            return 0
        if rr <= 24:
            return 2
        return 3

    threshold = _respiratory_rate_threshold(age_months)
    if rr <= threshold - 10:
        return 3
    if rr <= threshold - 5:
        return 1
    if rr <= threshold:
        return 0
    if rr <= threshold + 10:
        return 2
    return 3


def _news2_systolic_score(sbp: int, age_months: int) -> int:
    if age_months >= 144:
        if sbp <= 90:
            return 3
        if sbp <= 100:
            return 2
        if sbp <= 110:
            return 1
        if sbp <= 219:
            return 0
        return 3

    if age_months < 12:
        if sbp < 70:
            return 3
        if sbp < 80:
            return 2
        if sbp < 90:
            return 1
        return 0
    if sbp < 80:
        return 3
    if sbp < 90:
        return 2
    if sbp < 100:
        return 1
    return 0


def _compute_news2(ctx: PatientContext) -> int | None:
    if ctx.age_months < 144:
        return None

    vitals = ctx.vitals
    if vitals.respiratory_rate is None:
        return None

    score = _news2_respiratory_score(vitals.respiratory_rate, ctx.age_months)

    if vitals.spo2_percent is not None:
        spo2 = vitals.spo2_percent
        if spo2 <= 91:
            score += 3
        elif spo2 <= 93:
            score += 2
        elif spo2 <= 95:
            score += 1

    if vitals.temperature_c is not None:
        temp = vitals.temperature_c
        if temp <= 35.0:
            score += 3
        elif temp <= 36.0:
            score += 1
        elif temp <= 38.0:
            score += 0
        elif temp <= 39.0:
            score += 1
        else:
            score += 2

    if vitals.systolic_bp is not None:
        score += _news2_systolic_score(vitals.systolic_bp, ctx.age_months)

    if vitals.heart_rate is not None:
        hr = vitals.heart_rate
        threshold = _heart_rate_threshold(ctx.age_months)
        if hr <= 40:
            score += 3
        elif hr <= threshold - 20:
            score += 1
        elif hr <= threshold:
            score += 0
        elif hr <= threshold + 20:
            score += 1
        elif hr <= threshold + 40:
            score += 2
        else:
            score += 3

    if ctx.consciousness == ConsciousnessLevel.UNCONSCIOUS:
        score += 3
    elif ctx.consciousness == ConsciousnessLevel.LETHARGIC:
        score += 3
    elif ctx.consciousness == ConsciousnessLevel.IRRITABLE:
        score += 1

    return score


def _imci_danger_signs(ctx: PatientContext) -> list[str]:
    triggers: list[str] = []
    signs = ctx.danger_signs

    if signs.unable_to_drink_or_breastfeed:
        triggers.append("imci:unable_to_drink_or_breastfeed")
    if signs.vomits_everything:
        triggers.append("imci:vomits_everything")
    if signs.convulsions:
        triggers.append("imci:convulsions")
    if signs.chest_indrawing:
        triggers.append("imci:chest_indrawing")
    if signs.stiff_neck:
        triggers.append("imci:stiff_neck")
    if signs.bulging_fontanelle:
        triggers.append("imci:bulging_fontanelle")
    if signs.severe_palmar_pallor:
        triggers.append("imci:severe_palmar_pallor")
    if ctx.consciousness == ConsciousnessLevel.LETHARGIC:
        triggers.append("imci:lethargic")
    if ctx.consciousness == ConsciousnessLevel.UNCONSCIOUS:
        triggers.append("imci:unconscious")

    return triggers


def _hard_referral_triggers(ctx: PatientContext) -> list[str]:
    triggers: list[str] = []
    vitals = ctx.vitals
    age_band = _age_band(ctx.age_months)

    if ctx.has_fever and age_band == "neonate":
        triggers.append("neonate_fever")

    if ctx.danger_signs.convulsions:
        triggers.append("convulsions")

    if vitals.weak_or_absent_radial_pulse:
        triggers.append("weak_or_absent_radial_pulse")

    if vitals.spo2_percent is not None and vitals.spo2_percent < 90:
        triggers.append("hypoxia")

    if age_band in {"adult", "elderly", "adolescent"}:
        if vitals.systolic_bp is not None and vitals.systolic_bp < 90:
            triggers.append("hypotension_adult")
    elif vitals.systolic_bp is not None and vitals.systolic_bp < 70:
        triggers.append("hypotension_pediatric")

    if age_band in {"neonate", "under5"}:
        triggers.extend(_imci_danger_signs(ctx))

    return sorted(set(triggers))


def _composite_score(ctx: PatientContext) -> tuple[int, list[str]]:
    score = 0
    components: list[str] = []
    age_band = _age_band(ctx.age_months)
    vitals = ctx.vitals

    age_points = {
        "neonate": 3,
        "under5": 1,
        "child_5_12": 1,
        "adolescent": 0,
        "adult": 0,
        "elderly": 2,
    }[age_band]
    if age_points:
        score += age_points
        components.append(f"age:{age_band}(+{age_points})")

    if vitals.temperature_c is not None:
        if vitals.temperature_c < 36.0:
            score += 2
            components.append("hypothermia(+2)")
        elif vitals.temperature_c >= 39.5:
            score += 1
            components.append("high_fever(+1)")

    if vitals.heart_rate is not None:
        threshold = _heart_rate_threshold(ctx.age_months)
        if vitals.heart_rate > threshold:
            score += 1
            components.append("tachycardia(+1)")

    if vitals.respiratory_rate is not None:
        threshold = _respiratory_rate_threshold(ctx.age_months)
        if vitals.respiratory_rate > threshold:
            score += 1
            components.append("tachypnea(+1)")

    if ctx.consciousness == ConsciousnessLevel.LETHARGIC:
        score += 2
        components.append("lethargy(+2)")
    elif ctx.consciousness == ConsciousnessLevel.UNCONSCIOUS:
        score += 2
        components.append("unconscious(+2)")
    elif ctx.consciousness == ConsciousnessLevel.IRRITABLE:
        score += 1
        components.append("irritable(+1)")

    comorbidity_points = min(len(ctx.comorbidities), 3)
    if comorbidity_points:
        score += comorbidity_points
        components.append(f"comorbidities(+{comorbidity_points})")

    if ctx.fever_duration_days > 3:
        score += 1
        components.append("prolonged_fever(+1)")

    if ctx.toxic_appearance:
        score += 2
        components.append("toxic_appearance(+2)")

    qsofa = _compute_qsofa(ctx)
    if qsofa is not None and qsofa >= 2:
        score += 2
        components.append(f"qsofa>={2}(+2)")

    news2 = _compute_news2(ctx)
    if news2 is not None and news2 >= 7:
        score += 2
        components.append(f"news2>={7}(+2)")
    elif news2 is not None and news2 >= 5:
        score += 1
        components.append(f"news2>={5}(+1)")

    return score, components


def _decide_from_screen(
    ctx: PatientContext,
    hard_triggers: list[str],
    score: int,
    qsofa: int | None,
    news2: int | None,
) -> tuple[TriageDecision, ReferralUrgency, list[str]]:
    rationale: list[str] = []

    if hard_triggers:
        rationale.append("Hard referral rule triggered.")
        return TriageDecision.REFER_IMMEDIATE, ReferralUrgency.IMMEDIATE, rationale

    if qsofa is not None and qsofa >= 2:
        rationale.append("qSOFA >= 2 in adolescent/adult.")
        return TriageDecision.REFER, ReferralUrgency.SAME_DAY, rationale

    if news2 is not None and news2 >= 7:
        rationale.append("NEWS2 >= 7.")
        return TriageDecision.REFER_IMMEDIATE, ReferralUrgency.IMMEDIATE, rationale

    if news2 is not None and news2 >= 5:
        rationale.append("NEWS2 >= 5.")
        return TriageDecision.REFER, ReferralUrgency.SAME_DAY, rationale

    if score >= 3:
        rationale.append("Composite sepsis screen score >= 3.")
        return TriageDecision.REFER, ReferralUrgency.SAME_DAY, rationale

    if score >= 1 and ctx.comorbidities:
        rationale.append("Borderline score with high-risk comorbidity.")
        return TriageDecision.REFER, ReferralUrgency.SAME_DAY, rationale

    if score >= 1 or ctx.has_fever:
        rationale.append("Low-risk screen; treat with scheduled monitoring.")
        return TriageDecision.TREAT_AND_MONITOR, ReferralUrgency.ROUTINE, rationale

    rationale.append("No fever and low-risk screen.")
    return TriageDecision.TREAT, ReferralUrgency.ROUTINE, rationale


def assess_sepsis_risk(ctx: PatientContext) -> SepsisScreenResult:
    """
    Screen for likely severe infection / sepsis without laboratory tests.

  This is a triage aid only — not a sepsis diagnosis.
    """
    hard_triggers = _hard_referral_triggers(ctx)
    score, components = _composite_score(ctx)
    qsofa = _compute_qsofa(ctx)
    news2 = _compute_news2(ctx)
    decision, urgency, rationale = _decide_from_screen(
        ctx, hard_triggers, score, qsofa, news2
    )

    return SepsisScreenResult(
        score=score,
        qsofa_score=qsofa,
        news2_score=news2,
        hard_referral_triggers=hard_triggers,
        score_components=components,
        decision=decision,
        urgency=urgency,
        rationale=rationale,
    )
