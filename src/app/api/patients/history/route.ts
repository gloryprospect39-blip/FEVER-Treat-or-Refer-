import { NextResponse } from "next/server";

import { listEncountersForPatient } from "@/lib/db/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const name = searchParams.get("name");
  const village = searchParams.get("village");

  if (!patientId && !(name && village)) {
    return NextResponse.json(
      { error: "patientId or name+village is required" },
      { status: 400 },
    );
  }

  const encounters = await listEncountersForPatient(
    patientId ?? "",
    8,
    name && village ? { name, village } : null,
  );
  return NextResponse.json({ encounters });
}
