"use client";

import { useEffect } from "react";

import type { ActivityEventType } from "@/lib/fevergate/activity";
import { logActivityClient } from "@/lib/fevergate/log-activity";

export function ActivityPageTracker({
  eventType,
  actor,
}: {
  eventType: Extract<ActivityEventType, "view_reports" | "view_activity">;
  actor?: string | null;
}) {
  useEffect(() => {
    logActivityClient({ eventType, actor: actor ?? null });
  }, [eventType, actor]);

  return null;
}
