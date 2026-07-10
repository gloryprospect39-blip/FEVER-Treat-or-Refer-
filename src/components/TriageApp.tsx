"use client";

import {
  ArrowLeft,
  Calendar,
  Phone,
  Stethoscope,
  Thermometer,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ChatAssistant } from "@/components/ChatAssistant";
import { SectionCard } from "@/components/SectionCard";
import { ToggleChip } from "@/components/ToggleChip";
import { evaluateFebrilePatient } from "@/lib/decision-engine";
import type {
  Comorbidity,
  FebrileAssessment,
  PatientContext,
  TriageDecision,
} from "@/lib/decision-engine/models";
import { dangerSignTilesForPathway } from "@/lib/fevergate/danger-signs";
import { comorbidityOptionsForBand, optionsBySystem } from "@/lib/fevergate/comorbidities";
import { buildPatientContext } from "@/lib/fevergate/patient-context";
import {
  ADULT_AGE_BANDS,
  CHILD_AGE_BANDS,
  PATHWAY_ADULT,
  PATHWAY_CHILD,
  ageBandsForPathway,
  defaultAgeBandIndex,
  isPediatricPathway,
} from "@/lib/fevergate/pathways";
import { buildReferReason } from "@/lib/fevergate/treatment-plan";
import {
  buildTreatmentPlan,
  scheduleTeleconsultationNote,
  teleconsultationDialUrl,
  type ClinicContext,
  type TreatmentPlan,
} from "@/lib/fevergate/treatment-plan";
import { mm } from "@/lib/i18n/mm";

interface SessionResult {
  assessment: FebrileAssessment;
  patientContext: PatientContext;
  treatmentPlan: TreatmentPlan;
  clinic: ClinicContext;
}

const CARD_STYLES: Record<
  TriageDecision,
  { bg: string; label: string; reasonClass: string }
> = {
  REFER_IMMEDIATE: {
    bg: "from-rose-600 to-red-700",
    label: mm.result.refer,
    reasonClass: "text-rose-50",
  },
  REFER: {
    bg: "from-rose-600 to-red-700",
    label: mm.result.refer,
    reasonClass: "text-rose-50",
  },
  TREAT_AND_MONITOR: {
    bg: "from-amber-500 to-orange-600",
    label: mm.result.treatAndMonitor,
    reasonClass: "text-amber-50",
  },
  TREAT: {
    bg: "from-emerald-600 to-teal-700",
    label: mm.result.treat,
    reasonClass: "text-emerald-50",
  },
};

export function TriageApp() {
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const [pathway, setPathway] = useState<string>(PATHWAY_CHILD);
  const [ageBand, setAgeBand] = useState<string>(
    CHILD_AGE_BANDS[defaultAgeBandIndex(PATHWAY_CHILD)],
  );

  const [hasFever, setHasFever] = useState(true);
  const [feverDays, setFeverDays] = useState(1);
  const [systolicBp, setSystolicBp] = useState(0);
  const [spo2, setSpo2] = useState(0);
  const [respiratoryRate, setRespiratoryRate] = useState(0);
  const [showVitals, setShowVitals] = useState(false);

  const [dangerTiles, setDangerTiles] = useState<Record<string, boolean>>({});
  const [comorbidities, setComorbidities] = useState<Comorbidity[]>([]);

  const [endemicity, setEndemicity] = useState<"high" | "low">("high");
  const [actInStock, setActInStock] = useState(true);
  const [amoxInStock, setAmoxInStock] = useState(false);
  const [paraInStock, setParaInStock] = useState(true);
  const [showClinic, setShowClinic] = useState(false);

  useEffect(() => {
    const bands = ageBandsForPathway(pathway);
    if (!(bands as readonly string[]).includes(ageBand)) {
      setAgeBand(bands[defaultAgeBandIndex(pathway)]);
      setDangerTiles({});
      setComorbidities([]);
    }
  }, [pathway, ageBand]);

  const toggleComorbidity = (c: Comorbidity) => {
    setComorbidities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const toggleDanger = (code: string) => {
    setDangerTiles((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const clinicContext = (): ClinicContext => ({
    malaria_endemicity: endemicity,
    act_in_stock: actInStock,
    amoxicillin_in_stock: amoxInStock,
    paracetamol_in_stock: paraInStock,
  });

  const logEncounter = async (
    session: SessionResult,
    actionTaken: string,
  ) => {
    await fetch("/api/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient: session.patientContext,
        assessment: session.assessment,
        clinic: session.clinic,
        actionTaken,
      }),
    });
  };

  const handleAssess = () => {
    setError(null);
    try {
      const clinic = clinicContext();
      const ctx = buildPatientContext({
        pathway,
        ageBand,
        hasFever,
        feverDurationDays: feverDays,
        selectedTiles: dangerTiles,
        comorbidities,
        systolicBp: systolicBp || null,
        spo2Percent: spo2 || null,
        respiratoryRate: respiratoryRate || null,
      });
      const assessment = evaluateFebrilePatient(ctx);
      const treatmentPlan = buildTreatmentPlan(ctx, assessment, clinic);

      setResult({
        assessment,
        patientContext: ctx,
        treatmentPlan,
        clinic,
      });
      setActionNote(null);
    } catch {
      setError("ထည့်သွင်းမှု စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။");
    }
  };

  const resetForm = () => {
    setResult(null);
    setActionNote(null);
    setDangerTiles({});
    setComorbidities([]);
  };

  const handleNewPatient = async (action: string) => {
    if (result) await logEncounter(result, action);
    resetForm();
  };

  if (result) {
    const { assessment, treatmentPlan } = result;
    const style = CARD_STYLES[assessment.decision];
    const isRefer =
      assessment.decision === "REFER" ||
      assessment.decision === "REFER_IMMEDIATE";

    const reason = isRefer
      ? buildReferReason(assessment.referral_reasons, assessment.urgency)
      : assessment.decision === "TREAT_AND_MONITOR"
        ? mm.result.monitorReason(assessment.monitoring_days)
        : treatmentPlan.summary;

    const patientSummary = [
      `Pathway: ${pathway}`,
      `Age band: ${ageBand}`,
      `Decision: ${assessment.decision}`,
      `Urgency: ${assessment.urgency}`,
      `Referral reasons: ${assessment.referral_reasons.join(", ") || "none"}`,
      `Sepsis screen score: ${assessment.sepsis.score}`,
    ].join("; ");

    return (
      <>
      <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
        <div
          className={`rounded-3xl bg-gradient-to-br ${style.bg} p-8 text-white shadow-xl shadow-slate-300/40`}
        >
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">
            {mm.result.triageDecision}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
            {style.label}
          </h1>
          <p className={`mt-3 text-lg font-medium ${style.reasonClass}`}>
            {reason}
          </p>
          <p className="mt-4 text-base leading-relaxed opacity-95">
            {treatmentPlan.detail}
          </p>
        </div>

        {actionNote && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            {actionNote}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isRefer && (
            <button
              type="button"
              onClick={async () => {
                await logEncounter(result, "teleconsultation_call");
                setActionNote(
                  `${mm.actions.dialTeleconsultation}: ${teleconsultationDialUrl().replace("tel:", "")}`,
                );
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-rose-800"
            >
              <Phone className="h-5 w-5" />
              {treatmentPlan.primaryActionLabel}
            </button>
          )}

          {assessment.decision === "TREAT_AND_MONITOR" && (
            <button
              type="button"
              onClick={async () => {
                const note = scheduleTeleconsultationNote(
                  assessment.monitoring_days,
                );
                await logEncounter(result, `schedule_teleconsultation: ${note}`);
                setActionNote(note);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-amber-700"
            >
              <Calendar className="h-5 w-5" />
              {treatmentPlan.primaryActionLabel}
            </button>
          )}

          {assessment.decision === "TREAT" && (
            <button
              type="button"
              onClick={async () => {
                await logEncounter(result, "start_treatment");
                setActionNote(mm.actions.treatmentAcknowledged);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-800"
            >
              <Stethoscope className="h-5 w-5" />
              {treatmentPlan.primaryActionLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              handleNewPatient(
                isRefer
                  ? "refer_new_patient"
                  : assessment.decision === "TREAT_AND_MONITOR"
                    ? "monitor_new_patient"
                    : "treat_new_patient",
              )
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {mm.actions.newPatient}
          </button>
        </div>
      </div>
      <ChatAssistant patientSummary={patientSummary} />
      </>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 pb-16">
      <header className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
          <Stethoscope className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {mm.app.title}
        </h1>
        <p className="mt-1 text-slate-500">{mm.app.tagline}</p>
      </header>

      <SectionCard
        title={mm.clinic.title}
        icon={<Thermometer className="h-5 w-5" />}
      >
        <button
          type="button"
          onClick={() => setShowClinic(!showClinic)}
          className="mb-3 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          {showClinic ? mm.clinic.hideSettings : mm.clinic.showSettings}
        </button>
        {showClinic && (
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                {mm.clinic.stockHeading}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  [mm.clinic.actInStock, actInStock, setActInStock],
                  [mm.clinic.amoxicillin, amoxInStock, setAmoxInStock],
                  [mm.clinic.paracetamol, paraInStock, setParaInStock],
                ].map(([label, val, setter]) => (
                  <button
                    key={label as string}
                    type="button"
                    onClick={() =>
                      (setter as (v: boolean) => void)(!(val as boolean))
                    }
                    className={`rounded-lg px-2 py-2 text-xs font-medium ${
                      val
                        ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                {mm.clinic.endemicityHeading}
              </p>
              <div className="flex gap-2">
                {(["high", "low"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEndemicity(v)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      endemicity === v
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {v === "high"
                      ? mm.clinic.highEndemicity
                      : mm.clinic.lowEndemicity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title={mm.age.title} icon={<UserPlus className="h-5 w-5" />}>
        <div className="mb-3 flex gap-2">
          {[PATHWAY_CHILD, PATHWAY_ADULT].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPathway(p);
                const bands = ageBandsForPathway(p);
                setAgeBand(bands[defaultAgeBandIndex(p)]);
                setComorbidities([]);
                setDangerTiles({});
              }}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
                pathway === p
                  ? "bg-teal-600 text-white shadow"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {ageBandsForPathway(pathway).map((band) => (
            <button
              key={band}
              type="button"
              onClick={() => {
                setAgeBand(band);
                setComorbidities([]);
                setDangerTiles({});
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                ageBand === band
                  ? "bg-teal-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {band}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={mm.fever.title}>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={hasFever}
              onChange={(e) => setHasFever(e.target.checked)}
              className="h-5 w-5 rounded accent-teal-600"
            />
            <span className="text-sm font-medium">{mm.fever.hasFever}</span>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{mm.fever.durationDays}</span>
            <input
              type="number"
              min={0}
              max={60}
              value={feverDays}
              onChange={(e) => setFeverDays(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title={mm.vitals.title}>
        <button
          type="button"
          onClick={() => setShowVitals(!showVitals)}
          className="text-sm font-medium text-teal-700"
        >
          {showVitals ? mm.vitals.hide : mm.vitals.show}
        </button>
        {showVitals && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              [mm.vitals.systolicBp, systolicBp, setSystolicBp],
              [mm.vitals.spo2, spo2, setSpo2],
              [mm.vitals.respiratoryRate, respiratoryRate, setRespiratoryRate],
            ].map(([label, val, setter]) => (
              <label key={label as string} className="block">
                <span className="text-xs text-slate-500">{label as string}</span>
                <input
                  type="number"
                  min={0}
                  value={val as number}
                  onChange={(e) =>
                    (setter as (n: number) => void)(Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={
          pathway === PATHWAY_ADULT
            ? mm.dangerSigns.adultTitle
            : mm.dangerSigns.pediatricTitle
        }
        description={
          pathway === PATHWAY_ADULT
            ? mm.dangerSigns.adultDesc
            : mm.dangerSigns.pediatricDesc
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {dangerSignTilesForPathway(pathway).map((tile) => {
            const Icon = tile.icon;
            return (
              <ToggleChip
                key={`${pathway}-${tile.triggerCode}`}
                active={!!dangerTiles[tile.triggerCode]}
                onClick={() => toggleDanger(tile.triggerCode)}
                icon={<Icon className="h-5 w-5" />}
                label={tile.label}
              />
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={
          isPediatricPathway(ageBand)
            ? mm.comorbidity.pediatricTitle
            : mm.comorbidity.adultTitle
        }
        description={
          isPediatricPathway(ageBand)
            ? mm.comorbidity.pediatricDesc
            : mm.comorbidity.adultDesc
        }
      >
        {isPediatricPathway(ageBand) ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {comorbidityOptionsForBand(ageBand).map((opt) => {
              const Icon = opt.icon;
              return (
                <ToggleChip
                  key={opt.comorbidity}
                  active={comorbidities.includes(opt.comorbidity)}
                  onClick={() => toggleComorbidity(opt.comorbidity)}
                  icon={<Icon className="h-5 w-5" />}
                  label={opt.label}
                />
              );
            })}
          </div>
        ) : (
          Object.entries(optionsBySystem(ageBand)).map(([system, opts]) => (
            <div key={system} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {system}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {opts.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <ToggleChip
                      key={opt.comorbidity}
                      active={comorbidities.includes(opt.comorbidity)}
                      onClick={() => toggleComorbidity(opt.comorbidity)}
                      icon={<Icon className="h-5 w-5" />}
                      label={opt.label}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </SectionCard>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAssess}
        className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-200 transition hover:from-teal-700 hover:to-emerald-700"
      >
        {mm.actions.assess}
      </button>
    </div>
    <ChatAssistant />
    </>
  );
}
