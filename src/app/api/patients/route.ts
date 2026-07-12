import { NextResponse } from "next/server";

import { listRecentPatients, listVillages } from "@/lib/db/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const village = searchParams.get("village");
  const patients = await listRecentPatients(
    30,
    village && village !== "all" ? village : null,
  );
  const villages = await listVillages();
  return NextResponse.json({ patients, villages });
}
