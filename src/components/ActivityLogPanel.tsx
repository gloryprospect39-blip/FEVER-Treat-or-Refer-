"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import { PrintButton } from "@/components/PrintButton";
import {
  activityRowsToCsv,
  downloadTextFile,
  endOfDayMs,
  filterActivityBetween,
  parseDateInputValue,
  startOfDayMs,
  summarizeActivity,
  toDateInputValue,
  type ActivityEventType,
  type ActivityLogRow,
} from "@/lib/fevergate/activity";
import { startOfToday, startOfWeek } from "@/lib/fevergate/reports";
import { mm } from "@/lib/i18n/mm";

const DISPLAY_LIMIT = 200;

type DatePreset = "today" | "week" | "month" | "all" | "custom";

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
  if (typeof meta.decision === "string") parts.push(meta.decision);
  if (typeof meta.action === "string") parts.push(meta.action);
  if (typeof meta.note === "string") parts.push(meta.note);
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

function presetRange(
  preset: Exclude<DatePreset, "custom" | "all">,
  now: Date,
): { from: string; to: string } {
  const to = toDateInputValue(now);
  if (preset === "today") {
    return { from: to, to };
  }
  if (preset === "week") {
    const fromDate = new Date(startOfWeek(now));
    return { from: toDateInputValue(fromDate), to };
  }
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 29);
  return { from: toDateInputValue(fromDate), to };
}

function rangeBounds(fromValue: string, toValue: string) {
  const fromDate = parseDateInputValue(fromValue);
  const toDate = parseDateInputValue(toValue);
  return {
    fromMs: fromDate ? startOfDayMs(fromDate) : null,
    toMs: toDate ? endOfDayMs(toDate) : null,
  };
}

export function ActivityLogPanel({
  rows,
  generatedAt,
}: {
  rows: ActivityLogRow[];
  generatedAt: string;
}) {
  const now = useMemo(() => new Date(), []);
  const weekPreset = presetRange("week", now);

  const [preset, setPreset] = useState<DatePreset>("week");
  const [fromValue, setFromValue] = useState(weekPreset.from);
  const [toValue, setToValue] = useState(weekPreset.to);

  const { fromMs, toMs } = useMemo(
    () => rangeBounds(fromValue, toValue),
    [fromValue, toValue],
  );

  const filteredRows = useMemo(() => {
    if (preset === "all") return rows;
    return filterActivityBetween(rows, fromMs, toMs);
  }, [rows, preset, fromMs, toMs]);

  const dailyRows = useMemo(
    () => filterActivityBetween(rows, startOfToday(now), endOfDayMs(now)),
    [rows, now],
  );
  const weeklyRows = useMemo(
    () => filterActivityBetween(rows, startOfWeek(now), endOfDayMs(now)),
    [rows, now],
  );

  const displayedRows = filteredRows.slice(0, DISPLAY_LIMIT);
  const exportStamp = toDateInputValue(now);

  const applyPreset = (next: Exclude<DatePreset, "custom">) => {
    setPreset(next);
    if (next === "all") {
      setFromValue("");
      setToValue("");
      return;
    }
    const range = presetRange(next, now);
    setFromValue(range.from);
    setToValue(range.to);
  };

  const exportLabels = {
    headers: {
      time: mm.activity.colTime,
      event: mm.activity.colEvent,
      actor: mm.activity.colActor,
      village: mm.report.colVillage,
      patient: mm.activity.colPatient,
      details: mm.activity.colDetails,
    },
    eventLabel,
    unnamedPatient: mm.patient.unnamed,
    metadataSummary,
  };

  const handleExportCsv = () => {
    const csv = activityRowsToCsv(filteredRows, exportLabels);
    downloadTextFile(
      csv,
      `fevergate-activity-${exportStamp}.csv`,
      "text/csv;charset=utf-8",
    );
  };

  const handleExportJson = () => {
    downloadTextFile(
      JSON.stringify(filteredRows, null, 2),
      `fevergate-activity-${exportStamp}.json`,
      "application/json;charset=utf-8",
    );
  };

  const presetButtonClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-teal-600 text-white shadow"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredRows.length === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {mm.activity.exportCsv}
        </button>
        <button
          type="button"
          onClick={handleExportJson}
          disabled={filteredRows.length === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {mm.activity.exportJson}
        </button>
        <PrintButton label={mm.activity.print} />
      </div>

      <div id="printable" className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-teal-700">
            FeverGate — {mm.activity.title}
          </h1>
          <p className="text-sm text-slate-500">{mm.activity.subtitle}</p>
          <p className="mt-1 text-xs text-slate-400">
            {mm.activity.generatedAt}: {generatedAt}
          </p>
        </header>

        <section className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            {mm.activity.filterHeading}
          </h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset("today")}
              className={presetButtonClass(preset === "today")}
            >
              {mm.activity.filterPresetToday}
            </button>
            <button
              type="button"
              onClick={() => applyPreset("week")}
              className={presetButtonClass(preset === "week")}
            >
              {mm.activity.filterPresetWeek}
            </button>
            <button
              type="button"
              onClick={() => applyPreset("month")}
              className={presetButtonClass(preset === "month")}
            >
              {mm.activity.filterPresetMonth}
            </button>
            <button
              type="button"
              onClick={() => applyPreset("all")}
              className={presetButtonClass(preset === "all")}
            >
              {mm.activity.filterPresetAll}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="text-xs text-slate-500">{mm.activity.filterFrom}</span>
              <input
                type="date"
                value={fromValue}
                onChange={(e) => {
                  setPreset("custom");
                  setFromValue(e.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{mm.activity.filterTo}</span>
              <input
                type="date"
                value={toValue}
                onChange={(e) => {
                  setPreset("custom");
                  setToValue(e.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                {mm.activity.filterReset}
              </button>
            </div>
          </div>
        </section>

        {preset === "week" ? (
          <>
            <SummaryBlock title={mm.activity.daily} rows={dailyRows} />
            <SummaryBlock title={mm.activity.weekly} rows={weeklyRows} />
          </>
        ) : (
          <SummaryBlock title={mm.activity.filteredSummary} rows={filteredRows} />
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {mm.activity.recent}
            </h2>
            {filteredRows.length > 0 ? (
              <p className="text-xs text-slate-500">
                {mm.activity.showingCount(displayedRows.length, filteredRows.length)}
              </p>
            ) : null}
          </div>
          {filteredRows.length === 0 ? (
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
                  {displayedRows.map((row) => (
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
