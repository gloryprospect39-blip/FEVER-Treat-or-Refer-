import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";

import { ActivityPageTracker } from "@/components/ActivityPageTracker";
import { PrintButton } from "@/components/PrintButton";
import {
  filterActivitySince,
  summarizeActivity,
  type ActivityEventType,
  type ActivityLogRow,
} from "@/lib/fevergate/activity";
import { loadActivityLogs } from "@/lib/db/activity";
import { startOfToday, startOfWeek } from "@/lib/fevergate/reports";
import { mm } from "@/lib/i18n/mm";

export const dynamic = "force-dynamic";

function eventLabel(eventType: ActivityEventType): string {
  return mm.activity.events[eventType] ?? eventType;
}

function eventClass(eventType: ActivityEventType): string {
  if (
    eventType === "teleconsultation_call" ||
    eventType === "schedule_teleconsultation"
  ) {
    return "bg-rose-100 text-rose-800";
  }
  if (eventType === "start_treatment") return "bg-emerald-100 text-emerald-800";
  if (eventType === "assess_completed") return "bg-teal-100 text-teal-800";
  if (eventType === "print_referral" || eventType === "open_referral_form") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
}

function metadataSummary(row: ActivityLogRow): string {
  const meta = row.metadata;
  if (!meta) return "—";
  const parts: string[] = [];
  if (typeof meta.decision === "string") {
    parts.push(meta.decision);
  }
  if (typeof meta.action === "string") {
    parts.push(meta.action);
  }
  if (typeof meta.note === "string") {
    parts.push(meta.note);
  }
  return parts.length ? parts.join(" · ") : "—";
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
  rows,
}: {
  title: string;
  rows: ActivityLogRow[];
}) {
  const summary = summarizeActivity(rows);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={mm.activity.totalEvents} value={summary.total} accent="text-teal-700" />
        <Stat label={mm.activity.assessments} value={summary.assessCompleted} accent="text-teal-700" />
        <Stat label={mm.activity.referralActions} value={summary.referrals} accent="text-rose-700" />
        <Stat label={mm.activity.treatmentActions} value={summary.treatments} accent="text-emerald-700" />
        <Stat label={mm.activity.printActions} value={summary.prints} accent="text-amber-700" />
        <Stat label={mm.activity.newPatients} value={summary.newPatients} accent="text-slate-900" />
      </div>
    </section>
  );
}

export default async function ActivityPage() {
  const rows = await loadActivityLogs();
  const now = new Date();
  const dailyRows = filterActivitySince(rows, startOfToday(now));
  const weeklyRows = filterActivitySince(rows, startOfWeek(now));
  const recent = rows.slice(0, 100);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <ActivityPageTracker eventType="view_activity" />

      <div className="no-print flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {mm.nav.backToTriage}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-800 shadow-sm transition hover:bg-teal-100"
          >
            <ClipboardList className="h-4 w-4" />
            {mm.nav.reports}
          </Link>
          <PrintButton label={mm.activity.print} />
        </div>
      </div>

      <div id="printable" className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-teal-700">
            FeverGate — {mm.activity.title}
          </h1>
          <p className="text-sm text-slate-500">{mm.activity.subtitle}</p>
          <p className="mt-1 text-xs text-slate-400">
            {mm.activity.generatedAt}: {now.toLocaleString("en-GB")}
          </p>
        </header>

        <SummaryBlock title={mm.activity.daily} rows={dailyRows} />
        <SummaryBlock title={mm.activity.weekly} rows={weeklyRows} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            {mm.activity.recent}
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              {mm.activity.empty}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3 font-medium">{mm.activity.colTime}</th>
                    <th className="py-2 pr-3 font-medium">{mm.activity.colEvent}</th>
                    <th className="py-2 pr-3 font-medium">{mm.activity.colActor}</th>
                    <th className="py-2 pr-3 font-medium">{mm.activity.colPatient}</th>
                    <th className="py-2 font-medium">{mm.activity.colDetails}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id ?? row.created_at} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-500">
                        {new Date(row.created_at).toLocaleString("en-GB")}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${eventClass(
                            row.event_type,
                          )}`}
                        >
                          {eventLabel(row.event_type)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {row.actor || "—"}
                      </td>
                      <td className="py-2 pr-3 text-slate-900">
                        {row.patient_name || mm.patient.unnamed}
                        {row.village ? (
                          <span className="block text-xs text-slate-500">
                            {row.village}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-slate-600">
                        {metadataSummary(row)}
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
