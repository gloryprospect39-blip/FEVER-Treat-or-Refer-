import { ArrowLeft, BarChart3, ClipboardList, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { mm } from "@/lib/i18n/mm";

type SupervisorSection = "supervisor" | "reports" | "activity";

const linkBase =
  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition";

function sectionClass(active: boolean, accent: "teal" | "slate"): string {
  if (active) {
    return accent === "teal"
      ? `${linkBase} border-teal-300 bg-teal-100 text-teal-900`
      : `${linkBase} border-slate-300 bg-slate-100 text-slate-900`;
  }
  return accent === "teal"
    ? `${linkBase} border-teal-200 bg-white text-teal-700 hover:bg-teal-50`
    : `${linkBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
}

export function SupervisorNav({
  current,
  trailing,
}: {
  current: SupervisorSection;
  trailing?: ReactNode;
}) {
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-2">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {mm.nav.backToTriage}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/supervisor"
          className={sectionClass(current === "supervisor", "teal")}
          aria-current={current === "supervisor" ? "page" : undefined}
        >
          <LayoutDashboard className="h-4 w-4" />
          {mm.nav.supervisor}
        </Link>
        <Link
          href="/reports"
          className={sectionClass(current === "reports", "teal")}
          aria-current={current === "reports" ? "page" : undefined}
        >
          <BarChart3 className="h-4 w-4" />
          {mm.nav.reports}
        </Link>
        <Link
          href="/activity"
          className={sectionClass(current === "activity", "slate")}
          aria-current={current === "activity" ? "page" : undefined}
        >
          <ClipboardList className="h-4 w-4" />
          {mm.nav.activity}
        </Link>
        {trailing}
      </div>
    </div>
  );
}
