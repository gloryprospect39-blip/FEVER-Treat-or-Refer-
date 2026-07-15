import { NextResponse } from "next/server";

import { listEncountersForPatient } from "@/lib/db/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }
  const encounters = await listEncountersForPatient(patientId);
  return NextResponse.json({ encounters });
}
