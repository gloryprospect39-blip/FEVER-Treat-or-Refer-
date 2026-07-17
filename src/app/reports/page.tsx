import { ActivityPageTracker } from "@/components/ActivityPageTracker";
import { PrintButton } from "@/components/PrintButton";
import { SupervisorNav } from "@/components/SupervisorNav";
import type { TriageDecision } from "@/lib/decision-engine/models";
import { loadEncounters, type EncounterRow } from "@/lib/db/encounters";
import { AGE_BANDS } from "@/lib/fevergate/pathways";
import {
  filterSince,
  groupEncountersByVillage,
  isChildEncounter,
  pct,
  startOfToday,
  startOfWeek,
  summarizeEncounters,
  summarizeEncountersByVillage,
  type EncounterSummary,
  type VillageSummaryRow,
} from "@/lib/fevergate/reports";
import { decisionLabel } from "@/lib/fevergate/decision-labels";
import {
  summarizeDrugDispensing,
  type DrugDispensingSummary,
} from "@/lib/fevergate/drug-dispensing";
import { CLINIC_VILLAGES, type VillageKey } from "@/lib/fevergate/villages";
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

function decisionLabelForRow(decision: TriageDecision): string {
  return decisionLabel(decision);
}

function decisionClass(decision: TriageDecision): string {
  if (decision === "REFER_IMMEDIATE") return "bg-rose-200 text-rose-900";
  if (decision === "REFER") return "bg-rose-100 text-rose-800";
  if (decision === "TREAT_AND_MONITOR") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function villageLabel(village: VillageKey): string {
  return village === "Unknown" ? mm.report.villageUnknown : village;
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
        <Stat label={mm.result.referImmediate} value={summary.referImmediate} accent="text-rose-700" />
        <Stat label={mm.result.treatAndMonitor} value={summary.treatMonitor} accent="text-amber-700" />
        <Stat label={mm.result.treat} value={summary.treat} accent="text-emerald-700" />
        <Stat label={mm.report.children} value={summary.children} accent="text-slate-900" />
        <Stat label={mm.report.adults} value={summary.adults} accent="text-slate-900" />
      </div>
    </section>
  );
}

function VillageBreakdownTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: VillageSummaryRow[];
  total: number;
}) {
  const visibleRows = rows.filter(
    (row) => row.total > 0 || row.village !== "Unknown",
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>
      {total === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {mm.report.empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-medium">{mm.report.colVillage}</th>
                <th className="py-2 pr-3 font-medium">{mm.report.colEncounters}</th>
                <th className="py-2 pr-3 font-medium">{mm.report.colPctTotal}</th>
                <th className="py-2 pr-3 font-medium">{mm.report.referrals}</th>
                <th className="py-2 pr-3 font-medium">{mm.report.colReferralRate}</th>
                <th className="py-2 font-medium">{mm.result.treatAndMonitor}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.village} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-900">
                    {villageLabel(row.village)}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">{row.total}</td>
                  <td className="py-2 pr-3 text-slate-600">
                    {pct(row.total, total)}
                  </td>
                  <td className="py-2 pr-3 text-rose-700">{row.referrals}</td>
                  <td className="py-2 pr-3 text-slate-600">
                    {pct(row.referrals, row.total)}
                  </td>
                  <td className="py-2 text-amber-700">{row.treatMonitor}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="py-2 pr-3 text-slate-900">{mm.report.totalPatients}</td>
                <td className="py-2 pr-3 text-slate-900">{total}</td>
                <td className="py-2 pr-3 text-slate-600">100%</td>
                <td className="py-2 pr-3 text-rose-700">
                  {rows.reduce((sum, row) => sum + row.referrals, 0)}
                </td>
                <td className="py-2 pr-3 text-slate-600">
                  {pct(
                    rows.reduce((sum, row) => sum + row.referrals, 0),
                    total,
                  )}
                </td>
                <td className="py-2 text-amber-700">
                  {rows.reduce((sum, row) => sum + row.treatMonitor, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentByVillage({ rows }: { rows: EncounterRow[] }) {
  const grouped = groupEncountersByVillage(rows);
  const villageOrder: VillageKey[] = [...CLINIC_VILLAGES, "Unknown"];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">
        {mm.report.recent}
      </h2>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          {mm.report.empty}
        </p>
      ) : (
        <div className="space-y-6">
          {villageOrder.map((village) => {
            const villageRows = grouped
              .get(village)!
              .sort(
                (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
              );
            if (villageRows.length === 0) return null;

            return (
              <div key={village}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-teal-700">
                  {villageLabel(village)} ({villageRows.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2 pr-3 font-medium">{mm.report.colTime}</th>
                        <th className="py-2 pr-3 font-medium">{mm.report.colName}</th>
                        <th className="py-2 pr-3 font-medium">{mm.report.colAge}</th>
                        <th className="py-2 font-medium">{mm.report.colDecision}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {villageRows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 pr-3 text-slate-500">
                            {new Date(row.timestamp).toLocaleString("en-GB")}
                          </td>
                          <td className="py-2 pr-3 text-slate-900">
                            {row.patient_name || mm.patient.unnamed}
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
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DrugDispensingReportTable({
  title,
  summary,
}: {
  title: string;
  summary: DrugDispensingSummary;
}) {
  const rows = [
    {
      drug: mm.drugDispensing.actLabel,
      counts: summary.act,
    },
    {
      drug: mm.drugDispensing.paracetamolLabel,
      counts: summary.paracetamol,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mb-3 text-sm text-slate-500">{mm.report.stockReportSubtitle}</p>
      {summary.logged === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          {mm.report.stockReportEmpty}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm font-medium text-teal-700">
            {mm.report.stockPatientsLogged}: {summary.logged}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3 font-medium">{mm.report.stockColDrug}</th>
                  <th className="py-2 pr-3 font-medium">{mm.report.stockColGiven}</th>
                  <th className="py-2 pr-3 font-medium">{mm.report.stockColOutOfStock}</th>
                  <th className="py-2 font-medium">{mm.report.stockColNotIndicated}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.drug} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-900">
                      {row.drug}
                    </td>
                    <td className="py-2 pr-3 text-emerald-700">{row.counts.given}</td>
                    <td className="py-2 pr-3 text-rose-700">
                      {row.counts.out_of_stock}
                    </td>
                    <td className="py-2 text-slate-600">
                      {row.counts.not_indicated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default async function ReportsPage() {
  const rows = await loadEncounters();
  const now = new Date();
  const dailyRows = filterSince(rows, startOfToday(now));
  const weeklyRows = filterSince(rows, startOfWeek(now));
  const dailySummary = summarizeEncounters(dailyRows);
  const weeklySummary = summarizeEncounters(weeklyRows);
  const dailyByVillage = summarizeEncountersByVillage(dailyRows);
  const weeklyByVillage = summarizeEncountersByVillage(weeklyRows);
  const dailyDrugDispensing = summarizeDrugDispensing(dailyRows);
  const weeklyDrugDispensing = summarizeDrugDispensing(weeklyRows);

  const recent = [...rows]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 50);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <ActivityPageTracker eventType="view_reports" />

      <SupervisorNav
        current="reports"
        trailing={<PrintButton label={mm.report.print} />}
      />

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
        <VillageBreakdownTable
          title={`${mm.report.daily} — ${mm.report.byVillage}`}
          rows={dailyByVillage}
          total={dailySummary.total}
        />

        <DrugDispensingReportTable
          title={mm.report.stockReportTitle}
          summary={dailyDrugDispensing}
        />

        <SummaryBlock title={mm.report.weekly} summary={weeklySummary} />
        <VillageBreakdownTable
          title={`${mm.report.weekly} — ${mm.report.byVillage}`}
          rows={weeklyByVillage}
          total={weeklySummary.total}
        />

        <DrugDispensingReportTable
          title={`${mm.report.weekly} — ${mm.report.stockReportTitle}`}
          summary={weeklyDrugDispensing}
        />

        <RecentByVillage rows={recent} />
      </div>
    </div>
  );
}
