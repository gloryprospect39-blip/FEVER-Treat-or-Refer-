import { NextResponse } from "next/server";

import { resolvePatientForEncounter } from "@/lib/db/registry";

export async function POST(request: Request) {
  const body = await request.json();
  const patient = resolvePatientForEncounter({
    name: body.name ?? "",
    village: body.village ?? "",
    patientId: body.patientId ?? null,
  });
  return NextResponse.json({ patient });
}
