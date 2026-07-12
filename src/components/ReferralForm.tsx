"use client";

import { Printer, X } from "lucide-react";

import { mm } from "@/lib/i18n/mm";
import { toSentences } from "@/lib/utils";

export interface ReferralData {
  patientName: string;
  village: string;
  clinician: string;
  ageBand: string;
  pathwayLabel: string;
  hasFever: boolean;
  feverDays: number;
  vitals: { systolicBp: number; spo2: number; respiratoryRate: number };
  dangerSignLabels: string[];
  comorbidityLabels: string[];
  decisionLabel: string;
  urgencyText: string;
  reason: string;
  planSummary: string;
  planDetail: string;
  isRefer: boolean;
  teleconsultNumber: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-1.5 text-sm">
      <span className="w-40 shrink-0 font-medium text-slate-500">{label}</span>
      <span className="text-slate-900">{value || "—"}</span>
    </div>
  );
}

export function ReferralForm({
  data,
  onClose,
}: {
  data: ReferralData;
  onClose: () => void;
}) {
  const dateStr = new Date().toLocaleString("en-GB");
  const vitalsParts: string[] = [];
  if (data.vitals.systolicBp)
    vitalsParts.push(`${mm.referral.systolicBp}: ${data.vitals.systolicBp}`);
  if (data.vitals.spo2) vitalsParts.push(`${mm.referral.spo2}: ${data.vitals.spo2}%`);
  if (data.vitals.respiratoryRate)
    vitalsParts.push(
      `${mm.referral.respiratoryRate}: ${data.vitals.respiratoryRate}`,
    );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-2xl">
        <div className="no-print mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-700"
          >
            <Printer className="h-4 w-4" />
            {mm.referral.print}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            {mm.referral.close}
          </button>
        </div>

        <div
          id="printable"
          className="rounded-2xl bg-white p-8 text-slate-900 shadow-2xl"
        >
          <div className="flex items-start justify-between border-b-2 border-teal-600 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-teal-700">FeverGate</h1>
              <p className="text-sm font-semibold text-slate-700">
                {data.isRefer ? mm.referral.formTitle : mm.referral.reportTitle}
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>
                {mm.referral.date}: {dateStr}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Row label={mm.referral.patientName} value={data.patientName} />
            <Row label={mm.referral.village} value={data.village} />
            <Row label={mm.referral.ageGroup} value={data.ageBand} />
            <Row label={mm.referral.pathway} value={data.pathwayLabel} />
            <Row label={mm.referral.clinician} value={data.clinician} />
          </div>

          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-teal-700">
            {mm.referral.findings}
          </h2>
          <div className="mt-2">
            <Row
              label={mm.referral.fever}
              value={
                data.hasFever
                  ? mm.referral.feverYes(data.feverDays)
                  : mm.referral.feverNo
              }
            />
            <Row label={mm.referral.vitals} value={vitalsParts.join("  ·  ")} />
            <Row
              label={mm.referral.dangerSigns}
              value={
                data.dangerSignLabels.length
                  ? data.dangerSignLabels.join("၊ ")
                  : mm.referral.none
              }
            />
            <Row
              label={mm.referral.comorbidities}
              value={
                data.comorbidityLabels.length
                  ? data.comorbidityLabels.join("၊ ")
                  : mm.referral.none
              }
            />
          </div>

          <div className="mt-6 rounded-xl border-2 border-slate-200 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">
                {mm.referral.decision}
              </h2>
              <span className="text-xl font-extrabold text-rose-700">
                {data.decisionLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium text-slate-500">
                {mm.referral.urgency}:{" "}
              </span>
              {data.urgencyText}
            </p>
            {data.reason && (
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium text-slate-500">
                  {mm.referral.referralReasons}:{" "}
                </span>
                {data.reason}
              </p>
            )}
          </div>

          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-teal-700">
            {mm.referral.plan}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {data.planSummary}
          </p>
          <div className="mt-1 space-y-1 text-sm text-slate-700">
            {toSentences(data.planDetail).map((sentence, i) => (
              <p key={i}>{sentence}</p>
            ))}
          </div>

          {data.isRefer && (
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-medium text-slate-500">
                {mm.referral.teleconsult}:{" "}
              </span>
              {data.teleconsultNumber}
            </p>
          )}

          <div className="mt-10 flex items-end justify-between">
            <div className="w-56 border-t border-slate-400 pt-1 text-center text-xs text-slate-500">
              {mm.referral.signature}
            </div>
            <p className="text-[10px] text-slate-400">{mm.referral.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
