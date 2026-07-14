"use client";

import { useState } from "react";

import {
  dispensingComplete,
  type DrugDispensingStatus,
  type PatientDrugDispensing,
} from "@/lib/fevergate/drug-dispensing";
import type { StockDrug } from "@/lib/fevergate/stock-prompts";
import { mm } from "@/lib/i18n/mm";

const STATUS_OPTIONS: DrugDispensingStatus[] = [
  "given",
  "out_of_stock",
  "not_indicated",
];

function drugName(drug: StockDrug): string {
  return drug === "act"
    ? mm.drugDispensing.actLabel
    : mm.drugDispensing.paracetamolLabel;
}

function statusLabel(status: DrugDispensingStatus): string {
  if (status === "given") return mm.drugDispensing.given;
  if (status === "out_of_stock") return mm.drugDispensing.outOfStock;
  return mm.drugDispensing.notIndicated;
}

export function PatientDrugPanel({
  needed,
  onConfirm,
  onCancel,
}: {
  needed: StockDrug[];
  onConfirm: (dispensing: PatientDrugDispensing) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<PatientDrugDispensing>({});

  const setStatus = (drug: StockDrug, status: DrugDispensingStatus) => {
    const next = { ...answers, [drug]: status };
    setAnswers(next);
    if (dispensingComplete(needed, next)) onConfirm(next);
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
      <h3 className="text-lg font-bold text-slate-900">
        {mm.drugDispensing.title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{mm.drugDispensing.subtitle}</p>

      <div className="mt-4 space-y-4">
        {needed.map((drug) => (
          <div key={drug}>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              {drugName(drug)}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus(drug, status)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    answers[drug] === status
                      ? status === "given"
                        ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                        : status === "out_of_stock"
                          ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                          : "bg-slate-200 text-slate-700 ring-1 ring-slate-300"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        {mm.drugDispensing.cancel}
      </button>
    </div>
  );
}
