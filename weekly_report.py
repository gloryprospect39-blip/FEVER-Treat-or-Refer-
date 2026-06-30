"""CLI — generate a weekly epidemiologic Markdown report from local encounter logs."""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

from ui.weekly_report import build_weekly_report, default_report_range


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate FeverGate weekly epidemiologic report from encounter logs."
    )
    parser.add_argument(
        "--log",
        type=Path,
        default=None,
        help="Path to encounters.jsonl (default: data/encounters.jsonl)",
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=None,
        help="Path to patient registry SQLite (default: data/fevergate.db)",
    )
    parser.add_argument(
        "--week-start",
        type=_parse_date,
        default=None,
        help="Report week start (ISO date, Monday recommended). Default: current ISO week.",
    )
    parser.add_argument(
        "--week-end",
        type=_parse_date,
        default=None,
        help="Report week end (ISO date, inclusive). Default: week-start + 6 days.",
    )
    parser.add_argument(
        "--clinic",
        default="Border clinic",
        help="Clinic name for the report header.",
    )
    parser.add_argument(
        "--prepared-by",
        default="Community health worker team",
        help="Author line for the report header.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Write report to this file instead of stdout.",
    )
    args = parser.parse_args(argv)

    week_start = args.week_start
    week_end = args.week_end
    if week_start is None and week_end is None:
        week_start, week_end = default_report_range()

    report = build_weekly_report(
        week_start=week_start,
        week_end=week_end,
        log_path=args.log,
        db_path=args.db,
        clinic_name=args.clinic,
        prepared_by=args.prepared_by,
    )

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding="utf-8")
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
