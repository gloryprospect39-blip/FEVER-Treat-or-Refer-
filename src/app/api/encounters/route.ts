import { NextResponse } from "next/server";

import { logEncounter } from "@/lib/db/encounters";
import type { FebrileAssessment, PatientContext } from "@/lib/decision-engine/models";
import type { ClinicContext } from "@/lib/fevergate/treatment-plan";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    await logEncounter({
      ctx: body.patient as PatientContext,
      assessment: body.assessment as FebrileAssessment,
      clinic: body.clinic as ClinicContext,
      actionTaken: body.actionTaken ?? null,
      patientName: body.patientName ?? null,
      village: body.village ?? null,
      clinician: body.clinician ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
