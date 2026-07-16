import { NextResponse } from "next/server";

import {
  listEncountersForPatient,
  listRecentPatients,
  listReturningPatientsForVillage,
  listVillages,
} from "@/lib/db/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const village = searchParams.get("village");
  const patients =
    village && village !== "all"
      ? await listReturningPatientsForVillage(village)
      : await listRecentPatients(30);
  const villages = await listVillages();
  return NextResponse.json({ patients, villages });
}
