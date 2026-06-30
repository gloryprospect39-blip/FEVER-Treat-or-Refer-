"use client";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Stethoscope,
  Thermometer,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SectionCard } from "@/components/SectionCard";
import { ToggleChip } from "@/components/ToggleChip";
import { evaluateFebrilePatient } from "@/lib/decision-engine";
import type {
  Comorbidity,
  FebrileAssessment,
  PatientContext,
  TriageDecision,
} from "@/lib/decision-engine/models";
import { DANGER_SIGN_TILES } from "@/lib/fevergate/danger-signs";
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
  requireCatchment,
  scheduleTeleconsultationNote,
  teleconsultationDialUrl,
  type ClinicContext,
  type TreatmentPlan,
} from "@/lib/fevergate/treatment-plan";

interface RegisteredPatient {
  id: string;
  name: string;
  village: string;
  visit_count: number;
  display_label: string;
  last_seen_at: string;
}

interface SessionResult {
  assessment: FebrileAssessment;
  patientContext: PatientContext;
  treatmentPlan: TreatmentPlan;
  clinic: ClinicContext;
  catchment: string;
  registeredPatient: RegisteredPatient | null;
}

const NEW_PATIENT = "— New patient —";
const ALL_VILLAGES = "All villages";
const NEW_CATCHMENT = "— Type new village —";

const CARD_STYLES: Record<
  TriageDecision,
  { bg: string; label: string; reasonClass: string }
> = {
  REFER_IMMEDIATE: {
    bg: "from-rose-600 to-red-700",
    label: "REFER",
    reasonClass: "text-rose-50",
  },
  REFER: {
    bg: "from-rose-600 to-red-700",
    label: "REFER",
    reasonClass: "text-rose-50",
  },
  TREAT_AND_MONITOR: {
    bg: "from-amber-500 to-orange-600",
    label: "TREAT & MONITOR",
    reasonClass: "text-amber-50",
  },
  TREAT: {
    bg: "from-emerald-600 to-teal-700",
    label: "TREAT",
    reasonClass: "text-emerald-50",
  },
};

export function TriageApp() {
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const [villages, setVillages] = useState<string[]>([]);
  const [recentPatients, setRecentPatients] = useState<RegisteredPatient[]>([]);

  const [villageFilter, setVillageFilter] = useState(ALL_VILLAGES);
  const [revisitId, setRevisitId] = useState<string | null>(null);
  const [revisitSelect, setRevisitSelect] = useState(NEW_PATIENT);
  const [catchmentPick, setCatchmentPick] = useState(NEW_CATCHMENT);
  const [catchmentText, setCatchmentText] = useState("");
  const [patientName, setPatientName] = useState("");

  const [pathway, setPathway] = useState(PATHWAY_CHILD);
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

  const loadPatients = useCallback(async () => {
    const params =
      villageFilter !== ALL_VILLAGES
        ? `?village=${encodeURIComponent(villageFilter)}`
        : "";
    const res = await fetch(`/api/patients${params}`);
    const data = await res.json();
    setVillages(data.villages ?? []);
    setRecentPatients(data.patients ?? []);
  }, [villageFilter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const effectiveCatchment =
    revisitId != null
      ? recentPatients.find((p) => p.id === revisitId)?.village ?? ""
      : catchmentPick === NEW_CATCHMENT
        ? catchmentText
        : catchmentPick;

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
        catchment: session.catchment,
        actionTaken,
        registeredPatientId: session.registeredPatient?.id ?? null,
        registeredName: session.registeredPatient?.name ?? null,
        registeredVillage: session.registeredPatient?.village ?? null,
      }),
    });
  };

  const handleAssess = async () => {
    setError(null);
    try {
      const catchment = requireCatchment(effectiveCatchment);
      const clinic = clinicContext();
      const ctx = buildPatientContext({
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

      let registered: RegisteredPatient | null = null;
      if (revisitId || (patientName.trim() && catchment)) {
        const res = await fetch("/api/patients/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: revisitId
              ? recentPatients.find((p) => p.id === revisitId)?.name ?? ""
              : patientName,
            village: catchment,
            patientId: revisitId,
          }),
        });
        const data = await res.json();
        registered = data.patient ?? null;
        await loadPatients();
      }

      setResult({
        assessment,
        patientContext: ctx,
        treatmentPlan,
        clinic,
        catchment,
        registeredPatient: registered,
      });
      setActionNote(null);
    } catch {
      setError("Village / catchment is required for every encounter.");
    }
  };

  const resetForm = () => {
    setResult(null);
    setActionNote(null);
    setRevisitId(null);
    setRevisitSelect(NEW_PATIENT);
    setPatientName("");
    setCatchmentText("");
    setDangerTiles({});
    setComorbidities([]);
  };

  const handleNewPatient = async (action: string) => {
    if (result) await logEncounter(result, action);
    resetForm();
    await loadPatients();
  };

  if (result) {
    const { assessment, treatmentPlan, registeredPatient, catchment } = result;
    const style = CARD_STYLES[assessment.decision];
    const isRefer =
      assessment.decision === "REFER" ||
      assessment.decision === "REFER_IMMEDIATE";

    const reason = isRefer
      ? buildReferReason(assessment.referral_reasons, assessment.urgency)
      : assessment.decision === "TREAT_AND_MONITOR"
        ? `Treat now and re-check in ${assessment.monitoring_days} days.`
        : treatmentPlan.summary;

    return (
      <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
        <div
          className={`rounded-3xl bg-gradient-to-br ${style.bg} p-8 text-white shadow-xl shadow-slate-300/40`}
        >
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">
            Triage decision
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

        {registeredPatient ? (
          <p className="text-center text-sm text-slate-500">
            {registeredPatient.name} · {registeredPatient.village} (visit #
            {registeredPatient.visit_count})
          </p>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Catchment: {catchment}
          </p>
        )}

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
                  `Dial teleconsultation: ${teleconsultationDialUrl().replace("tel:", "")}`,
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
                setActionNote("Treatment plan acknowledged.");
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
            New patient
          </button>
        </div>
      </div>
    );
  }

  const revisitLabels =
    villageFilter !== ALL_VILLAGES
      ? [NEW_PATIENT, ...recentPatients.map((p) => p.name)]
      : [NEW_PATIENT, ...recentPatients.map((p) => p.display_label)];

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 pb-16">
      <header className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
          <Stethoscope className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          FeverGate
        </h1>
        <p className="mt-1 text-slate-500">
          Point-of-care treat / refer — screening only
        </p>
      </header>

      <SectionCard
        title="Clinic context"
        description="Today's stock and malaria endemicity"
        icon={<Thermometer className="h-5 w-5" />}
      >
        <button
          type="button"
          onClick={() => setShowClinic(!showClinic)}
          className="mb-3 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          {showClinic ? "Hide" : "Show"} clinic settings
        </button>
        {showClinic && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["high", "low"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setEndemicity(v)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize ${
                    endemicity === v
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {v} endemicity
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["ACT in stock", actInStock, setActInStock],
                ["Amoxicillin", amoxInStock, setAmoxInStock],
                ["Paracetamol", paraInStock, setParaInStock],
              ].map(([label, val, setter]) => (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => (setter as (v: boolean) => void)(!(val as boolean))}
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
        )}
      </SectionCard>

      <SectionCard
        title="Village / catchment"
        description="Required on every encounter for epidemiologic reporting"
        icon={<MapPin className="h-5 w-5" />}
      >
        <div className="space-y-3">
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option>{ALL_VILLAGES}</option>
            {villages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={revisitSelect}
            onChange={(e) => {
              setRevisitSelect(e.target.value);
              if (e.target.value === NEW_PATIENT) {
                setRevisitId(null);
              } else {
                const idx = revisitLabels.indexOf(e.target.value) - 1;
                setRevisitId(recentPatients[idx]?.id ?? null);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            {revisitLabels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>

          {revisitId == null && (
            <>
              <select
                value={catchmentPick}
                onChange={(e) => setCatchmentPick(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              >
                <option>{NEW_CATCHMENT}</option>
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {catchmentPick === NEW_CATCHMENT && (
                <input
                  value={catchmentText}
                  onChange={(e) => setCatchmentText(e.target.value)}
                  placeholder="Enter village / catchment (required)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              )}
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient name (optional)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Age group" icon={<UserPlus className="h-5 w-5" />}>
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

      <SectionCard title="Fever">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={hasFever}
              onChange={(e) => setHasFever(e.target.checked)}
              className="h-5 w-5 rounded accent-teal-600"
            />
            <span className="text-sm font-medium">Fever</span>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Duration (days)</span>
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

      <SectionCard title="Vitals (optional)">
        <button
          type="button"
          onClick={() => setShowVitals(!showVitals)}
          className="text-sm font-medium text-teal-700"
        >
          {showVitals ? "Hide vitals" : "Add vitals"}
        </button>
        {showVitals && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              ["Systolic BP", systolicBp, setSystolicBp],
              ["SpO₂ %", spo2, setSpo2],
              ["RR /min", respiratoryRate, setRespiratoryRate],
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
        title="Danger signs"
        description="Tap any that are present"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {DANGER_SIGN_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <ToggleChip
                key={tile.triggerCode}
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
        title={isPediatricPathway(ageBand) ? "High-risk conditions" : "Underlying diseases"}
        description={
          isPediatricPathway(ageBand)
            ? "Sickle cell or severe malnutrition"
            : "Grouped by organ system"
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
        Assess patient
      </button>
    </div>
  );
}
