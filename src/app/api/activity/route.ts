import { NextResponse } from "next/server";

import { logActivity } from "@/lib/db/activity";
import type { ActivityEventType } from "@/lib/fevergate/activity";

const VALID_EVENTS = new Set<ActivityEventType>([
  "assess_completed",
  "teleconsultation_call",
  "schedule_teleconsultation",
  "start_treatment",
  "open_referral_form",
  "print_referral",
  "new_patient",
  "view_reports",
  "view_activity",
]);

export async function POST(request: Request) {
  const body = await request.json();
  const eventType = body.eventType as ActivityEventType;

  if (!VALID_EVENTS.has(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  try {
    await logActivity({
      eventType,
      actor: body.actor ?? null,
      village: body.village ?? null,
      patientName: body.patientName ?? null,
      metadata: body.metadata ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
