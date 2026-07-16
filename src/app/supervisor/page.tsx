import { BarChart3, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SupervisorNav } from "@/components/SupervisorNav";
import { loadActivityLogs } from "@/lib/db/activity";
import { loadEncounters } from "@/lib/db/encounters";
import {
  filterActivitySince,
  summarizeActivity,
} from "@/lib/fevergate/activity";
import { summarizeDrugDispensing } from "@/lib/fevergate/drug-dispensing";
import {
  filterSince,
  startOfToday,
  startOfWeek,
  summarizeEncounters,
} from "@/lib/fevergate/reports";
import { mm } from "@/lib/i18n/mm";

export const dynamic = "force-dynamic";

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

function HubCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 transition group-hover:bg-teal-200">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export default async function SupervisorPage() {
  const now = new Date();
  const [encounters, activityRows] = await Promise.all([
    loadEncounters(),
    loadActivityLogs(),
  ]);

  const dailyRows = filterSince(encounters, startOfToday(now));
  const weeklyRows = filterSince(encounters, startOfWeek(now));
  const dailySummary = summarizeEncounters(dailyRows);
  const weeklySummary = summarizeEncounters(weeklyRows);
  const dailyDrugs = summarizeDrugDispensing(dailyRows);
  const weeklyActivity = summarizeActivity(
    filterActivitySince(activityRows, startOfWeek(now)),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <SupervisorNav current="supervisor" />

      <header>
        <h1 className="text-2xl font-bold text-teal-700">
          FeverGate — {mm.supervisor.title}
        </h1>
        <p className="text-sm text-slate-500">{mm.supervisor.subtitle}</p>
        <p className="mt-1 text-xs text-slate-400">
          {mm.report.generatedAt}: {now.toLocaleString("en-GB")}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          {mm.supervisor.todayOverview}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={mm.report.totalPatients}
            value={dailySummary.total}
            accent="text-teal-700"
          />
          <Stat
            label={mm.report.referrals}
            value={dailySummary.referrals}
            accent="text-rose-700"
          />
          <Stat
            label={mm.report.treat}
            value={dailySummary.treat}
            accent="text-emerald-700"
          />
          <Stat
            label={mm.supervisor.actStockOuts}
            value={dailyDrugs.act.out_of_stock}
            accent="text-amber-700"
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {mm.supervisor.weekEncounters(weeklySummary.total)} ·{" "}
          {mm.supervisor.weekTreatments(weeklyActivity.treatments)}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <HubCard
          href="/reports"
          title={mm.nav.reports}
          description={mm.supervisor.reportsCard}
          icon={<BarChart3 className="h-6 w-6" />}
        />
        <HubCard
          href="/activity"
          title={mm.nav.activity}
          description={mm.supervisor.activityCard}
          icon={<ClipboardList className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}
