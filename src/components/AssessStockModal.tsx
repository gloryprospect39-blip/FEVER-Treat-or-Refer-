"use client";

import { ClinicStockCheckIn } from "@/components/ClinicStockCheckIn";
import type { SessionStock } from "@/lib/fevergate/stock-prompts";
import { mm } from "@/lib/i18n/mm";

export function AssessStockModal({
  initial,
  onConfirm,
  onCancel,
}: {
  initial: SessionStock | null;
  onConfirm: (stock: SessionStock) => void;
  onCancel: () => void;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
      <h3 className="text-lg font-bold text-slate-900">{mm.assessStock.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{mm.assessStock.subtitle}</p>
      <ClinicStockCheckIn value={initial} onChange={onConfirm} />
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        {mm.drugDispensing.cancel}
      </button>
    </div>
  );
}
