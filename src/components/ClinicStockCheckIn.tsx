"use client";

import { useEffect, useState } from "react";

import type { SessionStock, StockDrug } from "@/lib/fevergate/stock-prompts";
import {
  SESSION_STOCK_DRUGS,
  sessionStockForDrugs,
  stockAnswersComplete,
} from "@/lib/fevergate/stock-prompts";
import { mm } from "@/lib/i18n/mm";

function drugQuestion(drug: StockDrug): string {
  return drug === "act"
    ? mm.stockPrompt.actQuestion
    : mm.stockPrompt.paracetamolQuestion;
}

function drugStatusLabel(drug: StockDrug, available: boolean): string {
  const name =
    drug === "act" ? mm.stockPrompt.actLabel : mm.stockPrompt.paracetamolLabel;
  return available
    ? mm.stockPrompt.drugAvailable(name)
    : mm.stockPrompt.drugUnavailable(name);
}

export function ClinicStockCheckIn({
  value,
  onChange,
}: {
  value: SessionStock | null;
  onChange: (stock: SessionStock) => void;
}) {
  const [answers, setAnswers] = useState<Partial<SessionStock>>(value ?? {});

  useEffect(() => {
    if (value) setAnswers(value);
  }, [value]);

  const setDrug = (drug: StockDrug, available: boolean) => {
    const next = { ...answers, [drug]: available };
    setAnswers(next);
    if (stockAnswersComplete(SESSION_STOCK_DRUGS, next)) {
      onChange(sessionStockForDrugs(next as SessionStock, SESSION_STOCK_DRUGS));
    }
  };

  const complete =
    value !== null &&
    stockAnswersComplete(SESSION_STOCK_DRUGS, value);

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <p className="text-xs text-slate-500">{mm.clinic.stockHint}</p>
      <div className="mt-3 space-y-3">
        {SESSION_STOCK_DRUGS.map((drug) => (
          <div key={drug} className="space-y-2">
            <p className="text-sm text-slate-700">{drugQuestion(drug)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDrug(drug, true)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  answers[drug] === true
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {mm.stockPrompt.yes}
              </button>
              <button
                type="button"
                onClick={() => setDrug(drug, false)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  answers[drug] === false
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {mm.stockPrompt.no}
              </button>
            </div>
          </div>
        ))}
      </div>
      {!complete ? (
        <p className="mt-3 text-xs text-amber-800">{mm.clinic.stockIncomplete}</p>
      ) : null}
    </div>
  );
}

export function ClinicStockSummary({ stock }: { stock: SessionStock }) {
  return (
    <div className="mt-2 space-y-0.5 text-xs text-slate-600">
      {SESSION_STOCK_DRUGS.map((drug) => (
        <p key={drug}>{drugStatusLabel(drug, stock[drug])}</p>
      ))}
    </div>
  );
}
