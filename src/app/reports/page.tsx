import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PrintButton } from "@/components/PrintButton";
import type { TriageDecision } from "@/lib/decision-engine/models";
import { loadEncounters, type EncounterRow } from "@/lib/db/encounters";
import { AGE_BANDS } from "@/lib/fevergate/pathways";
import {
  filterSince,
  isChildEncounter,
  startOfToday,
  startOfWeek,
  summarizeEncounters,
  type EncounterSummary,
} from "@/lib/fevergate/reports";
import { mm } from "@/lib/i18n/mm";

export const dynamic = "force-dynamic";

const MONTHS_TO_BAND: Record<number, string> = Object.fromEntries(
  Object.entries(AGE_BANDS).map(([band, months]) => [months, band]),
);

function ageBandLabel(row: EncounterRow): string {
  const months = row.patient?.age_months;
  if (months != null && MONTHS_TO_BAND[months]) return MONTHS_TO_BAND[months];
  return isChildEncounter(row) ? mm.report.children : mm.report.adults;
}

function decisionLabel(decision: TriageDecision): string {
  if (decision === "REFER" || decision === "REFER_IMMEDIATE")
    return mm.result.refer;
  if (decision === "TREAT_AND_MONITOR") return mm.result.treatAndMonitor;
  return mm.result.treat;
}

function decisionClass(decision: TriageDecision): string {
  if (decision === "REFER" || decision === "REFER_IMMEDIATE")
    return "bg-rose-100 text-rose-800";
  if (decision === "TREAT_AND_MONITOR") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className={`text-2xl font-extrabold ${accent ?? "text-slate-900"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SummaryBlock({
  title,
  summary,
}: {
  title: string;
  summary: EncounterSummary;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={mm.report.totalPatients} value={summary.total} accent="text-teal-700" />
        <Stat label={mm.report.referrals} value={summary.referrals} accent="text-rose-700" />
        <Stat label={mm.report.referImmediate} value={summary.referImmediate} accent="text-rose-700" />
        <Stat label={mm.report.treatMonitor} value={summary.treatMonitor} accent="text-amber-700" />
        <Stat label={mm.report.treat} value={summary.treat} accent="text-emerald-700" />
        <Stat label={mm.report.children} value={summary.children} accent="text-slate-900" />
        <Stat label={mm.report.adults} value={summary.adults} accent="text-slate-900" />
      </div>
    </section>
  );
}

export default function ReportsPage() {
  const rows = loadEncounters();
  const now = new Date();
  const dailySummary = summarizeEncounters(filterSince(rows, startOfToday(now)));
  const weeklySummary = summarizeEncounters(filterSince(rows, startOfWeek(now)));

  const recent = [...rows]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 50);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div className="no-print flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {mm.nav.backToTriage}
        </Link>
        <PrintButton label={mm.report.print} />
      </div>

      <div id="printable" className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-teal-700">
            FeverGate — {mm.report.title}
          </h1>
          <p className="text-sm text-slate-500">{mm.report.subtitle}</p>
          <p className="mt-1 text-xs text-slate-400">
            {mm.report.generatedAt}: {now.toLocaleString("en-GB")}
          </p>
        </header>

        <SummaryBlock title={mm.report.daily} summary={dailySummary} />
        <SummaryBlock title={mm.report.weekly} summary={weeklySummary} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            {mm.report.recent}
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              {mm.report.empty}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3 font-medium">{mm.report.colTime}</th>
                    <th className="py-2 pr-3 font-medium">{mm.report.colName}</th>
                    <th className="py-2 pr-3 font-medium">{mm.report.colVillage}</th>
                    <th className="py-2 pr-3 font-medium">{mm.report.colAge}</th>
                    <th className="py-2 font-medium">{mm.report.colDecision}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-500">
                        {new Date(row.timestamp).toLocaleString("en-GB")}
                      </td>
                      <td className="py-2 pr-3 text-slate-900">
                        {row.patient_name || mm.patient.unnamed}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {row.village || "—"}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {ageBandLabel(row)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${decisionClass(
                            row.assessment.decision,
                          )}`}
                        >
                          {decisionLabel(row.assessment.decision)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
