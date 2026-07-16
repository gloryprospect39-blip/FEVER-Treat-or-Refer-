"use client";

import {
  ArrowLeft,
  Calendar,
  FileText,
  LayoutDashboard,
  Phone,
  Stethoscope,
  Thermometer,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ReferralForm, type ReferralData } from "@/components/ReferralForm";
import { PatientDrugPanel } from "@/components/PatientDrugPanel";
import { SectionCard } from "@/components/SectionCard";
import {
  StockPromptPanel,
  StockSessionSummary,
} from "@/components/StockPromptPanel";
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
  AGE_BANDS,
  CHILD_AGE_BANDS,
  PATHWAY_ADULT,
  PATHWAY_CHILD,
  ageBandsForPathway,
  defaultAgeBandIndex,
  isPediatricPathway,
} from "@/lib/fevergate/pathways";
import { buildReferReason, urgencyPhrase } from "@/lib/fevergate/treatment-plan";
import {
  buildTreatmentPlan,
  scheduleTeleconsultationNote,
  teleconsultationDialUrl,
  TELECONSULTATION_NUMBER,
  type ClinicContext,
  type TreatmentPlan,
} from "@/lib/fevergate/treatment-plan";
import { CLINIC_VILLAGES } from "@/lib/fevergate/villages";
import {
  EMPTY_VITAL_SELECTIONS,
  resolveVitalsFromCategories,
  sanitizeVitalSelections,
  vitalOptionsFor,
  vitalSelectionLabels,
  type VitalCategorySelection,
  type VitalKey,
} from "@/lib/fevergate/vitals-categories";
import {
  drugsToLogForPatient,
  type PatientDrugDispensing,
} from "@/lib/fevergate/drug-dispensing";
import { logActivityClient } from "@/lib/fevergate/log-activity";
import type {
  PatientEncounterSummary,
  RegisteredPatient,
} from "@/lib/fevergate/registry-types";
import {
  buildClinicWithStock,
  needsStockPrompt,
  sessionStockForDrugs,
  stockDrugsNeeded,
  type SessionStock,
} from "@/lib/fevergate/stock-prompts";
import { mm } from "@/lib/i18n/mm";
import { toSentences } from "@/lib/utils";

interface SessionResult {
  assessment: FebrileAssessment;
  patientContext: PatientContext;
  treatmentPlan: TreatmentPlan;
  clinic: ClinicContext;
  registeredPatient?: RegisteredPatient | null;
}

type PendingTreatAction =
  | { type: "start_treatment" }
  | { type: "schedule_teleconsultation" };

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

const FEVER_DAYS_MAX = 60;

function clampFeverDays(value: string): number {
  if (!value.trim()) return 0;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(FEVER_DAYS_MAX, Math.max(0, n));
}

function normalizeFeverDaysInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  return String(parseInt(digits, 10));
}

const VITAL_FIELD_LABELS: Record<VitalKey, string> = {
  temperature_c: mm.vitals.temperature,
  heart_rate: mm.vitals.heartRate,
  systolic_bp: mm.vitals.systolicBp,
  spo2_percent: mm.vitals.spo2,
  respiratory_rate: mm.vitals.respiratoryRate,
};

const VITAL_SELECT_CLASS =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

function formatVisitDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function priorDecisionLabel(decision: string): string {
  if (decision === "REFER" || decision === "REFER_IMMEDIATE") return mm.result.refer;
  if (decision === "TREAT_AND_MONITOR") return mm.result.treatAndMonitor;
  return mm.result.treat;
}

export function TriageApp() {
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [showReferral, setShowReferral] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [village, setVillage] = useState("");
  const [clinicianName, setClinicianName] = useState("");
  const [registeredPatientId, setRegisteredPatientId] = useState("");
  const [registeredPatient, setRegisteredPatient] =
    useState<RegisteredPatient | null>(null);
  const [returningPatients, setReturningPatients] = useState<RegisteredPatient[]>(
    [],
  );
  const [priorEncounters, setPriorEncounters] = useState<PatientEncounterSummary[]>(
    [],
  );

  const [pathway, setPathway] = useState<string>(PATHWAY_CHILD);
  const [ageBand, setAgeBand] = useState<string>(
    CHILD_AGE_BANDS[defaultAgeBandIndex(PATHWAY_CHILD)],
  );

  const [hasFever, setHasFever] = useState(true);
  const [feverDays, setFeverDays] = useState("1");
  const [vitalSelections, setVitalSelections] =
    useState<VitalCategorySelection>(EMPTY_VITAL_SELECTIONS);
  const [showVitals, setShowVitals] = useState(false);

  const [dangerTiles, setDangerTiles] = useState<Record<string, boolean>>({});
  const [comorbidities, setComorbidities] = useState<Comorbidity[]>([]);

  const [endemicity, setEndemicity] = useState<"high" | "low">("high");
  const [showClinic, setShowClinic] = useState(false);
  const [sessionStock, setSessionStock] = useState<SessionStock | null>(null);
  const [stockPromptOpen, setStockPromptOpen] = useState(false);
  const [pendingTreatAction, setPendingTreatAction] =
    useState<PendingTreatAction | null>(null);

  useEffect(() => {
    const bands = ageBandsForPathway(pathway);
    if (!(bands as readonly string[]).includes(ageBand)) {
      setAgeBand(bands[defaultAgeBandIndex(pathway)]);
      setDangerTiles({});
      setComorbidities([]);
    }
  }, [pathway, ageBand]);

  useEffect(() => {
    const ageMonths = AGE_BANDS[ageBand] ?? 24;
    setVitalSelections((prev) => sanitizeVitalSelections(prev, ageMonths));
  }, [ageBand]);

  const loadPatientHistory = async (patient: RegisteredPatient) => {
    try {
      const params = new URLSearchParams({
        patientId: patient.id,
        name: patient.name,
        village: patient.village,
      });
      const res = await fetch(`/api/patients/history?${params.toString()}`);
      if (!res.ok) {
        setPriorEncounters([]);
        return;
      }
      const data = (await res.json()) as { encounters?: PatientEncounterSummary[] };
      setPriorEncounters(data.encounters ?? []);
    } catch {
      setPriorEncounters([]);
    }
  };

  useEffect(() => {
    if (!village) {
      setReturningPatients([]);
      return;
    }
    void fetch(`/api/patients?village=${encodeURIComponent(village)}`)
      .then((res) => (res.ok ? res.json() : { patients: [] }))
      .then((data: { patients?: RegisteredPatient[] }) => {
        setReturningPatients(data.patients ?? []);
      })
      .catch(() => setReturningPatients([]));
  }, [village]);

  const selectReturningPatient = (patientId: string) => {
    setRegisteredPatientId(patientId);
    if (!patientId) {
      setRegisteredPatient(null);
      setPriorEncounters([]);
      return;
    }
    const patient = returningPatients.find((row) => row.id === patientId);
    if (!patient) return;
    setRegisteredPatient(patient);
    setPatientName(patient.name);
    setVillage(patient.village);
    void loadPatientHistory(patient);
  };

  const resolveRegisteredPatient = async (): Promise<RegisteredPatient | null> => {
    const name = patientName.trim();
    const villageCode = village.trim();
    if (!name || !villageCode) return null;
    try {
      const res = await fetch("/api/patients/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          village: villageCode,
          patientId: registeredPatientId || null,
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { patient?: RegisteredPatient | null };
      return data.patient ?? null;
    } catch {
      return null;
    }
  };

  const toggleComorbidity = (c: Comorbidity) => {
    setComorbidities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const toggleDanger = (code: string) => {
    setDangerTiles((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const setVitalCategory = (key: VitalKey, value: string) => {
    setVitalSelections((prev) => ({ ...prev, [key]: value }));
  };

  const ageMonths = AGE_BANDS[ageBand] ?? 24;
  const resolvedVitals = resolveVitalsFromCategories(vitalSelections, ageMonths);

  const renderVitalSelect = (key: VitalKey) => (
    <label key={key} className="block">
      <span className="text-xs text-slate-500">{VITAL_FIELD_LABELS[key]}</span>
      <select
        value={vitalSelections[key]}
        onChange={(e) => setVitalCategory(key, e.target.value)}
        className={VITAL_SELECT_CLASS}
      >
        <option value="">{mm.vitals.selectCategory}</option>
        {vitalOptionsFor(key, ageMonths).map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  const clinicContextForStock = (stock: SessionStock): ClinicContext =>
    buildClinicWithStock(endemicity, stock);

  const applyStockToResult = (stock: SessionStock) => {
    setSessionStock(stock);
    setStockPromptOpen(false);
    setResult((current) => {
      if (!current) return current;
      const clinic = clinicContextForStock(stock);
      const treatmentPlan = buildTreatmentPlan(
        current.patientContext,
        current.assessment,
        clinic,
      );
      return { ...current, clinic, treatmentPlan };
    });
  };

  const activityContext = () => ({
    actor: clinicianName.trim() || null,
    village: village.trim() || null,
    patientName: patientName.trim() || null,
  });

  const logEncounter = async (
    session: SessionResult,
    actionTaken: string,
    drugDispensing?: PatientDrugDispensing | null,
  ) => {
    await fetch("/api/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient: session.patientContext,
        assessment: session.assessment,
        clinic: session.clinic,
        actionTaken,
        drugDispensing: drugDispensing ?? null,
        patientName: patientName.trim() || null,
        village: village.trim() || null,
        clinician: clinicianName.trim() || null,
        patientId: session.registeredPatient?.id ?? (registeredPatientId || null),
      }),
    });
  };

  const executeTreatAction = async (
    action: PendingTreatAction,
    dispensing: PatientDrugDispensing,
  ) => {
    if (!result) return;
    const { assessment } = result;

    if (action.type === "start_treatment") {
      await logEncounter(result, "start_treatment", dispensing);
      logActivityClient({
        eventType: "start_treatment",
        ...activityContext(),
        metadata: { decision: assessment.decision, drug_dispensing: dispensing },
      });
      setActionNote(mm.actions.treatmentAcknowledged);
    } else {
      const note = scheduleTeleconsultationNote(assessment.monitoring_days);
      await logEncounter(result, `schedule_teleconsultation: ${note}`, dispensing);
      logActivityClient({
        eventType: "schedule_teleconsultation",
        ...activityContext(),
        metadata: {
          note,
          decision: assessment.decision,
          drug_dispensing: dispensing,
        },
      });
      setActionNote(note);
    }
    setPendingTreatAction(null);
  };

  const requestTreatAction = (action: PendingTreatAction) => {
    if (!result) return;
    const drugs = drugsToLogForPatient(
      result.patientContext,
      result.assessment,
      endemicity,
    );
    if (drugs.length > 0) {
      setPendingTreatAction(action);
      return;
    }
    void executeTreatAction(action, {});
  };

  const completeTreatAction = (dispensing: PatientDrugDispensing) => {
    if (!pendingTreatAction) return;
    void executeTreatAction(pendingTreatAction, dispensing);
  };

  const handleAssess = async () => {
    setError(null);
    try {
      const ctx = buildPatientContext({
        pathway,
        ageBand,
        hasFever,
        feverDurationDays: clampFeverDays(feverDays),
        selectedTiles: dangerTiles,
        comorbidities,
        systolicBp: resolvedVitals.systolicBp,
        spo2Percent: resolvedVitals.spo2Percent,
        respiratoryRate: resolvedVitals.respiratoryRate,
        temperatureC: resolvedVitals.temperatureC,
        heartRate: resolvedVitals.heartRate,
      });
      const assessment = evaluateFebrilePatient(ctx);
      const linkedPatient = await resolveRegisteredPatient();
      if (linkedPatient) {
        setRegisteredPatient(linkedPatient);
        setRegisteredPatientId(linkedPatient.id);
        void loadPatientHistory(linkedPatient);
      }
      const stockNeeded = needsStockPrompt(ctx, assessment, endemicity);
      const drugsNeeded = stockDrugsNeeded(ctx, assessment, endemicity);
      const stock = sessionStock
        ? sessionStockForDrugs(sessionStock, drugsNeeded)
        : { act: true, paracetamol: true };
      const clinic = clinicContextForStock(stock);
      const treatmentPlan = buildTreatmentPlan(ctx, assessment, clinic);

      setStockPromptOpen(stockNeeded && !sessionStock);
      setResult({
        assessment,
        patientContext: ctx,
        treatmentPlan,
        clinic,
        registeredPatient: linkedPatient,
      });
      setActionNote(null);
      logActivityClient({
        eventType: "assess_completed",
        ...activityContext(),
        metadata: {
          decision: assessment.decision,
          pathway,
          ageBand,
        },
      });
    } catch {
      setError("ထည့်သွင်းမှု စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။");
    }
  };

  const resetForm = () => {
    setResult(null);
    setActionNote(null);
    setShowReferral(false);
    setStockPromptOpen(false);
    setPendingTreatAction(null);
    setDangerTiles({});
    setComorbidities([]);
    setPatientName("");
    setVillage("");
    setRegisteredPatientId("");
    setRegisteredPatient(null);
    setReturningPatients([]);
    setPriorEncounters([]);
  };

  const handleNewPatient = async (action: string) => {
    if (result) {
      await logEncounter(result, action);
      logActivityClient({
        eventType: "new_patient",
        ...activityContext(),
        metadata: {
          decision: result.assessment.decision,
          action,
        },
      });
    }
    resetForm();
  };

  if (result) {
    const { assessment, treatmentPlan, patientContext, registeredPatient: linked } =
      result;
    const style = CARD_STYLES[assessment.decision];
    const isRefer =
      assessment.decision === "REFER" ||
      assessment.decision === "REFER_IMMEDIATE";
    const drugsNeeded = stockDrugsNeeded(
      patientContext,
      assessment,
      endemicity,
    );
    const stockRequired = drugsNeeded.length > 0;
    const awaitingStock = stockRequired && stockPromptOpen;
    const showStockSummary =
      stockRequired && sessionStock && !stockPromptOpen;

    const reason = isRefer
      ? buildReferReason(assessment.referral_reasons, assessment.urgency, pathway)
      : assessment.decision === "TREAT_AND_MONITOR"
        ? mm.result.monitorReason(assessment.monitoring_days)
        : awaitingStock
          ? mm.stockPrompt.answerToSeePlan
          : treatmentPlan.summary;

    const referralData: ReferralData = {
      patientName: patientName.trim() || mm.patient.unnamed,
      village: village.trim(),
      clinician: clinicianName.trim(),
      ageBand,
      pathwayLabel: pathway,
      hasFever,
      feverDays: clampFeverDays(feverDays),
      vitals: {
        systolicBp: resolvedVitals.systolicBp ?? 0,
        spo2: resolvedVitals.spo2Percent ?? 0,
        respiratoryRate: resolvedVitals.respiratoryRate ?? 0,
        temperatureC: resolvedVitals.temperatureC ?? 0,
        heartRate: resolvedVitals.heartRate ?? 0,
      },
      vitalClinicalLabels: Object.values(
        vitalSelectionLabels(vitalSelections, ageMonths),
      ),
      dangerSignLabels: dangerSignTilesForPathway(pathway)
        .filter((t) => dangerTiles[t.triggerCode])
        .map((t) => t.label),
      comorbidityLabels: comorbidityOptionsForBand(ageBand)
        .filter((o) => comorbidities.includes(o.comorbidity))
        .map((o) => o.label),
      decisionLabel: style.label,
      urgencyText: urgencyPhrase(assessment.urgency),
      reason,
      planSummary: treatmentPlan.summary,
      planDetail: treatmentPlan.detail,
      isRefer,
      teleconsultNumber: TELECONSULTATION_NUMBER,
    };

    return (
      <>
      <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
        <div
          className={`rounded-3xl bg-gradient-to-br ${style.bg} p-8 text-white shadow-xl shadow-slate-300/40`}
        >
          {(linked || village.trim()) && (
            <p className="mb-2 text-sm font-medium opacity-90">
              {linked
                ? mm.patient.visitCaption(
                    linked.name,
                    linked.village,
                    linked.visit_count,
                  )
                : mm.patient.catchmentOnly(village.trim())}
            </p>
          )}
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">
            {mm.result.triageDecision}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
            {style.label}
          </h1>
          <div className={`mt-3 space-y-1 text-lg font-medium ${style.reasonClass}`}>
            {toSentences(reason).map((sentence, i) => (
              <p key={i}>{sentence}</p>
            ))}
          </div>
          {stockRequired && stockPromptOpen && (
            <StockPromptPanel
              needed={drugsNeeded}
              initial={sessionStock ?? undefined}
              onConfirm={applyStockToResult}
            />
          )}
          {showStockSummary && sessionStock && (
            <StockSessionSummary
              needed={drugsNeeded}
              stock={sessionStock}
              onChange={() => setStockPromptOpen(true)}
            />
          )}
          {!awaitingStock && (
            <div className="mt-4 space-y-1.5 text-base leading-relaxed opacity-95">
              {toSentences(treatmentPlan.detail).map((sentence, i) => (
                <p key={i}>{sentence}</p>
              ))}
            </div>
          )}
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
                logActivityClient({
                  eventType: "teleconsultation_call",
                  ...activityContext(),
                  metadata: { decision: assessment.decision },
                });
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
              disabled={awaitingStock}
              onClick={() =>
                requestTreatAction({ type: "schedule_teleconsultation" })
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Calendar className="h-5 w-5" />
              {treatmentPlan.primaryActionLabel}
            </button>
          )}

          {assessment.decision === "TREAT" && (
            <button
              type="button"
              disabled={awaitingStock}
              onClick={() => requestTreatAction({ type: "start_treatment" })}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Stethoscope className="h-5 w-5" />
              {treatmentPlan.primaryActionLabel}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              logActivityClient({
                eventType: "open_referral_form",
                ...activityContext(),
                metadata: { decision: assessment.decision },
              });
              setShowReferral(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-6 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            <FileText className="h-4 w-4" />
            {mm.referral.button}
          </button>

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
      {pendingTreatAction && result && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <PatientDrugPanel
            needed={drugsToLogForPatient(
              result.patientContext,
              result.assessment,
              endemicity,
            )}
            onConfirm={completeTreatAction}
            onCancel={() => setPendingTreatAction(null)}
          />
        </div>
      )}
      {showReferral && (
        <ReferralForm
          data={referralData}
          onClose={() => setShowReferral(false)}
          onPrint={() =>
            logActivityClient({
              eventType: "print_referral",
              ...activityContext(),
              metadata: { decision: assessment.decision },
            })
          }
        />
      )}
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
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/supervisor"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            {mm.nav.supervisor}
          </Link>
        </div>
      </header>

      <SectionCard title={mm.patient.title} icon={<User className="h-5 w-5" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-3">
            <span className="text-xs text-slate-500">{mm.patient.village}</span>
            <select
              value={village}
              onChange={(e) => {
                setVillage(e.target.value);
                setRegisteredPatientId("");
                setRegisteredPatient(null);
                setPriorEncounters([]);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">{mm.patient.villageSelect}</option>
              {CLINIC_VILLAGES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          {village && (
            <label className="block sm:col-span-3">
              <span className="text-xs text-slate-500">
                {mm.patient.returningPatient}
              </span>
              <select
                value={registeredPatientId}
                onChange={(e) => selectReturningPatient(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">{mm.patient.returningPatientNew}</option>
                {returningPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.display_label} · visit #{patient.visit_count}
                  </option>
                ))}
              </select>
              {returningPatients.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {mm.patient.returningPatientEmpty}
                </p>
              )}
            </label>
          )}
          <label className="block">
            <span className="text-xs text-slate-500">{mm.patient.name}</span>
            <input
              type="text"
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                setRegisteredPatientId("");
                setRegisteredPatient(null);
                setPriorEncounters([]);
              }}
              placeholder={mm.patient.namePlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-500">{mm.patient.clinician}</span>
            <input
              type="text"
              value={clinicianName}
              onChange={(e) => setClinicianName(e.target.value)}
              placeholder={mm.patient.clinicianPlaceholder}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          {registeredPatient && (
            <div className="sm:col-span-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
              {mm.patient.visitTrace(
                registeredPatient.visit_count,
                formatVisitDate(registeredPatient.last_seen_at),
              )}
            </div>
          )}
          {registeredPatient && (
            <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {mm.patient.priorVisits}
              </p>
              {priorEncounters.length === 0 ? (
                <p className="text-sm text-slate-500">{mm.patient.priorVisitsEmpty}</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {priorEncounters.map((row, index) => (
                    <li
                      key={`${row.timestamp}-${index}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 pb-1.5 last:border-0 last:pb-0"
                    >
                      <span className="tabular-nums text-slate-500">
                        {formatVisitDate(row.timestamp)}
                      </span>
                      <span className="font-medium text-slate-900">
                        {priorDecisionLabel(row.decision)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SectionCard>

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
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={feverDays}
              onChange={(e) => setFeverDays(normalizeFeverDaysInput(e.target.value))}
              onBlur={() => {
                if (!feverDays.trim()) {
                  setFeverDays("1");
                  return;
                }
                setFeverDays(String(clampFeverDays(feverDays)));
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </label>
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4">
        <button
          type="button"
          onClick={() => setShowVitals(!showVitals)}
          className="text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          {showVitals ? mm.vitals.hide : mm.vitals.show}
        </button>
        {showVitals && (
          <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {mm.vitals.title}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {mm.vitals.notMeasuredHelp}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {mm.vitals.coreGroup}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {renderVitalSelect("temperature_c")}
                  {renderVitalSelect("heart_rate")}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {mm.vitals.circulationGroup}
                </p>
                {renderVitalSelect("systolic_bp")}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {mm.vitals.respiratoryGroup}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {renderVitalSelect("spo2_percent")}
                  {renderVitalSelect("respiratory_rate")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
