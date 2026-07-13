import type { ActivityEventType } from "@/lib/fevergate/activity";

/** Fire-and-forget client-side activity logging (never throws). */
export function logActivityClient(input: {
  eventType: ActivityEventType;
  actor?: string | null;
  village?: string | null;
  patientName?: string | null;
  metadata?: Record<string, unknown> | null;
}): void {
  void fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: input.eventType,
      actor: input.actor ?? null,
      village: input.village ?? null,
      patientName: input.patientName ?? null,
      metadata: input.metadata ?? null,
    }),
  }).catch(() => {
    // Ignore network errors — logging is best-effort.
  });
}
