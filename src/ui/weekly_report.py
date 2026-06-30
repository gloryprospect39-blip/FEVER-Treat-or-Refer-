"""Aggregate local encounter logs into a weekly epidemiologic Markdown report."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from decision_engine.models import DANGER_SIGN_LABELS, TriageDecision

from ui.encounter_log import DEFAULT_LOG_PATH, load_encounters
from ui.patient_registry import DEFAULT_DB_PATH, count_patients_registered_between

DANGER_FIELD_TO_CODE: dict[str, str] = {
    "unable_to_drink_or_breastfeed": "imci:unable_to_drink_or_breastfeed",
    "vomits_everything": "imci:vomits_everything",
    "convulsions": "imci:convulsions",
    "chest_indrawing": "imci:chest_indrawing",
    "stiff_neck": "imci:stiff_neck",
    "bulging_fontanelle": "imci:bulging_fontanelle",
    "severe_palmar_pallor": "imci:severe_palmar_pallor",
}

REFERRAL_DECISIONS = {TriageDecision.REFER.value, TriageDecision.REFER_IMMEDIATE.value}


@dataclass
class WeekMetrics:
    total: int = 0
    catchments: Counter[str] = field(default_factory=Counter)
    decisions: Counter[str] = field(default_factory=Counter)
    referrals_by_catchment: Counter[str] = field(default_factory=Counter)
    monitor_by_catchment: Counter[str] = field(default_factory=Counter)
    age_groups: Counter[str] = field(default_factory=Counter)
    referrals_by_age: Counter[str] = field(default_factory=Counter)
    danger_signs: Counter[str] = field(default_factory=Counter)
    danger_sign_encounters: int = 0
    referral_reasons: Counter[str] = field(default_factory=Counter)
    linked_registry: int = 0
    named_registration: int = 0
    act_plan_proxy: int = 0
    endemicity_high: int = 0
    endemicity_low: int = 0
    act_out_of_stock_high: int = 0


def monday_of_week(ref: date) -> date:
    return ref - timedelta(days=ref.weekday())


def default_report_range(ref: date | None = None) -> tuple[date, date]:
    start = monday_of_week(ref or date.today())
    return start, start + timedelta(days=6)


def _parse_row_date(timestamp: str) -> date:
    return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).date()


def _age_group(age_months: int) -> str:
    if age_months < 2:
        return "Neonate (<2 months)"
    if age_months < 60:
        return "Under 5 (2 mo-5 yr)"
    if age_months < 180:
        return "Child 5-15 yr"
    return "Adolescent / adult 15+"


def _is_referral(decision: str) -> bool:
    return decision in REFERRAL_DECISIONS


def _danger_signs_positive(patient: dict[str, Any]) -> list[str]:
    signs = patient.get("danger_signs") or {}
    positive: list[str] = []
    for field_name, code in DANGER_FIELD_TO_CODE.items():
        if signs.get(field_name):
            positive.append(code)
    consciousness = patient.get("consciousness")
    if consciousness == "lethargic":
        positive.append("imci:lethargic")
    if consciousness == "unconscious":
        positive.append("imci:unconscious")
    return positive


def _act_plan_proxy(row: dict[str, Any]) -> bool:
    assessment = row.get("assessment") or {}
    clinic = row.get("clinic") or {}
    patient = row.get("patient") or {}
    decision = assessment.get("decision")
    if decision not in {
        TriageDecision.TREAT.value,
        TriageDecision.TREAT_AND_MONITOR.value,
    }:
        return False
    if not patient.get("has_fever", True):
        return False
    if clinic.get("malaria_endemicity") != "high":
        return False
    return bool(clinic.get("act_in_stock", True))


def filter_encounters_by_range(
    rows: list[dict[str, Any]], start: date, end: date
) -> list[dict[str, Any]]:
    return [
        row
        for row in rows
        if start <= _parse_row_date(row["timestamp"]) <= end
    ]


def compute_week_metrics(rows: list[dict[str, Any]]) -> WeekMetrics:
    metrics = WeekMetrics()
    metrics.total = len(rows)

    for row in rows:
        catchment = row.get("catchment") or "Unknown"
        assessment = row.get("assessment") or {}
        patient = row.get("patient") or {}
        decision = assessment.get("decision", "UNKNOWN")
        age_months = int(patient.get("age_months", 0))
        age_group = _age_group(age_months)

        metrics.catchments[catchment] += 1
        metrics.decisions[decision] += 1
        metrics.age_groups[age_group] += 1

        if _is_referral(decision):
            metrics.referrals_by_catchment[catchment] += 1
            metrics.referrals_by_age[age_group] += 1

        if decision == TriageDecision.TREAT_AND_MONITOR.value:
            metrics.monitor_by_catchment[catchment] += 1

        positive_signs = _danger_signs_positive(patient)
        if positive_signs:
            metrics.danger_sign_encounters += 1
        for code in positive_signs:
            metrics.danger_signs[code] += 1

        for reason in assessment.get("referral_reasons") or []:
            metrics.referral_reasons[reason] += 1

        registration = row.get("registration")
        if registration and registration.get("id"):
            metrics.linked_registry += 1
        if registration and registration.get("name"):
            metrics.named_registration += 1

        clinic = row.get("clinic") or {}
        if clinic.get("malaria_endemicity") == "high":
            metrics.endemicity_high += 1
            if not clinic.get("act_in_stock", True):
                metrics.act_out_of_stock_high += 1
        elif clinic.get("malaria_endemicity") == "low":
            metrics.endemicity_low += 1

        if _act_plan_proxy(row):
            metrics.act_plan_proxy += 1

    return metrics


def _pct(part: int, whole: int) -> str:
    if whole == 0:
        return "—"
    return f"{round(100 * part / whole)}%"


def _change_pp(current: float, prior: float) -> str:
    delta = round(current - prior, 0)
    sign = "+" if delta > 0 else ""
    return f"{sign}{int(delta)} pp"


def _change_pct(current: int, prior: int) -> str:
    if prior == 0:
        return "—"
    delta = round(100 * (current - prior) / prior)
    sign = "+" if delta > 0 else ""
    return f"{sign}{delta}%"


def _referral_rate(metrics: WeekMetrics) -> float:
    referrals = sum(
        metrics.decisions.get(d, 0)
        for d in (TriageDecision.REFER.value, TriageDecision.REFER_IMMEDIATE.value)
    )
    return 100 * referrals / metrics.total if metrics.total else 0.0


def _danger_encounter_count(metrics: WeekMetrics) -> int:
    return metrics.danger_sign_encounters


def _bar(count: int, total: int, width: int = 20) -> str:
    if total == 0:
        return "-" * width
    filled = round(width * count / total)
    return "#" * filled + "-" * (width - filled)


def _reason_label(code: str) -> str:
    if code in DANGER_SIGN_LABELS:
        return DANGER_SIGN_LABELS[code]
    if code.startswith("news2>="):
        return f"NEWS2 ≥ {code.split('>=')[1]}"
    if code == "qsofa>=2":
        return "Elevated qSOFA"
    if code == "composite_sepsis_score>=3":
        return "Elevated composite screen"
    return code


def format_weekly_report_markdown(
    *,
    week_start: date,
    week_end: date,
    current: WeekMetrics,
    prior: WeekMetrics | None = None,
    clinic_name: str = "Border clinic",
    prepared_by: str = "Community health worker team",
    log_path: Path | None = None,
    db_path: Path | None = None,
) -> str:
    iso_week = week_start.isocalendar()[1]
    total = current.total
    referrals = sum(
        current.decisions.get(d, 0)
        for d in (TriageDecision.REFER.value, TriageDecision.REFER_IMMEDIATE.value)
    )
    monitor = current.decisions.get(TriageDecision.TREAT_AND_MONITOR.value, 0)
    refer_rate = _referral_rate(current)
    danger_positive = _danger_encounter_count(current)

    prior_total = prior.total if prior else 0
    prior_refer_rate = _referral_rate(prior) if prior and prior.total else None
    prior_danger = _danger_encounter_count(prior) if prior else None
    prior_monitor_pct = (
        100 * prior.decisions.get(TriageDecision.TREAT_AND_MONITOR.value, 0) / prior.total
        if prior and prior.total
        else None
    )

    new_patients = count_patients_registered_between(
        week_start, week_end, db_path=db_path
    )

    lines: list[str] = [
        "# FeverGate — Weekly Epidemiologic Report",
        "",
        f"**Clinic:** {clinic_name}  ",
        f"**Catchments reporting:** {len(current.catchments)} village(s)  ",
        f"**Reporting week:** {week_start.strftime('%d %b %Y')} – "
        f"{week_end.strftime('%d %b %Y')} (ISO week {iso_week})  ",
        f"**Prepared by:** {prepared_by}  ",
        f"**Data source:** `{log_path or DEFAULT_LOG_PATH}`  ",
        "**Note:** Screening counts only — not confirmed diagnoses. No lab/RDT.",
        "",
        "---",
        "",
        "## 1. Executive summary",
        "",
        "| Indicator | This week | Prior week | Change |",
        "|-----------|-----------|------------|--------|",
        f"| Total febrile encounters | **{total}** | "
        f"{prior_total if prior else '—'} | "
        f"{_change_pct(total, prior_total) if prior else '—'} |",
        f"| Unique catchments | **{len(current.catchments)}** | "
        f"{len(prior.catchments) if prior else '—'} | "
        f"{_change_pct(len(current.catchments), len(prior.catchments)) if prior and prior.catchments else '—'} |",
        f"| Referral rate | **{round(refer_rate)}%** ({referrals}/{total}) | "
        f"{f'{round(prior_refer_rate)}%' if prior_refer_rate is not None else '—'} | "
        f"{_change_pp(refer_rate, prior_refer_rate) if prior_refer_rate is not None else '—'} |",
        f"| Danger-sign positives | **{danger_positive}** | "
        f"{prior_danger if prior is not None else '—'} | "
        f"{(danger_positive - prior_danger) if prior_danger is not None else '—'} |",
        f"| Treat & monitor | **{round(100 * monitor / total) if total else 0}%** "
        f"({monitor}/{total}) | "
        f"{f'{round(prior_monitor_pct)}%' if prior_monitor_pct is not None else '—'} | "
        f"{_change_pp(100 * monitor / total if total else 0, prior_monitor_pct) if prior_monitor_pct is not None else '—'} |",
        f"| Registry-linked encounters | **{current.linked_registry}** | "
        f"{prior.linked_registry if prior else '—'} | "
        f"{(current.linked_registry - prior.linked_registry) if prior else '—'} |",
        f"| New registry patients | **{new_patients}** | — | — |",
        "",
    ]

    if total == 0:
        lines.extend(
            [
                "_No encounters in this date range. Triage patients to populate the log._",
                "",
            ]
        )
        return "\n".join(lines)

    lines.extend(["## 2. Encounters by village / catchment", ""])
    lines.append(
        "| Village / catchment | Encounters | % | Referrals | Referral rate | TREAT & MONITOR |"
    )
    lines.append("|---------------------|------------|---|-----------|---------------|-----------------|")

    for catchment, count in current.catchments.most_common():
        refs = current.referrals_by_catchment[catchment]
        mon = current.monitor_by_catchment[catchment]
        lines.append(
            f"| {catchment} | {count} | {_pct(count, total)} | {refs} | "
            f"{_pct(refs, count)} | {mon} |"
        )
    lines.append(
        f"| **Total** | **{total}** | **100%** | **{referrals}** | "
        f"**{_pct(referrals, total)}** | **{monitor}** |"
    )
    lines.append("")

    lines.extend(["## 3. Age pattern", ""])
    lines.append("| Age group | Encounters | Referrals | Referral rate |")
    lines.append("|-----------|------------|-----------|---------------|")
    for group, count in current.age_groups.most_common():
        refs = current.referrals_by_age[group]
        lines.append(
            f"| {group} | {count} | {refs} | {_pct(refs, count)} |"
        )
    lines.append("")

    lines.extend(["## 4. Danger signs (positive at triage)", ""])
    lines.append("| Danger sign | Count | % of encounters |")
    lines.append("|-------------|-------|-----------------|")
    for code, count in current.danger_signs.most_common():
        label = _reason_label(code)
        lines.append(f"| {label} | {count} | {_pct(count, total)} |")
    no_sign = total - current.danger_sign_encounters
    lines.append(
        f"| *No danger sign recorded* | {no_sign} | {_pct(no_sign, total)} |"
    )
    lines.append("")

    lines.extend(["## 5. Decision mix", ""])
    for decision in (
        TriageDecision.REFER_IMMEDIATE.value,
        TriageDecision.REFER.value,
        TriageDecision.TREAT_AND_MONITOR.value,
        TriageDecision.TREAT.value,
    ):
        count = current.decisions.get(decision, 0)
        lines.append(
            f"- `{decision}` {_bar(count, total)} {count} ({_pct(count, total)})"
        )
    lines.append("")

    lines.extend(["## 6. Malaria context (session settings)", ""])
    lines.append("| Setting | Encounters | Presumptive ACT proxy* |")
    lines.append("|---------|------------|------------------------|")
    lines.append(
        f"| High endemicity + ACT in stock | "
        f"{current.endemicity_high - current.act_out_of_stock_high} | "
        f"{current.act_plan_proxy} |"
    )
    lines.append(
        f"| High endemicity + ACT out of stock | "
        f"{current.act_out_of_stock_high} | 0 |"
    )
    lines.append(f"| Low endemicity | {current.endemicity_low} | 0 |")
    lines.append("")
    lines.append(
        "*Proxy: TREAT / TREAT & MONITOR + fever + high endemicity + ACT in stock."
    )
    lines.append("")

    lines.extend(["## 7. Registration linkage", ""])
    lines.append("| Metric | Count |")
    lines.append("|--------|-------|")
    lines.append(f"| Catchment-only (no registry id) | {total - current.linked_registry} |")
    lines.append(f"| Registry-linked encounters | {current.linked_registry} |")
    lines.append(f"| Named in registration block | {current.named_registration} |")
    lines.append(f"| New patients registered (DB) | {new_patients} |")
    lines.append("")

    lines.extend(["## 8. Top referral reason codes", ""])
    lines.append("| Code | Label | Count |")
    lines.append("|------|-------|-------|")
    for code, count in current.referral_reasons.most_common(10):
        lines.append(f"| `{code}` | {_reason_label(code)} | {count} |")
    lines.append("")

    lines.extend(
        [
            "## 9. Data quality & limitations",
            "",
            f"- **Catchment recorded:** {total}/{total} (100%)",
            f"- **Registry-linked:** {current.linked_registry}/{total} "
            f"({_pct(current.linked_registry, total)})",
            "- **No lab confirmation** — clinic screening counts, not incidence",
            "- **Clinic-based rates** — not population denominators",
            "- **Raw log stays on device** — aggregate before sharing externally",
            "",
            "---",
            "",
            "_Generated by FeverGate `weekly_report.py` from local encounter logs._",
            "",
        ]
    )
    return "\n".join(lines)


def build_weekly_report(
    *,
    week_start: date | None = None,
    week_end: date | None = None,
    log_path: Path | None = None,
    db_path: Path | None = None,
    clinic_name: str = "Border clinic",
    prepared_by: str = "Community health worker team",
) -> str:
    if week_start is None and week_end is None:
        week_start, week_end = default_report_range()
    elif week_start is not None and week_end is None:
        week_end = week_start + timedelta(days=6)
    elif week_start is None and week_end is not None:
        week_start = week_end - timedelta(days=6)

    rows = load_encounters(log_path)
    current_rows = filter_encounters_by_range(rows, week_start, week_end)
    prior_end = week_start - timedelta(days=1)
    prior_start = prior_end - timedelta(days=6)
    prior_rows = filter_encounters_by_range(rows, prior_start, prior_end)

    return format_weekly_report_markdown(
        week_start=week_start,
        week_end=week_end,
        current=compute_week_metrics(current_rows),
        prior=compute_week_metrics(prior_rows) if prior_rows else None,
        clinic_name=clinic_name,
        prepared_by=prepared_by,
        log_path=log_path,
        db_path=db_path,
    )
