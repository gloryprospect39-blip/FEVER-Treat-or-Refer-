import type { DrugDispensingSummary } from "@/lib/fevergate/drug-dispensing";
import type { EncounterSummary, VillageSummaryRow } from "@/lib/fevergate/reports";
import { pct } from "@/lib/fevergate/reports";
import { mm } from "@/lib/i18n/mm";

type Segment = {
  key: string;
  count: number;
  color: string;
  label: string;
};

function decisionSegments(summary: EncounterSummary): Segment[] {
  return [
    {
      key: "referImmediate",
      count: summary.referImmediate,
      color: "bg-rose-700",
      label: mm.result.referImmediate,
    },
    {
      key: "refer",
      count: summary.refer,
      color: "bg-rose-400",
      label: mm.result.refer,
    },
    {
      key: "treatMonitor",
      count: summary.treatMonitor,
      color: "bg-amber-400",
      label: mm.result.treatAndMonitor,
    },
    {
      key: "treat",
      count: summary.treat,
      color: "bg-emerald-500",
      label: mm.result.treat,
    },
  ];
}

function StackedBar({
  segments,
  total,
  height = "h-7",
}: {
  segments: Segment[];
  total: number;
  height?: string;
}) {
  if (total === 0) {
    return (
      <div
        className={`${height} rounded-lg border border-dashed border-slate-200 bg-slate-50`}
      />
    );
  }

  return (
    <div
      className={`${height} flex overflow-hidden rounded-lg`}
      role="img"
      aria-label={mm.supervisor.decisionMixAria(total)}
    >
      {segments
        .filter((segment) => segment.count > 0)
        .map((segment) => (
          <div
            key={segment.key}
            className={`${segment.color} min-w-[2px] transition-[width]`}
            style={{ width: `${(100 * segment.count) / total}%` }}
            title={`${segment.label}: ${segment.count} (${pct(segment.count, total)})`}
          />
        ))}
    </div>
  );
}

function Legend({ segments, total }: { segments: Segment[]; total: number }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {segments.map((segment) => (
        <li key={segment.key} className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-sm ${segment.color}`}
          />
          <span>
            {segment.label}{" "}
            <span className="font-medium text-slate-800">{segment.count}</span>
            {total > 0 ? (
              <span className="text-slate-400">
                {" "}
                ({pct(segment.count, total)})
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DecisionMixChart({
  daily,
  weekly,
}: {
  daily: EncounterSummary;
  weekly: EncounterSummary;
}) {
  const segments = decisionSegments(daily);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        {mm.supervisor.decisionMixTitle}
      </h2>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            {mm.report.daily}
          </p>
          <StackedBar segments={segments} total={daily.total} />
          <Legend segments={segments} total={daily.total} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            {mm.report.weekly}
          </p>
          <StackedBar segments={decisionSegments(weekly)} total={weekly.total} />
          <Legend segments={decisionSegments(weekly)} total={weekly.total} />
        </div>
      </div>
    </section>
  );
}

export function VillageVolumeChart({
  rows,
  total,
}: {
  rows: VillageSummaryRow[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.total));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        {mm.supervisor.villageVolumeTitle}
      </h2>
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{mm.report.empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => {
            const label =
              row.village === "Unknown"
                ? mm.report.villageUnknown
                : row.village;
            const widthPct = Math.round((100 * row.total) / max);

            return (
              <li key={row.village}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800">{label}</span>
                  <span className="tabular-nums text-slate-500">
                    {row.total}
                    {row.referrals > 0 ? (
                      <span className="ml-1 text-rose-600">
                        · {row.referrals} {mm.report.referrals}
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DrugRow({
  label,
  counts,
}: {
  label: string;
  counts: { given: number; out_of_stock: number; not_indicated: number };
}) {
  const total = counts.given + counts.out_of_stock + counts.not_indicated;
  const segments: Segment[] = [
    {
      key: "given",
      count: counts.given,
      color: "bg-emerald-500",
      label: mm.drugDispensing.given,
    },
    {
      key: "out_of_stock",
      count: counts.out_of_stock,
      color: "bg-amber-500",
      label: mm.drugDispensing.outOfStock,
    },
    {
      key: "not_indicated",
      count: counts.not_indicated,
      color: "bg-slate-300",
      label: mm.drugDispensing.notIndicated,
    },
  ];

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-xs text-slate-500">
          {total === 0 ? mm.supervisor.noDrugLogs : `${total} ${mm.supervisor.loggedShort}`}
        </span>
      </div>
      <StackedBar segments={segments} total={total} height="h-4" />
    </div>
  );
}

export function DrugDispensingChart({
  summary,
}: {
  summary: DrugDispensingSummary;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-bold text-slate-900">
        {mm.supervisor.drugChartTitle}
      </h2>
      <p className="mb-4 text-xs text-slate-500">{mm.supervisor.drugChartSubtitle}</p>
      <div className="space-y-4">
        <DrugRow label={mm.drugDispensing.actLabel} counts={summary.act} />
        <DrugRow
          label={mm.drugDispensing.paracetamolLabel}
          counts={summary.paracetamol}
        />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        {mm.report.stockPatientsLogged}: {summary.logged}
      </p>
    </section>
  );
}

export function ActivityPulseChart({
  summary,
}: {
  summary: {
    assessCompleted: number;
    referrals: number;
    treatments: number;
    prints: number;
    newPatients: number;
  };
}) {
  const items = [
    {
      label: mm.activity.assessments,
      value: summary.assessCompleted,
      color: "text-teal-700",
      bar: "from-teal-400 to-teal-600",
    },
    {
      label: mm.activity.treatmentActions,
      value: summary.treatments,
      color: "text-emerald-700",
      bar: "from-emerald-400 to-emerald-600",
    },
    {
      label: mm.activity.referralActions,
      value: summary.referrals,
      color: "text-rose-700",
      bar: "from-rose-400 to-rose-600",
    },
    {
      label: mm.activity.newPatients,
      value: summary.newPatients,
      color: "text-slate-900",
      bar: "from-slate-300 to-slate-500",
    },
  ];
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        {mm.supervisor.activityPulseTitle}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">{item.label}</span>
              <span className={`font-bold tabular-nums ${item.color}`}>
                {item.value}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${item.bar}`}
                style={{ width: `${Math.round((100 * item.value) / max)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
