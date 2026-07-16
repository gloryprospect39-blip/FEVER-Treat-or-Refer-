import { ActivityLogPanel } from "@/components/ActivityLogPanel";
import { ActivityPageTracker } from "@/components/ActivityPageTracker";
import { SupervisorNav } from "@/components/SupervisorNav";
import { loadActivityLogs } from "@/lib/db/activity";
import { mm } from "@/lib/i18n/mm";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const rows = await loadActivityLogs();
  const generatedAt = new Date().toLocaleString("en-GB");

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <ActivityPageTracker eventType="view_activity" />

      <SupervisorNav current="activity" />

      <ActivityLogPanel rows={rows} generatedAt={generatedAt} />
    </div>
  );
}
