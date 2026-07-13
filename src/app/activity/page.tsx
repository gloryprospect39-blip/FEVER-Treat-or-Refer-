import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";

import { ActivityLogPanel } from "@/components/ActivityLogPanel";
import { ActivityPageTracker } from "@/components/ActivityPageTracker";
import { loadActivityLogs } from "@/lib/db/activity";
import { mm } from "@/lib/i18n/mm";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const rows = await loadActivityLogs();
  const generatedAt = new Date().toLocaleString("en-GB");

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <ActivityPageTracker eventType="view_activity" />

      <div className="no-print flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {mm.nav.backToTriage}
        </Link>
        <Link
          href="/reports"
          className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-800 shadow-sm transition hover:bg-teal-100"
        >
          <ClipboardList className="h-4 w-4" />
          {mm.nav.reports}
        </Link>
      </div>

      <ActivityLogPanel rows={rows} generatedAt={generatedAt} />
    </div>
  );
}
