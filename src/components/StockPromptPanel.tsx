"use client";

import { useState } from "react";

import type { SessionStock, StockDrug } from "@/lib/fevergate/stock-prompts";
import {
  sessionStockForDrugs,
  stockAnswersComplete,
} from "@/lib/fevergate/stock-prompts";
import { mm } from "@/lib/i18n/mm";

function drugQuestion(drug: StockDrug): string {
  return drug === "act"
    ? mm.stockPrompt.actQuestion
    : mm.stockPrompt.paracetamolQuestion;
}

function drugLabel(drug: StockDrug, available: boolean): string {
  const name =
    drug === "act" ? mm.stockPrompt.actLabel : mm.stockPrompt.paracetamolLabel;
  return available
    ? mm.stockPrompt.drugAvailable(name)
    : mm.stockPrompt.drugUnavailable(name);
}

export function StockPromptPanel({
  needed,
  initial,
  onConfirm,
}: {
  needed: StockDrug[];
  initial?: SessionStock;
  onConfirm: (stock: SessionStock) => void;
}) {
  const [answers, setAnswers] = useState<Partial<SessionStock>>(
    initial ? sessionStockForDrugs(initial, needed) : {},
  );

  const setDrug = (drug: StockDrug, available: boolean) => {
    const next = {
      ...answers,
      [drug]: available,
    };
    setAnswers(next);
    if (stockAnswersComplete(needed, next)) {
      onConfirm(sessionStockForDrugs(next, needed));
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-white/30 bg-white/10 p-4">
      <p className="text-sm font-semibold">{mm.stockPrompt.title}</p>
      {needed.map((drug) => (
        <div key={drug} className="space-y-2">
          <p className="text-sm opacity-95">{drugQuestion(drug)}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDrug(drug, true)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                answers[drug] === true
                  ? "bg-white text-emerald-800"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {mm.stockPrompt.yes}
            </button>
            <button
              type="button"
              onClick={() => setDrug(drug, false)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                answers[drug] === false
                  ? "bg-white text-rose-800"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {mm.stockPrompt.no}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StockSessionSummary({
  needed,
  stock,
  onChange,
}: {
  needed: StockDrug[];
  stock: SessionStock;
  onChange: () => void;
}) {
  const resolved = sessionStockForDrugs(stock, needed);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
      <div className="space-y-0.5">
        {needed.map((drug) => (
          <p key={drug} className="opacity-95">
            {drugLabel(drug, resolved[drug])}
          </p>
        ))}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
      >
        {mm.stockPrompt.change}
      </button>
    </div>
  );
}
